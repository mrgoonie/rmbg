import { promises as fs } from 'fs'
import { join, resolve, normalize } from 'path'
import { createHash } from 'crypto'
import { tmpdir } from 'os'

/**
 * Validate cache directory path
 */
function validateCacheDir(cacheDir: string): string {
  const normalizedPath = normalize(resolve(cacheDir))

  // Block sensitive system directories
  const blockedPatterns = [
    '/etc/',
    '/proc/',
    '/sys/',
    '/dev/',
    '/boot/',
    '/bin/',
    '/sbin/',
    'C:\\Windows\\',
    'C:\\Program Files\\'
  ]

  for (const pattern of blockedPatterns) {
    if (normalizedPath.includes(pattern)) {
      throw new Error(
        `Invalid cache directory: Cannot use system directory "${pattern}"`
      )
    }
  }

  // Ensure it's within a safe location (tmpdir or user-writable directories)
  const systemTmpDir = normalize(resolve(tmpdir()))
  const isInTmpDir = normalizedPath.startsWith(systemTmpDir)

  if (!isInTmpDir) {
    // Allow user directories but warn
    const userHome = process.env.HOME || process.env.USERPROFILE || ''
    const isInUserDir = userHome && normalizedPath.startsWith(normalize(resolve(userHome)))

    if (!isInUserDir) {
      console.warn(
        `Warning: Cache directory "${normalizedPath}" is not in temp or user directory. Using system tmpdir instead.`
      )
      return join(systemTmpDir, 'rmbg-models')
    }
  }

  return normalizedPath
}

/**
 * Model cache manager
 */
export class ModelCache {
  private cacheDir: string

  constructor(cacheDir: string) {
    this.cacheDir = validateCacheDir(cacheDir)
  }

  /**
   * Get cache key for model file
   */
  private getCacheKey(url: string): string {
    return createHash('md5').update(url).digest('hex')
  }

  /**
   * Get cache file path
   */
  private getCachePath(url: string): string {
    const key = this.getCacheKey(url)
    return join(this.cacheDir, `${key}.onnx`)
  }

  /**
   * Check if model is cached
   */
  async has(url: string): Promise<boolean> {
    const path = this.getCachePath(url)
    try {
      await fs.access(path)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get cached model
   */
  async get(url: string): Promise<Buffer | null> {
    const path = this.getCachePath(url)
    try {
      return await fs.readFile(path)
    } catch {
      return null
    }
  }

  /**
   * Save model to cache
   */
  async set(url: string, data: Buffer): Promise<void> {
    const path = this.getCachePath(url)

    // Ensure cache directory exists
    await fs.mkdir(this.cacheDir, { recursive: true })

    // Write to cache
    await fs.writeFile(path, data)
  }

  /**
   * Clear cache
   */
  async clear(): Promise<void> {
    try {
      await fs.rm(this.cacheDir, { recursive: true, force: true })
    } catch {
      // Ignore errors
    }
  }

  /**
   * Get cache size in bytes
   */
  async getSize(): Promise<number> {
    try {
      const files = await fs.readdir(this.cacheDir)
      let totalSize = 0

      for (const file of files) {
        const stats = await fs.stat(join(this.cacheDir, file))
        totalSize += stats.size
      }

      return totalSize
    } catch {
      return 0
    }
  }
}
