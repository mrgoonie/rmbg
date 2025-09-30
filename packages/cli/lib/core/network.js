"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadModel = void 0;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
async function downloadFile(url, onProgress) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                if (response.headers.location) {
                    return downloadFile(response.headers.location, onProgress)
                        .then(resolve)
                        .catch(reject);
                }
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            const chunks = [];
            let receivedLength = 0;
            response.on('data', (chunk) => {
                chunks.push(chunk);
                receivedLength += chunk.length;
                onProgress?.(receivedLength);
            });
            response.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
            response.on('error', reject);
        }).on('error', reject);
    });
}
async function loadModel(model, options) {
    const { onProgress } = options ?? {};
    const loaded = Array(model.files.length);
    const chunks = await Promise.all(model.files.map(async (file, index) => {
        loaded[index] = 0;
        const url = model.publicPath + file;
        return downloadFile(url, (length) => {
            loaded[index] = length;
            onProgress?.(loaded.reduce((acc, item) => acc + item, 0) / model.size);
        });
    }));
    const data = Buffer.concat(chunks);
    if (data.length !== model.size) {
        throw new Error(`Failed to fetch ${model.name} with size ${model.size} but got ${data.length}`);
    }
    return data;
}
exports.loadModel = loadModel;
//# sourceMappingURL=network.js.map