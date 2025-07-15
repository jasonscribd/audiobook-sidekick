import { useState, useContext } from "react";
import { SidekickProvider, SidekickContext } from "./context/SidekickContext";
import SettingsPane from "./components/SettingsPane";
import HistoryDrawer from "./components/HistoryDrawer";
import { useRecorder } from "./hooks/useRecorder";
import { transcribeAudio } from "./utils/openai";
import { parseIntent } from "./utils/intent";
import { chatCompletion, synthesizeSpeech } from "./utils/openai";

function AppContent() {
  const [listening, setListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const { recording, start, stop } = useRecorder();
  const { addHistory, settings } = useContext(SidekickContext);

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
          replyText = await chatCompletion(`Provide a one sentence definition for: ${payload}`, settings);
        } else if (intent === "fact") {
          replyText = await chatCompletion(`Answer briefly (2 sentences max): ${payload}`, settings);
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
    <div className="h-screen w-screen overflow-hidden relative flex flex-col items-center justify-center">
      {/* Mic Button */}
      <button
        className={`rounded-full w-64 h-64 flex items-center justify-center text-5xl font-bold transition-colors ${listening ? "bg-palette3 text-white" : "bg-palette1 text-palette4"}`}
        onClick={toggleMic}
      >
        {transcribing ? "..." : listening ? "Stop" : "Talk"}
      </button>

      {/* Secondary buttons */}
      <div className="mt-6 flex gap-6">
        <button
          className="rounded-lg px-10 py-4 text-xl font-semibold bg-palette1 text-palette4 transition-colors hover:bg-palette2"
          onClick={() => setShowHistory((prev) => !prev)}
        >
          History
        </button>
        <button
          className="rounded-lg px-10 py-4 text-xl font-semibold bg-palette1 text-palette4 transition-colors hover:bg-palette2"
          onClick={() => setShowSettings((prev) => !prev)}
        >
          Settings
        </button>
      </div>

      {showHistory && <HistoryDrawer onClose={() => setShowHistory(false)} />}

      {showSettings && <SettingsPane onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <SidekickProvider>
      <AppContent />
    </SidekickProvider>
  );
} 