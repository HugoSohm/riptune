import { readFile } from '@tauri-apps/plugin-fs';


function getWorker(): Worker {
  // Reuse an idle worker or spawn a new one (max one per concurrent analysis)
  const worker = new Worker(new URL('../workers/essentiaWorker.ts', import.meta.url), {
    type: 'module',
  });
  return worker;
}

/**
 * Analyzes an audio file from its local path.
 * Decodes audio on the main thread, then offloads WASM computation to a Web Worker
 * so multiple files can be analyzed concurrently without blocking the UI.
 * Returns [bpm, keyStr]
 */
export async function analyzeAudioFile(filepath: string, deepAnalysis: boolean = false): Promise<[number, string, number, number]> {
  // Step 1 (main thread): read file + decode audio — uses Tauri fs APIs unavailable in workers
  const audioData = await readFile(filepath);
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(audioData.buffer);
  } finally {
    await audioCtx.close();
  }

  const sampleRate = audioBuffer.sampleRate;
  const signal: Float32Array = deepAnalysis
    ? audioBuffer.getChannelData(0).slice() // slice() to copy — getChannelData returns a live view
    : audioBuffer.getChannelData(0).slice(0, Math.min(audioBuffer.length, 60 * sampleRate));

  // Step 2 (Web Worker): run CPU-intensive WASM computation off the main thread
  return new Promise<[number, string, number, number]>((resolve, reject) => {
    const worker = getWorker();
    const taskId = crypto.randomUUID();

    const onMessage = (e: MessageEvent) => {
      if (e.data.taskId !== taskId) return;
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      worker.terminate();

      if (e.data.error) {
        reject(new Error(e.data.error));
      } else {
        resolve([e.data.bpm, e.data.keyStr, e.data.bpmConfidence, e.data.keyStrength]);
      }
    };

    const onError = (e: ErrorEvent) => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      worker.terminate();
      reject(new Error(e.message));
    };

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);

    // Transfer the Float32Array buffer (zero-copy) to the worker
    worker.postMessage({ signal, taskId }, [signal.buffer]);
  });
}
