import { createContext, ReactNode } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

export type HistoryItem = {
  id: string;
  timestamp: string;
  role: "user" | "sidekick" | "note";
  content: string;
};

export type Settings = {
  apiKey: string;
  systemPrompt: string;
  voiceId: string;
  debug: boolean;
  silent: boolean; // if true, skip TTS playback
  fastMode: boolean; // if true, use gpt-3.5-turbo-mini for simple tasks
  prewarm?: boolean; // gate for API pre-warming
};

interface SidekickContextValue {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  history: HistoryItem[];
  addHistory: (item: HistoryItem) => void;
}

export const SidekickContext = createContext<SidekickContextValue>({} as SidekickContextValue);

export function SidekickProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage<Settings>("settings", {
    apiKey: "",
    systemPrompt: "You are a concise Audiobook Sidekick. Always respond with exactly 1-2 complete sentences that end with proper punctuation. Never cut off mid-sentence or use fragments. Be helpful but brief.",
    voiceId: "alloy",
    debug: false,
    silent: false,
    fastMode: true, // default to fast mode for better UX
    prewarm: false,
  });

  const [history, setHistory] = useLocalStorage<HistoryItem[]>("history", []);

  const updateSettings = (partial: Partial<Settings>) => setSettings({ ...settings, ...partial });
  const addHistory = (item: HistoryItem) => {
    if (settings.debug) {
      // eslint-disable-next-line no-console
      console.log('Adding to history:', item);
    }
    setHistory([...history, item]);
  };

  return (
    <SidekickContext.Provider value={{ settings, updateSettings, history, addHistory }}>
      {children}
    </SidekickContext.Provider>
  );
} 