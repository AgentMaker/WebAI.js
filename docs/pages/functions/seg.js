// 获取 Doms
const imageDom = document.getElementById('image');
const canvasDom = document.getElementById('canvas');
const inputDom = document.getElementById('inputFile');
const selectModel = document.getElementById('selectModel');
const buttonUser = document.getElementById('buttonUser');
const buttonEnv = document.getElementById('buttonEnv');
const videoCapture = document.getElementById('videoCapture');
const inputRange = document.getElementById('inputRange');
const inputNum = document.getElementById('inputNum');
const output = document.getElementById('output');
const baseURL = '../pretrained_models/seg';

var cap = null
var model = null
var imgRGBA = null
var imgSeg = null

var mixingFactor = 0.5
inputRange.onchange = async function (e) {
    inputNum.value = inputRange.value * 1.0
    mixingFactor = inputRange.value * 1.0
    if (imgRGBA != null) {
        let imgShow = new cv.Mat()
        cv.addWeighted(imgRGBA, 1.0 - mixingFactor, imgSeg, mixingFactor, 0.0, imgShow)
        cv.imshow(canvasDom, imgShow)
        imgShow.delete()
    }
}
inputNum.onchange = async function (e) {
    inputRange.value = inputNum.value * 1.0
    mixingFactor = inputNum.value * 1.0
    if (imgRGBA != null) {
        let imgShow = new cv.Mat()
        cv.addWeighted(imgRGBA, 1.0 - mixingFactor, imgSeg, mixingFactor, 0.0, imgShow)
        cv.imshow(canvasDom, imgShow)
        imgShow.delete()
    }
}
function getUserMedia(facingMode) {
    if (navigator.mediaDevices.getUserMedia) {
        //最新的标准API
        navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: facingMode } }).then(successCap).catch(errorCap);
    } else if (navigator.webkitGetUserMedia) {
        //webkit核心浏览器
        navigator.webkitGetUserMedia({ video: { width: 1280, height: 720, facingMode: facingMode } }, successCap, errorCap);
    } else if (navigator.mozGetUserMedia) {
        //firfox浏览器
        navigator.mozGetUserMedia({ video: { width: 1280, height: 720, facingMode: facingMode } }, successCap, errorCap);
    } else if (navigator.getUserMedia) {
        //旧版API
        navigator.getUserMedia({ video: { width: 1280, height: 720, facingMode: facingMode } }, successCap, errorCap);
    }
}
function successCap(stream) {
    let h = stream.getVideoTracks()[0].getSettings().height;
    let w = stream.getVideoTracks()[0].getSettings().width;
    videoCapture.width = w;
    videoCapture.height = h;
    videoCapture.srcObject = stream;
    videoCapture.play();
    if (cap == null) {
        cap = new cv.VideoCapture(videoCapture);
    }
    if (imgRGBA != null) {
        imgRGBA.delete()
        imgSeg.delete()
    }
    imgRGBA = new cv.Mat(h, w, cv.CV_8UC4);
    setTimeout(processVideo, 0);
}

function errorCap(error) {
    console.log(`访问用户媒体设备失败${error.name}, ${error.message}`);
}

