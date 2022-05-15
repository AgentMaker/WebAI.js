import cv, { Mat, Scalar } from '../opencv'
import ort, { InferenceSession, Tensor } from '../onnxruntime-web'

namespace WebAI {
    /**
     * get the index of the max value of the array.
     * @param arr array
     * @returns the index of the max value of the array
     */
    export function argmax(arr: number[]): number {
        let max = Math.max.apply(null, arr);
        let index = arr.findIndex(
            function (value) {
                if (value == max) {
                    return true
                }
                else {
                    return false
                }
            }
        )
        return index
    }

    /**
     * get image scale.
     * @param height image height
     * @param width image width
     * @param targetSize target size [h, w]
     * @param keepRatio is keep the ratio of image size
     * @param limitMax is limit max size of image
     * @returns [scale factor of x axis, , scale factor of y axis]
     */
    export function getIMScale(height: number, width: number, targetSize: [number, number], keepRatio: boolean, limitMax: boolean): [number, number] {
        let imScaleX, imScaleY;
        if (keepRatio) {
            let imSizeMin = Math.min(height, width);
            let targetSizeMin = Math.min(targetSize[0], targetSize[1]);
            let imScale = targetSizeMin / imSizeMin;

            if (limitMax) {
                let imSizeMax = Math.max(height, width);
                let targetSizeMax = Math.max(targetSize[0], targetSize[1]);
                if (Math.round(imScale * imSizeMax) > targetSizeMax) {
                    imScale = targetSizeMax / imSizeMax;
                }
            }

            imScaleX = imScale;
            imScaleY = imScale;
        }
        else {
            imScaleY = targetSize[0] / height;
            imScaleX = targetSize[1] / width;
        }
        return [imScaleX, imScaleY]
    }

    /**
     * RGBA -> RGB image.
     * @param imgRGBA RGBA image
     * @returns RGB image
     */
    export function rgba2rgb(imgRGBA: Mat): Mat {
        let imgRGB = new cv.Mat();
        cv.cvtColor(imgRGBA, imgRGB, cv.COLOR_RGBA2RGB);
        return imgRGB
    }

    /**
     * RGBA -> BGR image.
     * @param imgRGBA RGBA image
     * @returns BGR image
     */
    export function rgba2bgr(imgRGBA: Mat): Mat {
        let imgBGR = new cv.Mat();
        cv.cvtColor(imgRGBA, imgBGR, cv.COLOR_RGBA2BGR);
        return imgBGR
    }

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
    export function resize(img: Mat, height: number, width: number, targetSize: [number, number], keepRatio: boolean, limitMax: boolean, interp: number): [Mat, number, number] {
        let [imScaleX, imScaleY] = WebAI.getIMScale(height, width, targetSize, keepRatio, limitMax);
        let imgResize = new cv.Mat();
        cv.resize(img, imgResize, new cv.Size(0, 0), imScaleX, imScaleY, interp);
        return [imgResize, imScaleX, imScaleY]
    }

    /**
     * image center crop.
     * @param img image mat
     * @param cropSize crop size [h, w]
     * @returns cropped image
     */
    export function crop(img: Mat, cropSize: [number, number]): Mat {
        let imgCrop = img.roi(
            new cv.Rect(
                Math.ceil((img.cols - cropSize[1]) / 2),
                Math.ceil((img.rows - cropSize[0]) / 2),
                cropSize[1],
                cropSize[0]
            )
        )
        img.delete()
        return imgCrop
    }

    /**
     * image normalize.
     * @param img image mat
     * @param scale normalize scale
     * @param mean normalize mean
     * @param std normalize std
     * @param isScale is scale the image
     * @returns normalized image
     */
    export function normalize(img: Mat, scale: Scalar, mean: Scalar, std: Scalar, isScale: boolean): Mat {
        img.convertTo(img, cv.CV_32F);

        if (isScale) {
            let imgScale = new cv.Mat(img.rows, img.cols, cv.CV_32FC3, scale);
            cv.divide(img, imgScale, img);
            imgScale.delete();
        }

        let imgMean = new cv.Mat(img.rows, img.cols, cv.CV_32FC3, mean);
        cv.subtract(img, imgMean, img);
        imgMean.delete();

        let imgStd = new cv.Mat(img.rows, img.cols, cv.CV_32FC3, std);
        cv.divide(img, imgStd, img);
        imgStd.delete();

        return img
    }

