const fs = require('fs');
const { createCanvas, loadImage, createImageData } = require('canvas');
const WebAI = require('./src/webai')

WebAI.loadOpenCV = function () {
    return new Promise(resolve => {
        global.Module = {
            onRuntimeInitialized: resolve
        };
        WebAI.cv = require('./src/opencv');
    });
}

WebAI.checkOpenCV = async function () {
    if (typeof WebAI.cv == 'undefined') {
        await WebAI.loadOpenCV()
    }
}

WebAI.switchBackend = function (onnxBackend) {
    if (onnxBackend != WebAI.onnxBackend) {
        WebAI.onnxBackend = onnxBackend
        if (onnxBackend == 'node') {
            WebAI.ort = require('onnxruntime-node')
        }
        else if (onnxBackend == 'web') {
            WebAI.ort = require('onnxruntime-web')
        }
        else {
            throw `not support ${onnxBackend} ONNXRuntime Backend`
        }
    }
}

WebAI.loadImage = async function (imageURL) {
    await this.checkOpenCV()
    let image = await loadImage(imageURL);
    let canvas = createCanvas(image.width, image.height);
    let ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0, image.width, image.height)
    let imageData = ctx.getImageData(0, 0, image.width, image.height)
    let imageMat = WebAI.cv.matFromArray(image.height, image.width, WebAI.cv.CV_8UC4, imageData.data)
    return imageMat
}

WebAI.saveImage = function (image, path) {
    let canvas = createCanvas(image.cols, image.rows);
    let ctx = canvas.getContext('2d');
    let imageData = createImageData(Uint8ClampedArray.from(image.data), image.cols, image.rows)
    ctx.putImageData(imageData, 0, 0, 0, 0, image.cols, image.rows);
    fs.writeFileSync(path, canvas.toBuffer('image/png'));
}

WebAI.loadText = function (textURL) {
    return fs.readFileSync(textURL);
}

WebAI.Model.create = async function (modelURL, sessionOption = { logSeverityLevel: 4 }, init = null, preProcess = null, postProcess = null) {
    await WebAI.checkOpenCV()
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

WebAI.switchBackend('node')
module.exports = WebAI