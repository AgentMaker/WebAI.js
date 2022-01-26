import cv from './opencv'
import ort from './ort'


class Model {
    static async create(modelURL, sessionOption = { logSeverityLevel: 4 }, init = null, preProcess = null, postProcess = null) {
        await WebAI.waitForOpenCV()
        let model = new this();
        model.session = await WebAI.ort.InferenceSession.create(modelURL, sessionOption);
        if (init) {
            init(model)
        }
        if (preProcess) {
            model.preProcess = preProcess
        }
        if (postProcess) {
            model.postProcess = postProcess
        }
        return model
    }

    async infer(...args) {
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
    static async create(modelURL, inferConfig, sessionOption = { logSeverityLevel: 4 }, getFeeds = null, postProcess = null) {
        let model = await super.create(modelURL, sessionOption, null, null, postProcess)
        model.loadConfigs(inferConfig);
        if (getFeeds) {
            model.getFeeds = getFeeds
        }
        return model
    }

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
                    this.scale = [255.0, 255.0, 255.0, 0.0]
                }
                this.mean = OP.mean
                this.mean.push(0.0)
                this.std = OP.std
                this.std.push(0.0)
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
        else {
            this.labelList = null;
        }

        console.info('model info: ', {
            mode: this.mode,
            isResize: this.isResize,
            interp: this.interp,
            keepRatio: this.keepRatio,
            targetSize: this.targetSize,
            isScale: this.isScale,
            limitMax: this.limitMax,
            mean: this.mean.slice(0, 3),
            std: this.std.slice(0, 3),
            isCrop: this.isCrop,
            cropSize: this.cropSize,
            isPermute: this.isPermute,
            labelList: this.labelList
        })
    }

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
            imgTensor = new WebAI.ort.Tensor('float32', WebAI.permute(imgNorm), [1, 3, h, w]);
        }
        else {
            imgTensor = new WebAI.ort.Tensor('float32', imgNorm.data32F, [1, h, w, 3]);
            imgNorm.delete()
        }

        return this.getFeeds(imgTensor, imScaleX, imScaleY)
    }
}

class Det extends CV {
    getFeeds(imgTensor, imScaleX, imScaleY) {
        let inputNames = this.session.inputNames;
        let _feeds = {
            im_shape: new WebAI.ort.Tensor('float32', Float32Array.from(imgTensor.dims.slice(2, 4)), [1, 2]),
            image: imgTensor,
            scale_factor: new WebAI.ort.Tensor('float32', Float32Array.from([imScaleY, imScaleX]), [1, 2])
        }
        let feeds = {};
        for (let i = 0; i < inputNames.length; i++) {
            feeds[inputNames[i]] = _feeds[inputNames[i]];
        }
        return feeds
    }

    postProcess(resultsTensors, ...args) {
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

    async infer(imgRGBA, drawThreshold = 0.5) {
        return super.infer(imgRGBA, imgRGBA.rows, imgRGBA.cols, drawThreshold)
    }
}

class Cls extends CV {
    getFeeds(imgTensor) {
        return { x: imgTensor }
    }

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

    async infer(imgRGBA, topK = 5) {
        return super.infer(imgRGBA, imgRGBA.rows, imgRGBA.cols, topK)
    }
}

class Seg extends CV {
    getFeeds(imgTensor) {
        return { x: imgTensor }
    }

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
            tmp = []
            for (let j = 0; j < C; j++) {
                tmp.push(pixelArrs[j][i])
            }
            index = WebAI.gray(tmp)
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