    /**
     * permute hwc -> chw.
     * @param img image mat
     * @returns image data
     */
    export function permute(img: Mat): Float32Array {
        let rgbPlanes = new cv.MatVector();
        cv.split(img, rgbPlanes);
        let R = rgbPlanes.get(0);
        let G = rgbPlanes.get(1);
        let B = rgbPlanes.get(2);
        rgbPlanes.delete();

        let imgData = new Float32Array(R.data32F.length * 3)
        imgData.set(R.data32F, 0)
        imgData.set(G.data32F, R.data32F.length)
        imgData.set(B.data32F, R.data32F.length * 2)
        R.delete();
        G.delete();
        B.delete();
        img.delete();
        return imgData
    }

    /**
     * load text content.
     * @param textURL text URL
     * @returns content of the text
     */
    export function loadText(textURL: string): string {
        let xhr = new XMLHttpRequest();
        xhr.open('get', textURL, false);
        xhr.send(null);
        return xhr.responseText
    }

    /**
     * get color map of label list.
     * @param labelList label list
     * @returns color map of label list
     */
    export function getColorMap(labelList: string[]): { label: string; color: [number, number, number, number]; }[] {
        let classNum = labelList.length
        let colorMap: { label: string; color: [number, number, number, number]; }[] = []
        let colorSlice = Math.ceil((256 * 256 * 256) / classNum)
        for (let i = 0; i < classNum; i++) {
            let color = (colorSlice * i).toString(16)
            let colorRGBA = []
            for (let j = 0; j < 6; j += 2) {
                let tmp = color.slice(j, j + 2)
                if (tmp == '') {
                    colorRGBA.push(0);
                }
                else {
                    colorRGBA.push(parseInt("0x" + tmp));
                }
            }
            colorRGBA.push(255)
            colorMap.push({
                label: labelList[i],
                color: colorRGBA as [number, number, number, number]
            })
        }
        return colorMap
    }

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
        withLabel: boolean = true,
        withScore: boolean = true,
        thickness: number = 2.0,
        lineType: number = 8,
        fontFace: number = 0,
        fontScale: number = 0.7
    ): Mat {
        let imgShow = img.clone()
        for (let i = 0; i < bboxes.length; i++) {
            let bbox = bboxes[i];
            cv.rectangle(imgShow, new cv.Point(bbox.x1, bbox.y1), new cv.Point(bbox.x2, bbox.y2), bbox.color, thickness, lineType);
            if (withLabel && withScore) {
                cv.putText(imgShow, `${bbox.label} ${(bbox.score * 100).toFixed(2)}%`, new cv.Point(bbox.x1, bbox.y2), fontFace, fontScale, bbox.color, thickness, lineType);
            }
            else if (withLabel) {
                cv.putText(imgShow, `${bbox.label}`, new cv.Point(bbox.x1, bbox.y2), fontFace, fontScale, bbox.color, thickness, lineType);
            }
            else if (withScore) {
                cv.putText(imgShow, `${(bbox.score * 100).toFixed(2)}%`, new cv.Point(bbox.x1, bbox.y2), fontFace, fontScale, bbox.color, thickness, lineType);
            }
        }
        return imgShow
    }

    /**
     * wait for OpenCV initialized.
     */
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
        ) {
            this.promises = Promise.all([
                cv.init(),
                InferenceSession.create(modelURL, sessionOption)
                    .then(session => this.session = session)
            ])
            if (typeof init != 'undefined') {
                init(this)
            }
            if (typeof preProcess != 'undefined') {
                this.preProcess = preProcess
            }
            if (typeof postProcess != 'undefined') {
                this.postProcess = postProcess
            }
        }

        /**
         * base model infer function.
         * @param  args model infer paramters
         * @returns {any} model infer results
         */
        async infer(...args: any[]): Promise<any> {
            await this.promises;
            console.time('Infer');

            console.time('Infer.Preprocess');
            let feeds = this.preProcess!(...args);

            console.timeEnd('Infer.Preprocess');

            console.time('Infer.Run');

            let resultsTensors = await this.session.run(feeds);

            console.timeEnd('Infer.Run');

            console.time('Infer.Postprocess');

            let results = this.postProcess!(resultsTensors, ...args);

            console.timeEnd('Infer.Postprocess');

            console.timeEnd('Infer');

            return results
        }
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
        ) {
            super(modelURL, sessionOption, undefined, undefined, postProcess)
            this.loadConfigs(inferConfig)
            if (typeof getFeeds != 'undefined') {
                this.getFeeds = getFeeds
            }
        }

        /**
         * load infer configs
         * @param inferConfig model infer config URL
         */
        loadConfigs(inferConfig: string) {
            let inferConfigs = JSON.parse(WebAI.loadText(inferConfig));
            let preProcess = inferConfigs.Preprocess;
            this.isPermute = false
            this.isCrop = false
            this.isResize = false
            for (let i = 0; i < preProcess.length; i++) {
                let OP = preProcess[i] as OP
                if (OP.type == 'Decode') {
                    this.mode = OP.mode
                    if (!(this.mode == 'RGB' || this.mode == 'BGR')) {
                        throw `Not support ${OP.mode} mode.`
                    }
                }
                else if (OP.type == 'Resize') {
                    this.isResize = true;
                    this.interp = OP.interp;
                    this.keepRatio = OP.keep_ratio;
                    this.targetSize = OP.target_size;
                    this.limitMax = OP.limit_max;
                }
                else if (OP.type == 'Normalize') {
                    this.isScale = OP.is_scale!
                    if (this.isScale) {
                        this.scale = new cv.Scalar(255.0, 255.0, 255.0)
                    }
                    this.mean = new cv.Scalar(...OP.mean!)
                    this.std = new cv.Scalar(...OP.std!)
                }
                else if (OP.type == 'Crop') {
                    this.isCrop = true;
                    this.cropSize = OP.crop_size
                }
                else if (OP.type == 'Permute') {
                    this.isPermute = true
                }
                else {
                    throw `Not support ${OP.type} OP.`
                }
            }

            if (inferConfigs.hasOwnProperty('label_list')) {
                this.labelList = inferConfigs.label_list;
                this.colorMap = WebAI.getColorMap(this.labelList!);
            }

            console.info('model info: ', {
                mode: this.mode,
                isResize: this.isResize,
                interp: this.interp,
                keepRatio: this.keepRatio,
                targetSize: this.targetSize,
                isScale: this.isScale,
                limitMax: this.limitMax,
                mean: this.mean,
                std: this.std,
                isCrop: this.isCrop,
                cropSize: this.cropSize,
                isPermute: this.isPermute,
                labelList: this.labelList
            })
        }

        /**
         * model preprocess function. 
         * @param args preprocess args
         * @returns session infer feeds
         */
        preProcess(...args: any[]): InferenceSession.OnnxValueMapType {
            let [imgRGBA, height, width] = args.slice(0, 3)
            let imgResize: Mat, imScaleX: number, imScaleY: number
            if (this.isResize) {
                [imgResize, imScaleX, imScaleY] = WebAI.resize(imgRGBA, height, width, this.targetSize!, this.keepRatio!, this.limitMax!, this.interp!);
            }
            else {
                imgResize = imgRGBA.clone();
            }

            let imgCvt: Mat;
            if (this.isCrop) {
                let imgCrop = WebAI.crop(imgResize, this.cropSize!);
                if (this.mode == 'RGB') {
                    imgCvt = WebAI.rgba2rgb(imgCrop);
                }
                else if (this.mode == 'BGR') {
                    imgCvt = WebAI.rgba2bgr(imgCrop);
                }
                imgCrop.delete();
            }
            else {
                if (this.mode == 'RGB') {
                    imgCvt = WebAI.rgba2rgb(imgResize);
                }
                else if (this.mode == 'BGR') {
                    imgCvt = WebAI.rgba2bgr(imgResize);
                }
                imgResize.delete();
            }
            let imgNorm = WebAI.normalize(imgCvt!, this.scale!, this.mean!, this.std!, this.isScale);

            let imgTensor;
            let [h, w] = [imgNorm.rows, imgNorm.cols];
            if (this.isPermute) {
                imgTensor = new Tensor('float32', WebAI.permute(imgNorm), [1, 3, h, w]);
            }
            else {
                imgTensor = new Tensor('float32', imgNorm.data32F, [1, h, w, 3]);
                imgNorm.delete()
            }

            return this.getFeeds(imgTensor, imScaleX!, imScaleY!)
        }
    }


    export class Det extends CV {
        /**
         * get session infer feeds.
         * @param imgTensor image tensor
         * @param imScaleX image scale factor of x axis
         * @param imScaleY image scale factor of y axis
         * @returns session infer feeds
         */
        getFeeds(imgTensor: Tensor, imScaleX: number, imScaleY: number): InferenceSession.OnnxValueMapType {
            let inputNames = this.session.inputNames as ('im_shape' | 'image' | 'scale_factor')[];
            let _feeds = {
                im_shape: new Tensor('float32', Float32Array.from(imgTensor.dims.slice(2, 4)), [1, 2]),
                image: imgTensor,
                scale_factor: new Tensor('float32', Float32Array.from([imScaleY, imScaleX]), [1, 2])
            }
            let feeds: {
                im_shape?: Tensor
                image?: Tensor
                scale_factor?: Tensor
            } = {}
            inputNames.forEach(name => {
                feeds[name] = _feeds[name]
            })
            return feeds as InferenceSession.OnnxValueMapType
        }

        /**
         * detection postprocess.
         * @param resultsTensors result tensors
         * @param args postprocess args
         * @returns bboxes of the detection
         */
        postProcess(
            resultsTensors: InferenceSession.OnnxValueMapType,
            ...args: any[]
        ): { label: string; color: [number, number, number, number]; score: number; x1: number; y1: number; x2: number; y2: number; }[] {
            let [height, width, drawThreshold] = args.slice(1, 4)
            let bboxesTensor = Object.values(resultsTensors)[0];
            let bboxes = [];
            let bboxesNum = bboxesTensor.dims[0];
            let bboxesDatas = bboxesTensor.data as Float32Array;

            for (let i = 0; i < bboxesNum; i++) {
                let classID = bboxesDatas[i * 6 + 0];
                let score = bboxesDatas[i * 6 + 1];

                let x1 = Math.max(0, Math.round(bboxesDatas[i * 6 + 2]));
                let y1 = Math.max(0, Math.round(bboxesDatas[i * 6 + 3]));
                let x2 = Math.min(width, Math.round(bboxesDatas[i * 6 + 4]));
                let y2 = Math.min(height, Math.round(bboxesDatas[i * 6 + 5]));

                let label = this.labelList![classID];
                let color = this.colorMap![classID].color;
                if (score > drawThreshold) {
                    let bbox = {
                        label: label,
                        color: color,
                        score: score,
                        x1: x1,
                        y1: y1,
                        x2: x2,
                        y2: y2
                    };

                    bboxes.push(bbox);
                }
            }
            return bboxes
        }

        /**
         * detection infer.
         * @param imgRGBA RGBA image
         * @param drawThreshold threshold of detection
         * @returns bboxes of the detection
         */
        infer(
            imgRGBA: Mat,
            drawThreshold: number = 0.5
        ): Promise<{ label: string; color: [number, number, number, number]; score: number; x1: number; y1: number; x2: number; y2: number; }[]> {
            return super.infer(imgRGBA, imgRGBA.rows, imgRGBA.cols, drawThreshold)
        }
    }

    export class Cls extends CV {
        /**
         * get the feeds of the infer session.
         * @param imgTensor image tensor
         * @returns feeds of the infer session {x: image tensor}
         */
        getFeeds(imgTensor: Tensor): InferenceSession.OnnxValueMapType {
            return { x: imgTensor }
        }

        /**
         * classification postprocess.
         * @param resultsTensors result tensors
         * @param args postprocess args
         * @returns probs of the classification
         */
        postProcess(resultsTensors: InferenceSession.OnnxValueMapType, ...args: any[]): { label: string; prob: number; }[] {
            let topK = args[3];
            let probsTensor = Object.values(resultsTensors)[0];
            let data = probsTensor.data as Float32Array
            let probs: { label: string; prob: number; }[] = []

            for (let i = 0; i < this.labelList!.length; i++) {
                probs.push({
                    label: this.labelList![i],
                    prob: data[i]
                })
            }
            if (topK > 0) {
                return probs.sort((a, b) => b.prob - a.prob).slice(0, topK)
            }
            else {
                return probs.sort((a, b) => b.prob - a.prob)
            }
        }

        /**
         * classification infer.
         * @param imgRGBA RGBA image
         * @param topK probs top K
         * @returns probs of the classification
         */
        infer(
            imgRGBA: Mat,
            topK: number = 5
        ): Promise<{ label: string; prob: number; }[]> {
            return super.infer(imgRGBA, imgRGBA.rows, imgRGBA.cols, topK)
        }
    }

    export class Seg extends CV {
        /**
         * get the feeds of the infer session.
         * @param imgTensor image tensor
         * @returns feeds of the infer session {x: image tensor}
         */
        getFeeds(imgTensor: Tensor): InferenceSession.OnnxValueMapType {
            return { x: imgTensor }
        }

        /**
         * segmentation postprocess.
         * @param resultsTensors result tensors
         * @returns segmentation results
         */
        postProcess(resultsTensors: InferenceSession.OnnxValueMapType): { gray: Mat; colorRGBA: Mat; colorMap: { label: string; color: [number, number, number, number]; }[]; delete: () => void } {
            let segTensor = Object.values(resultsTensors)[0];
            let data = segTensor.data as Float32Array
            let [N, C, H, W] = segTensor.dims;
            let numPixel = H * W

            let pixelArrs: Float32Array[] = []
            for (let i = 0; i < C; i++) {
                pixelArrs.push(data.slice(i * numPixel, (i + 1) * numPixel))
            }
            let colorRGBA = [];
            let gray = [];
            let tmp, index;
            for (let i = 0; i < numPixel; i++) {
                let tmp: number[] = []
                for (let j = 0; j < C; j++) {
                    tmp.push(pixelArrs[j][i])
                }
                index = WebAI.argmax(tmp)
                gray.push(index)
                colorRGBA.push(...this.colorMap![index].color)
            }

            return {
                gray: cv.matFromArray(H, W, cv.CV_8UC1, gray),
                colorRGBA: cv.matFromArray(H, W, cv.CV_8UC4, colorRGBA),
                colorMap: this.colorMap!,
                delete: function () {
                    if (!this.gray.isDeleted()) {
                        this.gray.delete()
                    }
                    if (!this.colorRGBA.isDeleted()) {
                        this.colorRGBA.delete()
                    }
                }
            }
        }

        /**
         * segmentation infer.
         * @param imgRGBA RGBA image
         * @returns segmentation results
         */
        infer(
            imgRGBA: Mat
        ): Promise<{ gray: Mat; colorRGBA: Mat; colorMap: { label: string; color: [number, number, number, number]; }[]; delete: () => void }> {
            return super.infer(imgRGBA, imgRGBA.rows, imgRGBA.cols)
        }
    }
}

export { WebAI as default, WebAI, cv, ort }