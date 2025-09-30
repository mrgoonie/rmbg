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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rmbg = void 0;
const ort = __importStar(require("onnxruntime-node"));
const sharp_1 = __importDefault(require("sharp"));
const types_1 = require("./types");
const network_1 = require("./network");
const utils_1 = require("./utils");
async function rmbg(inputPath, { model, maxResolution = types_1.defaultMaxResolution, onProgress }) {
    try {
        let progress = 0;
        // Load model
        const modelData = await (0, network_1.loadModel)(model, {
            onProgress(value) {
                onProgress?.(progress + (1 / 2) * value, progress + (1 / 2) * value, 0);
            }
        });
        const session = await ort.InferenceSession.create(modelData, {
            executionProviders: ['cpu'],
            graphOptimizationLevel: 'all',
            enableCpuMemArena: true
        }).catch((e) => {
            throw new Error(`Failed to create session: ${e.message}`);
        });
        progress += 1 / 2;
        // Process image
        const imageBuffer = await (0, sharp_1.default)(inputPath).raw().ensureAlpha().toBuffer({
            resolveWithObject: true
        });
        const { data, info } = imageBuffer;
        const { width, height } = info;
        // Resize to model resolution
        const resizedImage = await (0, sharp_1.default)(data, {
            raw: { width, height, channels: 4 }
        })
            .resize(model.resolution, model.resolution, {
            fit: 'fill',
            kernel: 'lanczos3'
        })
            .raw()
            .toBuffer();
        // Convert to Float32Array
        const tensorImageData = (0, utils_1.imageDataToFloat32Array)(new Uint8ClampedArray(resizedImage), model.resolution, model.resolution);
        // Run inference
        const outputData = await session.run({
            [session.inputNames[0]]: new ort.Tensor('float32', tensorImageData, [
                1,
                3,
                model.resolution,
                model.resolution
            ])
        });
        const { outputNames } = session;
        session.release().catch(() => {
            // ignore
        });
        // Get alpha mask
        const output = outputData[outputNames[0]];
        const maskData = output.data;
        // Resize mask back to original size
        const maskBuffer = Buffer.from(maskData.map((v) => Math.round(v * 255)));
        const resizedMask = await (0, sharp_1.default)(maskBuffer, {
            raw: {
                width: model.resolution,
                height: model.resolution,
                channels: 1
            }
        })
            .resize(width, height, {
            fit: 'fill',
            kernel: 'lanczos3'
        })
            .raw()
            .toBuffer();
        // Apply mask to original image
        const outputBuffer = Buffer.from(data);
        for (let i = 0; i < width * height; i++) {
            const alpha = resizedMask[i];
            outputBuffer[i * 4 + 3] = alpha;
            if (alpha === 0) {
                outputBuffer[i * 4] = 0;
                outputBuffer[i * 4 + 1] = 0;
                outputBuffer[i * 4 + 2] = 0;
            }
        }
        // Apply max resolution limit
        const [finalWidth, finalHeight] = (0, utils_1.calculateProportionalSize)(width, height, maxResolution, maxResolution);
        // Convert to PNG
        let result = (0, sharp_1.default)(outputBuffer, {
            raw: { width, height, channels: 4 }
        });
        if (finalWidth !== width || finalHeight !== height) {
            result = result.resize(finalWidth, finalHeight);
        }
        onProgress?.(1, 1, 1);
        return result.png().toBuffer();
    }
    catch (error) {
        throw new Error(`Background removal failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
exports.rmbg = rmbg;
__exportStar(require("./types"), exports);
__exportStar(require("./models"), exports);
//# sourceMappingURL=index.js.map