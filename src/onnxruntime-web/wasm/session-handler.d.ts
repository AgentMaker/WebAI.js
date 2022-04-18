import { InferenceSession, SessionHandler } from 'onnxruntime-common';
export declare class OnnxruntimeWebAssemblySessionHandler implements SessionHandler {
    private sessionId;
    inputNames: string[];
    outputNames: string[];
    loadModel(model: Uint8Array, options?: InferenceSession.SessionOptions): Promise<void>;
    dispose(): Promise<void>;
    run(feeds: SessionHandler.FeedsType, fetches: SessionHandler.FetchesType, options: InferenceSession.RunOptions): Promise<SessionHandler.ReturnType>;
    startProfiling(): void;
    endProfiling(): void;
}
