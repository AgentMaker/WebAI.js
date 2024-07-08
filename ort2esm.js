import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { writeFile } from 'fs/promises';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const url = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@dev/dist/ort.all.mjs';
const jsOutputFilePath = path.join(__dirname, './src/ort.all.mjs');

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
    await writeFile(jsOutputFilePath, data);
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