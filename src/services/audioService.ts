export type AudioStatus = "idle" | "loading" | "playing" | "paused" | "ended";

export interface AudioState {
  status: AudioStatus;
  currentTime: number;
  duration: number;
  error?: string;
}

type AudioListener = (state: AudioState) => void;

class AudioService {
  private audio: HTMLAudioElement;
  private listeners: Set<AudioListener> = new Set();
  private state: AudioState = {
    status: "idle",
    currentTime: 0,
    duration: 0,
  };
  private lastClickTime = 0;
  private updateThrottle: number | null = null;

  constructor() {
    this.audio = new Audio();
    this.setupAudio();
  }

  private setupAudio() {
    this.audio.preload = "metadata";
    this.audio.crossOrigin = "anonymous";
    
    // Event listeners
    this.audio.addEventListener("loadedmetadata", () => {
      this.updateState({
        duration: this.audio.duration,
        status: this.state.status === "loading" ? "idle" : this.state.status,
      });
    });

    this.audio.addEventListener("timeupdate", () => {
      // Throttle to ~4-8 updates per second
      if (this.updateThrottle) return;
      
      this.updateThrottle = window.setTimeout(() => {
        this.updateState({
          currentTime: this.audio.currentTime,
        });
        try {
          localStorage.setItem('audio:lastTime', String(this.audio.currentTime));
        } catch {}
        this.updateThrottle = null;
      }, 150); // ~6.7 updates per second
    });

    this.audio.addEventListener("play", () => {
      this.updateState({ status: "playing", error: undefined });
    });

    this.audio.addEventListener("pause", () => {
      this.updateState({ 
        status: this.audio.currentTime >= this.audio.duration ? "ended" : "paused" 
      });
    });

    this.audio.addEventListener("ended", () => {
      this.updateState({ status: "ended" });
    });

    this.audio.addEventListener("waiting", () => {
      this.updateState({ status: "loading" });
    });

    this.audio.addEventListener("canplay", () => {
      if (this.state.status === "loading") {
        this.updateState({ status: "paused" });
      }
    });

    this.audio.addEventListener("error", () => {
      this.updateState({ 
        status: "idle", 
        error: "Couldn't start playback. Tap Play again." 
      });
    });
  }

  private updateState(updates: Partial<AudioState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Public API
  load(src?: string) {
    const audioSrc = src || `${(import.meta as any).env.BASE_URL}audio/treasure-island-ch1.mp3`;
    if (this.audio.src !== audioSrc) {
      this.audio.src = audioSrc;
      this.updateState({ status: "loading", error: undefined });
      try {
        const saved = localStorage.getItem('audio:lastTime');
        if (saved) {
          const t = parseFloat(saved);
          if (!Number.isNaN(t)) this.audio.currentTime = t;
        }
      } catch {}
    }
  }

  async play() {
    // Debounce rapid taps
    const now = Date.now();
    if (now - this.lastClickTime < 200) return;
    this.lastClickTime = now;

    try {
      // Load if not loaded
      if (!this.audio.src) {
        this.load();
      }

      await this.audio.play();
    } catch (error) {
      console.error("Audio play failed:", error);
      this.updateState({ 
        status: "idle", 
        error: "Couldn't start playback. Tap Play again." 
      });
    }
  }

  pause() {
    this.audio.pause();
  }

  async toggle() {
    if (this.state.status === "playing") {
      this.pause();
    } else {
      await this.play();
    }
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.updateState({ 
      status: "idle", 
      currentTime: 0,
      error: undefined 
    });
  }

  seek(seconds: number) {
    if (this.audio.duration) {
      this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration));
      this.updateState({ currentTime: this.audio.currentTime });
    }
  }

  getState(): AudioState {
    return { ...this.state };
  }

  // Subscription management
  subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.state);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Cleanup
  destroy() {
    if (this.updateThrottle) {
      clearTimeout(this.updateThrottle);
    }
    this.audio.pause();
    this.audio.src = "";
    this.listeners.clear();
  }
}

// Singleton instance
export const audioService = new AudioService();
