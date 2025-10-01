import { promises as fs } from 'fs'
import { Writable } from 'stream'
import { resolve, normalize, dirname } from 'path'

/**
 * Handle output - write to file, stream, or return buffer
 */
export async function handleOutput(
  buffer: Buffer,
  output?: string | Writable
): Promise<Buffer> {
  // No output specified - return buffer
  if (!output) {
    return buffer
  }

  // Write to file
  if (typeof output === 'string') {
    await writeToFile(buffer, output)
    return buffer
  }

  // Write to stream
  if (output instanceof Writable) {
    await writeToStream(buffer, output)
    return buffer
  }

  throw new Error(`Invalid output type: ${typeof output}`)
}

/**
 * Validate output file path to prevent path traversal attacks
 */
function validateOutputPath(filePath: string, baseDir?: string): string {
  // Normalize path to resolve any ".." or "." segments
  const normalizedPath = normalize(resolve(filePath))

  // If baseDir is provided, ensure path is within it
  if (baseDir) {
    const normalizedBase = normalize(resolve(baseDir))
    if (!normalizedPath.startsWith(normalizedBase)) {
      throw new Error(
        `Invalid file path: Path "${filePath}" is outside allowed directory "${baseDir}"`
      )
    }
  }

  // Block writing to sensitive system directories
  const sensitivePatterns = [
    '/etc/',
    '/proc/',
    '/sys/',
    '/dev/',
    '/boot/',
    '/bin/',
    '/sbin/',
    '/usr/bin/',
    '/usr/sbin/',
    'C:\\Windows\\',
    'C:\\Program Files\\',
    'C:\\Program Files (x86)\\'
  ]

  for (const pattern of sensitivePatterns) {
    if (normalizedPath.includes(pattern)) {
      throw new Error(`Access denied: Cannot write to system directory "${pattern}"`)
    }
  }

  return normalizedPath
}

/**
 * Write buffer to file with path validation
 */
async function writeToFile(buffer: Buffer, filePath: string): Promise<void> {
  try {
    // Validate path before writing
    const validatedPath = validateOutputPath(filePath)

    // Ensure directory exists
    const dir = dirname(validatedPath)
    await fs.mkdir(dir, { recursive: true })

    // Check if we have write permission
    try {
      await fs.access(dir, fs.constants.W_OK)
    } catch {
      throw new Error(`No write permission for directory "${dir}"`)
    }

    await fs.writeFile(validatedPath, buffer)
  } catch (error) {
    throw new Error(
      `Failed to write file "${filePath}": ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Write buffer to stream with proper error handling
 */
async function writeToStream(buffer: Buffer, stream: Writable): Promise<void> {
  return new Promise((resolve, reject) => {
    let resolved = false

    // Handle stream errors
    const onError = (error: Error) => {
      if (!resolved) {
        resolved = true
        reject(new Error(`Failed to write to stream: ${error.message}`))
      }
    }

    // Handle stream finish
    const onFinish = () => {
      if (!resolved) {
        resolved = true
        cleanup()
        resolve()
      }
    }

    // Cleanup listeners
    const cleanup = () => {
      stream.removeListener('error', onError)
      stream.removeListener('finish', onFinish)
    }

    // Attach listeners
    stream.once('error', onError)
    stream.once('finish', onFinish)

    // Write data
    const canContinue = stream.write(buffer)
    if (!canContinue) {
      // Wait for drain event if buffer is full
      stream.once('drain', () => {
        stream.end()
      })
    } else {
      stream.end()
    }
  })
}
