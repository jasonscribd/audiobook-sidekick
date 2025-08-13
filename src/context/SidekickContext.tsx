import { createContext, ReactNode } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

export type HistoryItem = {
  id: string;
  timestamp: string;
  role: "user" | "sidekick" | "note";
  content: string;
  meta?: {
    bookId?: string;
    usedContext?: boolean;
  };
};

export type Settings = {
  apiKey: string;
  systemPrompt: string;
  voiceId: string;
  debug: boolean;
  silent: boolean; // if true, skip TTS playback
  fastMode: boolean; // if true, use gpt-3.5-turbo-mini for simple tasks
  // Book context settings
  currentBookId: string;
  currentBookTitle: string;
  useBookContext: boolean; // toggle for using book context
};

export type BookContext = {
  bookContextMarkdown: string;
  updatedAt: number;
};

interface SidekickContextValue {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  history: HistoryItem[];
  addHistory: (item: HistoryItem) => void;
  // Book context functions
  getBookContext: (bookId: string) => BookContext | null;
  saveBookContext: (bookId: string, context: BookContext) => void;
  getCurrentBookContext: () => BookContext | null;
}

export const SidekickContext = createContext<SidekickContextValue>({} as SidekickContextValue);

export function SidekickProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage<Settings>("settings", {
    apiKey: "",
    systemPrompt: "You are a concise audiobook sidekick. Always respond with exactly 1-2 complete sentences that end with proper punctuation. Never cut off mid-sentence or use fragments. Be helpful but brief.",
    voiceId: "alloy",
    debug: false,
    silent: false,
    fastMode: true, // default to fast mode for better UX
    // Book context defaults
    currentBookId: "treasure-island",
    currentBookTitle: "Treasure Island",
    useBookContext: true,
  });

  const [history, setHistory] = useLocalStorage<HistoryItem[]>("history", []);

  const updateSettings = (partial: Partial<Settings>) => setSettings({ ...settings, ...partial });
  const addHistory = (item: HistoryItem) => setHistory([...history, item]);

  // Book context management functions
  const getBookContext = (bookId: string): BookContext | null => {
    try {
      const stored = localStorage.getItem(`book:${bookId}:context`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const saveBookContext = (bookId: string, context: BookContext) => {
    localStorage.setItem(`book:${bookId}:context`, JSON.stringify(context));
  };

  const getCurrentBookContext = (): BookContext | null => {
    return getBookContext(settings.currentBookId);
  };

  return (
    <SidekickContext.Provider value={{ 
      settings, 
      updateSettings, 
      history, 
      addHistory,
      getBookContext,
      saveBookContext,
      getCurrentBookContext
    }}>
      {children}
    </SidekickContext.Provider>
  );
} 