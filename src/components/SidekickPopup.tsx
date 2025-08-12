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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 m-4 max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Audiobook Sidekick</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center justify-center">
          {/* Mic Button */}
          <button
            className={`rounded-full w-32 h-32 flex items-center justify-center text-2xl font-bold transition-colors mb-6 ${
              listening 
                ? "bg-red-500 text-white" 
                : transcribing 
                ? "bg-gray-400 text-white"
                : "bg-yellow-400 text-black hover:bg-yellow-500"
            }`}
            onClick={toggleMic}
            disabled={transcribing}
          >
            {transcribing ? "..." : listening ? "Stop" : "Talk"}
          </button>

          {/* Status Text */}
          {listening && (
            <p className="text-gray-600 mb-4">Listening... Tap "Stop" when done</p>
          )}
          {transcribing && (
            <p className="text-gray-600 mb-4">Processing your request...</p>
          )}

          {/* Secondary buttons */}
          <div className="flex gap-4 w-full">
            <button
              className="flex-1 rounded-lg px-4 py-3 text-sm font-semibold bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
              onClick={() => setShowHistory(true)}
            >
              History
            </button>
            <button
              className="flex-1 rounded-lg px-4 py-3 text-sm font-semibold bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
              onClick={() => setShowSettings(true)}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Nested modals */}
        {showHistory && (
          <div className="absolute inset-0 bg-white rounded-2xl">
            <HistoryDrawer onClose={() => setShowHistory(false)} />
          </div>
        )}

        {showSettings && (
          <div className="absolute inset-0 bg-white rounded-2xl">
            <SettingsPane onClose={() => setShowSettings(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SidekickPopup;
