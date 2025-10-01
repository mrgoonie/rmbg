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

    // Process image - EXACTLY like browser implementation
    // Step 1: Get original image data
    const imageBuffer = await sharp(inputBuffer).raw().ensureAlpha().toBuffer({
      resolveWithObject: true
    })

    const { data: originalData, info } = imageBuffer
    const { width: originalWidth, height: originalHeight } = info

    // Step 2: Resize image to model resolution for inference (like browser's imageDataResize)
    const tensorImageBuffer = await sharp(originalData, {
      raw: { width: originalWidth, height: originalHeight, channels: 4 }
    })
      .resize(model.resolution, model.resolution, {
        fit: 'fill',  // Browser uses fill to match exact model input size
        kernel: 'lanczos3'
      })
      .raw()
      .toBuffer({ resolveWithObject: true })

    const tensorImageData = new Uint8ClampedArray(tensorImageBuffer.data)

    // Step 3: Convert to Float32Array for model input
    const inputTensor = imageDataToFloat32Array(
      tensorImageData,
      model.resolution,
      model.resolution
    )

    // Step 4: Run inference
    const outputData = await session.run({
      [session.inputNames[0]]: new ort.Tensor('float32', inputTensor, [
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

    // Step 5: Get alpha mask from model output
    const output: ort.Tensor = outputData[outputNames[0]]
    const maskData = output.data as Float32Array

    // Step 6: Apply mask to tensorImage (like browser lines 149-154)
    const stride = model.resolution * model.resolution
    for (let i = 0; i < stride; i++) {
      const alpha = maskData[i]
      tensorImageData[i * 4 + 3] = Math.round(alpha * 255)
    }

    // Step 7: Resize tensorImage back to original dimensions (like browser lines 155-159)
    const resizedTensorImage = await sharp(Buffer.from(tensorImageData), {
      raw: { width: model.resolution, height: model.resolution, channels: 4 }
    })
      .resize(originalWidth, originalHeight, {
        fit: 'fill',
        kernel: 'lanczos3'
      })
      .raw()
      .toBuffer()

    // Step 8: Apply resized mask to original image (like browser lines 160-168)
    const outputBuffer = Buffer.from(originalData)
    for (let i = 0; i < originalWidth * originalHeight; i++) {
      const alpha = resizedTensorImage[i * 4 + 3]
      outputBuffer[i * 4 + 3] = alpha
      
      // Zero out RGB if alpha is 0 (like browser)
      if (alpha === 0) {
        outputBuffer[i * 4] = 0
        outputBuffer[i * 4 + 1] = 0
        outputBuffer[i * 4 + 2] = 0
      }
    }

    // Apply max resolution limit (like browser lines 169-177)
    const [finalWidth, finalHeight] = calculateProportionalSize(
      originalWidth,
      originalHeight,
      maxResolution,
      maxResolution
    )

    // Convert to PNG
    let result = sharp(outputBuffer, {
      raw: { width: originalWidth, height: originalHeight, channels: 4 }
    })

    if (finalWidth !== originalWidth || finalHeight !== originalHeight) {
      result = result.resize(finalWidth, finalHeight, {
        kernel: 'lanczos3'
      })
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