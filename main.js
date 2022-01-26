import WebAI from './src/webai'
window.WebAI = WebAI
window.cv = WebAI.cv

// 获取 Doms
const aDet = document.getElementById('aDet')
const aCls = document.getElementById('aCls')
const aSeg = document.getElementById('aSeg')

const detDoms = document.getElementsByClassName('det')
const clsDoms = document.getElementsByClassName('cls')
const segDoms = document.getElementsByClassName('seg')

const detModel = document.getElementById('detModel')
const clsModel = document.getElementById('clsModel')
const segModel = document.getElementById('segModel')

const drawThresholdDoms = document.getElementsByClassName('drawThreshold')
const topKDoms = document.getElementsByClassName('topK')
const mixingFactorDoms = document.getElementsByClassName('mixingFactor')

const imgDom = document.getElementById('imgDom')
const inputFile = document.getElementById('inputFile')
const videoDom = document.getElementById('videoDom')
const canvasDom = document.getElementById('canvasDom')
const buttonUser = document.getElementById('buttonUser')
const buttonEnv = document.getElementById('buttonEnv')
const tableDiv = document.getElementById('tableDiv')
let MODE = 'det'
let modelName = 'blazeface_1000e'

let drawThreshold = 0.5
let topK = 5
let mixingFactor = 0.5

let cap
let model

let imgRGBA
let bboxes
let probs
let seg


let modelDir
if (typeof BUILD == 'undefined') {
    modelDir = './docs/pretrained_models'
}
else {
    modelDir = './pretrained_models'
}

async function switchType(e) {
    if (e.target.id == 'aDet') {
        for (let i = 0; i < detDoms.length; i++) {
            detDoms[i].style['display'] = ''
        }
        for (let i = 0; i < clsDoms.length; i++) {
            clsDoms[i].style['display'] = 'none'
        }
        for (let i = 0; i < segDoms.length; i++) {
            segDoms[i].style['display'] = 'none'
        }
        tableDiv.style['display'] = 'none'
        modelName = 'blazeface_1000e'
        await loadModel('det')
        MODE = 'det'
    }
    else if (e.target.id == 'aCls') {
        for (let i = 0; i < detDoms.length; i++) {
            detDoms[i].style['display'] = 'none'
        }
        for (let i = 0; i < clsDoms.length; i++) {
            clsDoms[i].style['display'] = ''
        }
        for (let i = 0; i < segDoms.length; i++) {
            segDoms[i].style['display'] = 'none'
        }
        tableDiv.style['display'] = ''
        modelName = 'efficientnetb0_imagenet'
        await loadModel('cls')
        MODE = 'cls'
    }
    else if (e.target.id == 'aSeg') {
        for (let i = 0; i < detDoms.length; i++) {
            detDoms[i].style['display'] = 'none'
        }
        for (let i = 0; i < clsDoms.length; i++) {
            clsDoms[i].style['display'] = 'none'
        }
        for (let i = 0; i < segDoms.length; i++) {
            segDoms[i].style['display'] = ''
        }
        tableDiv.style['display'] = ''
        modelName = 'ppseg_lite_portrait_398x224'
        await loadModel('seg')
        MODE = 'seg'
    }
    await restart()
}

aDet.onclick = (e) => switchType(e)
aCls.onclick = (e) => switchType(e)
aSeg.onclick = (e) => switchType(e)

async function switchModel(e) {
    modelName = e.target.value
    await loadModel(MODE)
    await restart()
}

detModel.onchange = (e) => switchModel(e)
clsModel.onchange = (e) => switchModel(e)
segModel.onchange = (e) => switchModel(e)

function getConfig(e) {
    if (e.target.className == 'drawThreshold') {
        drawThreshold = e.target.value * 1.0
        for (let i = 0; i < drawThresholdDoms.length; i++) {
            drawThresholdDoms[i].value = drawThreshold
        }
    }
    else if (e.target.className == 'topK') {
        topK = e.target.value * 1
        for (let i = 0; i < topKDoms.length; i++) {
            topKDoms[i].value = topK
        }
    }
    else if (e.target.className == 'mixingFactor') {
        mixingFactor = e.target.value * 1.0
        for (let i = 0; i < mixingFactorDoms.length; i++) {
            mixingFactorDoms[i].value = mixingFactor
        }
    }
    if (!(typeof imgRGBA == 'undefined')) {
        postProcess()
    }
}

for (let i = 0; i < drawThresholdDoms.length; i++) {
    drawThresholdDoms[i].onchange = (e) => getConfig(e)
}
for (let i = 0; i < topKDoms.length; i++) {
    topKDoms[i].onchange = (e) => getConfig(e)
}
for (let i = 0; i < mixingFactorDoms.length; i++) {
    mixingFactorDoms[i].onchange = (e) => getConfig(e)
}

inputFile.onchange = (e) => {
    if (e.target.files[0]) {
        imgDom.src = URL.createObjectURL(e.target.files[0]);
    }
}

