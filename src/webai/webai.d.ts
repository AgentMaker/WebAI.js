import opencv, { Mat, Scalar } from '../opencv'
import onnxruntime, { InferenceSession, Tensor } from '../onnxruntime-web'


declare namespace WebAI {
    /**
     * get the index of the max value of the array.
     * @param arr array
     * @returns the index of the max value of the array
     */
    export function argmax(arr: number[]): number

    /**
     * get image scale.
     * @param height image height
     * @param width image width
     * @param targetSize target size [h, w]
     * @param keepRatio is keep the ratio of image size
     * @param limitMax is limit max size of image
     * @returns [scale factor of x axis, , scale factor of y axis]
     */
    export function getIMScale(height: number, width: number, targetSize: [number, number], keepRatio: boolean, limitMax: boolean): [number, number]

    /**
     * RGBA -> RGB image.
     * @param imgRGBA RGBA image
     * @returns RGB image
     */
    export function rgba2rgb(imgRGBA: Mat): Mat

    /**
     * RGBA -> BGR image.
     * @param imgRGBA RGBA image
     * @returns BGR image
     */
    export function rgba2bgr(imgRGBA: Mat): Mat

    /**
     * image resize.
     * @param img image mat
     * @param height image height
     * @param width image width
     * @param targetSize target size [h, w]
     * @param keepRatio is keep the ratio of image size
     * @param limitMax is limit max size of image
     * @param interp interpolation method
     * @returns [image resized, scale factor of x axis, , scale factor of y axis]
     */
    export function resize(img: Mat, height: number, width: number, targetSize: [number, number], keepRatio: boolean, limitMax: boolean, interp: number): [Mat, number, number]

    /**
     * image center crop.
     * @param img image mat
     * @param cropSize crop size [h, w]
     * @returns cropped image
     */
    export function crop(img: Mat, cropSize: [number, number]): Mat

    /**
     * image normalize.
     * @param img image mat
     * @param scale normalize scale
     * @param mean normalize mean
     * @param std normalize std
     * @param isScale is scale the image
     * @returns normalized image
     */
    export function normalize(img: Mat, scale: Scalar, mean: Scalar, std: Scalar, isScale: boolean): Mat

    /**
     * permute hwc -> chw.
     * @param img image mat
     * @returns image data
     */
    export function permute(img: Mat): Float32Array

    /**
     * load text content.
     * @param textURL text URL
     * @returns content of the text
     */
    export function loadText(textURL: string): string

    /**
     * get color map of label list.
     * @param labelList label list
     * @returns color map of label list
     */
    export function getColorMap(labelList: string[]): { label: string; color: [number, number, number, number]; }[]

    /**
     * draw bboxes onto the image.
     * @param img image mat
     * @param bboxes bboxes of detection
     * @param withLabel draw with label 
     * @param withScore draw with score
     * @param thickness line thickness
     * @param lineType line type
     * @param fontFace font face
     * @param fontScale font scale
     * @returns drawed image
     */
    export function drawBBoxes(
        img: Mat,
        bboxes: { label: string; color: Scalar; score: number; x1: number; y1: number; x2: number; y2: number; }[],
        withLabel?: boolean,
        withScore?: boolean,
        thickness?: number,
        lineType?: number,
        fontFace?: number,
        fontScale?: number
    ): Mat

    /**
     * wait for OpenCV initialized.
     */
    export const waitForOpenCV: Promise<unknown>

    export interface Model {
        constructor(
            modelURL: string,
            sessionOption?: InferenceSession.SessionOptions,
            init?: (model: Model) => void,
            preProcess?: (...arg: any[]) => InferenceSession.OnnxValueMapType,
            postProcess?: (resultsTensors: InferenceSession.OnnxValueMapType, ...args: any[]) => any
        ): Model
        promises: Promise<[unknown, InferenceSession]>
        session: InferenceSession
        preProcess(...arg: any[]): InferenceSession.OnnxValueMapType
        postProcess(resultsTensors: InferenceSession.OnnxValueMapType, ...args: any[]): any
    }


    export class Model {
        /**
         * create a base model.
         */
        constructor(
            modelURL: string,
            sessionOption?: InferenceSession.SessionOptions,
            init?: (model: Model) => void,
            preProcess?: (...arg: any[]) => InferenceSession.OnnxValueMapType,
            postProcess?: (resultsTensors: InferenceSession.OnnxValueMapType, ...args: any[]) => any
        )

        /**
         * base model infer function.
         * @param  args model infer paramters
         * @returns {any} model infer results
         */
        infer(...args: any[]): Promise<any>
    }


    export interface OP {
        type: string
        mode?: "BGR" | "RGB"
        mean?: [number, number, number]
        std?: [number, number, number]
        interp?: number
        is_crop?: boolean
        is_scale?: boolean
        is_resize?: boolean
        limit_max?: boolean
        keep_ratio?: boolean
        target_size?: [number, number]
        crop_size?: [number, number]
    }

