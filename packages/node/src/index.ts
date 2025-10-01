import { ImageInput, RMBGOptions } from './core/types'
import { handleInput, validateInput } from './io/input'
import { handleOutput } from './io/output'
import { rmbgCore } from './core/index'
import { ModelCache } from './config/cache'
import { DEFAULT_CONFIG, getConfigFromEnv } from './config/defaults'

/**
 * Remove background from image
 *
 * @param input - Image input (file path, URL, Buffer, or stream)
 * @param options - Configuration options
 * @returns Promise<Buffer> - Processed image buffer
 *
 * @example
 * ```typescript
 * // Simple usage
 * const output = await rmbg('input.jpg')
 *
 * // With custom model
 * import { createBriaaiModel } from 'rmbg/models'
 * const output = await rmbg('input.jpg', { model: createBriaaiModel() })
 *
 * // Save to file
 * await rmbg('input.jpg', { output: 'output.png' })
 *
 * // From URL
 * const output = await rmbg('https://example.com/image.jpg')
 *
 * // From Buffer
 * const inputBuffer = fs.readFileSync('input.jpg')
 * const output = await rmbg(inputBuffer)
 * ```
 */
export async function rmbg(
  input: ImageInput,
  options: RMBGOptions = {}
): Promise<Buffer> {
  try {
    // Get configuration from environment
    const envConfig = getConfigFromEnv()

    // Merge options with defaults
    const {
      model = DEFAULT_CONFIG.model,
      maxResolution = DEFAULT_CONFIG.maxResolution,
      output,
      onProgress,
      abortController,
      cacheDir = envConfig.cacheDir,
      enableCache = envConfig.enableCache
    } = options

    // Initialize cache
    const cache = enableCache ? new ModelCache(cacheDir) : undefined

    // Check if operation was aborted
    if (abortController?.signal.aborted) {
      throw new Error('Operation aborted')
    }

    // Handle input - normalize to Buffer
    const inputBuffer = await handleInput(input)

    // Validate input
    await validateInput(inputBuffer)

    // Check if operation was aborted
    if (abortController?.signal.aborted) {
      throw new Error('Operation aborted')
    }

    // Process image - remove background
    const resultBuffer = await rmbgCore(inputBuffer, model, {
      maxResolution,
      onProgress,
      cache,
      enableCache
    })

    // Check if operation was aborted
    if (abortController?.signal.aborted) {
      throw new Error('Operation aborted')
    }

    // Handle output - write to file/stream or return buffer
    return await handleOutput(resultBuffer, output)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Background removal failed: ${String(error)}`)
  }
}

// Re-export types and models
export type { ImageInput, ImageOutput, RMBGOptions, RMBGModel } from './core/types'
export {
  createU2netpModel,
  createModnetModel,
  createBriaaiModel
} from './core/models'
