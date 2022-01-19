# ONNXRuntime.js
## 1. 简介
* ONNXRuntime.js: ONNXRuntime 的 JavaScript 版本

* 官方项目: [microsoft/onnxruntime](https://github.com/microsoft/onnxruntime/tree/master/js)

* 官方示例程序: [microsoft/onnxruntime-inference-examples](https://github.com/microsoft/onnxruntime-inference-examples/tree/main/js/)

## 2. 安装使用
1. HTML script 标签引入

    ```html
    <!-- ONNXRuntime-web 1.10.0 版本 -->
    <script src='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.10.0/dist/ort.min.js'></script>
    ```

2. node.js 安装

    ```bash
    # 安装 Web 版本
    $ npm install onnxruntime-web

    # 安装 Node.js 版本
    $ npm install onnxruntime-node

    # 更多安装细节请参考官方项目文档
    ```

## 3. API
* 模型加载

    ```js
    (async) ort.InferenceSession.create(model, sessionOption) -> session
    ```

        model(string): 模型链接或路径
        sessionOption(object): session 的运行选项

* 模型推理
    ```js
    (async) session.run(feeds) -> results
    ```

        feeds(object): 输入数据
        results(object): 输出结果

* 更多 API 细节请参考：[官方 JS API 文档](https://onnxruntime.ai/docs/api/js/)
