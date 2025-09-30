"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageDataToFloat32Array = exports.calculateProportionalSize = void 0;
function calculateProportionalSize(originalWidth, originalHeight, maxWidth, maxHeight) {
    if (originalWidth > maxWidth || originalHeight > maxHeight) {
        const widthRatio = maxWidth / originalWidth;
        const heightRatio = maxHeight / originalHeight;
        const scalingFactor = Math.min(widthRatio, heightRatio);
        const newWidth = Math.floor(originalWidth * scalingFactor);
        const newHeight = Math.floor(originalHeight * scalingFactor);
        return [newWidth, newHeight];
    }
    return [originalWidth, originalHeight];
}
exports.calculateProportionalSize = calculateProportionalSize;
function imageDataToFloat32Array(data, width, height, mean = [128, 128, 128], std = [256, 256, 256]) {
    const stride = width * height;
    const float32Data = new Float32Array(3 * stride);
    for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
        float32Data[j] = (data[i] - mean[0]) / std[0];
        float32Data[j + stride] = (data[i + 1] - mean[1]) / std[1];
        float32Data[j + stride + stride] = (data[i + 2] - mean[2]) / std[2];
    }
    return float32Data;
}
exports.imageDataToFloat32Array = imageDataToFloat32Array;
//# sourceMappingURL=utils.js.map