"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createU2netpModel = exports.createModnetModel = exports.createBriaaiModel = void 0;
function createBriaaiModel(publicPath = 'https://unpkg.com/@rmbg/model-briaai@0.0.1/') {
    return {
        name: 'briaai',
        files: [
            'briaai-1.onnx',
            'briaai-2.onnx',
            'briaai-3.onnx',
            'briaai-4.onnx',
            'briaai-5.onnx'
        ],
        mime: 'application/octet-stream',
        publicPath,
        resolution: 1024,
        size: 44403226
    };
}
exports.createBriaaiModel = createBriaaiModel;
function createModnetModel(publicPath = 'https://unpkg.com/@rmbg/model-modnet@0.0.1/') {
    return {
        name: 'modnet',
        files: ['modnet-1.onnx', 'modnet-2.onnx', 'modnet-3.onnx'],
        mime: 'application/octet-stream',
        publicPath,
        resolution: 512,
        size: 25888640
    };
}
exports.createModnetModel = createModnetModel;
function createU2netpModel(publicPath = 'https://unpkg.com/@rmbg/model-u2netp@0.0.1/') {
    return {
        name: 'u2netp',
        files: ['u2netp.onnx'],
        mime: 'application/octet-stream',
        publicPath,
        resolution: 320,
        size: 4574861
    };
}
exports.createU2netpModel = createU2netpModel;
//# sourceMappingURL=models.js.map