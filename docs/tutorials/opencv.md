# OpenCV.js
## 1. 简介
* OpenCV.js 

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

## 3. 安装
1. HTML script 标签引入

    ```html
    <!-- OpenCV.js 4.5.5 版本 -->
    <script src='https://docs.opencv.org/4.5.5/opencv.js'></script>
    ```

2. node.js

    * 下载 opencv.js 文件，放置于源码目录下即可

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
        let mat = new cv.Mat()
        let matVector = new cv.MatVector()

        matVector.push_back(mat)
        mat = matVector(0)
        matVector.set(0, mat)

        mat.delete()
        matVector.delete()
        ```

* 其他数据类型及其对应的 JS 对象格式，创建变量时两种方式均可使用

    ```js
    new cv.Point(x, y) = {
        x: number, 
        y: number
    }

    new cv.Scalar(R, G, B, Alpha) = [
        R: number, 
        G: number, 
        B: number, 
        Alpha: number
    ]

    new cv.Size(width, height) = {
        width: number, 
        height: number
    }

    new cv.Circle(center, radius) = {
        center: number, 
        radius: number
    }

    new cv.Rect(x, y, width, height) = {
        x: number, 
        y: number, 
        width: number, 
        height: number
    }

    new cv.RotatedRect(center, size, angle) = {
        center: number, 
        size: number,
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
            type(number): 图像类型
            scalar(cv.Scalar): 图像初始值
            array(Array): JS 图像数组
            imgData(ImageData): canvas 图像数据

            mat(cv.Mat): 图像（type)

    * 颜色空间转换

        ```js
        cv.cvtColor(src, dst, code)
        ```

            src(cv.Mat): 输入图像
            dst(cv.Mat): 输出图像
            code(number): 转换类型（如：cv.COLOR_RGBA2RGB）

* 更多 API 和详细信息请参考 [OpenCV 官方文档](https://docs.opencv.org)

## 6. 使用
