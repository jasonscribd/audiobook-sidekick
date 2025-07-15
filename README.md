# Audiobook Sidekick

A minimalist, hands-free web companion that adds a push-to-talk AI "Sidekick" to any audiobook—while the audiobook plays in a separate app.

## Features (MVP)

- Floating microphone button for push-to-talk interaction
- Speech-to-Text via OpenAI Whisper
- Text-to-Speech via OpenAI Advanced Voice
- Command handling for **Note**, **Define**, and **Fact** intents
- History drawer showing interaction log
- Settings pane (API key, system prompt, voice selection, debug)
- Mobile-first UI with Tailwind CSS

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS
- Web Audio API + OpenAI Audio endpoints
- LocalStorage for persistence
- Deployed via GitHub Pages

## Getting Started

```bash
# Install dependencies (do not copy the comment symbols)
npm install

# Start the dev server
npm run dev
```

The app should open at `http://localhost:5173`.

## Configuration

The first time you open the app, head to **Settings** and paste your OpenAI API key.

## Deploying to GitHub Pages

1. Make sure the `base` field in `vite.config.ts` matches the repository name (e.g. `/audiobook-sidekick/`).
2. Commit your changes and push to GitHub.
3. Run:

```bash
npm run deploy
```

This will build the project and publish the `dist` folder to the `gh-pages` branch. Enable GitHub Pages in the repository settings, pointing to that branch.

## Roadmap

- [ ] Implement STT integration
- [ ] Implement TTS integration
- [ ] Finish settings, history, and command logic
- [ ] Polish UI & accessibility 