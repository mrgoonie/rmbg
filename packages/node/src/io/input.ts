import { createReadStream, promises as fs } from 'fs'
import { Readable } from 'stream'
import * as http from 'http'
import * as https from 'https'
import { resolve, normalize } from 'path'
import sharp from 'sharp'
import { ImageInput } from '../core/types'

// Blocked hosts for SSRF prevention
const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '169.254.169.254', // AWS metadata
  '::1',
  'metadata.google.internal' // GCP metadata
]

// Allowed content types for images
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg'
]

/**
 * Normalize various input formats to Buffer
 */
export async function handleInput(input: ImageInput): Promise<Buffer> {
  // Buffer input - passthrough
  if (Buffer.isBuffer(input)) {
    return input
  }

  // Stream input - convert to buffer
  if (input instanceof Readable) {
    return streamToBuffer(input)
  }

  // String input - could be file path or URL
  if (typeof input === 'string') {
    // Check if it's a URL
    if (input.startsWith('http://') || input.startsWith('https://')) {
      return downloadFromUrl(input)
    }

    // Otherwise treat as file path
    return readFromFile(input)
  }

  throw new Error(`Invalid input type: ${typeof input}`)
}

/**
 * Validate file path to prevent path traversal attacks
 */
function validateFilePath(filePath: string, baseDir?: string): string {
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

  // Block access to sensitive system files
  const sensitivePatterns = [
    '/etc/',
    '/proc/',
    '/sys/',
    '/dev/',
    '/boot/',
    'C:\\Windows\\',
    'C:\\Program Files\\'
  ]

  for (const pattern of sensitivePatterns) {
    if (normalizedPath.includes(pattern)) {
      throw new Error(`Access denied: Cannot read from system directory "${pattern}"`)
    }
  }

  return normalizedPath
}

/**
 * Read file from filesystem with path validation
 */
async function readFromFile(filePath: string): Promise<Buffer> {
  try {
    // Validate path before reading
    const validatedPath = validateFilePath(filePath)

    // Check if file exists and is readable
    await fs.access(validatedPath, fs.constants.R_OK)

    return await fs.readFile(validatedPath)
  } catch (error) {
    throw new Error(
      `Failed to read file "${filePath}": ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Validate URL to prevent SSRF attacks
 */
function validateUrl(urlString: string): URL {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(urlString)
  } catch {
    throw new Error(`Invalid URL: "${urlString}"`)
  }

  // Only allow HTTP and HTTPS protocols
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error(
      `Invalid URL protocol: "${parsedUrl.protocol}". Only HTTP and HTTPS are allowed.`
    )
  }

  // Check if hostname is blocked
  const hostname = parsedUrl.hostname.toLowerCase()

  // Check against blocked hosts
  if (BLOCKED_HOSTS.includes(hostname)) {
    throw new Error(`Access denied: Cannot download from blocked host "${hostname}"`)
  }

  // Block private IP ranges
  if (
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)
  ) {
    throw new Error(`Access denied: Cannot download from private IP address "${hostname}"`)
  }

  return parsedUrl
}

/**
 * Download image from URL with SSRF protection
 */
async function downloadFromUrl(url: string, maxRedirects = 3): Promise<Buffer> {
  // Validate URL
  const parsedUrl = validateUrl(url)

  return new Promise((resolve, reject) => {
    const protocol = parsedUrl.protocol === 'https:' ? https : http

    protocol
      .get(url, (response) => {
        // Validate Content-Type
        const contentType = response.headers['content-type']?.toLowerCase() || ''
        const isValidContentType = ALLOWED_CONTENT_TYPES.some((type) =>
          contentType.includes(type)
        )

        if (!isValidContentType) {
          reject(
            new Error(
              `Invalid content type: "${contentType}". Expected image/* content type.`
            )
          )
          return
        }

        // Handle redirects with limit
        if (
          response.statusCode === 301 ||
          response.statusCode === 302 ||
          response.statusCode === 307 ||
          response.statusCode === 308
        ) {
          if (maxRedirects <= 0) {
            reject(new Error('Too many redirects'))
            return
          }

          const redirectUrl = response.headers.location
          if (!redirectUrl) {
            reject(new Error('Redirect location not found'))
            return
          }

          // Validate redirect URL
          try {
            validateUrl(redirectUrl)
          } catch (error) {
            reject(error)
            return
          }

          downloadFromUrl(redirectUrl, maxRedirects - 1).then(resolve).catch(reject)
          return
        }

        // Handle errors
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`HTTP ${response.statusCode}: Failed to download image from ${url}`))
          return
        }

        // Collect data
        const chunks: Buffer[] = []
        response.on('data', (chunk) => chunks.push(chunk))
        response.on('end', () => resolve(Buffer.concat(chunks)))
        response.on('error', reject)
      })
      .on('error', (error) => {
        reject(new Error(`Failed to download image from "${url}": ${error.message}`))
      })
  })
}

/**
 * Convert readable stream to buffer
 */
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

/**
 * Validate input buffer
 */
export async function validateInput(buffer: Buffer): Promise<void> {
  // Check if buffer is empty
  if (buffer.length === 0) {
    throw new Error('Image buffer is empty')
  }

  // Check file size (max 50MB)
  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `Image file too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB (max: ${MAX_FILE_SIZE / 1024 / 1024}MB)`
    )
  }

  // Validate image format using Sharp
  try {
    const metadata = await sharp(buffer).metadata()

    // Check if format is supported
    const supportedFormats = ['jpeg', 'png', 'webp', 'jpg']
    if (!metadata.format || !supportedFormats.includes(metadata.format)) {
      throw new Error(
        `Unsupported image format: "${metadata.format}". Supported formats: ${supportedFormats.join(', ')}`
      )
    }

    // Validate image dimensions
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image: Unable to determine dimensions')
    }

    // Check minimum dimensions
    if (metadata.width < 1 || metadata.height < 1) {
      throw new Error(
        `Invalid image dimensions: ${metadata.width}x${metadata.height}`
      )
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unsupported image format')) {
      throw error
    }
    throw new Error(
      `Invalid image file: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
