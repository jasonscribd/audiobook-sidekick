import { Settings, BookContext } from "../context/SidekickContext";

// Helper function to trim context if too large
function trimBookContext(markdown: string, maxChars: number = 10000): string {
  if (markdown.length <= maxChars) return markdown;
  
  // Try to find a good breaking point (end of a section or paragraph)
  const trimmed = markdown.substring(0, maxChars);
  const lastDoubleNewline = trimmed.lastIndexOf('\n\n');
  const lastSingleNewline = trimmed.lastIndexOf('\n');
  const lastPeriod = trimmed.lastIndexOf('.');
  
  // Use the best breaking point we can find
  const breakPoint = lastDoubleNewline > maxChars * 0.8 ? lastDoubleNewline :
                     lastSingleNewline > maxChars * 0.9 ? lastSingleNewline :
                     lastPeriod > maxChars * 0.9 ? lastPeriod + 1 : maxChars;
  
  return trimmed.substring(0, breakPoint) + '\n\n[Context truncated for length]';
}

// Helper function to build messages with optional book context
function buildMessages(settings: Settings, userText: string, bookContext?: BookContext | null): Array<{role: string, content: string}> {
  const messages = [
    { role: "system", content: settings.systemPrompt }
  ];

  // Add book context if available and enabled
  if (settings.useBookContext && bookContext?.bookContextMarkdown?.trim()) {
    const trimmedContext = trimBookContext(bookContext.bookContextMarkdown);
    const contextMessage = `BOOK CONTEXT (for ${settings.currentBookTitle}):

Use the following book context as your primary source. If the answer isn't supported by this context, say you're not sure. Be concise (1–2 sentences).

${trimmedContext}`;
    
    messages.push({ role: "system", content: contextMessage });
  }

  messages.push({ role: "user", content: userText });
  return messages;
}

export async function transcribeAudio(blob: Blob, settings: Settings): Promise<string> {
  if (!settings.apiKey) throw new Error("OpenAI API key missing in Settings");
  const form = new FormData();
  form.append("model", "whisper-1");
  form.append("file", new File([blob], "audio.wav", { type: "audio/wav" }));

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

export async function chatCompletion(userText: string, settings: Settings, useSimpleModel = false, bookContext?: BookContext | null): Promise<string> {
  if (!settings.apiKey) throw new Error("OpenAI API key missing");
  
  // Use fast model for simple tasks when enabled
  const model = (settings.fastMode && useSimpleModel) ? "gpt-3.5-turbo-0125" : "gpt-4o-mini";
  
  // Sufficient tokens for 1-2 complete sentences (avg 15-20 tokens per sentence)
  const maxTokens = (settings.fastMode && useSimpleModel) ? 60 : 80;
  
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: buildMessages(settings, userText, bookContext),
      max_tokens: maxTokens,
      temperature: 0, // Consistent, faster responses
      stream: false, // We'll implement streaming separately
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Chat request failed");
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
  bookContext?: BookContext | null
): Promise<string> {
  if (!settings.apiKey) throw new Error("OpenAI API key missing");
  
  const model = (settings.fastMode && useSimpleModel) ? "gpt-3.5-turbo-0125" : "gpt-4o-mini";
  const maxTokens = (settings.fastMode && useSimpleModel) ? 60 : 80;
  
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: buildMessages(settings, userText, bookContext),
      max_tokens: maxTokens,
      temperature: 0,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.error?.message || "Streaming chat request failed");
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

// Pre-warm API connections to eliminate cold starts
export function preWarmConnections(apiKey: string): void {
  if (!apiKey) return;
  
  // Pre-warm chat completions endpoint
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