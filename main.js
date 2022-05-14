import { WebAI, cv, ort } from '.'
import YAML from 'yamljs'

ort.env.wasm.proxy = true

// 获取 Doms
const aDet = document.getElementById('aDet')
const aCls = document.getElementById('aCls')
const aSeg = document.getElementById('aSeg')
const aConvertor = document.getElementById('aConvertor')

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
const convertor = document.getElementById('convertor')
const predictor = document.getElementById('predictor')

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
        predictor.style['display'] = ''
        convertor.style['display'] = 'none'
        tableDiv.style['display'] = 'none'
        modelName = 'blazeface_1000e'
        await loadModel('det')
        MODE = 'det'
        await restart()
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
        predictor.style['display'] = ''
        convertor.style['display'] = 'none'
        tableDiv.style['display'] = ''
        modelName = 'efficientnetb0_imagenet'
        await loadModel('cls')
        MODE = 'cls'
        await restart()
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
        predictor.style['display'] = ''
        convertor.style['display'] = 'none'
        tableDiv.style['display'] = ''
        modelName = 'ppseg_lite_portrait_398x224'
        await loadModel('seg')
        MODE = 'seg'
        await restart()
    }
    else if (e.target.id == 'aConvertor') {
        predictor.style['display'] = 'none'
        convertor.style['display'] = ''
    }
}

