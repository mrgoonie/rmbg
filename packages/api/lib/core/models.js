export function createBriaaiModel(publicPath = 'https://unpkg.com/@rmbg/model-briaai@0.0.1/') {
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
export function createModnetModel(publicPath = 'https://unpkg.com/@rmbg/model-modnet@0.0.1/') {
    return {
        name: 'modnet',
        files: ['modnet-1.onnx', 'modnet-2.onnx', 'modnet-3.onnx'],
        mime: 'application/octet-stream',
        publicPath,
        resolution: 512,
        size: 25888640
    };
}
export function createU2netpModel(publicPath = 'https://unpkg.com/@rmbg/model-u2netp@0.0.1/') {
    return {
        name: 'u2netp',
        files: ['u2netp.onnx'],
        mime: 'application/octet-stream',
        publicPath,
        resolution: 320,
        size: 4574861
    };
}
export function createIsnetAnimeModel(publicPath = 'https://unpkg.com/@rmbg/model-isnet-anime@0.0.1/') {
    return {
        name: 'isnet-anime',
        files: ['isnet-anime.onnx'],
        mime: 'application/octet-stream',
        publicPath,
        resolution: 1024,
        size: 168746172
    };
}
export function createSiluetaModel(publicPath = 'https://unpkg.com/@rmbg/model-silueta@0.0.1/') {
    return {
        name: 'silueta',
        files: ['silueta.onnx'],
        mime: 'application/octet-stream',
        publicPath,
        resolution: 320,
        size: 43808301
    };
}
export function createU2netClothModel(publicPath = 'https://unpkg.com/@rmbg/model-u2net-cloth@0.0.1/') {
    return {
        name: 'u2net-cloth',
        files: ['u2net-cloth.onnx'],
        mime: 'application/octet-stream',
        publicPath,
        resolution: 768,
        size: 170659996
    };
}
//# sourceMappingURL=models.js.map