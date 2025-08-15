# Audiobook Sidekick

An intelligent, hands-free web companion that transforms your audiobook experience with AI-powered voice interaction, contextual notes, and seamless conversation tracking.

## 🎧 How It Works

1. **Open the Sidekick** in your browser while listening to any audiobook (Audible, Libby, Spotify, etc.)
2. **Tap the Talk button** to start voice capture  
3. **Speak your request** ("Take a note: great metaphor here", "Define bildungsroman", or "Tell me about Long John Silver")
4. **Tap Stop** to end recording
5. **Sidekick responds** with optimized voice + text, automatically creating timestamped note markers
6. **Continue conversations** in the dedicated Conversation View with full chat interface

## 🚀 Core Features

- **Interactive Audio Player** → Drag-to-scrub progress bar with smooth audio navigation
- **Conversation View** → Dedicated chat interface with streaming responses and conversation history
- **Smart Note Markers** → Visual timeline dots showing saved notes linked to audio timestamps  
- **Intelligent Intent Detection** → Recognizes Notes, Definitions, Questions, and Book-specific queries
- **Optimized Voice Interaction** → OpenAI Whisper (STT) + streaming TTS with sentence-based delivery
- **Book-Aware AI** → Enhanced responses for Treasure Island with detailed summary integration
- **Advanced History Management** → Filterable conversations, notes, and one-click data clearing
- **Single-Page Navigation** → Seamless routing between home and conversation views
- **Cost-Optimized Performance** → GPT-3.5-turbo and TTS-1 models for maximum affordability

## 🛠️ Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS  
- **Audio**: Interactive HTML5 Audio + Web Audio API + OpenAI Whisper & TTS with streaming optimization
- **AI**: OpenAI GPT-3.5-turbo for cost-efficient chat completions with context-aware book integration
- **Routing**: Hash-based SPA navigation for GitHub Pages compatibility
- **Storage**: LocalStorage for settings, history, and note markers persistence
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
| **Note** | "Take a note: love this character development" | Says "Noted", saves timestamped note marker |
| **Define** | "Define bildungsroman" | 1-sentence definition via streaming TTS |
| **Question** | "Who was Virginia Woolf?" | 2-sentence answer via streaming TTS |
| **Book** | "Tell me about Long John Silver" | Context-aware response using Treasure Island summary |

### Interactive Audio Player
- **Drag-to-Scrub** → Smooth progress bar dragging with real-time audio seeking
- **Click-to-Seek** → Single-click anywhere on progress bar to jump to position
- **Live Feedback** → Visual knob scaling and timestamp updates during interaction
- **Touch Support** → Full mobile and tablet drag functionality
- **Keyboard Navigation** → Arrow keys for 5s steps, Home/End for full range
- **Smart Pausing** → Audio automatically pauses during scrubbing for better UX

### Note Markers System
- **Visual Timeline Dots** → Yellow markers appear on audio progress bar
- **Timestamp Linking** → Notes automatically linked to current audio position  
- **Quick Navigation** → Click note dots to jump to conversation view
- **Auto-Preview** → Recent conversations automatically link to note markers

### Settings Options
- **OpenAI API Key** → Required for all AI features
- **System Prompt** → Customize the AI's response style  
- **Voice** → Choose from alloy, echo, fable, nova, onyx, shimmer, sage
- **Silent Mode** → Skip TTS, text-only responses
- **Debug Mode** → Show API request/response logs in console
- **Data Management** → Clear all history and notes with one click
- **API Pre-warming** → Reduce first-response latency by warming connections

## 💬 Conversation View & History

- **Dedicated Chat Interface** → Full-screen conversation view with streaming responses
- **Answer-Focused Archive** → Clean display showing only AI responses for easy reading
- **Real-time Streaming** → Watch responses appear word-by-word with live audio
- **Smart Navigation** → Seamless transitions from popup to conversation view
- **Note Integration** → Toast notifications when navigating from note markers
- **PDF Export** → One-click download of conversation history
- **Data Management** → Clear all conversations and notes from settings

## 🚀 Deploying to GitHub Pages

```bash
# Build and deploy in one command
npm run deploy
```

This builds the project and publishes to the `gh-pages` branch. Enable GitHub Pages in your repo settings (Source: gh-pages branch).

## 🔧 Development & Architecture

### Key Files
- `src/App.tsx` → Main app with hash-based routing and navigation
- `src/components/HomeScreen.tsx` → Audio player interface with note markers
- `src/components/ConversationView.tsx` → Dedicated chat interface with streaming
- `src/components/SidekickPopup.tsx` → Voice interaction popup with optimized TTS
- `src/utils/openai.ts` → STT, streaming TTS, and chat API calls
- `src/utils/intent.ts` → Enhanced intent parsing including book queries
- `src/utils/bookSummary.ts` → Treasure Island context integration
- `src/context/SidekickContext.tsx` → Global state with notes and history management
- `src/services/audioService.ts` → Audio playback and timeline management

### Performance Optimizations
- **Streaming TTS**: Sentence-based audio generation with concurrent processing  
- **Cost-Efficient Models**: GPT-3.5-turbo and TTS-1 with optimized request patterns
- **Progressive Audio**: First sentence plays while subsequent ones generate
- **Smart Text Display**: 25ms chunk delays to mask TTS generation time
- **Single AudioContext**: Reused audio context to eliminate initialization overhead
- **Interactive Audio Controls**: Optimized drag/touch events with throttled updates
- **Real-time UI Feedback**: Smooth visual transitions during audio scrubbing
- **Hash-based Routing**: SPA navigation compatible with GitHub Pages
- **Lazy Loading**: jsPDF and other heavy dependencies load on demand
- **LocalStorage Persistence**: Settings, history, and note markers cached locally

## 🎯 Future Enhancements

- **Multi-Book Support**: Expand beyond Treasure Island with configurable book summaries
- **Voice Activity Detection**: Auto-stop recording on silence detection  
- **Progressive Web App**: Offline mode with service worker caching
- **Enhanced Note Markers**: Category tags, search functionality, and export options
- **Conversation Branching**: Save multiple conversation threads from same note marker
- **Real-time Collaboration**: Share notes and conversations across devices
- **Advanced Book Integration**: Chapter-aware context and character relationship mapping
- **Accessibility Improvements**: Screen reader optimization and keyboard navigation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this for your own audiobook adventures! 