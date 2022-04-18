import { InferenceSession as InferenceSessionInterface } from './inference-session';
declare type SessionOptions = InferenceSessionInterface.SessionOptions;
declare type RunOptions = InferenceSessionInterface.RunOptions;
declare type FeedsType = InferenceSessionInterface.FeedsType;
declare type FetchesType = InferenceSessionInterface.FetchesType;
declare type ReturnType = InferenceSessionInterface.ReturnType;
export declare class InferenceSession implements InferenceSessionInterface {
    private constructor();
    run(feeds: FeedsType, options?: RunOptions): Promise<ReturnType>;
    run(feeds: FeedsType, fetches: FetchesType, options?: RunOptions): Promise<ReturnType>;
    static create(path: string, options?: SessionOptions): Promise<InferenceSessionInterface>;
    static create(buffer: ArrayBufferLike, options?: SessionOptions): Promise<InferenceSessionInterface>;
    static create(buffer: ArrayBufferLike, byteOffset: number, byteLength?: number, options?: SessionOptions): Promise<InferenceSessionInterface>;
    static create(buffer: Uint8Array, options?: SessionOptions): Promise<InferenceSessionInterface>;
    startProfiling(): void;
    endProfiling(): void;
    get inputNames(): readonly string[];
    get outputNames(): readonly string[];
    private handler;
}
export {};
