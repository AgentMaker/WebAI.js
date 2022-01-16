window.WebAI = require('./src/webai')

function onLoadONNX() {
    console.info('ONNXRuntime-web has been loaded.')
    window.WebAI.ort = window.ort
}

function onLoadOpenCV() {
    console.info('OpenCV.js has been loaded.')
    window.WebAI.cv = window.cv
}

window.onLoadONNX = onLoadONNX
window.onLoadOpenCV = onLoadOpenCV

function addScript(url, onload) {
    let script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', url);
    script.setAttribute('onload', onload);
    document.getElementsByTagName('head')[0].appendChild(script);
    return script
}

addScript('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.10.0/dist/ort.wasm.min.js', 'onLoadONNX()')
addScript('https://docs.opencv.org/4.5.5/opencv.js', 'onLoadOpenCV()')

console.info('WebAI.js has been loaded.')