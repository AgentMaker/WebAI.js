import path from 'path';
import https from 'https';
import prettier from 'prettier';
import { Buffer } from 'buffer';
import { fileURLToPath } from 'url';
import { writeFile } from 'fs/promises';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const url = 'https://docs.opencv.org/5.x/opencv.js';
const wasmFilePath = path.join(__dirname, './public/opencv.wasm');
const jsOutputFilePath = path.join(__dirname, './src/opencv.mjs');

async function fetchFile(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => resolve(data));
            response.on('error', (err) => reject(err));
        }).on('error', (err) => reject(err));
    });
}

async function processFile(data) {
    const wasmDataUriMatch = data.match(/wasmBinaryFile\s*=\s*"data:application\/octet-stream;base64,([^"]+)"/);
    if (!wasmDataUriMatch) {
        throw new Error('WASM data URI not found in the file.');
    }

    const base64Data = wasmDataUriMatch[1];
    const binaryData = Buffer.from(base64Data, 'base64');
    await writeFile(wasmFilePath, binaryData);
    console.log('WASM file saved as opencv.wasm');

    let updatedData = data.replace(wasmDataUriMatch[0], 'wasmBinaryFile = "opencv.wasm"');

    const moduleWrapStart = "(function(root,factory){if(typeof define==='function'&&define.amd){define(function(){return(root.cv=factory());});}else if(typeof module==='object'&&module.exports){module.exports=factory();}else if(typeof window==='object'){root.cv=factory();}else if(typeof importScripts==='function'){root.cv=factory();}else{root.cv=factory();}}(this,function(){";
    const moduleWrapEnd = ";if(typeof exports==='object'&&typeof module==='object')\nmodule.exports=cv;else if(typeof define==='function'&&define['amd'])\ndefine([],function(){return cv;});else if(typeof exports==='object')\nexports[\"cv\"]=cv;if(typeof Module==='undefined')\nModule={};return cv(Module);}));";
    const moduleWarpSrc = "scriptDirectory=document.currentScript.src}";

    updatedData = updatedData.replace(moduleWrapStart, "");
    updatedData = updatedData.replace(moduleWrapEnd, "();");
    updatedData = updatedData.replace(moduleWarpSrc, "scriptDirectory=document.currentScript.src}else{scriptDirectory=import.meta.url}");
    updatedData = updatedData + '\nexport default cv;\n';

    const formattedData = await prettier.format(updatedData, { parser: 'babel' });
    await writeFile(jsOutputFilePath, formattedData);
    console.log('JavaScript file saved as opencv.mjs');
}

async function main() {
    try {
        const data = await fetchFile(url);
        await processFile(data);
    } catch (error) {
        console.error('Error processing file:', error);
    }
}

main();