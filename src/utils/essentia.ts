import Essentia from 'essentia.js/dist/essentia.js-core.es.js';
import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm.es.js';
import { readFile } from '@tauri-apps/plugin-fs';

let essentia: any = null;

export async function initEssentia() {
  if (essentia) return essentia;

  let wasmModule = EssentiaWASM;

  // Handle the case where EssentiaWASM is exported as a nested object (common in some UMD/CJS builds)
  if (wasmModule && (wasmModule as any).EssentiaWASM) {
    wasmModule = (wasmModule as any).EssentiaWASM;
  }

  // If it's a factory function (common in some Emscripten configurations), call it
  if (typeof wasmModule === 'function') {
    wasmModule = await (wasmModule as any)();
  }

  // Wait for wasm module to be ready if it has a then method (Promise-like)
  if (wasmModule && typeof (wasmModule as any).then === 'function') {
    wasmModule = await wasmModule;
  }

  if (!wasmModule || !(wasmModule as any).EssentiaJS) {
    console.error("EssentiaJS not found in WASM module. Available keys:", Object.keys(wasmModule || {}));
    throw new Error("EssentiaWASM initialization failed: EssentiaJS not found in module");
  }

  essentia = new Essentia(wasmModule);

  return essentia;
}

/**
 * Analyzes an audio file from its local path
 * Returns [bpm, key]
 */
export async function analyzeAudioFile(filepath: string, deepAnalysis: boolean = false): Promise<[number, string]> {
  const ess = await initEssentia();
  const audioData = await readFile(filepath);
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(audioData.buffer);

  // 1. Extract desired audio segment (full track if deepAnalysis, else first 60 seconds)
  const sampleRate = audioBuffer.sampleRate;
  const signal = deepAnalysis
    ? audioBuffer.getChannelData(0)
    : audioBuffer.getChannelData(0).slice(0, Math.min(audioBuffer.length, 60 * sampleRate));

  // 2. Compute BPM using PercivalBpmEstimator
  const vectorSignal = ess.arrayToVector(signal);
  let bpm = 0;
  let keyStr = "Unknown";

  try {
    const bpmResult = ess.PercivalBpmEstimator(vectorSignal);
    bpm = Math.round(bpmResult.bpm * 10) / 10;

    // 3. Compute Key
    const keyResult = ess.KeyExtractor(vectorSignal);
    keyStr = `${keyResult.key} ${keyResult.scale === 'minor' ? 'min' : 'maj'}`;
  } catch (err) {
    console.error("Error during Essentia analysis:", err);
  } finally {
    // Memory cleanup for WASM vectors
    if (vectorSignal && typeof vectorSignal.delete === 'function') {
      vectorSignal.delete();
    }
    await audioCtx.close();
  }

  return [bpm, keyStr];
}