function getModelURL() {
    let modelName = selectModel.options[selectModel.selectedIndex].value;
    let modelSeg = `${baseURL}/${modelName}/model.onnx`;
    let inferConfig = `${baseURL}/${modelName}/configs.json`;
    return [modelSeg, inferConfig]
}
function loadImage(e) {
    if (e.target.files[0]) {
        imageDom.src = URL.createObjectURL(e.target.files[0]);
    }
};
async function inferSeg(e) {
    if (buttonEnv.innerHTML == 'Stop Environment Camera') {
        buttonEnv.innerHTML = 'Open Environment Camera';
        videoCapture.srcObject.getTracks()[0].stop();
    }
    if (buttonUser.innerHTML == 'Stop User Camera') {
        buttonUser.innerHTML = 'Open User Camera';
        videoCapture.srcObject.getTracks()[0].stop();
    }
    // 模型推理
    if (imgRGBA != null) {
        imgRGBA.delete()
        imgSeg.delete()
    }
    imgRGBA = cv.imread(imageDom);
    let seg = await model.infer(imgRGBA, true);
    let imgShow = new cv.Mat()
    imgSeg = cv.matFromArray(imgRGBA.rows, imgRGBA.cols, cv.CV_8UC4, seg.colorMapping)
    cv.addWeighted(imgRGBA, 1.0 - mixingFactor, imgSeg, mixingFactor, 0.0, imgShow)
    cv.imshow(canvasDom, imgShow);
    let tableProb = document.getElementById('tableProb');
    let table = buildTable(seg.colorMap)
    output.removeChild(tableProb)
    output.appendChild(table)
    imgShow.delete();
};
async function loadModel(e) {
    let [modelSeg, inferConfig] = getModelURL();
    model = await WebAI.Seg.create(
        modelSeg,
        inferConfig
    )
    inputDom.disabled = false;
    buttonUser.disabled = false;
    buttonEnv.disabled = false;
    document.getElementById('statusModel').innerHTML = 'Model is ready.';

};
// 绑定函数
inputDom.onchange = loadImage;
imageDom.onload = inferSeg;
onload = loadModel;
selectModel.onchange = async function (e) {
    document.getElementById('statusModel').innerHTML = 'Model is loading...';
    let [modelSeg, inferConfig] = getModelURL();
    model = await WebAI.Seg.create(
        modelSeg,
        inferConfig
    )
    inputDom.disabled = false;
    buttonUser.disabled = false;
    buttonEnv.disabled = false;
    if (imgRGBA != null) {
        let seg = await model.infer(imgRGBA);
        let imgShow = new cv.Mat()
        imgSeg = cv.matFromArray(imgRGBA.rows, imgRGBA.cols, cv.CV_8UC4, seg.colorMapping)
        cv.addWeighted(imgRGBA, 1.0 - mixingFactor, imgSeg, mixingFactor, 0.0, imgShow)
        cv.imshow(canvasDom, imgShow);
        let tableProb = document.getElementById('tableProb');
        let table = buildTable(seg.colorMap)
        output.removeChild(tableProb)
        output.appendChild(table)
        imgShow.delete();
    }
    document.getElementById('statusModel').innerHTML = 'Model is ready.';
}
buttonUser.onclick = function (e) {
    if (buttonUser.innerHTML == 'Open User Camera') {
        if (buttonEnv.innerHTML == 'Stop Environment Camera') {
            buttonEnv.innerHTML = 'Open Environment Camera';
            videoCapture.srcObject.getTracks()[0].stop();

        }
        buttonUser.innerHTML = 'Stop User Camera';
        getUserMedia('user');
    }
    else {
        buttonUser.innerHTML = 'Open User Camera';
        videoCapture.srcObject.getTracks()[0].stop();

    }
}
buttonEnv.onclick = function (e) {
    if (buttonEnv.innerHTML == 'Open Environment Camera') {
        if (buttonUser.innerHTML == 'Stop User Camera') {
            buttonUser.innerHTML = 'Open User Camera';
            videoCapture.srcObject.getTracks()[0].stop();

        }
        buttonEnv.innerHTML = 'Stop Environment Camera';
        getUserMedia('environment');
    }
    else {
        buttonEnv.innerHTML = 'Open Environment Camera';
        videoCapture.srcObject.getTracks()[0].stop();

    }

}
function processVideo() {
    if (buttonUser.innerHTML == 'Stop User Camera' || buttonEnv.innerHTML == 'Stop Environment Camera') {
        cap.read(imgRGBA);
        model.infer(imgRGBA, true).then(function (results) {
            let seg = results;
            let imgRGB = new cv.Mat()
            let imgShow = new cv.Mat()
            imgSeg = cv.matFromArray(imgRGBA.rows, imgRGBA.cols, cv.CV_8UC4, seg.colorMapping)
            cv.cvtColor(imgRGBA, imgRGB, cv.COLOR_RGBA2RGB);
            cv.addWeighted(imgRGB, 1.0 - mixingFactor, imgSeg, mixingFactor, 0.0, imgShow)
            cv.imshow(canvasDom, imgShow)
            let tableProb = document.getElementById('tableProb');
            let table = buildTable(seg.colorMap)
            output.removeChild(tableProb)
            output.appendChild(table)
            imgRGB.delete();
            imgShow.delete();
            setTimeout(processVideo, 0);
        }).catch(function (e) {
            console.log(e)
            setTimeout(processVideo, 0);
        })
    }
    else {
        return
    }


}
function buildTable(data) {
    let table = document.createElement("table");
    let tr = document.createElement("tr");
    // 通过 for in 循环遍历对象,得到对象的属性,为表头添加内容
    for (let i in data[0]) {
        let th = document.createElement("th");
        th.innerText = i;
        tr.appendChild(th);
    }
    table.appendChild(tr);
    // 通过 forEach 循环遍历对象数组,为表格添加行
    data.forEach((value, index) => {
        let tr = document.createElement("tr");
        // 通过 for in 循环遍历对象,得到对象的属性,给每行添加内容
        for (let index1 in data[index]) {
            let td = document.createElement("td");
            let tmp = data[index][index1]
            if (typeof tmp=="object"){
                td.setAttribute("style", `background: rgba(${tmp.toString()})`);
                tmp = '';
            }
            td.innerText = tmp;
            tr.appendChild(td);
        }
        table.appendChild(tr);
    });
    table.setAttribute("border","1");
    table.setAttribute("id","tableProb");
    return table;
}