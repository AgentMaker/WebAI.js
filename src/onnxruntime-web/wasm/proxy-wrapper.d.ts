import { InferenceSession } from 'onnxruntime-common';
import { SerializableSessionMetadata, SerializableTensor } from './proxy-messages';
export declare const initWasm: () => Promise<void>;
export declare const initOrt: (numThreads: number, loggingLevel: number) => Promise<void>;
export declare const createSession: (model: Uint8Array, options?: InferenceSession.SessionOptions | undefined) => Promise<SerializableSessionMetadata>;
export declare const releaseSession: (sessionId: number) => Promise<void>;
export declare const run: (sessionId: number, inputIndices: number[], inputs: SerializableTensor[], outputIndices: number[], options: InferenceSession.RunOptions) => Promise<SerializableTensor[]>;
export declare const endProfiling: (sessionId: number) => Promise<void>;
