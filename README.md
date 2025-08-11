# Audiobook Sidekick

A minimalist, hands-free web companion that adds a push-to-talk AI "Sidekick" to any audiobook—while the audiobook plays in a separate app.

## 🎧 How It Works

1. **Open the Sidekick** in your browser while listening to any audiobook (Audible, Libby, Spotify, etc.)
2. **Tap the Talk button** to start voice capture
3. **Speak your request** ("Take a note: great metaphor here" or "Define epiphany")  
4. **Tap Stop** to end recording
5. **Sidekick responds** with voice + text, logs everything in History

## 🚀 Core Features

- **Push-to-Talk Interface** → Large Talk button, mobile-optimized
- **Smart Intent Detection** → Automatically recognizes Notes, Definitions, and Questions
- **Voice Interaction** → OpenAI Whisper (STT) + Advanced Voice (TTS) with 7 voice options
- **History Management** → Filterable log with PDF export, virtualized scrolling
- **Silent Mode** → Text-only responses when you need quiet
- **Persistent Settings** → API key, system prompt, voice selection stored locally

## 🛠️ Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Audio**: Web Audio API + OpenAI Whisper & TTS
- **AI**: OpenAI GPT-4o-mini for chat completions
- **Storage**: LocalStorage for settings & history
- **Deployment**: GitHub Pages (static hosting)

## 🏃‍♂️ Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` and head to **Settings** to add your OpenAI API key.

## ⚙️ Configuration & Usage

### First-Time Setup
1. **Get an OpenAI API Key**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. **Open Settings** → paste API key → choose voice → save
3. **Test the Talk button** → speak → see transcription in History

### Voice Commands
| Intent | Example | Response |
|--------|---------|----------|
| **Note** | "Take a note: love this character development" | Says "Noted", saves cleaned-up text |
| **Define** | "Define bildungsroman" | 1-sentence definition via TTS + History |
| **Question** | "Who was Virginia Woolf?" | 2-sentence answer via TTS + History |

### Settings Options
- **OpenAI API Key** → Required for all AI features
- **System Prompt** → Customize the AI's response style
- **Voice** → Choose from alloy, echo, fable, nova, onyx, shimmer, sage
- **Silent Mode** → Skip TTS, text-only responses
- **Debug Mode** → Show API request/response logs in console

## 📱 History & Export

- **Filter by type**: All / Notes / Q&A
- **Scroll performance**: Virtualized list handles thousands of entries
- **PDF Export**: One-click download of filtered history
- **Auto-collapse**: Shows recent 10 by default, expandable

## 🚀 Deploying to GitHub Pages

```bash
# Build and deploy in one command
npm run deploy
```

This builds the project and publishes to the `gh-pages` branch. Enable GitHub Pages in your repo settings (Source: gh-pages branch).

## 🔧 Development & Architecture

### Key Files
- `src/App.tsx` → Main component with mic button & state
- `src/utils/openai.ts` → STT, TTS, and chat API calls  
- `src/utils/intent.ts` → Parses voice input into Note/Define/Question
- `src/components/HistoryDrawer.tsx` → Virtualized history with PDF export
- `src/components/SettingsPane.tsx` → Configuration UI
- `src/context/SidekickContext.tsx` → Global state & localStorage persistence

### Performance Notes
- **Lazy loading**: jsPDF only loads when exporting
- **Virtualization**: react-window handles large history lists
- **Efficient models**: GPT-4o-mini for speed + cost optimization
- **Local caching**: Settings & history persist in localStorage

## 🎯 Future Enhancements

- **Faster models**: Switch to gpt-3.5-turbo-mini for 2-3x speed boost
- **Voice activity detection**: Auto-stop recording on silence
- **Offline mode**: PWA with service worker caching
- **Fine-tuned models**: Custom note cleanup for better accuracy
- **Batch operations**: Group similar requests to reduce API calls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this for your own audiobook adventures! 