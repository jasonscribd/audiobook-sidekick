import React, { createContext, useContext, useEffect, useState } from "react";
import { audioService, AudioState } from "../services/audioService";

const AudioContext = createContext<AudioState | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [audioState, setAudioState] = useState<AudioState>(audioService.getState());

  useEffect(() => {
    const unsubscribe = audioService.subscribe(setAudioState);
    return unsubscribe;
  }, []);

  return (
    <AudioContext.Provider value={audioState}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === null) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
