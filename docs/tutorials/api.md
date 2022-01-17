# API 参考
## 1. 模型相关
* 模型加载

    ```js
    // Base model
    (async) WebAI.CV.create(modelURL, sessionOption = { logSeverityLevel: 4 }, init = null, preProcess = null, postProcess = null) -> model

    // Base CV model
    (async) WebAI.CV.create(modelURL, inferConfig, sessionOption = { logSeverityLevel: 4 }, getFeeds = null, postProcess = null) -> modelCV

    // Detection model
    (async) WebAI.Det.create(modelURL, inferConfig, sessionOption = { logSeverityLevel: 4 }, getFeeds = null, postProcess = null) -> modelDet

    // Classification model
    (async) WebAI.Cls.create(modelURL, inferConfig, sessionOption = { logSeverityLevel: 4 }, getFeeds = null, postProcess = null) -> modelCls

    // Segmentation model
    (async) WebAI.Seg.create(modelURL, inferConfig, sessionOption = { logSeverityLevel: 4 }, getFeeds = null, postProcess = null) -> modelSeg    
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
            argMax: number[], // 最大值索引图像（Gray）
            colorMapping: number[], // 伪彩色图（RGBA）
            colorMap: { // 调色板
                lable: string, // 标签
                color: number[] // 颜色（RGBA）
            }[]
        }): 图像分割结果

## 2. 图像 I/O
* 图像读取/保存（只适用于 node.js）

    ```js
    // 图像读取
    (async) WebAI.loadImage(imgPath) -> img

    // 图像保存
    WebAI.saveImage(img, imgPath)
    ```
    
        imgPath(string): 图像（保存）路径

        img(cv.Mat): 输入/输出图像

## 3. 预处理函数
* 获取图像缩放因子

    ```js
    WebAI.getIMScale(height, width, targetSize, keepRatio, limitMax) -> [imScaleX, imScaleY]
    ```

        height(number): 图像高度
        width(number): 图像宽度
        targetSize([number, number]): 目标尺寸（高，宽）/（最小，最大）
        keepRatio(boolean): 保持长宽比
        limitMax(boolean): 限制最大尺寸

        imScaleX, imScaleY(number, number): x/y 轴缩放因子

* 图像颜色空间转换

    ```js
    WebAI.rgba2rgb(imgRGBA) -> imgRGB
    WebAI.rgba2bgr(imgRGBA) -> imgBGR
    ```

        imgRGBA(cv.Mat): 输入的图像（RGBA）

        imgRGB/imgBGR(cv.Mat): 输出的图像（RGB/BGR）

* 图像缩放

    ```js
    WebAI.resize(img, height, width, targetSize, keepRatio, limitMax, interp) -> imgResize
    ```

        img(cv.Mat): 输入的图像
        height(number): 图像高度
        width(number): 图像宽度
        targetSize([number, number]): 目标尺寸（高，宽）/（最小，最大）
        keepRatio(boolean): 保持长宽比
        limitMax(boolean): 限制最大尺寸
        interp(number): 插值类型

* 图像裁切（中心裁切）

    ```js
    WebAI.crop(img, cropSize) -> imgCrop
    ```

        img(cv.Mat): 输入的图像
        cropSize([number, number]): 裁切尺寸（高，宽）

* 归一化

    ```js
    WebAI.normalize(img, scale, mean, std, isScale) -> imgNorm
    ```

        img(cv.Mat): 输入的图像
        scale(number): 缩放值
        mean(number[]): 均值
        std(number[]): 标准差
        isScale(boolean): 是否缩放

        imgNorm(cv.Mat): 输出的图像

* 转置

    ```js
    WebAI.permute(img) -> imgData
    ```

        img(cv.Mat): 输入的图像（HWC）

        imgData(Float32Array): 输出的图像数据（CHW）

## 4. 后处理函数
* 绘制目标检测包围框

    ```js
    WebAI.drawBBoxes(img, bboxes, withLabel = true, withScore = true, thickness = 2.0, lineType = 8, fontFace = 0, fontScale = 0.7) -> imgDrawed
    ```

        img(cv.Mat): 输入图像
        bboxes({
            label: string, // 标签
            score: number, // 置信度
            color: number[], // 颜色（RGBA）
            x1: number, // 左上角 x 坐标
            y1: number, // 左上角 y 坐标
            x2: number, // 右下角 x 坐标
            y2: number // 右下角 y 坐标
        }[]): 目标检测包围框结果
        withLabel(boolean): 绘制标签
        withScore(boolean): 绘制置信度
        thickness(number): 线条宽度
        lineType(number): 线条类型
        fontFace(number): 字体类型
        fontScale(number): 字体缩放

        imgDrawed(cv.Mat): 输出图像

## 5. 其他功能函数
* 获取文本内容

    ```js
    WebAI.loadText(textURL) -> text
    ```

        textURL: 文本文件链接/路径

        text: 文本内容

* 获取调色板

    ```js
    WebAI.getColorMap(labelList) -> colorMap
    ```
        labelList(string[]): 标签列表

        colorMap({
            lable: string, // 标签
            color: number[] // 颜色（RGBA）
        }[]): 调色板

* 获取列表最大值的索引值

    ```js
    WebAI.argMax(arr) -> index
    ```

        arr(number[]): 输入的列表

        index(number): 列表最大值的索引值