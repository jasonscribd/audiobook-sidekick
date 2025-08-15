import { Settings } from "../context/SidekickContext";

type FetchOpts = { signal?: AbortSignal; timeoutMs?: number };

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: init.signal ?? controller.signal });
    return res;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function transcribeAudio(blob: Blob, settings: Settings, opts: FetchOpts = {}): Promise<string> {
  if (!settings.apiKey) throw new Error("OpenAI API key missing in Settings");
  const form = new FormData();
  form.append("model", "whisper-1");
  form.append("file", new File([blob], "audio.wav", { type: "audio/wav" }));

  const res = await fetchWithTimeout("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: form,
    signal: opts.signal,
  }, opts.timeoutMs ?? 15000);

  let data: any = null;
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) {
    const message = data?.error?.message || `Transcription failed (status ${res.status})`;
    throw new Error(message);
  }
  if (settings.debug) {
    console.debug("Whisper response", data);
  }
  return data.text as string;
}

export async function chatCompletion(userText: string, settings: Settings, useSimpleModel = false, opts: FetchOpts = {}): Promise<string> {
  if (!settings.apiKey) throw new Error("OpenAI API key missing");
  
  // Use cost-efficient model for all tasks
  const model = "gpt-3.5-turbo-0125";
  
  // Optimized token limits: simple tasks get fewer tokens, complex tasks get more
  const maxTokens = useSimpleModel ? 40 : 100;
  
  const res = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: settings.systemPrompt },
        { role: "user", content: userText },
      ],
      max_tokens: maxTokens,
      temperature: 0, // Consistent, faster responses
      stream: false, // We'll implement streaming separately
    }),
    signal: opts.signal,
  }, opts.timeoutMs ?? 12000);

  let data: any = null;
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) {
    const message = data?.error?.message || `Chat request failed (status ${res.status})`;
    throw new Error(message);
  }
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (settings.debug) console.debug("Chat response", data);
  return reply || "";
}

// New streaming chat completion function
export async function chatCompletionStreaming(
  userText: string, 
  settings: Settings, 
  useSimpleModel = false,
  onChunk?: (chunk: string) => void,
  opts: FetchOpts = {}
): Promise<string> {
  if (!settings.apiKey) throw new Error("OpenAI API key missing");
  
  const model = "gpt-3.5-turbo-0125";
  const maxTokens = useSimpleModel ? 40 : 100;
  
  const res = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: settings.systemPrompt },
        { role: "user", content: userText },
      ],
      max_tokens: maxTokens,
      temperature: 0,
      stream: true,
    }),
    signal: opts.signal,
  }, opts.timeoutMs ?? 20000);

  if (!res.ok) {
    let errorData: any = null;
    try { errorData = await res.json(); } catch { /* ignore */ }
    throw new Error(errorData?.error?.message || `Streaming chat request failed (status ${res.status})`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body reader");

  let fullResponse = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      buffer += chunk;

      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              onChunk?.(content);
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (settings.debug) console.debug("Streaming response complete:", fullResponse);
  return fullResponse.trim();
}

export async function synthesizeSpeech(text: string, settings: Settings): Promise<ArrayBuffer> {
  if (!settings.apiKey) throw new Error("OpenAI API key missing");
  const res = await fetchWithTimeout("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: "tts-1", // Use standard model for cost efficiency
      voice: settings.voiceId || "alloy",
      input: text,
      format: "mp3",
    }),
  }, 15000);

  if (!res.ok) {
    let data: any = null;
    try { data = await res.json(); } catch { /* ignore */ }
    throw new Error(data?.error?.message || `TTS failed (status ${res.status})`);
  }

  const arrayBuf = await res.arrayBuffer();
  return arrayBuf;
}

// Stream TTS for sentences as they arrive
export async function synthesizeSpeechChunked(
  textStream: AsyncIterable<string>, 
  settings: Settings,
  onAudioChunk?: (audio: ArrayBuffer) => void
): Promise<void> {
  if (!settings.apiKey) throw new Error("OpenAI API key missing");
  
  let buffer = '';
  const sentences: string[] = [];
  
  // Collect complete sentences from the stream
  for await (const chunk of textStream) {
    buffer += chunk;
    
    // Split on sentence endings
    const matches = buffer.match(/[.!?]+/g);
    if (matches) {
      const parts = buffer.split(/([.!?]+)/);
      for (let i = 0; i < parts.length - 1; i += 2) {
        if (parts[i] && parts[i + 1]) {
          const sentence = parts[i] + parts[i + 1];
          if (sentence.trim().length > 10) { // Only process substantial sentences
            sentences.push(sentence.trim());
          }
        }
      }
      // Keep the incomplete part
      buffer = parts[parts.length - 1] || '';
    }
    
    // Process complete sentences immediately
    while (sentences.length > 0) {
      const sentence = sentences.shift()!;
      try {
        const audioBuffer = await synthesizeSpeech(sentence, settings);
        onAudioChunk?.(audioBuffer);
      } catch (error) {
        console.error('TTS chunk failed:', error);
      }
    }
  }
  
  // Process any remaining text
  if (buffer.trim().length > 5) {
    try {
      const audioBuffer = await synthesizeSpeech(buffer.trim(), settings);
      onAudioChunk?.(audioBuffer);
    } catch (error) {
      console.error('Final TTS chunk failed:', error);
    }
  }
}

// Pre-warm API connections to eliminate cold starts
export function preWarmConnections(apiKey: string): void {
  if (!apiKey) return;
  
  // Pre-warm chat completions endpoint with default cost-efficient model
  fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo-0125",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 1,
    }),
  }).catch(() => {
    // Ignore errors, this is just for warming
  });

  // Pre-warm TTS endpoint
  fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "tts-1",
      voice: "alloy",
      input: "test",
      format: "mp3",
    }),
  }).catch(() => {
    // Ignore errors, this is just for warming
  });

  // Pre-warm Whisper endpoint
  const dummyWav = new Blob([new ArrayBuffer(44)], { type: "audio/wav" });
  const form = new FormData();
  form.append("model", "whisper-1");
  form.append("file", new File([dummyWav], "test.wav", { type: "audio/wav" }));
  
  fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  }).catch(() => {
    // Ignore errors, this is just for warming
  });
} 