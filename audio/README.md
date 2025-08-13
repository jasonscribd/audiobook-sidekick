# Audio Files

This directory should contain the audiobook files.

## Required File

- `treasure-island-ch1.mp3` - A sample chapter from Treasure Island audiobook
  - Format: MP3 or M4A (AAC)
  - Bitrate: 128-192 kbps
  - Sample Rate: 44.1 kHz
  - Should be a few minutes long for testing

## File Placement

The audio service will look for:
`/public/audio/treasure-island-ch1.mp3`

## Testing

Until a real audio file is added, the audio controls will show error messages when attempting to play.

To test with a real file:
1. Add an MP3 or M4A file named `treasure-island-ch1.mp3` to this directory
2. The app will automatically detect and load it
3. All playback controls should work normally
