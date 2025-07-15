import { Settings } from "../context/SidekickContext";

export async function transcribeAudio(blob: Blob, settings: Settings): Promise<string> {
  if (!settings.apiKey) throw new Error("OpenAI API key missing in Settings");
  const form = new FormData();
  form.append("model", "whisper-1");
  form.append("file", new File([blob], "audio.webm", { type: "audio/webm" }));

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: form,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Transcription failed");
  }
  if (settings.debug) {
    console.debug("Whisper response", data);
  }
  return data.text as string;
}

export async function chatCompletion(userText: string, settings: Settings): Promise<string> {
  if (!settings.apiKey) throw new Error("OpenAI API key missing");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: settings.systemPrompt },
        { role: "user", content: userText },
      ],
      max_tokens: 80,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Chat request failed");
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (settings.debug) console.debug("Chat response", data);
  return reply || "";
}

export async function synthesizeSpeech(text: string, settings: Settings): Promise<ArrayBuffer> {
  if (!settings.apiKey) throw new Error("OpenAI API key missing");
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: "tts-1",
      voice: settings.voiceId || "alloy",
      input: text,
      format: "mp3",
    }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error?.message || "TTS failed");
  }

  const arrayBuf = await res.arrayBuffer();
  return arrayBuf;
} 