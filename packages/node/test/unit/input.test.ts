import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Readable } from 'stream'

// Import internal functions for testing
// Note: These are internal, but we're testing them for security
const testImagePath = join(__dirname, '../fixtures/test-image.jpg')

describe('Input Handling', () => {
  describe('Buffer Input', () => {
    it('should accept and process Buffer input', async () => {
      const { handleInput } = await import('../../src/io/input')
      const buffer = readFileSync(testImagePath)
      const result = await handleInput(buffer)

      expect(Buffer.isBuffer(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result).toEqual(buffer)
    })
  })

  describe('File Path Input', () => {
    it('should read file from valid path', async () => {
      const { handleInput } = await import('../../src/io/input')
      const result = await handleInput(testImagePath)

      expect(Buffer.isBuffer(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should reject path traversal attempts', async () => {
      const { handleInput } = await import('../../src/io/input')

      await expect(
        handleInput('/etc/passwd')
      ).rejects.toThrow('Access denied')
    })

    it('should reject non-existent files', async () => {
      const { handleInput } = await import('../../src/io/input')

      await expect(
        handleInput('/tmp/non-existent-file-12345.jpg')
      ).rejects.toThrow('Failed to read file')
    })
  })

  describe('Stream Input', () => {
    it('should convert stream to buffer', async () => {
      const { handleInput } = await import('../../src/io/input')
      const buffer = readFileSync(testImagePath)
      const stream = Readable.from(buffer)

      const result = await handleInput(stream)

      expect(Buffer.isBuffer(result)).toBe(true)
      expect(result.length).toBe(buffer.length)
    })
  })

  describe('URL Input - Security', () => {
    it('should reject localhost URLs', async () => {
      const { handleInput } = await import('../../src/io/input')

      await expect(
        handleInput('http://localhost/image.jpg')
      ).rejects.toThrow('Access denied')
    })

    it('should reject private IP addresses', async () => {
      const { handleInput } = await import('../../src/io/input')

      await expect(
        handleInput('http://192.168.1.1/image.jpg')
      ).rejects.toThrow('private IP address')
    })

    it('should reject AWS metadata URLs', async () => {
      const { handleInput } = await import('../../src/io/input')

      await expect(
        handleInput('http://169.254.169.254/latest/meta-data/')
      ).rejects.toThrow('Access denied')
    })

    it('should reject non-HTTP protocols', async () => {
      const { handleInput } = await import('../../src/io/input')

      // file:// protocol is treated as a file path, not URL
      // So it should fail with path validation error
      await expect(
        handleInput('file:///etc/passwd')
      ).rejects.toThrow('Access denied')
    })
  })

  describe('Input Validation', () => {
    it('should reject empty buffers', async () => {
      const { validateInput } = await import('../../src/io/input')
      const emptyBuffer = Buffer.alloc(0)

      await expect(
        validateInput(emptyBuffer)
      ).rejects.toThrow('Image buffer is empty')
    })

    it('should reject oversized files', async () => {
      const { validateInput } = await import('../../src/io/input')
      // Create 51MB buffer
      const largeBuffer = Buffer.alloc(51 * 1024 * 1024)

      await expect(
        validateInput(largeBuffer)
      ).rejects.toThrow('Image file too large')
    })

    it('should accept valid image formats', async () => {
      const { validateInput } = await import('../../src/io/input')
      const validImage = readFileSync(testImagePath)

      // Should not throw an error
      await validateInput(validImage)
      // If we get here without error, test passes
      expect(true).toBe(true)
    })

    it('should reject non-image files', async () => {
      const { validateInput } = await import('../../src/io/input')
      const textBuffer = Buffer.from('This is not an image')

      await expect(
        validateInput(textBuffer)
      ).rejects.toThrow('Invalid image file')
    })
  })
})
