# WebAI.js
## Online Demo
* [Hello WebAI.js](https://AgentMaker.github.io/WebAI.js)

## Usage
### use WebAI in a html script
* Install

    ```html
    <script src='https://cdn.jsdelivr.net/gh/AgentMaker/WebAI.js/dist/webai.min.js'></script>
    ```

### use WebAI in node.js
* Install

    ```shell
    $ npm install webai-js
    ```

* Face detection

    ```js
    const WebAI = require('webai-js')
    async function run() {
    let modelURL = './docs/pages/pretrained_models/det/blazeface_1000e/model.onnx'
    let modelConfig = './docs/pages/pretrained_models/det/blazeface_1000e/configs.json'
    let onnxBackend = 'node'
    let drawThreshold = 0.5

    let model = await WebAI.Det.create(modelURL, modelConfig, onnxBackend);
    let image = await WebAI.loadImage('./docs/images/human_image.jpg');
    let results = await model.infer(image, drawThreshold)

    console.log(results)
    }
    run()
    ```
        [
        {
            label: 'face',
            color: [ 0, 0, 0, 255 ],
            score: 0.9996205568313599,
            x1: 330,
            y1: 28,
            x2: 418,
            y2: 139
        }
        ]