aDet.onclick = (e) => switchType(e)
aCls.onclick = (e) => switchType(e)
aSeg.onclick = (e) => switchType(e)
aConvertor.onclick = (e) => switchType(e)

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

    let modelURL = `${modelDir}/${MODE}/${modelName}/model.onnx.json`
    let modelConfig = `${modelDir}/${MODE}/${modelName}/configs.json`
    if (MODE == 'det') {
        model = new WebAI.Det(modelURL, modelConfig)
    }
    else if (MODE == 'cls') {
        model = new WebAI.Cls(modelURL, modelConfig)
    }
    else if (MODE == 'seg') {
        model = new WebAI.Seg(modelURL, modelConfig)
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

let form = layui.form
let configs
layui.use('form', function () {
    var form = layui.form;
    let layer = layui.layer
    //监听提交
    form.on('submit(formDemo)', function (data) {
        let datas = data.field;

        configs = {
            "Preprocess": [
                {
                    'type': 'Decode',
                    'mode': datas.mode,
                },
            ],
            "label_list": []
        }
        if (datas.resize) {
            configs.Preprocess.push({
                'type': 'Resize',
                'interp': datas.interp * 1,
                'keep_ratio': datas.keep_ratio == 'true',
                'limit_max': datas.limit_max == 'true',
                'target_size': [datas['target_size.h'] * 1, datas['target_size.w'] * 1]
            })
        }
        if (datas.crop) {
            configs.Preprocess.push({
                'type': 'Crop',
                'crop_size': [datas['crop_size.h'] * 1, datas['crop_size.w'] * 1]
            })
        }
        configs.Preprocess.push({
            'type': 'Normalize',
            'is_scale': datas.is_scale == 'true',
            'mean': [datas['mean.R'] * 1.0, datas['mean.G'] * 1.0, datas['mean.B'] * 1.0],
            'std': [datas['std.R'] * 1.0, datas['std.G'] * 1.0, datas['std.B'] * 1.0]
        })
        if (datas.permute) {
            configs.Preprocess.push({
                'type': 'Permute'
            })
        }
        if (datas.label_list == '') {
            layer.prompt({
                title: 'label list is empty, please input the number of the labels',
            }, function (value, index, elem) {
                layer.close(index);
                for (let i = 0; i < value * 1; i++) {
                    configs.label_list.push(i.toString())
                }
                var Link = document.createElement('a');
                Link.download = "configs.json";
                Link.style.display = 'none';
                var blob = new Blob([JSON.stringify(configs, null, 4)]);
                Link.href = URL.createObjectURL(blob);
                document.body.appendChild(Link);
                Link.click();
                document.body.removeChild(Link);
            })
        }
        else {
            let label_list = datas.label_list.split('\n')
            for (let i = 0; i < label_list.length; i++) {
                if (label_list[i] != '') {
                    configs.label_list.push(label_list[i])
                }
            }
            var Link = document.createElement('a');
            Link.download = "configs.json";
            Link.style.display = 'none';
            var blob = new Blob([JSON.stringify(configs, null, 4)]);
            Link.href = URL.createObjectURL(blob);
            document.body.appendChild(Link);
            Link.click();
            document.body.removeChild(Link);
        }
        return false;
    });

    form.verify({
        mean_std: function (value) {
            let data = form.val('configs');
            if (data.is_scale) {
                if (value < 0.0 || value > 1.0) {
                    return 'value must be 0 - 1';
                }
            } else {
                if (value < 0 || value > 255) {
                    return 'value must be 0 - 255';
                }
            }
        }
        , size: function (value) {
            if (value <= 0) {
                return 'value must be > 0';
            }
        }
    });

});
const buttonLoad = document.getElementById('buttonLoad')
const inputLoad = document.getElementById('inputLoad')
const buttonDownload = document.getElementById('buttonDownload')
function loadText(textURL) {
    let xhr = new XMLHttpRequest();
    xhr.open('get', textURL, false);
    xhr.send(null);
    return xhr.responseText
}

function convertFromWebAI(configs) {
    configs
}

buttonLoad.onclick = function () {
    inputLoad.click()
}

inputLoad.onchange = function (e) {
    if (e.target.files[0].name.endsWith('.json')) {
        configs = JSON.parse(loadText(URL.createObjectURL(e.target.files[0])))
        let datas = {
            resize: false,
            crop: false,
            is_scale: false,
            permute: false
        }
        for (let i = 0; i < configs.Preprocess.length; i++) {
            let op = configs.Preprocess[i]
            let type = op.type
            if (type == 'Decode') {
                datas['mode'] = op.mode
            }
            else if (type == 'Resize') {
                datas.resize = true
                datas.interp = op.interp
                datas.keep_ratio = op.keep_ratio
                datas.limit_max = op.limit_max
                datas['target_size.h'] = op.target_size[0]
                datas['target_size.w'] = op.target_size[1]
            }
            else if (type == 'Crop') {
                datas.crop = true
                datas['crop_size.h'] = op.crop_size[0]
                datas['crop_size.w'] = op.crop_size[1]
            }
            else if (type == 'Normalize') {
                datas.is_scale = op.is_scale
                datas['mean.R'] = op.mean[0]
                datas['mean.G'] = op.mean[1]
                datas['mean.B'] = op.mean[2]
                datas['std.R'] = op.std[0]
                datas['std.G'] = op.std[1]
                datas['std.B'] = op.std[2]
            }
            else if (type == 'Permute') {
                datas.permute = true
            }
        }
        datas.label_list = configs.label_list.join('\n')
        form.val('configs', datas)
    }
    else if (e.target.files[0].name.endsWith('.yml') || e.target.files[0].name.endsWith('.yaml')) {
        configs = YAML.load(URL.createObjectURL(e.target.files[0]))

        if (configs.hasOwnProperty('Deploy')) {
            let datas = {
                resize: false,
                crop: false,
                is_scale: true,
                permute: true
            }
            let ops = configs.Deploy.transforms
            ops.forEach(op => {
                let type = op.type
                if (type == 'Normalize') {
                    if (op.hasOwnProperty('mean')) {
                        datas['mean.R'] = op.mean[0]
                        datas['mean.G'] = op.mean[1]
                        datas['mean.B'] = op.mean[2]
                    }
                    else {
                        datas['mean.R'] = 0.5
                        datas['mean.G'] = 0.5
                        datas['mean.B'] = 0.5
                    }
                    if (op.hasOwnProperty('std')) {
                        datas['std.R'] = op.std[0]
                        datas['std.G'] = op.std[1]
                        datas['std.B'] = op.std[2]
                    }
                    else {
                        datas['std.R'] = 0.5
                        datas['std.G'] = 0.5
                        datas['std.B'] = 0.5
                    }
                }
            })
            form.val('configs', datas)
        }
        else if (configs.hasOwnProperty('Global')) {
            let ops = configs.PreProcess.transform_ops
            let datas = {
                resize: false,
                crop: false,
                is_scale: false,
                permute: false
            }
            ops.forEach(op => {
                if (op.hasOwnProperty('ResizeImage')) {
                    if (op.ResizeImage.hasOwnProperty('resize_short')) {
                        datas.keep_ratio = true
                        datas.limit_max = false
                        datas.resize = true
                        datas.interp = 1
                        datas['target_size.h'] = op.ResizeImage.resize_short
                        datas['target_size.w'] = op.ResizeImage.resize_short
                    }
                }
                else if (op.hasOwnProperty('CropImage')) {
                    if (op.CropImage.hasOwnProperty('size')) {
                        datas.crop = true
                        datas['crop_size.h'] = op.CropImage.size
                        datas['crop_size.w'] = op.CropImage.size
                    }
                }
                else if (op.hasOwnProperty('NormalizeImage')) {
                    if (op.NormalizeImage.hasOwnProperty('scale')) {
                        datas.is_scale = true
                    }
                    if (op.NormalizeImage.hasOwnProperty('mean')) {
                        datas['mean.R'] = op.NormalizeImage.mean[0]
                        datas['mean.G'] = op.NormalizeImage.mean[1]
                        datas['mean.B'] = op.NormalizeImage.mean[2]
                    }
                    if (op.NormalizeImage.hasOwnProperty('std')) {
                        datas['std.R'] = op.NormalizeImage.std[0]
                        datas['std.G'] = op.NormalizeImage.std[1]
                        datas['std.B'] = op.NormalizeImage.std[2]
                    }
                }
                else if (op.hasOwnProperty('ToCHWImage')) {
                    datas.permute = true
                }

            });
            form.val('configs', datas)
        }
        else if (configs.hasOwnProperty('mode')) {
            let ops = configs.Preprocess
            let datas = {
                resize: false,
                crop: false,
                is_scale: false,
                permute: false
            }
            ops.forEach(op => {
                let type = op.type
                if (type == 'Resize') {
                    datas.resize = true
                    datas.interp = op.interp
                    datas.keep_ratio = op.keep_ratio
                    datas.limit_max = op.keep_ratio
                    datas['target_size.h'] = op.target_size[0]
                    datas['target_size.w'] = op.target_size[1]
                }
                else if (type == 'NormalizeImage') {

                    datas.is_scale = op.is_scale
                    datas['mean.R'] = op.mean[0]
                    datas['mean.G'] = op.mean[1]
                    datas['mean.B'] = op.mean[2]
                    datas['std.R'] = op.std[0]
                    datas['std.G'] = op.std[1]
                    datas['std.B'] = op.std[2]
                }
                else if (type == 'Permute') {
                    datas.permute = true
                }
            })
            datas.label_list = configs.label_list.join('\n')
            form.val('configs', datas)
        }
    }
    inputLoad.value = null

}
