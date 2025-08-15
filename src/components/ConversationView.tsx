import React, { useState, useContext, useEffect, useRef } from "react";
import { History, Info, Volume2, VolumeX, ExternalLink, Mic } from "lucide-react";
import { SidekickContext, HistoryItem } from "../context/SidekickContext";
import HistoryDrawer from "./HistoryDrawer";
import SettingsPane from "./SettingsPane";
import { useRecorder } from "../hooks/useRecorder";
import { transcribeAudio, chatCompletion, synthesizeSpeech } from "../utils/openai";
import { parseIntent } from "../utils/intent";
import { createBookEnhancedPrompt } from "../utils/bookSummary";
import { audioService } from "../services/audioService";

interface ConversationViewProps {
  onNavigateBack: () => void;
  noteId?: string | null;
}

type ConversationState = 'idle' | 'listening' | 'transcribing' | 'streaming' | 'complete' | 'error';

const ConversationView: React.FC<ConversationViewProps> = ({ onNavigateBack, noteId }) => {
  const { history, addHistory, settings, updateSettings, notes } = useContext(SidekickContext);
  const { recording, start, stop } = useRecorder();
  
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Get conversation history (AI responses only)
  const conversationResponses = React.useMemo(() => {
    return history.filter(item => item.role === 'sidekick');
  }, [history]);

  // Helper function to format time in MM:SS
  const formatTimeFromSeconds = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date();
      const [time] = timestamp.split(' ');
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `Aug 10, ${displayHour}:${minutes}${ampm}`;
    } catch {
      return timestamp;
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationResponses, streamingText]);

  // Handle note navigation when noteId is provided
  useEffect(() => {
    if (noteId) {
      const note = notes.find(n => n.id === noteId);
      if (note) {
        if (note.historyId) {
          // Note is linked to a conversation - could scroll to and highlight it
          // For now, just show a toast
          setToastMessage(`Note at ${formatTimeFromSeconds(note.timeSec)} — linked conversation shown below.`);
        } else {
          // Note has no linked conversation
          setToastMessage(`Note at ${formatTimeFromSeconds(note.timeSec)} — latest conversation shown.`);
        }
        
        // Auto-dismiss toast after 3 seconds
        setTimeout(() => setToastMessage(null), 3000);
      }
    }
  }, [noteId, notes, formatTimeFromSeconds]);

  // Handle "Read answers" toggle
  const handleToggleReadAnswers = () => {
    updateSettings({ silent: !settings.silent });
  };

  // Reset conversation state
  const resetConversationState = () => {
    setConversationState('idle');
    setStreamingText('');
    setErrorMessage('');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // Handle text form submission
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || conversationState !== 'idle') return;
    
    await handleUserInput(textInput.trim());
    setTextInput('');
  };

  // Handle voice input
  const handleVoiceInput = async () => {
    if (conversationState === 'idle') {
      try {
        await start();
        setConversationState('listening');
      } catch (error) {
        setErrorMessage('Failed to start recording');
        setConversationState('error');
      }
    } else if (conversationState === 'listening') {
      setConversationState('transcribing');
      try {
        const blob = await stop();
        const text = await transcribeAudio(blob, settings);
        await handleUserInput(text);
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to process audio');
        setConversationState('error');
      }
    }
  };

  // Process user input (text or voice)
  const handleUserInput = async (userText: string) => {
    // Stop audiobook playback
    audioService.pause();
    
    // Add user message to history
    const userEntryId = crypto.randomUUID?.() || Date.now().toString();
    addHistory({
      id: userEntryId,
      timestamp: new Date().toLocaleTimeString(),
      role: "user",
      content: userText,
    });

    // Start streaming response
    setConversationState('streaming');
    abortControllerRef.current = new AbortController();

    try {
      // Determine intent and create appropriate prompt
      const parsed = parseIntent(userText);
      const intent = parsed.intent;
      let payload = parsed.payload;
      
      let prompt = '';
      if (intent === "define") {
        prompt = `Provide a one sentence definition for: ${payload}`;
      } else if (intent === "fact") {
        prompt = `Answer briefly (2 sentences max): ${payload}`;
      } else if (intent === "book" && parsed.bookId) {
        // Use book-enhanced prompt with summary context
        prompt = await createBookEnhancedPrompt(payload, parsed.bookId);
      } else if (intent === "note") {
        // Handle note differently - show "Noted." and save cleaned note
        setStreamingText("Noted.");
        setConversationState('complete');
        
        try {
          payload = await chatCompletion(
            `Please correct punctuation and make very light edits for clarity while keeping the original words and order as much as possible. Return only the corrected text.\n\n${payload}`,
            settings,
            true
          );
        } catch (e) {
          console.error("Note edit failed", e);
        }

        addHistory({
          id: userEntryId + "-note",
          timestamp: new Date().toLocaleTimeString(),
          role: "note",
          content: payload,
        });
        return;
      } else {
        prompt = payload;
      }

      // Use appropriate model
      // For book queries, use the full model to handle the rich context
      const useSimpleModel = intent === "define" || intent === "fact";
      const response = await chatCompletion(prompt, settings, useSimpleModel);
      
      // Simulate streaming
      const words = response.split(' ');
      let accumulated = '';
      
      for (let i = 0; i < words.length; i++) {
        if (abortControllerRef.current?.signal.aborted) return;
        
        const chunk = i === 0 ? words[i] : ' ' + words[i];
        accumulated += chunk;
        setStreamingText(accumulated);
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setConversationState('complete');

      // Add response to history
      addHistory({
        id: userEntryId + "-r",
        timestamp: new Date().toLocaleTimeString(),
        role: "sidekick",
        content: response,
      });

      // TTS playback if not silent
      if (!settings.silent) {
        try {
          setIsTTSPlaying(true);
          const audioBuf = await synthesizeSpeech(response, settings);
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await ctx.decodeAudioData(audioBuf);
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          source.onended = () => setIsTTSPlaying(false);
          source.start();
        } catch (err) {
          console.error('TTS failed:', err);
          setIsTTSPlaying(false);
        }
      }

    } catch (error: any) {
      if (!abortControllerRef.current?.signal.aborted) {
        setErrorMessage(error.message || 'Something went wrong');
        setConversationState('error');
      }
    }
  };

  // Handle current streaming response
  const currentStreamingResponse = conversationState === 'streaming' && streamingText ? {
    id: 'streaming',
    timestamp: new Date().toLocaleTimeString(),
    role: 'sidekick' as const,
    content: streamingText
  } : null;

  return (
    <div 
      className="grid grid-rows-[auto_auto_1px_1fr_auto] max-w-[430px] mx-auto font-inter relative overflow-hidden"
      style={{
        minHeight: '100vh',
        height: '100dvh',
        background: 'var(--phone-bg)'
      } as React.CSSProperties & { WebkitHeight?: string }}
    >
      {/* Header */}
      <div 
        className="h-12 flex items-center justify-between px-6"
        style={{ 
          paddingTop: `calc(env(safe-area-inset-top) + 8px)`,
          paddingBottom: '8px'
        }}
      >
        {/* Left: Empty space for balance */}
        <div className="w-[88px]" />

        {/* Center: Title */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-text text-[17px] font-semibold tracking-[0.01em] whitespace-nowrap">
            Audiobook Sidekick
          </h1>
        </div>

        {/* Right: Icons */}
        <div className="flex items-center space-x-3 w-[88px] justify-end">
          {/* History Icon */}
          <button
            onClick={() => setShowHistory(true)}
            aria-label="Open history"
            className="w-11 h-11 flex items-center justify-center opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity"
          >
            <History 
              size={21} 
              strokeWidth={1.75}
              style={{ color: 'rgba(237, 237, 237, 0.8)' }}
            />
          </button>
          
          {/* Info Icon */}
          <button
            onClick={() => setShowSettings(true)}
            aria-label="Open settings"
            className="w-11 h-11 flex items-center justify-center opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity"
          >
            <Info 
              size={21} 
              strokeWidth={1.75}
              style={{ color: 'rgba(237, 237, 237, 0.8)' }}
            />
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="h-14 flex items-center justify-between px-6">
        {/* Left: Toggle with speaker icon */}
        <div className="flex items-center space-x-2">
          {settings.silent ? (
            <VolumeX size={18} strokeWidth={1.75} className="text-text-muted" />
          ) : (
            <Volume2 size={18} strokeWidth={1.75} className="text-text" />
          )}
          <button
            onClick={handleToggleReadAnswers}
            className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg rounded-md p-1"
            aria-label={`Read answers ${settings.silent ? 'off' : 'on'}`}
          >
            <span className="text-text text-[15px] font-medium">Read answers</span>
            <div 
              className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                settings.silent ? 'bg-gray-600' : 'bg-accent'
              }`}
            >
              <div 
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 mt-1 ${
                  settings.silent ? 'translate-x-1' : 'translate-x-5'
                }`}
              />
            </div>
          </button>
        </div>

        {/* Right: TTS Status */}
        {isTTSPlaying && (
          <div className="text-text-muted text-[13px] font-medium">
            Playing...
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ backgroundColor: '#FFFFFF14' }} />

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Show message if no conversations yet */}
        {conversationResponses.length === 0 && (
          <div className="text-center text-text-muted mt-8">
            <p className="text-sm mb-2">No conversation history yet.</p>
            <p className="text-xs">Start a conversation by asking a question below!</p>
          </div>
        )}
        
        {/* Display conversation responses (answers only) */}
        {conversationResponses.map((response, index) => (
          <div key={response.id || index} className="mb-6">
            <div className="text-[16px] leading-[150%]" style={{color: '#EDEDED'}}>
              {response.content}
            </div>
            
            {/* Meta Row */}
            <div className="flex items-center justify-between mt-3">
              <span style={{color: '#B9B9B9'}} className="text-[12px] font-inter">
                {formatTimestamp(response.timestamp)}
              </span>
              <div className="flex items-center space-x-3">
                {/* External Link Icon */}
                <button
                  aria-label="Open externally"
                  className="opacity-80 hover:opacity-100 focus:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 rounded"
                  style={{'--tw-ring-color': '#F3A46B'} as React.CSSProperties}
                >
                  <ExternalLink 
                    size={21} 
                    strokeWidth={1.75}
                    style={{ color: 'rgba(237, 237, 237, 0.8)' }}
                  />
                </button>
                
                {/* Speaker Icon */}
                <button
                  aria-label="Play/Stop TTS"
                  disabled={settings.silent}
                  className={`opacity-80 hover:opacity-100 focus:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 rounded ${
                    settings.silent ? 'cursor-not-allowed opacity-40' : ''
                  }`}
                  style={{'--tw-ring-color': '#F3A46B'} as React.CSSProperties}
                >
                  <Volume2 
                    size={21} 
                    strokeWidth={1.75}
                    style={{ color: 'rgba(237, 237, 237, 0.8)' }}
                  />
                </button>
              </div>
            </div>
          </div>
        ))}

        
        {/* Display current streaming response if any */}
        {currentStreamingResponse && (
          <div key="streaming-response" className="mb-6">
            <div className="text-[16px] leading-[150%]" style={{color: '#EDEDED'}}>
              {/* Streaming AI response */}
              {currentStreamingResponse.content}
              <span className="animate-pulse motion-reduce:animate-none">|</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div 
        className="px-6 py-4"
        style={{
          paddingBottom: `calc(env(safe-area-inset-bottom) + 16px)`
        }}
      >
        <form onSubmit={handleTextSubmit} className="flex items-center space-x-3">
          {/* Text Input */}
          <input
            ref={textInputRef}
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Talk or text"
            disabled={conversationState !== 'idle'}
            className="flex-1 h-12 px-4 bg-bge text-text placeholder-text-muted rounded-full border-none outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          
          {/* Mic Button */}
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={conversationState === 'transcribing' || conversationState === 'streaming'}
            aria-label={
              conversationState === 'listening' ? 'Listening...' : 'Start voice input'
            }
            className={`h-14 px-4 rounded-[18px] font-semibold text-base flex items-center justify-center space-x-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg motion-reduce:active:scale-100 ${
              conversationState === 'listening'
                ? "bg-accent text-black shadow-accent-glow animate-pulse motion-reduce:animate-none" 
                : conversationState === 'transcribing' || conversationState === 'streaming'
                ? "bg-accent bg-opacity-60 text-black cursor-not-allowed"
                : "bg-accent text-black shadow-accent-glow hover:brightness-110 active:scale-[0.99]"
            }`}
          >
            <Mic className="w-5 h-5" />
            {conversationState === 'listening' && (
              <span className="text-[14px]">Listening...</span>
            )}
          </button>
        </form>

        {/* Error Message */}
        {conversationState === 'error' && (
          <div className="mt-3 text-center">
            <p className="text-red-400 text-sm mb-2">{errorMessage}</p>
            <button
              onClick={resetConversationState}
              className="text-accent text-sm hover:underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Toast Message */}
      {toastMessage && (
        <div className="absolute top-4 left-4 right-4 z-50">
          <div 
            className="bg-accent text-black px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
            style={{ backgroundColor: '#F2FD53', color: '#000' }}
          >
            {toastMessage}
          </div>
        </div>
      )}

      {/* History Overlay */}
      {showHistory && (
        <div className="absolute inset-0 bg-bge">
          <HistoryDrawer onClose={() => setShowHistory(false)} />
        </div>
      )}

      {/* Settings Overlay */}
      {showSettings && (
        <div className="absolute inset-0 bg-bge">
          <SettingsPane onClose={() => setShowSettings(false)} />
        </div>
      )}
    </div>
  );
};

export default ConversationView;
