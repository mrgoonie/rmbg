import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFileSync, readFileSync, existsSync, unlinkSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { Writable } from 'stream'
import { tmpdir } from 'os'

describe('Output Handling', () => {
  const testBuffer = Buffer.from('test image data')
  const testDir = join(tmpdir(), 'rmbg-test-output')
  const testFile = join(testDir, 'test-output.png')

  beforeEach(() => {
    // Create test directory
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }
  })

  afterEach(() => {
    // Cleanup
    if (existsSync(testFile)) {
      unlinkSync(testFile)
    }
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('Buffer Output', () => {
    it('should return buffer when no output specified', async () => {
      const { handleOutput } = await import('../../src/io/output')
      const result = await handleOutput(testBuffer)

      expect(Buffer.isBuffer(result)).toBe(true)
      expect(result).toEqual(testBuffer)
    })
  })

  describe('File Output', () => {
    it('should write buffer to file', async () => {
      const { handleOutput } = await import('../../src/io/output')
      await handleOutput(testBuffer, testFile)

      expect(existsSync(testFile)).toBe(true)
      const written = readFileSync(testFile)
      expect(written).toEqual(testBuffer)
    })

    it('should create directories if they do not exist', async () => {
      const { handleOutput } = await import('../../src/io/output')
      const nestedPath = join(testDir, 'nested', 'deep', 'output.png')

      await handleOutput(testBuffer, nestedPath)

      expect(existsSync(nestedPath)).toBe(true)

      // Cleanup
      rmSync(join(testDir, 'nested'), { recursive: true, force: true })
    })

    it('should reject path traversal attempts', async () => {
      const { handleOutput } = await import('../../src/io/output')

      await expect(
        handleOutput(testBuffer, '/etc/test-output.png')
      ).rejects.toThrow('Access denied')
    })

    it('should reject writing to system directories', async () => {
      const { handleOutput } = await import('../../src/io/output')

      await expect(
        handleOutput(testBuffer, '/bin/malicious')
      ).rejects.toThrow('Access denied')
    })
  })

  describe('Stream Output', () => {
    it('should write buffer to writable stream', async () => {
      const { handleOutput } = await import('../../src/io/output')
      const chunks: Buffer[] = []

      const stream = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk)
          callback()
        }
      })

      await handleOutput(testBuffer, stream)

      const result = Buffer.concat(chunks)
      expect(result).toEqual(testBuffer)
    })

    it('should handle stream errors properly', async () => {
      const { handleOutput } = await import('../../src/io/output')

      const errorStream = new Writable({
        write(chunk, encoding, callback) {
          callback(new Error('Stream write error'))
        }
      })

      await expect(
        handleOutput(testBuffer, errorStream)
      ).rejects.toThrow('Failed to write to stream')
    })
  })
})
