const WebAI = require('./src/webai')

WebAI.loadText = function (textURL) {
    let fs = require('fs');
    return fs.readFileSync(textURL);
}

WebAI.setBackend = function (backend = 'node') {
    return new Promise(resolve => {
        global.Module = {
            onRuntimeInitialized: resolve
        };
        global.cv = require('./src/opencv.js');
        if (backend == 'web') {
            global.ort = require('onnxruntime-web')
        } else {
            global.ort = require('onnxruntime-node')
        }
    });
}

WebAI.Model.create = async function (modelURL, inferConfig, sessionOption = { logSeverityLevel: 4 }, backend = 'node') {
    let model = new this();
    await WebAI.setBackend(backend)
    model.loadConfigs(inferConfig);
    model.session = await ort.InferenceSession.create(modelURL, sessionOption);
    return model
}

module.exports = WebAI