import * as ort from 'onnxruntime-node'
import sharp from 'sharp'
import { RMBGOptions, defaultMaxResolution } from './types.js'
import { loadModel } from './network.js'
import { calculateProportionalSize, imageDataToFloat32Array } from './utils.js'

export async function rmbg(
  inputBuffer: Buffer,
  { model, maxResolution = defaultMaxResolution, onProgress }: RMBGOptions
): Promise<Buffer> {
  try {
    let progress = 0

    // Load model
    const modelData = await loadModel(model, {
      onProgress(value) {
        onProgress?.(progress + (1 / 2) * value, progress + (1 / 2) * value, 0)
      }
    })

    const session = await ort.InferenceSession.create(modelData, {
      executionProviders: ['cpu'],
      graphOptimizationLevel: 'all',
      enableCpuMemArena: true
    }).catch((e: Error) => {
      throw new Error(`Failed to create session: ${e.message}`)
    })

    progress += 1 / 2

    // Process image
    const imageBuffer = await sharp(inputBuffer).raw().ensureAlpha().toBuffer({
      resolveWithObject: true
    })

    const { data, info } = imageBuffer
    const { width, height } = info

    // Resize to model resolution
    const resizedImage = await sharp(data, {
      raw: { width, height, channels: 4 }
    })
      .resize(model.resolution, model.resolution, {
        fit: 'fill',
        kernel: 'lanczos3'
      })
      .raw()
      .toBuffer()

    // Convert to Float32Array
    const tensorImageData = imageDataToFloat32Array(
      new Uint8ClampedArray(resizedImage),
      model.resolution,
      model.resolution
    )

    // Run inference
    const outputData = await session.run({
      [session.inputNames[0]]: new ort.Tensor('float32', tensorImageData, [
        1,
        3,
        model.resolution,
        model.resolution
      ])
    })

    const { outputNames } = session
    session.release().catch(() => {
      // ignore
    })

    // Get alpha mask
    const output: ort.Tensor = outputData[outputNames[0]]
    const maskData = output.data as Float32Array

    // Resize mask back to original size
    const maskBuffer = Buffer.from(
      maskData.map((v) => Math.round(v * 255))
    )

    const resizedMask = await sharp(maskBuffer, {
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
      .toBuffer()

    // Apply mask to original image
    const outputBuffer = Buffer.from(data)
    for (let i = 0; i < width * height; i++) {
      const alpha = resizedMask[i]
      outputBuffer[i * 4 + 3] = alpha

      if (alpha === 0) {
        outputBuffer[i * 4] = 0
        outputBuffer[i * 4 + 1] = 0
        outputBuffer[i * 4 + 2] = 0
      }
    }

    // Apply max resolution limit
    const [finalWidth, finalHeight] = calculateProportionalSize(
      width,
      height,
      maxResolution,
      maxResolution
    )

    // Convert to PNG
    let result = sharp(outputBuffer, {
      raw: { width, height, channels: 4 }
    })

    if (finalWidth !== width || finalHeight !== height) {
      result = result.resize(finalWidth, finalHeight)
    }

    onProgress?.(1, 1, 1)

    return result.png().toBuffer()
  } catch (error) {
    throw new Error(
      `Background removal failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export * from './types.js'
export * from './models.js'