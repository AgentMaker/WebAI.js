import cv from '../opencv'
import ort from '../onnxruntime-web'

const waitForOpenCV = new Promise(resolve => {
    cv.onRuntimeInitialized = resolve
})

class Model {
    /**
     * create a base model.
     */
    constructor(
        modelURL,
        sessionOption,
        init,
        preProcess,
        postProcess
    ) {
        this.promises = Promise.all([
            waitForOpenCV,
            ort.InferenceSession.create(modelURL, sessionOption)
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
    async infer(...args) {
        await this.promises;
        console.time('Infer');

        console.time('Infer.Preprocess');
        let feeds = this.preProcess(...args);

        console.timeEnd('Infer.Preprocess');

        console.time('Infer.Run');

        let resultsTensors = await this.session.run(feeds);

        console.timeEnd('Infer.Run');

        console.time('Infer.Postprocess');

        let results = this.postProcess(resultsTensors, ...args);

        console.timeEnd('Infer.Postprocess');

        console.timeEnd('Infer');

        return results
    }
}

class CV extends Model {
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
        modelURL,
        inferConfig,
        sessionOption,
        getFeeds,
        postProcess
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
    loadConfigs(inferConfig) {
        let inferConfigs = JSON.parse(WebAI.loadText(inferConfig));
        let preProcess = inferConfigs.Preprocess;
        this.isPermute = false
        this.isCrop = false
        this.isResize = false
        for (let i = 0; i < preProcess.length; i++) {
            let OP = preProcess[i]
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
                this.isScale = OP.is_scale
                if (this.isScale) {
                    this.scale = new cv.Scalar(255.0, 255.0, 255.0)
                }
                this.mean = new cv.Scalar(...OP.mean)
                this.std = new cv.Scalar(...OP.std)
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
            this.colorMap = WebAI.getColorMap(this.labelList);
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
    preProcess(...args) {
        let [imgRGBA, height, width] = args.slice(0, 3)
        let imgResize, imScaleX, imScaleY
        if (this.isResize) {
            [imgResize, imScaleX, imScaleY] = WebAI.resize(imgRGBA, height, width, this.targetSize, this.keepRatio, this.limitMax, this.interp);
        }
        else {
            imgResize = imgRGBA.clone();
        }

        let imgCvt;
        if (this.isCrop) {
            let imgCrop = WebAI.crop(imgResize, this.cropSize);
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
        let imgNorm = WebAI.normalize(imgCvt, this.scale, this.mean, this.std, this.isScale);

        let imgTensor;
        let [h, w] = [imgNorm.rows, imgNorm.cols];
        if (this.isPermute) {
            imgTensor = new ort.Tensor('float32', WebAI.permute(imgNorm), [1, 3, h, w]);
        }
        else {
            imgTensor = new ort.Tensor('float32', imgNorm.data32F, [1, h, w, 3]);
            imgNorm.delete()
        }

        return this.getFeeds(imgTensor, imScaleX, imScaleY)
    }
}


class Det extends CV {
    /**
     * get session infer feeds.
     * @param imgTensor image tensor
     * @param imScaleX image scale factor of x axis
     * @param imScaleY image scale factor of y axis
     * @returns session infer feeds
     */
    getFeeds(imgTensor, imScaleX, imScaleY) {
        let inputNames = this.session.inputNames;
        let _feeds = {
            im_shape: new ort.Tensor('float32', Float32Array.from(imgTensor.dims.slice(2, 4)), [1, 2]),
            image: imgTensor,
            scale_factor: new ort.Tensor('float32', Float32Array.from([imScaleY, imScaleX]), [1, 2])
        }
        let feeds = {
            im_shape: undefined,
            image: undefined,
            scale_factor: undefined
        }
        inputNames.forEach(name => {
            feeds[name] = _feeds[name]
        })
        return feeds
    }

    /**
     * detection postprocess.
     * @param resultsTensors result tensors
     * @param args postprocess args
     * @returns bboxes of the detection
     */
    postProcess(
        resultsTensors,
        ...args
    ) {
        let [height, width, drawThreshold] = args.slice(1, 4)
        let bboxesTensor = Object.values(resultsTensors)[0];
        let bboxes = [];
        let bboxesNum = bboxesTensor.dims[0];
        let bboxesDatas = bboxesTensor.data;

        for (let i = 0; i < bboxesNum; i++) {
            let classID = bboxesDatas[i * 6 + 0];
            let score = bboxesDatas[i * 6 + 1];

            let x1 = Math.max(0, Math.round(bboxesDatas[i * 6 + 2]));
            let y1 = Math.max(0, Math.round(bboxesDatas[i * 6 + 3]));
            let x2 = Math.min(width, Math.round(bboxesDatas[i * 6 + 4]));
            let y2 = Math.min(height, Math.round(bboxesDatas[i * 6 + 5]));

            let label = this.labelList[classID];
            let color = this.colorMap[classID].color;
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
        imgRGBA,
        drawThreshold = 0.5
    ) {
        return super.infer(imgRGBA, imgRGBA.rows, imgRGBA.cols, drawThreshold)
    }
}

class Cls extends CV {
    /**
     * get the feeds of the infer session.
     * @param imgTensor image tensor
     * @returns feeds of the infer session {x: image tensor}
     */
    getFeeds(imgTensor) {
        return { x: imgTensor }
    }

    /**
     * classification postprocess.
     * @param resultsTensors result tensors
     * @param args postprocess args
     * @returns probs of the classification
     */
    postProcess(resultsTensors, ...args) {
        let topK = args[3];
        let probsTensor = Object.values(resultsTensors)[0];
        let data = probsTensor.data
        let probs = []

        for (let i = 0; i < this.labelList.length; i++) {
            probs.push({
                label: this.labelList[i],
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
        imgRGBA,
        topK = 5
    ) {
        return super.infer(imgRGBA, imgRGBA.rows, imgRGBA.cols, topK)
    }
}

class Seg extends CV {
    /**
     * get the feeds of the infer session.
     * @param imgTensor image tensor
     * @returns feeds of the infer session {x: image tensor}
     */
    getFeeds(imgTensor) {
        return { x: imgTensor }
    }

    /**
     * segmentation postprocess.
     * @param resultsTensors result tensors
     * @returns segmentation results
     */
    postProcess(resultsTensors) {
        let segTensor = Object.values(resultsTensors)[0];
        let data = segTensor.data
        let [N, C, H, W] = segTensor.dims;
        let numPixel = H * W

        let pixelArrs = []
        for (let i = 0; i < C; i++) {
            pixelArrs.push(data.slice(i * numPixel, (i + 1) * numPixel))
        }
        let colorRGBA = [];
        let gray = [];
        let tmp, index;
        for (let i = 0; i < numPixel; i++) {
            let tmp = []
            for (let j = 0; j < C; j++) {
                tmp.push(pixelArrs[j][i])
            }
            index = WebAI.argmax(tmp)
            gray.push(index)
            colorRGBA.push(...this.colorMap[index].color)
        }

        return {
            gray: cv.matFromArray(H, W, cv.CV_8UC1, gray),
            colorRGBA: cv.matFromArray(H, W, cv.CV_8UC4, colorRGBA),
            colorMap: this.colorMap,
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
        imgRGBA
    ) {
        return super.infer(imgRGBA, imgRGBA.rows, imgRGBA.cols)
    }
}


const WebAI = {
    /**
     * get the index of the max value of the array.
     * @param arr array
     * @returns the index of the max value of the array
     */
    argmax(arr) {
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
    },

    /**
     * get image scale.
     * @param height image height
     * @param width image width
     * @param targetSize target size [h, w]
     * @param keepRatio is keep the ratio of image size
     * @param limitMax is limit max size of image
     * @returns [scale factor of x axis, , scale factor of y axis]
     */
    getIMScale(height, width, targetSize, keepRatio, limitMax) {
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
    },

    /**
     * RGBA -> RGB image.
     * @param imgRGBA RGBA image
     * @returns RGB image
     */
    rgba2rgb(imgRGBA) {
        let imgRGB = new cv.Mat();
        cv.cvtColor(imgRGBA, imgRGB, cv.COLOR_RGBA2RGB);
        return imgRGB
    },

    /**
     * RGBA -> BGR image.
     * @param imgRGBA RGBA image
     * @returns BGR image
     */
    rgba2bgr(imgRGBA) {
        let imgBGR = new cv.Mat();
        cv.cvtColor(imgRGBA, imgBGR, cv.COLOR_RGBA2BGR);
        return imgBGR
    },

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
    resize(img, height, width, targetSize, keepRatio, limitMax, interp) {
        let [imScaleX, imScaleY] = WebAI.getIMScale(height, width, targetSize, keepRatio, limitMax);
        let imgResize = new cv.Mat();
        cv.resize(img, imgResize, new cv.Size(0, 0), imScaleX, imScaleY, interp);
        return [imgResize, imScaleX, imScaleY]
    },

    /**
     * image center crop.
     * @param img image mat
     * @param cropSize crop size [h, w]
     * @returns cropped image
     */
    crop(img, cropSize) {
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
    },

    /**
     * image normalize.
     * @param img image mat
     * @param scale normalize scale
     * @param mean normalize mean
     * @param std normalize std
     * @param isScale is scale the image
     * @returns normalized image
     */
    normalize(img, scale, mean, std, isScale) {
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
    },

    /**
     * permute hwc -> chw.
     * @param img image mat
     * @returns image data
     */
    permute(img) {
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
    },

    /**
     * load text content.
     * @param textURL text URL
     * @returns content of the text
     */
    loadText(textURL) {
        let xhr = new XMLHttpRequest();
        xhr.open('get', textURL, false);
        xhr.send(null);
        return xhr.responseText
    },

    /**
     * get color map of label list.
     * @param labelList label list
     * @returns color map of label list
     */
    getColorMap(labelList) {
        let classNum = labelList.length
        let colorMap = []
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
                color: colorRGBA
            })
        }
        return colorMap
    },

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
    drawBBoxes(
        img,
        bboxes,
        withLabel = true,
        withScore = true,
        thickness = 2.0,
        lineType = 8,
        fontFace = 0,
        fontScale = 0.7
    ) {
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
    },

    /**
     * wait for OpenCV initialized.
     */
    waitForOpenCV: waitForOpenCV,
    Model: Model,
    CV: CV,
    Det: Det,
    Cls: Cls,
    Seg: Seg
}

export { WebAI as default, WebAI, Model, CV, Det, Cls, Seg, cv, ort, waitForOpenCV }