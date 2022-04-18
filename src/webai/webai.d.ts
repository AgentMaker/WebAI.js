import opencv, { Mat, Scalar } from "../opencv/opencv"
import onnxruntime, { InferenceSession, Tensor } from '../onnxruntime-web'


declare const waitForOpenCV: Promise<() => void>

declare class Model {
    static create(
        modelURL: string,
        sessionOption?: InferenceSession.SessionOptions,
        init?: (model: Model) => void,
        preProcess?: (...args: any[]) => InferenceSession.OnnxValueMapType,
        postProcess?: (resultsTensors: InferenceSession.OnnxValueMapType, ...args: any[]) => any
    ): Promise<Model>
    infer(...args: any[]): any
}

declare class CV {
    static create(
        modelURL: string,
        inferConfig: string,
        sessionOption?: InferenceSession.SessionOptions,
        getFeeds?: (imgTensor: Tensor, imScaleX: number, imScaleY: number) => InferenceSession.OnnxValueMapType,
        postProcess?: (resultsTensors: InferenceSession.OnnxValueMapType, ...args: any[]) => any
    ): Promise<CV>
    loadConfigs(inferConfig: string): void
    preProcess(...args: any[]): InferenceSession.OnnxValueMapType
    infer(...args: any[]): any
}


declare class Det extends CV {
    postProcess(resultsTensors: InferenceSession.OnnxValueMapType, ...args: any[]): { label: string, color: [number, number, number, number], score: number, x1: number, y1: number, x2: number, y2: number }[]
    getFeeds(imgTensor: Tensor, imScaleX: number, imScaleY: number): InferenceSession.OnnxValueMapType
    infer(imgRGBA: Mat, drawThreshold?: number): { label: string, color: [number, number, number, number], score: number, x1: number, y1: number, x2: number, y2: number }[]
}


declare class Cls extends CV {
    postProcess(resultsTensors: InferenceSession.OnnxValueMapType, ...args: any[]): { label: string, prob: number }[]
    getFeeds(imgTensor: Tensor): InferenceSession.OnnxValueMapType
    infer(imgRGBA: Mat, topK?: number): { label: string, prob: number }[]
}

declare class Seg extends CV {
    postProcess(resultsTensors: InferenceSession.OnnxValueMapType): { gray: Mat, colorRGBA: Mat, colorMap: { label: string, color: [number, number, number, number] }[], delete: () => void }
    getFeeds(imgTensor: Tensor): InferenceSession.OnnxValueMapType
    infer(imgRGBA: Mat): { gray: Mat, colorRGBA: Mat, colorMap: { label: string, color: [number, number, number, number] }[], delete: () => void }
}

