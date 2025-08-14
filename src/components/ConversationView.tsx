import React, { useState, useContext, useEffect, useRef } from "react";
import { History, Info, Volume2, VolumeX, ExternalLink, Mic } from "lucide-react";
import { SidekickContext, HistoryItem } from "../context/SidekickContext";
import HistoryDrawer from "./HistoryDrawer";
import SettingsPane from "./SettingsPane";
import { useRecorder } from "../hooks/useRecorder";
import { transcribeAudio, chatCompletion, synthesizeSpeech } from "../utils/openai";
import { parseIntent } from "../utils/intent";
import { audioService } from "../services/audioService";

interface ConversationViewProps {
  onNavigateBack: () => void;
}

type ConversationState = 'idle' | 'listening' | 'transcribing' | 'streaming' | 'complete' | 'error';

const ConversationView: React.FC<ConversationViewProps> = ({ onNavigateBack }) => {
  const { history, addHistory, settings, updateSettings } = useContext(SidekickContext);
  const { recording, start, stop } = useRecorder();
  
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Get conversation history and group user questions with AI responses
  const conversationPairs = React.useMemo(() => {
    const filtered = history.filter(item => item.role === 'user' || item.role === 'sidekick');
    const pairs: Array<{ user?: HistoryItem; response?: HistoryItem }> = [];
    
    console.log('DEBUG: Filtered history:', filtered.map(item => `${item.role}: ${item.content?.slice(0, 30)}...`));
    
    for (let i = 0; i < filtered.length; i++) {
      console.log(`Processing item ${i}: ${filtered[i].role}`);
      
      if (filtered[i].role === 'user') {
        const userMessage = filtered[i];
        const nextMessage = filtered[i + 1];
        const responseMessage = nextMessage?.role === 'sidekick' ? nextMessage : undefined;
        
        pairs.push({ user: userMessage, response: responseMessage });
        console.log('Added user pair');
        
        // Skip the response message in the next iteration if we found it
        if (responseMessage) {
          i++; // Skip the response message
        }
      } else if (filtered[i].role === 'sidekick') {
        // Handle orphaned sidekick responses (responses without user questions)
        const prevMessage = filtered[i - 1];
        const isOrphan = !prevMessage || prevMessage.role !== 'user';
        
        console.log(`Sidekick message ${i}: prevMessage exists: ${!!prevMessage}, isOrphan: ${isOrphan}`);
        
        if (isOrphan) {
          pairs.push({ 
            user: {
              id: `orphan-user-${filtered[i].id}`,
              timestamp: filtered[i].timestamp,
              role: 'user',
              content: '[Question not found]'
            },
            response: filtered[i] 
          });
          console.log('Added orphan pair');
        }
      }
    }
    
    console.log('Final pairs:', pairs);
    return pairs;
  }, [history]);

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
  }, [conversationPairs, streamingText]);

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
  const currentStreamingPair = conversationState === 'streaming' && streamingText ? {
    user: conversationPairs[conversationPairs.length - 1]?.user || {
      id: 'temp-user',
      timestamp: new Date().toLocaleTimeString(),
      role: 'user' as const,
      content: ''
    },
    response: {
      id: 'streaming',
      timestamp: new Date().toLocaleTimeString(),
      role: 'sidekick' as const,
      content: streamingText
    }
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
        {/* Always visible debug info */}
        <div className="bg-red-900 text-white p-4 mb-4 rounded">
          <p className="font-bold">DEBUG INFO:</p>
          <p>History length: {history.length}</p>
          <p>ConversationPairs length: {conversationPairs.length}</p>
          <p>First history item: {history[0] ? `${history[0].role}: ${history[0].content?.slice(0, 50)}...` : 'None'}</p>
          <p>Pairs type: {Array.isArray(conversationPairs) ? 'Array' : typeof conversationPairs}</p>
          <p>First pair: {conversationPairs[0] ? `User: ${conversationPairs[0].user?.content?.slice(0, 30) || 'None'}, Response: ${conversationPairs[0].response?.content?.slice(0, 30) || 'None'}` : 'None'}</p>
        </div>
        
        {/* Ultra simple display test */}
        <div className="text-white text-lg mb-4">
          Total pairs to render: {conversationPairs.length}
        </div>
        
        {conversationPairs.map((pair, index) => (
          <div key={index} className="mb-4 p-3 border border-green-500 bg-gray-800">
            <div className="text-red-400 font-bold">
              *{pair.user?.content || '[No user content]'}*
            </div>
            <div className="text-white mt-2">
              {pair.response?.content || '[No response content]'}
            </div>
          </div>
        ))}

        
        {/* Display current streaming pair if any */}
        {currentStreamingPair && (
          <div key="streaming-pair" className="mb-6">
            <div className="text-text text-[16px] leading-[150%]">
              {/* User question in bold italics with asterisks */}
              <span className="font-bold italic text-accent-warm">
                *{currentStreamingPair.user.content}*
              </span>
              {/* Space between question and answer */}
              <span> </span>
              {/* Streaming AI response */}
              <span>
                {currentStreamingPair.response.content}
                <span className="animate-pulse motion-reduce:animate-none">|</span>
              </span>
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
