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
const baseURL = '../pretrained_models/det';

var cap = null
var model = null
var imgRGBA = null
var drawThreshold = 0.5
var bboxes = null

function bboxesThreshold(bboxes, drawThreshold){
    let _bboxes = []
    for (let i=0; i<bboxes.length;i++){
        if (bboxes[i].score > drawThreshold){
            _bboxes.push(bboxes[i])
        }
    }
    return _bboxes
}

inputRange.onchange = async function (e) {
    inputNum.value = inputRange.value
    drawThreshold = inputRange.value
    if (imgRGBA != null) {
        let imgShow = imgRGBA.clone();
        let _bboxes = bboxesThreshold(bboxes, drawThreshold);
        for (let i = 0; i < _bboxes.length; i++) {
            let bbox = _bboxes[i];
            cv.rectangle(imgShow, new cv.Point(bbox.x1, bbox.y1), new cv.Point(bbox.x2, bbox.y2), bbox.color, 2.0);
            cv.putText(imgShow, bbox.label, new cv.Point(bbox.x1, bbox.y2), cv.FONT_HERSHEY_COMPLEX, 0.8, bbox.color);
        }
        cv.imshow(canvasDom, imgShow);
        imgShow.delete()
    }
}
inputNum.onchange = async function (e) {
    inputRange.value = inputNum.value
    drawThreshold = inputNum.value
    if (imgRGBA != null) {
        let imgShow = imgRGBA.clone();
        let _bboxes = bboxesThreshold(bboxes, drawThreshold);
        for (let i = 0; i < _bboxes.length; i++) {
            let bbox = _bboxes[i];
            cv.rectangle(imgShow, new cv.Point(bbox.x1, bbox.y1), new cv.Point(bbox.x2, bbox.y2), bbox.color, 2.0);
            cv.putText(imgShow, bbox.label, new cv.Point(bbox.x1, bbox.y2), cv.FONT_HERSHEY_COMPLEX, 0.8, bbox.color);
        }
        cv.imshow(canvasDom, imgShow);
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
    if (cap==null){
        cap = new cv.VideoCapture(videoCapture);
    }
    if (imgRGBA != null) {
        imgRGBA.delete()
    }
    imgRGBA = new cv.Mat(h, w, cv.CV_8UC4);
    setTimeout(processVideo, 0);
}

function errorCap(error) {
    console.log(`访问用户媒体设备失败${error.name}, ${error.message}`);
}

function getModelURL() {
    let modelName = selectModel.options[selectModel.selectedIndex].value;
    let modelDet = `${baseURL}/${modelName}/model.onnx`;
    let inferConfig = `${baseURL}/${modelName}/configs.json`;
    return [modelDet, inferConfig]
}
function loadImage(e) {
    if (e.target.files[0]) {
        imageDom.src = URL.createObjectURL(e.target.files[0]);
    }
};
async function inferDet(e) {
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
    }
    imgRGBA = cv.imread(imageDom);
    bboxes = await model.infer(imgRGBA, -1);
    let imgShow = imgRGBA.clone();
    let _bboxes = bboxesThreshold(bboxes, drawThreshold);
    for (let i = 0; i < _bboxes.length; i++) {
        let bbox = _bboxes[i];
        cv.rectangle(imgShow, new cv.Point(bbox.x1, bbox.y1), new cv.Point(bbox.x2, bbox.y2), bbox.color, 2.0);
        cv.putText(imgShow, bbox.label, new cv.Point(bbox.x1, bbox.y2), cv.FONT_HERSHEY_COMPLEX, 0.8, bbox.color);
    }
    cv.imshow(canvasDom, imgShow)
    imgShow.delete()
};
async function loadModel(e) {
    let [modelDet, inferConfig] = getModelURL();
    model = await WebAI.Det.create(
        modelDet,
        inferConfig
    )
    inputDom.disabled = false;
    buttonUser.disabled = false;
    buttonEnv.disabled = false;
    document.getElementById('statusModel').innerHTML = 'Model is ready.';

};
// 绑定函数
inputDom.onchange = loadImage;
imageDom.onload = inferDet;
onload = loadModel;
selectModel.onchange = async function (e) {
    document.getElementById('statusModel').innerHTML = 'Model is loading...';
    let [modelDet, inferConfig] = getModelURL();
    model = await WebAI.Det.create(
        modelDet,
        inferConfig
    )
    inputDom.disabled = false;
    buttonUser.disabled = false;
    buttonEnv.disabled = false;
    if (imgRGBA != null) {
        bboxes = await model.infer(imgRGBA, -1);
        let imgShow = imgRGBA.clone();
        let _bboxes = bboxesThreshold(bboxes, drawThreshold);
        for (let i = 0; i < _bboxes.length; i++) {
            let bbox = _bboxes[i];
            cv.rectangle(imgShow, new cv.Point(bbox.x1, bbox.y1), new cv.Point(bbox.x2, bbox.y2), bbox.color, 2.0);
            cv.putText(imgShow, bbox.label, new cv.Point(bbox.x1, bbox.y2), cv.FONT_HERSHEY_COMPLEX, 0.8, bbox.color);
        }
        cv.imshow(canvasDom, imgShow);
        imgShow.delete()
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
        let imgShow = imgRGBA.clone();
        model.infer(imgRGBA, -1).then(function (bboxes) {
            let _bboxes = bboxesThreshold(bboxes, drawThreshold);
            for (let i = 0; i < _bboxes.length; i++) {
                let bbox = _bboxes[i];
                cv.rectangle(imgShow, new cv.Point(bbox.x1, bbox.y1), new cv.Point(bbox.x2, bbox.y2), bbox.color, 2.0);
                cv.putText(imgShow, bbox.label, new cv.Point(bbox.x1, bbox.y2), cv.FONT_HERSHEY_COMPLEX, 0.8, bbox.color);
            }
            cv.imshow(canvasDom, imgShow);
            imgShow.delete()
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