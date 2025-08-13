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
    systemPrompt: "You are a concise audiobook sidekick. Always respond in exactly 1-2 complete sentences. Never use incomplete sentences, bullet points, or lists. Be helpful but brief.",
    voiceId: "alloy",
    debug: false,
    silent: false,
    fastMode: true, // default to fast mode for better UX
  });

  const [history, setHistory] = useLocalStorage<HistoryItem[]>("history", []);

  const updateSettings = (partial: Partial<Settings>) => setSettings({ ...settings, ...partial });
  const addHistory = (item: HistoryItem) => setHistory([...history, item]);

  return (
    <SidekickContext.Provider value={{ settings, updateSettings, history, addHistory }}>
      {children}
    </SidekickContext.Provider>
  );
} 