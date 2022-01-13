const WebAI = require('./src/webai')
const { createCanvas, loadImage } = require('canvas');

WebAI.loadText = function (textURL) {
    let fs = require('fs');
    return fs.readFileSync(textURL);
}

WebAI.loadOpenCV = function () {
    return new Promise(resolve => {
        global.Module = {
            onRuntimeInitialized: resolve
        };
        global.cv = require('./src/opencv');
    });
}

WebAI.checkOpenCV = async function () {
    if (typeof global.cv == 'undefined') {
        await WebAI.loadOpenCV()
    }
}

WebAI.loadONNXRuntime = function (backend = 'node') {
    WebAI.backend = backend
    if (backend == 'web') {
        global.ort = require('onnxruntime-web')
    }
    else {
        global.ort = require('onnxruntime-node')
    }
}

WebAI.checkONNXRuntime = function (backend = 'node') {
    if (WebAI.backend != backend) {
        WebAI.loadONNXRuntime(backend)
    }
}

WebAI.loadImage = async function (imageURL) {
    WebAI.checkOpenCV()
    let image = await loadImage(imageURL);
    let canvas = createCanvas(image.width, image.height);
    let ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0, image.width, image.height)
    let imageData = ctx.getImageData(0, 0, image.width, image.height)
    let imageMat = cv.matFromArray(image.height, image.width, cv.CV_8UC4, imageData.data)
    return imageMat
}

WebAI.Model.create = async function (modelURL, inferConfig, backend = 'node', sessionOption = { logSeverityLevel: 4 }) {
    await WebAI.checkOpenCV();
    WebAI.checkONNXRuntime(backend);

    let model = new this();
    model.loadConfigs(inferConfig);
    model.session = await ort.InferenceSession.create(modelURL, sessionOption);
    return model
}

module.exports = WebAI