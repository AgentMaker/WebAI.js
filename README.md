# WebAI.js
![](https://img.shields.io/npm/v/webai-js.svg?sanitize=true)
![](https://img.shields.io/npm/l/webai-js.svg?sanitize=true)
![](https://img.shields.io/npm/dm/webai-js.svg?sanitize=true)

## 1. 简介
* WebAI.js 是一个基于 [OpenCV.js](https://docs.opencv.org/4.5.5/d5/d10/tutorial_js_root.html) 和 [ONNXRuntime](https://github.com/microsoft/onnxruntime/tree/master/js) 开发的一个 Web 前端 AI 模型部署工具

* 可通过在线体验网站 [Hello WebAI.js](https://AgentMaker.github.io/WebAI.js) 进行快速的体验试用

    ![](./docs/images/demo.png)


## 2. 特性
* WebAI.js 支持 HTML script 标签引入和 node.js 两种方式进行使用

* 目前支持目标检测 (Yolo / ssd / ...)、图像分类 (MobileNet / EfficientNet / ...)、图像分割(BiseNet / PPSeg / ...) 三类 CV 模型

* 目前支持 [PaddleDetection][PaddleDetection] / [PaddleClas][PaddleClas] / [PaddleSeg][PaddleSeg] 三个套件部分导出模型的部署

* 2.x 版本添加了比较完善的 ts 支持，优化了代码大小，将内联的 opencv.wasm 改为文件加载，API 进行了一些改动，主要修改了模型加载的 API

* 2.x 添加了全新的 API 文档，可直接跳转至 [API 参考](https://AgentMaker.github.io/WebAI.js/interfaces) 页面进行查看

## 3. 安装
1. HTML script 标签引入

    ```html
    <!-- 最新版本 -->
    <script src='https://cdn.jsdelivr.net/npm/webai-js/dist/webai.min.js'></script>

    <!-- 2.0.2 版本 -->
    <script src='https://cdn.jsdelivr.net/npm/webai-js@2.0.2/dist/webai.min.js'></script>
    ```

2. Npm 安装

    ```bash
    $ npm install webai-js
    ```

## 4. 模型
* WebAI.js 使用 ONNX 模型进行模型推理，通过配置文件对模型的预处理进行配置

* 一个常规的模型包含如下两个文件: model.onnx / configs.json

* 其中 model.onnx 为模型文件，记录了模型的计算图和每层的参数，configs.json 为配置文件，记录了模型预处理的一些配置，如下为一个配置文件的具体内容：

    ```json
    {
        "Preprocess": [
            {
                "type": "Decode", // 图像解码
                "mode": "RGB" // RGB 或 BGR
            },
            {
                "type": "Resize", //  图像缩放
                "interp": 1, // 插值方式
                "keep_ratio": false, // 保持长宽比
                "limit_max": false, // 限制图片尺寸
                "target_size": [300, 300] // 目标尺寸
                
            },
            {
                "type": "Normalize", // 归一化
                "is_scale": false, // 是否缩放 (img /= 255.0)
                "mean": [127.5, 127.5, 127.5], // 均值
                "std": [127.5, 127.5, 127.5] // 标准差
            },
            {
                "type": "Permute" // 转置 (HWC -> CHW)
            }
        ],
        "label_list": [
            "aeroplane", "bicycle", "bird", "boat", "bottle", "bus", "car", 
            "cat", "chair", "cow", "diningtable", "dog", "horse", "motorbike", 
            "person", "pottedplant", "sheep", "sofa", "train", "tvmonitor"
        ] // 标签列表
    }
    ```

* 项目中提供了多个已经过测试的预训练模型文件，具体文件位于 [./docs/pretrained_models](https://github.com/AgentMaker/WebAI.js/tree/main/docs/pretrained_models) 目录，也可在在线体验网页 [Hello WebAI.js](https://AgentMaker.github.io/WebAI.js) 中快速试用如下的模型，以下模型均来自 [PaddleDetection][PaddleDetection] / [PaddleClas][PaddleClas] / [PaddleSeg][PaddleSeg] 提供预训练模型，具体的导出教程和兼容性表格将很快更新，更多其他套件、工具链的兼容适配也在稳步进行

    |Model|Type|Source|
    |:-:|:-:|:-:|
    |BlazeFace_1000e|Detection|[PaddleDetection][PaddleDetection]|
    |PPYOLO_tiny_650e_coco|Detection|[PaddleDetection][PaddleDetection]|
    |SSD_mobilenet_v1_300_120e_voc|Detection|[PaddleDetection][PaddleDetection]|
    |SSDLite_mobilenet_v3_small_320_coco|Detection|[PaddleDetection][PaddleDetection]|
    |EfficientNetB0_imagenet|Classification|[PaddleClas][PaddleClas]|
    |MobileNetV3_small_x0_5_imagenet|Classification|[PaddleClas][PaddleClas]|
    |PPLCNet_x0_25_imagenet|Classification|[PaddleClas][PaddleClas]|
    |PPSEG_lite_portrait_398x224|Segmentation|[PaddleSeg][PaddleSeg]|
    |STDC1_seg_voc12aug_512x512_40k|Segmentation|[PaddleSeg][PaddleSeg]|
    |BiseNet_cityscapes_1024x1024_160k|Segmentation|[PaddleSeg][PaddleSeg]|

[PaddleDetection]:https://www.github.com/PaddlePaddle/PaddleDetection
[PaddleClas]:https://www.github.com/PaddlePaddle/PaddleClas
[PaddleSeg]:https://www.github.com/PaddlePaddle/PaddleSeg

## 5. API 
* 模型加载

    ```js
    // Base model
    new WebAI.Model(modelURL, sessionOption = { logSeverityLevel: 4 }, init = null, preProcess = null, postProcess = null) -> model

    // Base CV model
    new WebAI.CV(modelURL, inferConfig, sessionOption = { logSeverityLevel: 4 }, getFeeds = null, postProcess = null) -> modelCV

    // Detection model
    new WebAI.Det(modelURL, inferConfig, sessionOption = { logSeverityLevel: 4 }, getFeeds = null, postProcess = null) -> modelDet

    // Classification model
    new WebAI.Cls(modelURL, inferConfig, sessionOption = { logSeverityLevel: 4 }, getFeeds = null, postProcess = null) -> modelCls

    // Segmentation model
    new WebAI.Seg(modelURL, inferConfig, sessionOption = { logSeverityLevel: 4 }, getFeeds = null, postProcess = null) -> modelSeg    
    ```

        modelURL(string): 模型链接/路径
        inferConfig(string): 模型配置文件链接/路径
        sessionOption(object): ONNXRuntime session 的配置
        getFeeds(function(imgTensor: ort.Tensor, imScaleX: number, imScaleY: number) => feeds:object): 自定义模型输入函数
        init(function(model: WebAI.Model) => void): 自定义模型初始化函数
        preProcess(function(...args) => feeds: object): 自定义模型预处理函数
        postProcess(function(resultsTensors: object, ...args) => result: any): 自定义模型后处理函数

* 模型推理

    ```js
    // Base model
    (async) model.infer(...args)

    // Base CV model
    (async) modelCV.infer(...args)

    // Detection model
    (async) modelDet.infer(imgRGBA, drawThreshold=0.5) ->  bboxes

    // Classification model
    (async) modelCls.infer(imgRGBA, topK=5) ->  probs
    
    // Segmentation model
    (async) modelSeg.infer(imgRGBA) ->  segResults
    ```

        // 注：目前只能实现 BatchSize=1 的模型推理

        imgRGBA(cv.Mat): 输入图像
        drawThreshold(number): 检测阈值
        topK(number): 返回置信度前 K (K>0) 个结果，如果 K<0 返回所有结果

        bboxes({
            label: string, // 标签
            score: number, // 置信度
            color: number[], // 颜色（RGBA）
            x1: number, // 左上角 x 坐标
            y1: number, // 左上角 y 坐标
            x2: number, // 右下角 x 坐标
            y2: number // 右下角 y 坐标
        }[]): 目标检测包围框结果
        probs({
            label: string, // 标签
            prob: number // 置信度
        }[]): 图像分类置信度结果
        segResults({
            gray: cv.Mat, // 最大值索引图像（Gray）
            colorRGBA: cv.Mat, // 伪彩色图（RGBA）
            colorMap: { // 调色板
                lable: string, // 标签
                color: number[] // 颜色（RGBA）
            }[]
        }): 图像分割结果

* 更多 API 请参考文档：[API 参考](https://AgentMaker.github.io/WebAI.js/interfaces)

## 6. 部署
* 在线体验网页：[Hello WebAI.js](https://AgentMaker.github.io/WebAI.js)

* 除了在线体验网页，也可以通过 node.js 借助 vite 构建工具快速在本地部署这个体验网页

    ```bash
    # 安装依赖
    $ npm install

    # 启动服务器调试
    $ npm run dev
    ```

* 部署完成后，就可以使用浏览器访问 http://localhost:3000/ 进行体验使用

## 7. 更多
* [OpenCV.js 快速入门](./docs/tutorials/opencv.md)
