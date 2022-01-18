# OpenCV.js
## 1. 简介
* OpenCV.js: OpenCV 的 JavaScript 版本

* 官方指南：[OpenCV.js Tutorials](https://docs.opencv.org/4.5.5/d5/d10/tutorial_js_root.html)


## 2. 下载
* 可通过如下链接下载到指定版本的预编译 opencv.js 文件

    ```
    https://docs.opencv.org/{version}/opencv.js
    ```

* 比如下载 4.5.5 版本的 opencv.js 文件

    ```
    https://docs.opencv.org/4.5.5/opencv.js
    ```

## 3. 安装使用
1. HTML script 标签引入

    ```html
    <!-- OpenCV.js 4.5.5 版本 -->
    <script src='https://docs.opencv.org/4.5.5/opencv.js'></script>
    ```

2. node.js

    * 下载 opencv.js 文件，放置于源码目录下，然后使用 require 的方式加载即可

        ```js
        // 加载 OpenCV.js
        function loadOpenCV(path) {
            return new Promise(resolve => {
                global.Module = {
                    onRuntimeInitialized: resolve
                };
                global.cv = require(path);
            });
        }

        // 加载并创建一个图像
        async function run(path){
            await loadOpenCV(path)
            let img = new cv.Mat()
            img.delete()
        }
        
        // 设置文件路径
        const path = './opencv.js'

        // 运行
        run(path)
        ```

## 4. 数据类型
* 图像数据类型
    * Mat 是 OpenCV 基础的图像数据结构，其数据类型对照表如下：

        |Data Properties	|C++ Type	|JavaScript Typed Array	|Mat Type|
        |:-:|:-:|:-:|:-:|
        |data	|uchar	|Uint8Array	|CV_8U|
        |data8S	|char	|Int8Array	|CV_8S|
        |data16U	|ushort	|Uint16Array	|CV_16U|
        |data16S	|short	|Int16Array	|CV_16S|
        |data32S	|int	|Int32Array	|CV_32S|
        |data32F	|float	|Float32Array	|CV_32F|
        |data64F	|double	|Float64Array	|CV_64F|

    * MatVector 即多个 Mat 组成的向量，使用 push_back(mat: cv.Mat)、 get(index: number) 和 set(index: number, mat: cv.Mat)方法添加、读取和设置 Mat 至 MatVector 中

    * Mat 和 MatVector 类型的变量请在不再需要使用的时候使用 delete() 方法将其删除，否则该变量将会持续占用内存

    * 简单的创建和删除方式如下：

        ```js
        // 创建一个 Mat
        let mat = new cv.Mat()

        // 创建一个 MatVector
        let matVector = new cv.MatVector()

        // 添加一个 Mat
        matVector.push_back(mat)

        // 获取 index 为 0 的 Mat 
        mat = matVector.get(0)

        // 设置 index 为 0 的 Mat 
        matVector.set(0, mat)

        // 删除 Mat
        mat.delete()

        // 删除 MatVector
        matVector.delete()
        ```

* 其他数据类型及其对应的 JS 对象格式，创建变量时两种方式均可使用

    ```js
    // 坐标点
    new cv.Point(x, y) = {
        x: number, 
        y: number
    }

    // 像素点
    new cv.Scalar(R, G, B, Alpha) = [
        R: number, 
        G: number, 
        B: number, 
        Alpha: number
    ]

    // 图像尺寸
    new cv.Size(width, height) = {
        width: number, 
        height: number
    }

    // 圆形区域
    new cv.Circle(center, radius) = {
        center: {
            x: number,
            y: number
        }, 
        radius: number
    }

    // 矩形区域
    new cv.Rect(x, y, width, height) = {
        x: number, 
        y: number, 
        width: number, 
        height: number
    }

    // 旋转矩形区域
    new cv.RotatedRect(center, size, angle) = {
        center: {
            x: number,
            y: number
        }, 
        size: {
            width: number, 
            height: number 
        },
        angle: number
    }
    ```

## 5. API
* OpenCV.js 的 API 与 OpenCV C++ 版本 API 非常相似

* OpenCV.js 常用的 API 如下：
    * 图像读取和显示

        ```js
        // 读取
        cv.imread(dom) -> dst

        // 显示
        cv.imshow(dst, dom)
        ```

            dom(Dom/string): img 标签或其 id（读取） / canvas 标签或其 id（读取/显示）

            dst(cv.Mat): 图像（RGBA）

    * 创建图像

        ```js
        // 创建一个 Mat 格式的图像
        new cv.Mat() -> mat
        new cv.Mat(size, type) -> mat
        new cv.Mat(rows, cols, type) -> mat
        new cv.Mat(rows, cols, type, scalar) -> mat


        // 创建一个值全部为零的图像
        cv.Mat.zeros(rows, cols, type) -> mat

        // 创建一个值全部为一的图像
        cv.Mat.ones(rows, cols, type) -> mat

        // 创建一个对角线值为一的图像
        cv.Mat.eye(rows, cols, type) -> mat

        // 使用 JS Array 生成图像
        cv.matFromArray(rows, cols, type, array) -> mat

        // 使用 canvas ImageData 生成图像
        cv.matFromImageData(imgData) - mat
        ```

            size(cv.size): 图像尺寸
            rows(number): 图像高度
            cols(number): 图像宽度
            type(number): 图像类型（cv.CV_8UC3 ...）
            scalar(cv.Scalar): 图像初始值
            array(Array): JS 图像数组
            imgData(ImageData): canvas 图像数据

            mat(cv.Mat): 图像（type）

    * 获取图像属性

        ```js
        // 图像高度
        mat.rows -> rows

        // 图像宽度
        mat.cols -> cols

        // 图像尺寸
        mat.size() -> size

        // 图像通道数量
        mat.channels() -> channels

        // 图像数据类型
        mat.type() -> type
        ```
            
            mat(cv.Mat): 图像

            rows(number): 图像高度
            cols(number): 图像宽度
            size(cv.Size): 图像尺寸
            channles(number): 图像通道数量
            type(number): 图像数据类型（cv.CV_8UC3 ...）

    * 获取图像数据

        ```js
        mat.data -> data
        mat.data8S -> data8S
        mat.data16U -> data16U
        mat.data16S -> data16S
        mat.data32S -> data32S
        mat.data32F -> data32F
        mat.data64F -> data64F
        ```
            
            mat(cv.Mat): 图像

            data(Uint8Array): 无符号 8 位整型数据
            data8S(Int8Array): 有符号 8 位整型数据
            data16U(Uint16Array): 无符号 16 位整型数据
            data16S(Int16Array): 有符号 16 位整型数据
            data32S(Int32Array): 有符号 32 位整型数据
            data32F(Float32Array): 32 位浮点数据
            data64F(Float64Array): 64 位浮点数据
    
    * 裁切图像

        ```js
        mat.roi(rect) -> matROI
        ```

            rect(cv.Rect): 图像裁切区域

            matROI(cv.Mat): 裁切图像

    * 颜色空间转换

        ```js
        cv.cvtColor(src, dst, code)
        ```

            src(cv.Mat): 输入图像
            dst(cv.Mat): 输出图像
            code(number): 转换类型（cv.COLOR_RGBA2RGB ...）

    * 图像缩放

        ```js
        cv.resize(src, dst, dsize, fx, fy, interpolation)
        ```

            src(cv.Mat): 输入图像
            dst(cv.Mat): 输出图像
            dsize(cv.Size): 目标尺寸
            fx(number): x 轴缩放因子
            fy(number): y 轴缩放因子
            interpolation(number): 插值类型（cv.INTER_LINEAR ...）

    * 创建图像向量

        ```js
        new cv.MatVector() -> matVector
        ```

            matVector(cv.MatVector): 图像向量

    * 图像向量操作

        ```js
        // 添加
        matVector.push_back(mat)

        // 获取
        matVector.get(index) -> mat

        // 设置
        matVector.set(index, mat)
        ```
            
            matVector(cv.MatVector): 图像向量

            mat(cv.Mat): 图像
            index(number): 索引值

    * 通道拆分与合并

        ```js
        // 拆分
        cv.split(src, channels)

        // 合并
        cv.merge(channels, dst)
        ```

            src(cv.Mat): 输入图像
            dst(cv.Mat): 输出图像
            channels(cv.MatVector): 通道图像向量
    
    * 删除对象

        ```js
        // 删除图像对象
        mat.delete()

        // 删除图像向量对象
        matVector.delete()
        ```

            mat(cv.Mat): 图像
            matVector(cv.MatVector): 图像向量

    * 创建视频流

        ```js
        new cv.VideoCapture(videoSource) -> cap
        ```

            videoSource(Dom/string): video 标签或其 id

            cap(cv.VideoCapture): 视频流

    * 读取视频帧

        ```js
        cap.read(mat)
        ```

            cap(cv.VideoCapture): 视频流

            mat(cv.Mat): 图像

* 更多 API 和详细信息请参考 [OpenCV 官方文档](https://docs.opencv.org)
