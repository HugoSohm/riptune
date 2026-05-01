// Web Worker: runs Essentia WASM analysis off the main thread
// Receives the audio signal as a Float32Array and returns [bpm, keyStr]

import Essentia from 'essentia.js/dist/essentia.js-core.es.js';
import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm.es.js';

let essentia: any = null;

async function initEssentia() {
  if (essentia) return essentia;

  let wasmModule = EssentiaWASM;
  if (wasmModule && (wasmModule as any).EssentiaWASM) {
    wasmModule = (wasmModule as any).EssentiaWASM;
  }
  if (typeof wasmModule === 'function') {
    wasmModule = await (wasmModule as any)();
  }
  if (wasmModule && typeof (wasmModule as any).then === 'function') {
    wasmModule = await wasmModule;
  }
  if (!wasmModule || !(wasmModule as any).EssentiaJS) {
    throw new Error('EssentiaWASM initialization failed');
  }

  essentia = new Essentia(wasmModule);
  return essentia;
}

self.onmessage = async (event: MessageEvent) => {
  const { signal, taskId } = event.data as { signal: Float32Array; taskId: string };

  try {
    const ess = await initEssentia();

    const vectorSignal = ess.arrayToVector(signal);
    let bpm = 0;
    let keyStr = 'Unknown';

    try {
      const bpmResult = ess.PercivalBpmEstimator(vectorSignal);
      bpm = Math.round(bpmResult.bpm * 10) / 10;
      const bpmConfidence = bpmResult.confidence || 0.8;

      const keyResult = ess.KeyExtractor(vectorSignal);
      keyStr = `${keyResult.key} ${keyResult.scale === 'minor' ? 'min' : 'maj'}`;
      const keyStrength = keyResult.strength || 0;

      self.postMessage({ taskId, bpm, keyStr, bpmConfidence, keyStrength });
    } finally {
      if (vectorSignal && typeof vectorSignal.delete === 'function') {
        vectorSignal.delete();
      }
    }
  } catch (err: any) {
    self.postMessage({ taskId, error: err?.message || String(err) });
  }
};
