import { RMBGModel } from './types'

export function createBriaaiModel(
  publicPath = 'https://unpkg.com/@rmbg/model-briaai@0.0.1/'
): RMBGModel {
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
  }
}

export function createModnetModel(
  publicPath = 'https://unpkg.com/@rmbg/model-modnet@0.0.1/'
): RMBGModel {
  return {
    name: 'modnet',
    files: ['modnet-1.onnx', 'modnet-2.onnx', 'modnet-3.onnx'],
    mime: 'application/octet-stream',
    publicPath,
    resolution: 512,
    size: 25888640
  }
}

export function createU2netpModel(
  publicPath = 'https://unpkg.com/@rmbg/model-u2netp@0.0.1/'
): RMBGModel {
  return {
    name: 'u2netp',
    files: ['u2netp.onnx'],
    mime: 'application/octet-stream',
    publicPath,
    resolution: 320,
    size: 4574861
  }
}