declare module WebAI {
    export function argmax(arr: number[]): number
    export function getIMScale(
        height: number,
        width: number,
        targetSize: [number, number],
        keepRatio: boolean,
        limitMax: boolean
    ): [number, number]
    export function rgba2rgb(imgRGBA: Mat): Mat
    export function rgba2bgr(imgRGBA: Mat): Mat
    export function resize(
        img: Mat,
        height: number,
        width: number,
        targetSize: number,
        keepRatio: number,
        limitMax: boolean,
        interp: number
    ): [Mat, number, number]
    export function crop(img: Mat, cropSize: [number, number]): Mat
    export function normalize(
        img: Mat,
        scale: Scalar,
        mean: Scalar,
        std: Scalar,
        isScale: boolean
    ): Mat
    export function permute(img: Mat): Float32Array
    export function loadText(textURL: string): string
    export function getColorMap(labelList: string[]): { label: string, color: Scalar }[]
    export function drawBBoxes(
        img: Mat,
        bboxes: { label: string, color: [number, number, number, number], score: number, x1: number, y1: number, x2: number, y2: number }[],
        withLabel?: boolean,
        withScore?: boolean,
        thickness?: number,
        lineType?: number,
        fontFace?: number,
        fontScale?: number
    ): Mat
    export module Model {
        export function create(
            modelURL: string,
            sessionOption?: InferenceSession.SessionOptions,
            init?: (model: Model) => void,
            preProcess?: (...args: any[]) => InferenceSession.OnnxValueMapType,
            postProcess?: ((resultsTensors: InferenceSession.OnnxValueMapType, ...args: any[]) => any)
        ): Promise<Model>
        export function infer(...args: any[]): any
    }
    export module CV {
        export function create(
            modelURL: string,
            inferConfig: string,
            sessionOption?: InferenceSession.SessionOptions,
            getFeeds?: (imgTensor: Tensor, imScaleX: number, imScaleY: number) => InferenceSession.OnnxValueMapType,
            postProcess?: (resultsTensors: InferenceSession.OnnxValueMapType, ...args: any[]) => any
        ): Promise<CV>
        export function loadConfigs(inferConfig: string): void
        export function preProcess(...args: any[]): InferenceSession.OnnxValueMapType
        export function infer(...args: any[]): any
    }
    export module Det {
        export function create(
            modelURL: string,
            inferConfig: string,
            sessionOption?: InferenceSession.SessionOptions,
            getFeeds?: (imgTensor: Tensor, imScaleX: number, imScaleY: number) => InferenceSession.OnnxValueMapType,
            postProcess?: (resultsTensors: InferenceSession.OnnxValueMapType, ...args: any[]) => any
        ): Promise<Det>
        export function preProcess(...args: any[]): InferenceSession.OnnxValueMapType
        export function loadConfigs(inferConfig: string): void
        export function postProcess(resultsTensors: InferenceSession.OnnxValueMapType, ...args: any[]): { label: string, color: [number, number, number, number], score: number, x1: number, y1: number, x2: number, y2: number }[]
        export function getFeeds(imgTensor: Tensor, imScaleX: number, imScaleY: number): InferenceSession.OnnxValueMapType
        export function infer(imgRGBA: Mat, drawThreshold?: number): { label: string, color: [number, number, number, number], score: number, x1: number, y1: number, x2: number, y2: number }[]
    }
    export module Cls {
        export function create(
            modelURL: string,
            inferConfig: string,
            sessionOption?: InferenceSession.SessionOptions,
            getFeeds?: (imgTensor: Tensor, imScaleX: number, imScaleY: number) => InferenceSession.OnnxValueMapType,
            postProcess?: (resultsTensors: InferenceSession.OnnxValueMapType, ...args: any[]) => any
        ): Promise<Cls>
        export function preProcess(...args: any[]): InferenceSession.OnnxValueMapType
        export function loadConfigs(inferConfig: string): void
        export function postProcess(resultsTensors: InferenceSession.OnnxValueMapType, ...args: any[]): { label: string, prob: number }[]
        export function getFeeds(imgTensor: Tensor): InferenceSession.OnnxValueMapType
        export function infer(imgRGBA: Mat, topK?: number): { label: string, prob: number }[]
    }
    export module Seg {
        export function create(
            modelURL: string,
            inferConfig: string,
            sessionOption?: InferenceSession.SessionOptions,
            getFeeds?: (imgTensor: Tensor, imScaleX: number, imScaleY: number) => InferenceSession.OnnxValueMapType,
            postProcess?: (resultsTensors: InferenceSession.OnnxValueMapType, ...args: any[]) => any
        ): Promise<Seg>
        export function preProcess(...args: any[]): InferenceSession.OnnxValueMapType
        export function loadConfigs(inferConfig: string): void
        export function postProcess(resultsTensors: InferenceSession.OnnxValueMapType): { gray: Mat, colorRGBA: Mat, colorMap: { label: string, color: [number, number, number, number] }[], delete: () => void }
        export function getFeeds(imgTensor: Tensor): InferenceSession.OnnxValueMapType
        export function infer(imgRGBA: Mat): { gray: Mat, colorRGBA: Mat, colorMap: { label: string, color: [number, number, number, number] }[], delete: () => void }
    }
    export const cv: typeof opencv
    export const ort: typeof onnxruntime
    export const waitForOpenCV: Promise<() => void>
}

export { WebAI as default, WebAI, Model, CV, Det, Cls, Seg, opencv as cv, onnxruntime as ort, waitForOpenCV }