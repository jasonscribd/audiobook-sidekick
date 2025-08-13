import React, { useState, useContext, useRef, useEffect } from "react";
import { History, Info } from "lucide-react";
import { SidekickContext } from "../context/SidekickContext";
import SettingsPane from "./SettingsPane";
import HistoryDrawer from "./HistoryDrawer";
import { useRecorder } from "../hooks/useRecorder";
import { transcribeAudio } from "../utils/openai";
import { parseIntent } from "../utils/intent";
import { chatCompletion, synthesizeSpeech, preWarmConnections } from "../utils/openai";
import { audioService } from "../services/audioService";

interface SidekickPopupProps {
  onClose: () => void;
}

type ConversationState = 'idle' | 'listening' | 'transcribing' | 'streaming' | 'complete' | 'error';

const SidekickPopup: React.FC<SidekickPopupProps> = ({ onClose }) => {
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantText, setAssistantText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isNoteCommand, setIsNoteCommand] = useState(false);
  
  const { recording, start, stop } = useRecorder();
  const { addHistory, settings } = useContext(SidekickContext);
  const responseRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Pause audio playback when sidekick opens (preserves position)
  useEffect(() => {
    audioService.pause();
  }, []);

  // Pre-warm API connections when API key is available
  useEffect(() => {
    if (settings.apiKey && settings.prewarm) {
      preWarmConnections(settings.apiKey);
      const interval = setInterval(() => {
        preWarmConnections(settings.apiKey);
      }, 600000);
      return () => clearInterval(interval);
    }
  }, [settings.apiKey, settings.prewarm]);

  // Auto-scroll to keep latest response in view
  useEffect(() => {
    if (responseRef.current && conversationState === 'streaming') {
      responseRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [assistantText, conversationState]);

  const resetToIdle = () => {
    setConversationState('idle');
    setTranscript('');
    setAssistantText('');
    setErrorMessage('');
    setIsNoteCommand(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    resetToIdle();
  };

  const handleTryAgain = () => {
    resetToIdle();
  };



  const toggleMic = async () => {
    if (conversationState === 'idle') {
      // Start recording
      try {
        await start();
        setConversationState('listening');
      } catch (error) {
        setErrorMessage('Failed to start recording');
        setConversationState('error');
      }
    } else if (conversationState === 'listening') {
      // Stop recording and start transcription
      setConversationState('transcribing');
      try {
        const blob = await stop();
        
        // Transcribe audio
        const text = await transcribeAudio(blob, settings);
        setTranscript(text);

        const userEntryId = (crypto.randomUUID && crypto.randomUUID()) || Date.now().toString();
        addHistory({
          id: userEntryId,
          timestamp: new Date().toLocaleTimeString(),
          role: "user",
          content: text,
        });

        // Start streaming response
        setConversationState('streaming');
        abortControllerRef.current = new AbortController();

        // Determine intent
        const parsed = parseIntent(text);
        const intent = parsed.intent;
        let payload = parsed.payload;
        let streamedText = '';

        if (intent === "note") {
          // For notes, show the note content and "Noted." response
          setIsNoteCommand(true);
          setAssistantText("Noted.");
          setConversationState('complete');
          
          // Lightly edit note text for punctuation/clarity
          try {
            payload = await chatCompletion(
              `Please correct punctuation and make very light edits for clarity while keeping the original words and order as much as possible. Return only the corrected text.\n\n${payload}`,
              settings,
              true // Use simple model for text correction - it's a simple task
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
        } else {
          // Stream the response
          let prompt = '';
          if (intent === "define") {
            prompt = `Provide a one sentence definition for: ${payload}`;
          } else if (intent === "fact") {
            prompt = `Answer briefly (2 sentences max): ${payload}`;
          } else {
            prompt = payload;
          }

          try {
            // Use simple model for define/fact queries for speed and cost optimization
            const useSimpleModel = intent === "define" || intent === "fact";
            // Simulate streaming by chunking the response
            const response = await chatCompletion(prompt, settings, useSimpleModel);
            const words = response.split(' ');
            
            for (let i = 0; i < words.length; i++) {
              if (abortControllerRef.current?.signal.aborted) {
                return;
              }
              
              const chunk = i === 0 ? words[i] : ' ' + words[i];
              streamedText += chunk;
              setAssistantText(streamedText);
              
              // Simulate streaming delay
              await new Promise(resolve => setTimeout(resolve, 50));
            }

            setConversationState('complete');

            // TTS playback (skip if silent mode)
            if (!settings.silent) {
              try {
                const audioBuf = await synthesizeSpeech(response, settings);
                // Reuse a single AudioContext to avoid creating many instances
                const getCtx = (() => {
                  let shared: AudioContext | null = null;
                  return () => {
                    if (!shared) {
                      shared = new (window.AudioContext || (window as any).webkitAudioContext)();
                    }
                    return shared;
                  };
                })();
                const ctx = getCtx();
                const audioBuffer = await ctx.decodeAudioData(audioBuf);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.start();
              } catch (err) {
                console.error(err);
              }
            }

            // Add to history
            addHistory({
              id: userEntryId + "-r",
              timestamp: new Date().toLocaleTimeString(),
              role: "sidekick",
              content: response,
            });

          } catch (error: any) {
            if (!abortControllerRef.current?.signal.aborted) {
              setErrorMessage(error.message || 'Something went wrong');
              setConversationState('error');
            }
          }
        }
      } catch (error: any) {
        if (!abortControllerRef.current?.signal.aborted) {
          setErrorMessage(error.message || 'Failed to process request');
          setConversationState('error');
        }
      }
    }
  };

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showHistory && !showSettings) {
        if (conversationState === 'idle') {
          onClose();
        } else {
          handleCancel();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, showHistory, showSettings, conversationState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const getButtonText = () => {
    switch (conversationState) {
      case 'idle': return 'Tap to talk';
      case 'listening': return 'Tap to send';
      case 'transcribing': return 'Processing...';
      case 'streaming': return 'Responding...';
      case 'complete': return 'Tap to talk';
      case 'error': return 'Tap to talk';
      default: return 'Tap to talk';
    }
  };

  const isButtonDisabled = () => {
    return conversationState === 'transcribing' || conversationState === 'streaming';
  };

  const shouldShowStars = () => {
    return conversationState === 'transcribing' || conversationState === 'streaming';
  };

  const shouldShowCancel = () => {
    return conversationState === 'transcribing' || conversationState === 'streaming';
  };

  return (
    <div 
      className="absolute inset-0 bg-black bg-opacity-45 font-inter z-50 flex items-end"
      onClick={(e) => {
        if (e.target === e.currentTarget && !showHistory && !showSettings) {
          if (conversationState === 'idle') {
            onClose();
          }
        }
      }}
    >
      {/* Bottom Sheet Container - matches phone viewport width */}
      <div 
        className="w-full max-w-[430px] mx-auto bg-bge rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.35)] max-h-[70vh] min-h-[420px] overflow-hidden border-t border-white border-opacity-5"
        style={{
          paddingBottom: `calc(env(safe-area-inset-bottom) + 12px)`,
          height: 'min(60vh, 640px)'
        }}
        onClick={(e) => e.stopPropagation()}
        aria-modal="true"
        role="dialog"
      >
        {/* Optional Handle */}
        <div className="w-9 h-1 bg-white bg-opacity-20 rounded-full mx-auto mt-2 mb-2"></div>
        
        {/* Scrollable Content Container */}
        <div className="h-full flex flex-col overflow-hidden px-6">
          
          {/* Header Bar */}
          <div className="h-12 flex items-center mb-6 flex-shrink-0">
            {/* Left: Close X Button */}
            <div className="w-[100px] flex-shrink-0 flex justify-start">
              <button
                onClick={conversationState === 'complete' ? resetToIdle : onClose}
                aria-label={conversationState === 'complete' ? 'Close response' : 'Close'}
                className="w-8 h-8 flex items-center justify-center text-text opacity-70 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Centered header text */}
            <div className="flex-1 flex justify-center">
              <span className="text-text-muted text-[13px] font-medium tracking-[0.02em] whitespace-nowrap">
                Audiobook Sidekick
              </span>
            </div>
          
            {/* Right Icons */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {/* History */}
              <button
                onClick={() => setShowHistory(true)}
                aria-label="Open history"
                className="w-11 h-11 flex items-center justify-center text-text opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity"
              >
                <History 
                  size={21} 
                  strokeWidth={1.75}
                />
              </button>
              
              {/* Info */}
              <button
                onClick={() => setShowSettings(true)}
                aria-label="Open settings"
                className="w-11 h-11 flex items-center justify-center text-text opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-opacity"
              >
                <Info 
                  size={21} 
                  strokeWidth={1.75}
                />
              </button>
            </div>
          </div>

          {/* Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto px-0">
            <div className="flex flex-col items-center text-center pt-6">
            
            {/* Stars Animation */}
            {shouldShowStars() && (
              <div className="mb-4 flex items-center justify-center space-x-2">
                {[0, 1, 2].map((index) => (
                  <svg 
                    key={index}
                    className={`w-6 h-6 text-accent ${
                      shouldShowStars() 
                        ? 'animate-pulse motion-reduce:animate-none' 
                        : 'opacity-80'
                    }`}
                    style={{
                      animationDelay: `${index * 250}ms`,
                      animationDuration: '1.5s'
                    }}
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0l1.5 4.5L18 6l-4.5 1.5L12 12l-1.5-4.5L6 6l4.5-1.5L12 0z"/>
                  </svg>
                ))}
              </div>
            )}

            {/* Idle State */}
            {conversationState === 'idle' && (
              <>
                {/* Sparkles Cluster */}
                <div className="mb-3">
                  <svg className="w-7 h-7 text-accent" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0l1.5 4.5L18 6l-4.5 1.5L12 12l-1.5-4.5L6 6l4.5-1.5L12 0z"/>
                    <path d="M19 10l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z"/>
                    <path d="M5 14l0.5 1.5L7 16l-1.5 0.5L5 18l-0.5-1.5L3 16l1.5-0.5L5 14z"/>
                  </svg>
                </div>

                {/* Heading */}
                <h1 className="font-merriweather font-bold text-[34px] text-text leading-tight mb-3">
                  Ask away
                </h1>

                {/* Helper Text */}
                <p className="text-text-muted text-[15px] leading-relaxed max-w-[36ch] mb-7">
                  Ask about a word, explore a topic, or make a note.
                </p>
              </>
            )}

            {/* Transcript Line */}
            {conversationState !== 'idle' && (
              <>
                <h2 className="font-merriweather font-bold text-[32px] text-text leading-tight max-w-[30ch] mb-2">
                  {conversationState === 'listening' && 'Listening...'}
                  {conversationState === 'transcribing' && (
                    <span className="animate-pulse motion-reduce:animate-none">Processing...</span>
                  )}
                  {(conversationState === 'streaming' || conversationState === 'complete') && transcript}
                  {conversationState === 'error' && 'Something went wrong'}
                </h2>

                {/* Note Content Display - show the actual note content for note commands */}
                {isNoteCommand && conversationState === 'complete' && (
                  <div className="max-w-[40ch] text-center mt-4 mb-4">
                    <div className="text-text-muted text-sm mb-2">Note saved:</div>
                    <div className="text-text text-base leading-relaxed italic border-l-2 border-accent pl-4">
                      {transcript}
                    </div>
                  </div>
                )}

                {/* Cancel Link */}
                {shouldShowCancel() && (
                  <button
                    onClick={handleCancel}
                    className="text-text-muted text-base hover:underline mb-6"
                  >
                    Cancel
                  </button>
                )}
              </>
            )}

            {/* Error State */}
            {conversationState === 'error' && (
              <div className="text-center mb-6">
                <p className="text-text-muted text-sm mb-3">{errorMessage}</p>
                <button
                  onClick={handleTryAgain}
                  className="text-accent text-base hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Assistant Response Block */}
            {(conversationState === 'streaming' || conversationState === 'complete') && assistantText && (
              <div 
                ref={responseRef}
                className="max-w-[40ch] text-left mt-6"
                aria-live="polite"
              >
                <div className="text-text text-base leading-relaxed">
                  {assistantText}
                  {conversationState === 'streaming' && (
                    <span className="animate-pulse motion-reduce:animate-none">|</span>
                  )}
                </div>
              </div>
            )}

            {/* Primary CTA - only show in idle, listening, and complete states */}
            {(conversationState === 'idle' || conversationState === 'listening' || conversationState === 'complete') && (
              <button
                onClick={toggleMic}
                disabled={isButtonDisabled()}
                aria-label="Tap to talk"
                className={`w-full max-w-[560px] h-14 rounded-[17px] font-semibold text-base flex items-center justify-center space-x-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg motion-reduce:active:scale-100 ${
                  conversationState === 'listening'
                    ? "bg-accent text-black shadow-accent-glow animate-pulse motion-reduce:animate-none" 
                    : isButtonDisabled()
                    ? "bg-accent bg-opacity-60 text-black cursor-not-allowed"
                    : "bg-accent text-black shadow-accent-glow hover:brightness-110 active:scale-[0.99]"
                } ${conversationState === 'idle' ? 'mt-0' : 'mt-6'}`}
              >
                {/* Mic Icon */}
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
                <span>{getButtonText()}</span>
              </button>
            )}
            </div>
          </div>
        </div>

        {/* History Overlay */}
        {showHistory && (
          <div className="absolute inset-0 bg-bge rounded-t-[24px]">
            <HistoryDrawer onClose={() => setShowHistory(false)} />
          </div>
        )}

        {/* Settings Overlay */}
        {showSettings && (
          <div className="absolute inset-0 bg-bge rounded-t-[24px]">
            <SettingsPane onClose={() => setShowSettings(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SidekickPopup;