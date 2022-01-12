function addScript(url) {
    let script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', url);
    document.getElementsByTagName('head')[0].appendChild(script);
}

addScript('https://docs.opencv.org/4.5.5/opencv.js')
addScript('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.10.0/dist/ort.wasm.min.js')

const { WebAI } = require('./src/webai')
window.WebAI = WebAI