async function loadModel(MODE) {
    inputFile.disabled = true
    buttonUser.disabled = true
    buttonEnv.disabled = true

    let modelURL = `${modelDir}/${MODE}/${modelName}/model.onnx`
    let modelConfig = `${modelDir}/${MODE}/${modelName}/configs.json`
    if (MODE == 'det') {
        model = await WebAI.Det.create(modelURL, modelConfig)
    }
    else if (MODE == 'cls') {
        model = await WebAI.Cls.create(modelURL, modelConfig)
    }
    else if (MODE == 'seg') {
        model = await WebAI.Seg.create(modelURL, modelConfig)
    }
    inputFile.disabled = false
    buttonUser.disabled = false
    buttonEnv.disabled = false
}

loadModel(MODE)

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
    videoDom.width = w;
    videoDom.height = h;
    videoDom.srcObject = stream;
    videoDom.play();
    cap = new cv.VideoCapture(videoDom);
    setTimeout(inferVideo, 0)
}

function errorCap(error) {
    console.log(`访问用户媒体设备失败${error.name}, ${error.message}`);
}

buttonUser.onclick = function (e) {
    if (buttonUser.innerHTML == 'Open User Camera') {
        if (buttonEnv.innerHTML == 'Stop Environment Camera') {
            buttonEnv.innerHTML = 'Open Environment Camera';
            videoDom.pause();
            videoDom.srcObject.getTracks()[0].stop();

        }
        buttonUser.innerHTML = 'Stop User Camera';
        getUserMedia('user');
        setTimeout(inferVideo(), 0)
    }
    else {
        buttonUser.innerHTML = 'Open User Camera';
        videoDom.pause();
        videoDom.srcObject.getTracks()[0].stop();

    }
}
buttonEnv.onclick = function (e) {
    if (buttonEnv.innerHTML == 'Open Environment Camera') {
        if (buttonUser.innerHTML == 'Stop User Camera') {
            buttonUser.innerHTML = 'Open User Camera';
            videoDom.pause();
            videoDom.srcObject.getTracks()[0].stop();

        }
        buttonEnv.innerHTML = 'Stop Environment Camera';
        getUserMedia('environment');
    }
    else {
        buttonEnv.innerHTML = 'Open Environment Camera';
        videoDom.pause();
        videoDom.srcObject.getTracks()[0].stop();
    }
}
async function inferImage() {
    if (MODE == 'det') {
        bboxes = await model.infer(imgRGBA, 0.0)
    }
    else if (MODE == 'cls') {
        probs = await model.infer(imgRGBA, -1)
    }
    else if (MODE == 'seg') {
        if (!(typeof seg == 'undefined')) {
            seg.delete()
        }
        seg = await model.infer(imgRGBA)
    }
}

function postProcess() {
    if (MODE == 'det') {
        let _bboxes = []
        for (let i = 0; i < bboxes.length; i++) {
            if (bboxes[i].score > drawThreshold) {
                _bboxes.push(bboxes[i])
            }
        }
        let imgShow = WebAI.drawBBoxes(imgRGBA, _bboxes)
        cv.imshow(canvasDom, imgShow)
        imgShow.delete()
    }
    else if (MODE == 'cls') {
        cv.imshow(canvasDom, imgRGBA)
        buildTable(probs.slice(0, topK))
    }
    else if (MODE == 'seg') {
        let imgShow = imgRGBA.clone()
        cv.addWeighted(imgRGBA, 1.0 - mixingFactor, seg.colorRGBA, mixingFactor, 0.0, imgShow)
        cv.imshow(canvasDom, imgShow)
        buildTable(seg.colorMap)
        imgShow.delete()
    }
}

imgDom.onload = async function () {
    videoDom.pause();
    buttonUser.innerHTML = 'Open User Camera';
    buttonEnv.innerHTML = 'Open Environment Camera';
    if (!(videoDom.srcObject == null)) {
        videoDom.srcObject.getTracks()[0].stop();
    }
    if (!(typeof imgRGBA == 'undefined')) {
        imgRGBA.delete()
    }
    imgRGBA = cv.imread(imgDom)
    await inferImage()
    postProcess()
}

function buildTable(data) {
    let tableDom = document.getElementById('tableDom')
    tableDiv.removeChild(tableDom)
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
            if (typeof tmp == "object") {
                td.setAttribute("style", `background: rgba(${tmp.toString()})`);
                tmp = '';
            }
            td.innerText = tmp;
            tr.appendChild(td);
        }
        table.appendChild(tr);
    });
    table.setAttribute("border", "1");
    table.setAttribute("id", "tableDom");
    tableDiv.appendChild(table)
}

async function restart() {
    if (!(typeof imgRGBA == 'undefined')) {
        await inferImage()
        postProcess()
    }
}

function inferVideo() {
    if (videoDom.paused == true) {
        return
    }
    if (!(typeof imgRGBA == 'undefined')) {
        imgRGBA.delete()
    }
    imgRGBA = new cv.Mat(videoDom.height, videoDom.width, cv.CV_8UC4)
    cap.read(imgRGBA)
    inferImage().then(function () {
        postProcess()
        setTimeout(inferVideo, 0)
    })

}