    export interface CV {
        getFeeds(imgTensor: Tensor, imScaleX: number, imScaleY: number): InferenceSession.OnnxValueMapType
        isCrop: boolean
        isScale: boolean
        isResize: boolean
        isPermute: boolean
        mode?: "BGR" | "RGB"
        interp?: number
        limitMax?: boolean
        keepRatio?: boolean
        cropSize?: [number, number]
        targetSize?: [number, number]
        labelList?: string[]
        colorMap?: {
            label: string
            color: [number, number, number, number]
        }[]
        mean?: Scalar
        std?: Scalar
        scale?: Scalar
    }

    export class CV extends Model {
        /**
         * create a base CV model.
         * @param modelURL model URL
         * @param inferConfig model infer config URL
         * @param sessionOption onnxruntime session options
         * @param getFeeds get infer session feeds function
         * @param postProcess postprocess function
         * @returns base CV model object
         */
        constructor(
            modelURL: string,
            inferConfig: string,
            sessionOption?: InferenceSession.SessionOptions,
            getFeeds?: (imgTensor: Tensor, imScaleX: number, imScaleY: number) => InferenceSession.OnnxValueMapType,
            postProcess?: (resultsTensors: InferenceSession.OnnxValueMapType, ...args: any[]) => any
        )

        /**
         * load infer configs
         * @param inferConfig model infer config URL
         */
        loadConfigs(inferConfig: string): void

        /**
         * model preprocess function. 
         * @param args preprocess args
         * @returns session infer feeds
         */
        preProcess(...args: any[]): InferenceSession.OnnxValueMapType
    }

    export class Det extends CV {
        /**
         * get session infer feeds.
         * @param imgTensor image tensor
         * @param imScaleX image scale factor of x axis
         * @param imScaleY image scale factor of y axis
         * @returns session infer feeds
         */
        getFeeds(imgTensor: Tensor, imScaleX: number, imScaleY: number): InferenceSession.OnnxValueMapType

        /**
         * detection postprocess.
         * @param resultsTensors result tensors
         * @param args postprocess args
         * @returns bboxes of the detection
         */
        postProcess(
            resultsTensors: InferenceSession.OnnxValueMapType,
            ...args: any[]
        ): { label: string; color: [number, number, number, number]; score: number; x1: number; y1: number; x2: number; y2: number; }[]

        /**
         * detection infer.
         * @param imgRGBA RGBA image
         * @param drawThreshold threshold of detection
         * @returns bboxes of the detection
         */
        infer(
            imgRGBA: Mat,
            drawThreshold?: number
        ): Promise<{ label: string; color: [number, number, number, number]; score: number; x1: number; y1: number; x2: number; y2: number; }[]>
    }

    export class Cls extends CV {
        /**
         * get the feeds of the infer session.
         * @param imgTensor image tensor
         * @returns feeds of the infer session {x: image tensor}
         */
        getFeeds(imgTensor: Tensor): InferenceSession.OnnxValueMapType

        /**
         * classification postprocess.
         * @param resultsTensors result tensors
         * @param args postprocess args
         * @returns probs of the classification
         */
        postProcess(resultsTensors: InferenceSession.OnnxValueMapType, ...args: any[]): { label: string; prob: number; }[]

        /**
         * classification infer.
         * @param imgRGBA RGBA image
         * @param topK probs top K
         * @returns probs of the classification
         */
        infer(
            imgRGBA: Mat,
            topK?: number
        ): Promise<{ label: string; prob: number; }[]>
    }

    export class Seg extends CV {
        /**
         * get the feeds of the infer session.
         * @param imgTensor image tensor
         * @returns feeds of the infer session {x: image tensor}
         */
        getFeeds(imgTensor: Tensor): InferenceSession.OnnxValueMapType

        /**
         * segmentation postprocess.
         * @param resultsTensors result tensors
         * @returns segmentation results
         */
        postProcess(resultsTensors: InferenceSession.OnnxValueMapType): { gray: Mat; colorRGBA: Mat; colorMap: { label: string; color: [number, number, number, number]; }[]; delete: () => void }

        /**
         * segmentation infer.
         * @param imgRGBA RGBA image
         * @returns segmentation results
         */
        infer(
            imgRGBA: Mat
        ): Promise<{ gray: Mat; colorRGBA: Mat; colorMap: { label: string; color: [number, number, number, number]; }[]; delete: () => void }>
    }
    export const cv: typeof opencv
    export const ort: typeof onnxruntime
}

declare const Model: typeof WebAI.Model
declare const CV: typeof WebAI.CV
declare const Det: typeof WebAI.Det
declare const Cls: typeof WebAI.Cls
declare const Seg: typeof WebAI.Seg
declare const waitForOpenCV: typeof WebAI.waitForOpenCV

export { WebAI as default, WebAI, Model, CV, Det, Cls, Seg, opencv as cv, onnxruntime as ort, waitForOpenCV }
