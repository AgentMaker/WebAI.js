const WebAI = require('./src/webai')

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

WebAI.Model.create = async function (modelURL, inferConfig, backend = 'node', sessionOption = {logSeverityLevel: 4 }) {
    let model = new this();
    if (typeof global.cv == 'undefined') {
        await WebAI.loadOpenCV()
    }

    if (this.backend != backend) {
        this.backend = backend
        if (backend == 'web') {
            global.ort = require('onnxruntime-web')
        }
        else {
            global.ort = require('onnxruntime-node')
        }
    }

    model.loadConfigs(inferConfig);
    model.session = await ort.InferenceSession.create(modelURL, sessionOption);
    return model
}

module.exports = WebAI