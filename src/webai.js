// WebAI Namespace
const WebAI = {
    // Get image resize scale
    // height(int), width(int), targetSize(int[]), keepRatio(bool), limitMax(bool) -> imScaleX(number), imScaleY(number)
    getIMScale: function (height, width, targetSize, keepRatio, limitMax) {
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

    // RGBA image -> RGB image
    // imgRGBA(cv.Mat) -> imgRGB(cv.Mat)
    rgba2rgb: function (imgRGBA) {
        let imgRGB = new cv.Mat();
        cv.cvtColor(imgRGBA, imgRGB, cv.COLOR_RGBA2RGB);
        return imgRGB
    },

    // RGBA image -> BGR image
    // imgRGBA(cv.Mat) -> imgBGR(cv.Mat)
    rgba2bgr: function (imgRGBA) {
        let imgBGR = new cv.Mat();
        cv.cvtColor(imgRGBA, imgBGR, cv.COLOR_RGBA2BGR);
        return imgBGR
    },

    // Image resize
    // img(cv.Mat), height(int), width(int), targetSize(int[]), keepRatio(bool), limitMax(bool), interp(int) -> [imgResize(cv.Mat), imScaleX(number), imScaleY(number)]
    resize: function (img, height, width, targetSize, keepRatio, limitMax, interp) {
        let [imScaleX, imScaleY] = this.getIMScale(height, width, targetSize, keepRatio, limitMax);
        let imgResize = new cv.Mat();
        cv.resize(img, imgResize, { width: 0, height: 0 }, imScaleX, imScaleY, interp);
        return [imgResize, imScaleX, imScaleY]
    },

    // Image center crop
    // imgInput(cv.Mat) -> imgCrop(cv.Mat)
    crop: function (img, cropSize) {
        let imgCrop = img.roi({
            x: Math.ceil((img.cols - cropSize[1]) / 2),
            y: Math.ceil((img.rows - cropSize[0]) / 2),
            width: cropSize[1],
            height: cropSize[0]
        })
        img.delete()
        return imgCrop
    },

    // Image normalize
    // imgOutput(cv.Mat) = (imgInput(cv.Mat) / scale - mean) / std
    normalize: function (imgRGB, scale, mean, std, isScale) {
        imgRGB.convertTo(imgRGB, cv.CV_32F);

        if (isScale) {
            let imgScale = new cv.Mat(imgRGB.rows, imgRGB.cols, cv.CV_32FC3, scale);
            cv.divide(imgRGB, imgScale, imgRGB);
            imgScale.delete();
        }

        let imgMean = new cv.Mat(imgRGB.rows, imgRGB.cols, cv.CV_32FC3, mean);
        cv.subtract(imgRGB, imgMean, imgRGB);
        imgMean.delete();

        let imgStd = new cv.Mat(imgRGB.rows, imgRGB.cols, cv.CV_32FC3, std);
        cv.divide(imgRGB, imgStd, imgRGB);
        imgStd.delete();

        return imgRGB
    },

    // Image permute
    // imgHWC(cv.Mat) -> imgCHW(Float32Array)
    permute: function (imgRGB) {
        let rgbPlanes = new cv.MatVector();
        cv.split(imgRGB, rgbPlanes);
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
    },

    // Load text
    // textURL(string) -> textContext(string)
    loadText: function (textURL) {
        let xhr = new XMLHttpRequest();
        xhr.open('get', textURL, false);
        xhr.send(null);
        return xhr.responseText
    },

    // Get color map for echo class
    // labelList(string[]) -> colorMap({
    //     label: any;
    //     color: number[];
    // }[])
    getColorMap: function (labelList) {
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

    // Get the index of the max value of a array
    // arr(number[]) -> index(int)
    argMax: function (arr) {
        let max = Math.max.apply(null, arr);
        let index = arr.findIndex(
            function (v, i, obj) {
                if (v == max) {
                    return true
                }
                else {
                    return false
                }
            }
        )
        return index
    },

    // Draw bboxes / label / score into image
    // img(cv.Mat), bboxes(object[]), thickness(number)=2.0, lineType(int)=8, fontFace(int)=0, fontScale(number)=1.0 -> imgShow(cv.Mat)
    drawBBoxes: function(img, bboxes, thickness=2.0, lineType=8, fontFace=0, fontScale=1.0){
        let imgShow = img.clone()
        for (let i = 0; i < bboxes.length; i++) {
            let bbox = bboxes[i];
            cv.rectangle(imgShow, new cv.Point(bbox.x1, bbox.y1), new cv.Point(bbox.x2, bbox.y2), bbox.color, thickness, lineType);
            cv.putText(imgShow, `${bbox.label}(${(bbox.score*100).toFixed(2)})`, new cv.Point(bbox.x1, bbox.y2), fontFace, fontScale, bbox.color, thickness, lineType);
        }
        return imgShow
    }
}

// Base Model of WebAI
WebAI.Model = class {
    // Model create
    // modelURL(string), inferConfig(string), sessionOption(object) = { logSeverityLevel: 4 } -> model(WebAI.Model)
    static async create(modelURL, inferConfig, sessionOption = { logSeverityLevel: 4 }) {
        let model = new this();
        model.loadConfigs(inferConfig);
        model.session = await ort.InferenceSession.create(modelURL, sessionOption);
        return model
    }

    // Load configs
    // inferConfig(string) = configs.json -> null
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
                if (!(this.mode=='RGB' || this.mode=='BGR')){
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

        console.info(`model info: `)
        console.info({
            mode: this.mode,
            isResize: this.isResize,
            interp: this.interp,
            keepRatio: this.keepRatio,
            targetSize: this.targetSize,
            isScale: this.isScale,
            limitMax: this.limitMax,
            mean: this.mean.slice(0,3),
            std: this.std.slice(0,3),
            isCrop: this.isCrop,
            cropSize: this.cropSize,
            isPermute: this.isPermute,
            labelList: this.labelList
        })
    }

    // Base model preprocess
    // Resize -> Crop -> Normalize -> Permute -> Totensor -> Feeds
    // imgRGBA(cv.Mat), height(int), width(int) -> feeds (object)
    preProcess(imgRGBA, height, width) {
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

    // Base model infer
    // Preprocess --feed--> session.run --resultsTensors--> Postprocess -> results
    // imgRGBA(cv.Mat) -> results(any)
    async infer(imgRGBA, ...args) {
        console.time('Infer');

        console.time('Infer.Preprocess');
        let [height, width] = [imgRGBA.rows, imgRGBA.cols]

        let feeds = this.preProcess(imgRGBA, height, width);

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

// Detection Model of WebAI
WebAI.Det = class extends WebAI.Model {
    // Get feeds for session.run
    // imgTensor(ort.Tensor), imScaleX(number), imScaleY(number) -> feeds(object)
    getFeeds(imgTensor, imScaleX, imScaleY) {
        let inputNames = this.session.inputNames;
        let _feeds = {
            im_shape: new ort.Tensor('float32', Float32Array.from(imgTensor.dims.slice(2, 4)), [1, 2]),
            image: imgTensor,
            scale_factor: new ort.Tensor('float32', Float32Array.from([imScaleY, imScaleX]), [1, 2])
        }
        let feeds = {};
        for (let i = 0; i < inputNames.length; i++) {
            feeds[inputNames[i]] = _feeds[inputNames[i]];
        }
        return feeds
    }

    // Detection model postprocess
    // resultsTensors(ort.Tensor), args(any[]) -> results({
    //     label: string,
    //     color: int[],
    //     score: number,
    //     x1: int,
    //     y1: int,
    //     x2: int,
    //     y2: int
    // }[])
    postProcess(resultsTensors, ...args) {
        let [height, width, drawThreshold] = args
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

    // Detection model infer
    // Preprocess --feed--> session.run --resultsTensors--> Postprocess -> results
    // imgRGBA(cv.Mat), drawThreshold(number) -> results({
    //     label: string,
    //     color: int[],
    //     score: number,
    //     x1: int,
    //     y1: int,
    //     x2: int,
    //     y2: int
    // }[])
    async infer(imgRGBA, drawThreshold = 0.5) {
        return super.infer(imgRGBA, imgRGBA.rows, imgRGBA.cols, drawThreshold)
    }
}

// Classification Model of WebAI
WebAI.Cls = class extends WebAI.Model {
    // Get feeds for session.run
    // imgTensor(ort.Tensor), imScaleX(number), imScaleY(number) -> feeds(object)
    getFeeds(imgTensor, imScaleX, imScaleY) {
        return {
            x: imgTensor
        }
    }

    // Classification model postprocess
    // resultsTensors(ort.Tensor), args(any[]) -> results({
    //     label: string,
    //     prob: number
    // }[])
    postProcess(resultsTensors, ...args) {
        let topK = args[0];
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

    // Classification model infer
    // Preprocess --feed--> session.run --resultsTensors--> Postprocess -> results
    // imgRGBA(cv.Mat), topK(int) -> results({
    //     label: string,
    //     prob: number
    // }[])
    async infer(imgRGBA, topK = 5) {
        return super.infer(imgRGBA, topK)
    }
}

// Segmentation Model of WebAI
WebAI.Seg = class extends WebAI.Model {
    // Get feeds for session.run
    // imgTensor(ort.Tensor), imScaleX(number), imScaleY(number) -> feeds(object)
    getFeeds(imgTensor, imScaleX, imScaleY) {
        return { x: imgTensor }
    }

    // Segmentation model postprocess
    // resultsTensors(ort.Tensor) -> results({
    //     argMax: int[],
    //     colorMapping: int[]，
    //     colorMap: colorMap({label: any, color: number[]}[])
    // })
    postProcess(resultsTensors) {
        let segTensor = Object.values(resultsTensors)[0];
        let data = segTensor.data
        let [N, C, H, W] = segTensor.dims;
        let numPixel = H * W

        let pixelArrs = []
        for (let i = 0; i < C; i++) {
            pixelArrs.push(data.slice(i * numPixel, (i + 1) * numPixel))
        }
        let colorMapping = [];
        let argMax = [];
        let tmp, index;
        for (let i = 0; i < numPixel; i++) {
            tmp = []
            for (let j = 0; j < C; j++) {
                tmp.push(pixelArrs[j][i])
            }
            index = WebAI.argMax(tmp)
            argMax.push(index)
            colorMapping.push(...this.colorMap[index].color)
        }

        return {
            argMax: argMax,
            colorMapping: colorMapping,
            colorMap: this.colorMap
        }
    }

    // Segmentation model infer
    // Preprocess --feed--> session.run --resultsTensors--> Postprocess -> results
    // imgRGBA(cv.Mat) -> results({
    //     argMax: int[],
    //     colorMapping: int[]，
    //     colorMap: colorMap({label: any, color: number[]}[])
    // })
    infer(imgRGBA) {
        return super.infer(imgRGBA)
    }
}

module.exports = WebAI