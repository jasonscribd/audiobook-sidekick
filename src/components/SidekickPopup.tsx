import React, { useState, useContext } from "react";
import { SidekickContext } from "../context/SidekickContext";
import SettingsPane from "./SettingsPane";
import HistoryDrawer from "./HistoryDrawer";
import { useRecorder } from "../hooks/useRecorder";
import { transcribeAudio } from "../utils/openai";
import { parseIntent } from "../utils/intent";
import { chatCompletion, synthesizeSpeech, preWarmConnections } from "../utils/openai";

interface SidekickPopupProps {
  onClose: () => void;
}

const SidekickPopup: React.FC<SidekickPopupProps> = ({ onClose }) => {
  const [listening, setListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const { recording, start, stop } = useRecorder();
  const { addHistory, settings } = useContext(SidekickContext);

  // Pre-warm API connections when API key is available
  React.useEffect(() => {
    if (settings.apiKey) {
      preWarmConnections(settings.apiKey);
      
      // Re-warm every 10 minutes to keep connections alive
      const interval = setInterval(() => {
        preWarmConnections(settings.apiKey);
      }, 600000);
      
      return () => clearInterval(interval);
    }
  }, [settings.apiKey]);

  const toggleMic = async () => {
    if (!recording) {
      await start();
      setListening(true);
    } else {
      setListening(false);
      const blob = await stop();
      try {
        setTranscribing(true);
        const text = await transcribeAudio(blob, settings);

        const userEntryId = (crypto.randomUUID && crypto.randomUUID()) || Date.now().toString();
        addHistory({
          id: userEntryId,
          timestamp: new Date().toLocaleTimeString(),
          role: "user",
          content: text,
        });

        // Determine intent
        const parsed = parseIntent(text);
        const intent = parsed.intent;
        let payload = parsed.payload;
        let replyText = "";

        if (intent === "note") {
          replyText = "Noted.";
          // Lightly edit note text for punctuation/clarity
          try {
            payload = await chatCompletion(
              `Please correct punctuation and make very light edits for clarity while keeping the original words and order as much as possible. Return only the corrected text.\n\n${payload}`,
              settings
            );
          } catch (e) {
            console.error("Note edit failed", e);
          }
        } else if (intent === "define") {
          replyText = await chatCompletion(`Provide a one sentence definition for: ${payload}`, settings, true);
        } else if (intent === "fact") {
          replyText = await chatCompletion(`Answer briefly (2 sentences max): ${payload}`, settings, true);
        } else {
          replyText = await chatCompletion(payload, settings);
        }

        // TTS playback (skip if silent mode)
        if (!settings.silent) {
          try {
            const audioBuf = await synthesizeSpeech(replyText, settings);
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await ctx.decodeAudioData(audioBuf);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.start();
          } catch (err) {
            console.error(err);
          }
        }

        // History sidekick
        if (intent !== "note") {
          addHistory({
            id: userEntryId + "-r",
            timestamp: new Date().toLocaleTimeString(),
            role: "sidekick",
            content: replyText,
          });
        } else {
          // For notes, log edited note content (but no reply)
          addHistory({
            id: userEntryId + "-note",
            timestamp: new Date().toLocaleTimeString(),
            role: "note",
            content: payload,
          });
        }
      } catch (e: any) {
        alert(e.message);
      } finally {
        setTranscribing(false);
      }
    }
  };

  // Handle escape key to close
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showHistory && !showSettings) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, showHistory, showSettings]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 font-inter z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && !showHistory && !showSettings) {
          onClose();
        }
      }}
    >
      {/* Overlay Container */}
      <div className="w-full max-w-[430px] mx-4 bg-warm-gradient rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden"
           onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-10 pb-8 h-full flex flex-col">
          
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-6">
            {/* Close X Button */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 flex items-center justify-center text-text opacity-70 hover:opacity-100 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <span className="text-text-muted text-[13px] font-normal tracking-wide">
              Audiobook sidekick
            </span>
          
          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            {/* Clock - History */}
            <button
              onClick={() => setShowHistory(true)}
              aria-label="Open history"
              className="w-11 h-11 flex items-center justify-center text-text opacity-80 hover:opacity-100 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
            </button>
            
            {/* Info/Speech Bubble - Settings */}
            <button
              onClick={() => setShowSettings(true)}
              aria-label="Open settings"
              className="w-11 h-11 flex items-center justify-center text-text opacity-80 hover:opacity-100 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Hero Content - Centered */}
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          
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

          {/* Primary CTA */}
          <button
            onClick={toggleMic}
            disabled={transcribing}
            aria-label="Tap to talk"
            className={`w-full max-w-[560px] h-14 rounded-[17px] font-semibold text-base flex items-center justify-center space-x-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg motion-reduce:active:scale-100 ${
              listening 
                ? "bg-accent text-black shadow-accent-glow animate-pulse motion-reduce:animate-none" 
                : transcribing 
                ? "bg-accent bg-opacity-60 text-black cursor-not-allowed"
                : "bg-accent text-black shadow-accent-glow hover:brightness-110 active:scale-[0.99]"
            }`}
          >
            {/* Mic Icon */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            <span>
              {transcribing ? "Processing..." : listening ? "Listening..." : "Tap to talk"}
            </span>
          </button>
        </div>
      </div>

        {/* History Overlay */}
        {showHistory && (
          <div className="absolute inset-0 bg-warm-gradient rounded-2xl">
            <HistoryDrawer onClose={() => setShowHistory(false)} />
          </div>
        )}

        {/* Settings Overlay */}
        {showSettings && (
          <div className="absolute inset-0 bg-warm-gradient rounded-2xl">
            <SettingsPane onClose={() => setShowSettings(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SidekickPopup;