    infer(imgRGBA) {
        return super.infer(imgRGBA, imgRGBA.rows, imgRGBA.cols)
    }
}

class WebAI {
    static gray(arr) {
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

    static getIMScale(height, width, targetSize, keepRatio, limitMax) {
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

    static rgba2rgb(imgRGBA) {
        let imgRGB = new this.cv.Mat();
        this.cv.cvtColor(imgRGBA, imgRGB, this.cv.COLOR_RGBA2RGB);
        return imgRGB
    }

    static rgba2bgr(imgRGBA) {
        let imgBGR = new this.cv.Mat();
        this.cv.cvtColor(imgRGBA, imgBGR, this.cv.COLOR_RGBA2BGR);
        return imgBGR
    }

    static resize(img, height, width, targetSize, keepRatio, limitMax, interp) {
        let [imScaleX, imScaleY] = this.getIMScale(height, width, targetSize, keepRatio, limitMax);
        let imgResize = new this.cv.Mat();
        this.cv.resize(img, imgResize, { width: 0, height: 0 }, imScaleX, imScaleY, interp);
        return [imgResize, imScaleX, imScaleY]
    }

    static crop(img, cropSize) {
        let imgCrop = img.roi({
            x: Math.ceil((img.cols - cropSize[1]) / 2),
            y: Math.ceil((img.rows - cropSize[0]) / 2),
            width: cropSize[1],
            height: cropSize[0]
        })
        img.delete()
        return imgCrop
    }

    static normalize(imgRGB, scale, mean, std, isScale) {
        imgRGB.convertTo(imgRGB, this.cv.CV_32F);

        if (isScale) {
            let imgScale = new this.cv.Mat(imgRGB.rows, imgRGB.cols, this.cv.CV_32FC3, scale);
            this.cv.divide(imgRGB, imgScale, imgRGB);
            imgScale.delete();
        }

        let imgMean = new this.cv.Mat(imgRGB.rows, imgRGB.cols, this.cv.CV_32FC3, mean);
        this.cv.subtract(imgRGB, imgMean, imgRGB);
        imgMean.delete();

        let imgStd = new this.cv.Mat(imgRGB.rows, imgRGB.cols, this.cv.CV_32FC3, std);
        this.cv.divide(imgRGB, imgStd, imgRGB);
        imgStd.delete();

        return imgRGB
    }

    static permute(imgRGB) {
        let rgbPlanes = new this.cv.MatVector();
        this.cv.split(imgRGB, rgbPlanes);
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
        imgRGB.delete();
        return imgData
    }

    static loadText(textURL) {
        let xhr = new XMLHttpRequest();
        xhr.open('get', textURL, false);
        xhr.send(null);
        return xhr.responseText
    }

    static getColorMap(labelList) {
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
    }

    static drawBBoxes(img, bboxes, withLabel = true, withScore = true, thickness = 2.0, lineType = 8, fontFace = 0, fontScale = 0.7) {
        let imgShow = img.clone()
        for (let i = 0; i < bboxes.length; i++) {
            let bbox = bboxes[i];
            this.cv.rectangle(imgShow, { x: bbox.x1, y: bbox.y1 }, { x: bbox.x2, y: bbox.y2 }, bbox.color, thickness, lineType);
            if (withLabel && withScore) {
                this.cv.putText(imgShow, `${bbox.label} ${(bbox.score * 100).toFixed(2)}%`, { x: bbox.x1, y: bbox.y2 }, fontFace, fontScale, bbox.color, thickness, lineType);
            }
            else if (withLabel) {
                this.cv.putText(imgShow, `${bbox.label}`, { x: bbox.x1, y: bbox.y2 }, fontFace, fontScale, bbox.color, thickness, lineType);
            }
            else if (withScore) {
                this.cv.putText(imgShow, `${(bbox.score * 100).toFixed(2)}%`, { x: bbox.x1, y: bbox.y2 }, fontFace, fontScale, bbox.color, thickness, lineType);
            }
        }
        return imgShow
    }

    static waitForOpenCV() {
        return new Promise(resolve => {
            if (typeof cv.onRuntimeInitialized == 'undefined'){
                resolve(cv.onRuntimeInitialized) 
            }
            else {
                resolve(true)
            }
        });
    }

    static Model = Model

    static CV = CV

    static Det = Det

    static Cls = Cls

    static Seg = Seg

    static cv = cv

    static ort = ort
}

export default WebAI