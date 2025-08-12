import { useRef, useState } from "react";

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);

  const start = async () => {
    if (recording) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      // Create AudioContext for PCM processing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      chunksRef.current = [];
      
      processor.onaudioprocess = (e) => {
        const inputBuffer = e.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        // Store PCM data as Float32Array
        chunksRef.current.push(new Float32Array(inputData));
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      audioContextRef.current = audioContext;
      processorRef.current = processor;
      setRecording(true);
      
    } catch (error) {
      console.error("Failed to start recording:", error);
      throw error;
    }
  };

  const stop = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        if (!audioContextRef.current || !processorRef.current) {
          reject(new Error("No active recorder"));
          return;
        }
        
        // Disconnect and cleanup
        processorRef.current.disconnect();
        audioContextRef.current.close();
        
        // Convert Float32Array chunks to 16-bit PCM WAV
        const totalLength = chunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
        const pcmData = new Float32Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunksRef.current) {
          pcmData.set(chunk, offset);
          offset += chunk.length;
        }
        
        // Convert to 16-bit PCM and create WAV blob
        const wavBlob = createWavBlob(pcmData, 16000);
        setRecording(false);
        resolve(wavBlob);
        
      } catch (error) {
        console.error("Failed to stop recording:", error);
        reject(error);
      }
    });
  };

  return { recording, start, stop };
}

// Helper function to create WAV blob from PCM data
function createWavBlob(pcmData: Float32Array, sampleRate: number): Blob {
  const length = pcmData.length;
  const arrayBuffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);
  
  // Convert float32 to int16
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, pcmData[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
} 