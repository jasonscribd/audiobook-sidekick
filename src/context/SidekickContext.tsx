import { createContext, ReactNode } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

export type HistoryItem = {
  id: string;
  timestamp: string;
  role: "user" | "sidekick" | "note";
  content: string;
};

export type NoteMarker = {
  id: string;               // uuid
  bookId: string;           // e.g., "treasure-island"
  timeSec: number;          // audio timestamp when CTA was tapped
  createdAt: string;        // ISO
  historyId?: string;       // (optional) link to a conversation message
  preview?: string;         // (optional) first 80-120 chars of the user's question or answer
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
  clearHistory: () => void;
  notes: NoteMarker[];
  addNote: (note: NoteMarker) => void;
  updateNote: (noteId: string, updates: Partial<NoteMarker>) => void;
  deleteNote: (noteId: string) => void;
  getNotesForBook: (bookId: string) => NoteMarker[];
  clearAllNotes: () => void;
  clearAllData: () => void;
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
  const [notes, setNotes] = useLocalStorage<NoteMarker[]>("notes", []);

  const updateSettings = (partial: Partial<Settings>) => setSettings({ ...settings, ...partial });
  
  const addHistory = (item: HistoryItem) => {
    if (settings.debug) {
      // eslint-disable-next-line no-console
      console.log('Adding to history:', item);
    }
    setHistory([...history, item]);
  };

  const addNote = (note: NoteMarker) => {
    if (settings.debug) {
      // eslint-disable-next-line no-console
      console.log('Adding note:', note);
    }
    setNotes([...notes, note]);
  };

  const updateNote = (noteId: string, updates: Partial<NoteMarker>) => {
    if (settings.debug) {
      // eslint-disable-next-line no-console
      console.log('Updating note:', noteId, updates);
    }
    setNotes(notes.map(note => 
      note.id === noteId ? { ...note, ...updates } : note
    ));
  };

  const deleteNote = (noteId: string) => {
    if (settings.debug) {
      // eslint-disable-next-line no-console
      console.log('Deleting note:', noteId);
    }
    setNotes(notes.filter(note => note.id !== noteId));
  };

  const getNotesForBook = (bookId: string) => {
    return notes.filter(note => note.bookId === bookId);
  };

  const clearHistory = () => {
    if (settings.debug) {
      // eslint-disable-next-line no-console
      console.log('Clearing all conversation history');
    }
    setHistory([]);
  };

  const clearAllNotes = () => {
    if (settings.debug) {
      // eslint-disable-next-line no-console
      console.log('Clearing all notes');
    }
    setNotes([]);
  };

  const clearAllData = () => {
    if (settings.debug) {
      // eslint-disable-next-line no-console
      console.log('Clearing all history and notes');
    }
    setHistory([]);
    setNotes([]);
  };

  return (
    <SidekickContext.Provider value={{ 
      settings, 
      updateSettings, 
      history, 
      addHistory, 
      clearHistory,
      notes, 
      addNote, 
      updateNote, 
      deleteNote, 
      getNotesForBook,
      clearAllNotes,
      clearAllData
    }}>
      {children}
    </SidekickContext.Provider>
  );
} 