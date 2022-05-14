import { Env } from 'onnxruntime-common';
import { OrtWasmModule } from './ort-wasm';
export declare const initializeWebAssembly: (flags: Env.WebAssemblyFlags) => Promise<void>;
export declare const getInstance: () => OrtWasmModule;
export declare const dispose: () => void;
