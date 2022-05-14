import { Backend, InferenceSession, SessionHandler } from './common';
declare class OnnxjsBackend implements Backend {
    init(): Promise<void>;
    createSessionHandler(pathOrBuffer: string | Uint8Array, options?: InferenceSession.SessionOptions): Promise<SessionHandler>;
}
export declare const onnxjsBackend: OnnxjsBackend;
export {};
