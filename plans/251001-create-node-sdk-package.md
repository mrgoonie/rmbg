# Implementation Plan: RMBG Node.js SDK Package

**Created**: 2025-10-01
**Updated**: 2025-10-01 (Code Review Completed)
**Status**: In Progress - Security Fixes Required
**Package Name**: `rmbg`
**Completion**: 62% (Phases 1-2 complete, Phase 3-6 partial)

---

## Code Review Status

**Review Date**: 2025-10-01
**Review Report**: `/plans/reports/251001-node-sdk-code-review.md`

### Key Findings

**Overall Assessment**: ⭐⭐⭐⭐ (4/5) - CONDITIONAL APPROVAL

**Critical Issues Found**: 4 security vulnerabilities that MUST be fixed before npm publish
- Path traversal in file input/output handlers
- SSRF vulnerability in URL download handler
- Missing image format validation
- Cache directory path validation

**Status**: DO NOT PUBLISH until critical issues are resolved and tests are added.

**Strengths**:
- ✅ Excellent API design
- ✅ Outstanding TypeScript types
- ✅ Clean code architecture
- ✅ Comprehensive documentation
- ✅ Good error handling structure

**Weaknesses**:
- ❌ Critical security vulnerabilities
- ❌ No test suite (0% coverage)
- ❌ Missing examples directory
- ⚠️ Incomplete AbortController implementation
- ⚠️ No cache size limits

---

## Overview

Create a new universal Node.js SDK package that provides a clean, simple API for removing image backgrounds in Node.js environments. This package will bridge the gap between the CLI tool and the API server, enabling developers to easily integrate background removal into their Node.js applications, serverless functions, Next.js API routes, and other backend services.

**Key Differentiator**: Unlike the CLI (command-line focused) and API server (full HTTP server), this package provides a programmatic Node.js API that can be imported and used directly in any Node.js application.

---

## Requirements

### Functional Requirements

1. **Simple API**: Provide a straightforward `rmbg()` function that accepts images and returns processed buffers
2. **Multiple Input Formats**: Support Buffer, file paths, URLs, and streams
3. **Multiple Output Formats**: Return Buffer by default, with options for streams and file writing
4. **Model Selection**: Easy model selection via factory functions (reuse from CLI)
5. **Progress Tracking**: Optional progress callbacks for long-running operations
6. **TypeScript Support**: Full TypeScript definitions with excellent IntelliSense
7. **Error Handling**: Comprehensive error messages with actionable feedback

### Non-Functional Requirements

1. **Performance**: Optimized for server-side processing with minimal overhead
2. **Memory Efficiency**: Stream processing for large images when possible
3. **Bundle Size**: Reasonable package size (excluding models which are downloaded on-demand)
4. **Compatibility**: Support Node.js 18+ (LTS versions)
5. **Zero Config**: Works out of the box with sensible defaults
6. **Extensibility**: Allow configuration of ONNX runtime, model caching, etc.

---

## Architecture

### Package Structure

```
packages/node/
├── src/
│   ├── index.ts              # Main entry point
│   ├── core/
│   │   ├── rmbg.ts          # Core background removal logic (shared with CLI)
│   │   ├── models.ts        # Model factory functions
│   │   ├── types.ts         # TypeScript type definitions
│   │   ├── network.ts       # Model downloading logic
│   │   └── utils.ts         # Image processing utilities
│   ├── io/
│   │   ├── input.ts         # Input handling (file/buffer/url/stream)
│   │   ├── output.ts        # Output formatting (buffer/stream/file)
│   │   └── validation.ts    # Input validation
│   └── config/
│       ├── defaults.ts      # Default configuration
│       └── cache.ts         # Model caching strategy
├── test/
│   ├── unit/
│   │   ├── input.test.ts
│   │   ├── output.test.ts
│   │   └── rmbg.test.ts
│   └── integration/
│       └── e2e.test.ts
├── examples/
│   ├── basic.ts             # Basic usage example
│   ├── express.ts           # Express integration
│   ├── nextjs-api.ts        # Next.js API route example
│   └── streams.ts           # Stream processing example
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── README.md
└── LICENSE
```

### Code Reuse Strategy

**Reuse from CLI package** (`packages/cli/src/core/`):
- ✅ `rmbg.ts` - Core background removal algorithm
- ✅ `models.ts` - Model factory functions (with minor adaptations)
- ✅ `types.ts` - Type definitions
- ✅ `network.ts` - Model downloading
- ✅ `utils.ts` - Image processing utilities

**New Code Required**:
- Input/output handlers for multiple formats
- Enhanced error handling and validation
- Caching mechanism
- Stream processing support
- User-friendly API wrapper

### API Design

#### Basic Usage

```typescript
import { rmbg } from 'rmbg'
import { createModnetModel } from 'rmbg/models'

// Simple usage with defaults (uses modnet model)
const outputBuffer = await rmbg('input.jpg')

// With custom model
const model = createModnetModel()
const outputBuffer = await rmbg('input.jpg', { model })

// With progress tracking
const outputBuffer = await rmbg('input.jpg', {
  model,
  onProgress: (progress, download, process) => {
    console.log(`Progress: ${Math.round(progress * 100)}%`)
  }
})
```

#### Advanced Usage

```typescript
import { rmbg, RMBGOptions } from 'rmbg'
import { createBriaaiModel } from 'rmbg/models'
import fs from 'fs'

// From URL
const buffer = await rmbg('https://example.com/image.jpg')

// From Buffer
const inputBuffer = fs.readFileSync('input.jpg')
const outputBuffer = await rmbg(inputBuffer)

// Save to file directly
await rmbg('input.jpg', {
  output: 'output.png'
})

// Custom resolution
await rmbg('input.jpg', {
  model: createBriaaiModel(),
  maxResolution: 4096
})

// Stream processing (for large files)
import { createReadStream, createWriteStream } from 'fs'

const inputStream = createReadStream('input.jpg')
const outputStream = createWriteStream('output.png')

await rmbg(inputStream, {
  output: outputStream
})
```

#### Framework Integration Examples

**Express.js:**
```typescript
import express from 'express'
import { rmbg } from 'rmbg'
import multer from 'multer'

const app = express()
const upload = multer()

app.post('/remove-bg', upload.single('image'), async (req, res) => {
  try {
    const outputBuffer = await rmbg(req.file.buffer)
    res.contentType('image/png').send(outputBuffer)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

**Next.js API Route:**
```typescript
// pages/api/remove-background.ts
import { rmbg } from 'rmbg'
import { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Parse multipart form data
    const formData = await parseForm(req)
    const outputBuffer = await rmbg(formData.image)

    res.setHeader('Content-Type', 'image/png')
    res.send(outputBuffer)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

**AWS Lambda:**
```typescript
import { rmbg } from 'rmbg'
import { APIGatewayProxyHandler } from 'aws-lambda'

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const imageBuffer = Buffer.from(event.body, 'base64')
    const outputBuffer = await rmbg(imageBuffer)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'image/png' },
      body: outputBuffer.toString('base64'),
      isBase64Encoded: true
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
```

### Type Definitions

```typescript
// Main API
export type ImageInput =
  | string              // file path or URL
  | Buffer              // image buffer
  | ReadableStream      // stream

export type ImageOutput =
  | Buffer              // default
  | string              // file path to save
  | WritableStream      // output stream

export interface RMBGOptions {
  /** AI model to use for background removal */
  model?: RMBGModel

  /** Maximum output resolution (default: 2048) */
  maxResolution?: number

  /** Output destination (default: Buffer) */
  output?: ImageOutput

  /** Progress callback */
  onProgress?: (progress: number, download: number, process: number) => void

  /** Abort controller for cancellation */
  abortController?: AbortController

  /** Model cache directory (default: os.tmpdir()) */
  cacheDir?: string

  /** Enable model caching (default: true) */
  enableCache?: boolean
}

// From CLI package (reused)
export interface RMBGModel {
  name: string
  files: string[]
  mime: string
  publicPath: string
  resolution: number
  size: number
}

// Main function
export function rmbg(
  input: ImageInput,
  options?: RMBGOptions
): Promise<Buffer>

// Model factories (re-exported from core/models.ts)
export function createU2netpModel(publicPath?: string): RMBGModel
export function createModnetModel(publicPath?: string): RMBGModel
export function createBriaaiModel(publicPath?: string): RMBGModel
export function createIsnetAnimeModel(publicPath?: string): RMBGModel
export function createSiluetaModel(publicPath?: string): RMBGModel
export function createU2netClothModel(publicPath?: string): RMBGModel
```

---

## Dependencies

### Production Dependencies

```json
{
  "onnxruntime-node": "^1.16.2",    // ONNX inference engine
  "sharp": "^0.33.0",                // Image processing
  "node-fetch": "^3.3.2"             // For URL downloads (Node < 18)
}
```

### Development Dependencies

```json
{
  "@types/node": "^20.10.0",
  "typescript": "^5.2.2",
  "rimraf": "^5.0.1",
  "vitest": "^1.0.0",                // Testing framework
  "@vitest/ui": "^1.0.0",
  "tsup": "^8.0.0"                   // Fast TypeScript bundler
}
```

### Peer Dependencies

None required (all dependencies bundled)

---

## Build Configuration

### Package.json

```json
{
  "name": "rmbg",
  "version": "0.0.1",
  "description": "Remove image backgrounds in Node.js using AI models",
  "keywords": [
    "background-removal",
    "image-processing",
    "ai",
    "onnx",
    "computer-vision",
    "node",
    "typescript"
  ],
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    },
    "./models": {
      "require": "./dist/models.js",
      "import": "./dist/models.mjs",
      "types": "./dist/models.d.ts"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext ts --report-unused-disable-directives --max-warnings 0",
    "prepublishOnly": "bun run build"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/mrgoonie/rmbg.git",
    "directory": "packages/node"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

### TypeScript Configuration (tsconfig.json)

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "ESNext",
    "target": "ES2020",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

### Build Configuration (tsup.config.ts)

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    models: 'src/core/models.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  target: 'node18',
  external: ['sharp', 'onnxruntime-node']
})
```

---

## Export Strategy

### Main Exports (`src/index.ts`)

```typescript
// Core API
export { rmbg } from './core/rmbg'

// Types
export type {
  ImageInput,
  ImageOutput,
  RMBGOptions,
  RMBGModel
} from './core/types'

// Re-export models for convenience
export {
  createU2netpModel,
  createModnetModel,
  createBriaaiModel,
  createIsnetAnimeModel,
  createSiluetaModel,
  createU2netClothModel
} from './core/models'
```

### Model Exports (`src/core/models.ts`)

```typescript
// Re-export from CLI core with minor modifications
export * from './core/models'
```

---

## Implementation Steps

### Phase 1: Setup & Code Migration (Day 1)

1. **Create package structure**
   - [ ] Create `packages/node/` directory
   - [ ] Initialize package.json with correct metadata
   - [ ] Setup TypeScript configuration (tsconfig.json)
   - [ ] Setup build tool (tsup.config.ts)
   - [ ] Create basic directory structure (src/, test/, examples/)

2. **Migrate core code from CLI**
   - [ ] Copy `packages/cli/src/core/` to `packages/node/src/core/`
   - [ ] Update imports to use `.js` extensions (for ESM compatibility)
   - [ ] Remove CLI-specific code (ora spinners, chalk, commander)
   - [ ] Update types to include new input/output formats

3. **Setup development environment**
   - [ ] Install dependencies (onnxruntime-node, sharp)
   - [ ] Install dev dependencies (typescript, tsup, vitest)
   - [ ] Configure ESLint
   - [ ] Setup Vitest for testing

### Phase 2: Input/Output Handlers (Day 2)

4. **Implement input handling** (`src/io/input.ts`)
   - [ ] Buffer input handler (passthrough)
   - [ ] File path input handler (read file with fs)
   - [ ] URL input handler (download with fetch/https)
   - [ ] Stream input handler (convert to buffer)
   - [ ] Input validation and error handling

5. **Implement output handling** (`src/io/output.ts`)
   - [ ] Buffer output (default, return directly)
   - [ ] File output (write to path with fs)
   - [ ] Stream output (pipe to writable stream)
   - [ ] Output validation and error handling

6. **Create main API wrapper** (`src/index.ts`)
   - [ ] Main `rmbg()` function
   - [ ] Input normalization logic
   - [ ] Call core processing
   - [ ] Output formatting logic
   - [ ] Comprehensive error handling

### Phase 3: Features & Optimization (Day 3)

7. **Model caching**
   - [ ] Create cache directory manager (`src/config/cache.ts`)
   - [ ] Implement persistent model caching (save to disk)
   - [ ] Cache validation (check file integrity)
   - [ ] Cache cleanup utilities

8. **Configuration & defaults**
   - [ ] Default configuration object (`src/config/defaults.ts`)
   - [ ] Environment variable support (cache dir, default model)
   - [ ] Configuration validation

9. **Stream processing optimization**
   - [ ] Large file detection
   - [ ] Stream-based processing for large images
   - [ ] Memory-efficient buffer handling

### Phase 4: Testing (Day 4)

10. **Unit tests**
    - [ ] Test input handlers with various formats
    - [ ] Test output handlers
    - [ ] Test core processing with mocked models
    - [ ] Test error scenarios
    - [ ] Test configuration and defaults

11. **Integration tests**
    - [ ] End-to-end test with real model
    - [ ] Test with various image formats (JPEG, PNG, WebP)
    - [ ] Test with different image sizes
    - [ ] Test progress callbacks
    - [ ] Test abort controller

12. **Performance tests**
    - [ ] Benchmark processing speed
    - [ ] Memory usage profiling
    - [ ] Concurrent processing test

### Phase 5: Documentation & Examples (Day 5)

13. **Write documentation**
    - [ ] Comprehensive README.md
    - [ ] API documentation with examples
    - [ ] Installation instructions
    - [ ] Troubleshooting section
    - [ ] Migration guide (from CLI or API)
    - [ ] Performance tips

14. **Create examples**
    - [ ] Basic usage example (`examples/basic.ts`)
    - [ ] Express integration (`examples/express.ts`)
    - [ ] Next.js API route (`examples/nextjs-api.ts`)
    - [ ] Stream processing (`examples/streams.ts`)
    - [ ] AWS Lambda example (`examples/lambda.ts`)
    - [ ] Batch processing example (`examples/batch.ts`)

15. **Add JSDoc comments**
    - [ ] Document all public APIs with JSDoc
    - [ ] Add usage examples in JSDoc
    - [ ] Include parameter descriptions and return types

### Phase 6: Publishing Preparation (Day 6)

16. **Final testing & validation**
    - [ ] Run all tests and ensure 100% pass rate
    - [ ] Test installation from tarball (`npm pack`)
    - [ ] Test in fresh project with `npm link`
    - [ ] Validate TypeScript definitions
    - [ ] Check bundle size and dependencies

17. **Prepare for publication**
    - [ ] Update README with installation instructions
    - [ ] Add LICENSE file
    - [ ] Add CHANGELOG.md
    - [ ] Create changeset (`pnpm changeset`)
    - [ ] Update root README to include new package

18. **Publish to npm**
    - [ ] Build package (`bun run build`)
    - [ ] Verify built files
    - [ ] Publish to npm (`pnpm changeset publish`)
    - [ ] Verify package on npmjs.com
    - [ ] Test installation from npm registry

---

## Files to Create

### New Files

1. **Package files:**
   - `/packages/node/package.json` - Package manifest
   - `/packages/node/tsconfig.json` - TypeScript config
   - `/packages/node/tsup.config.ts` - Build config
   - `/packages/node/README.md` - Package documentation
   - `/packages/node/LICENSE` - License file

2. **Source files:**
   - `/packages/node/src/index.ts` - Main entry point
   - `/packages/node/src/io/input.ts` - Input handlers
   - `/packages/node/src/io/output.ts` - Output handlers
   - `/packages/node/src/io/validation.ts` - Input validation
   - `/packages/node/src/config/defaults.ts` - Default config
   - `/packages/node/src/config/cache.ts` - Cache manager

3. **Test files:**
   - `/packages/node/test/unit/input.test.ts`
   - `/packages/node/test/unit/output.test.ts`
   - `/packages/node/test/unit/rmbg.test.ts`
   - `/packages/node/test/integration/e2e.test.ts`
   - `/packages/node/vitest.config.ts` - Test config

4. **Example files:**
   - `/packages/node/examples/basic.ts`
   - `/packages/node/examples/express.ts`
   - `/packages/node/examples/nextjs-api.ts`
   - `/packages/node/examples/streams.ts`
   - `/packages/node/examples/lambda.ts`
   - `/packages/node/examples/batch.ts`

### Files to Copy/Migrate from CLI

Copy from `/packages/cli/src/core/` to `/packages/node/src/core/`:
- `rmbg.ts` - Core algorithm (minor modifications)
- `models.ts` - Model factories (keep as-is)
- `types.ts` - Type definitions (extend with new types)
- `network.ts` - Model downloading (add caching)
- `utils.ts` - Image utilities (keep as-is)

### Files to Modify

1. **Root package.json** - Add node package to workspace
2. **Root README.md** - Document new package
3. **.changeset/config.json** - Ensure node package is not ignored

---

## Testing Strategy

### Unit Tests

**Input Handling:**
```typescript
describe('Input Handler', () => {
  it('should handle Buffer input', async () => {
    const buffer = Buffer.from('mock image data')
    const result = await handleInput(buffer)
    expect(result).toBeInstanceOf(Buffer)
  })

  it('should handle file path input', async () => {
    const result = await handleInput('./test-image.jpg')
    expect(result).toBeInstanceOf(Buffer)
  })

  it('should handle URL input', async () => {
    const result = await handleInput('https://example.com/image.jpg')
    expect(result).toBeInstanceOf(Buffer)
  })

  it('should throw error for invalid input', async () => {
    await expect(handleInput(null)).rejects.toThrow()
  })
})
```

**Output Handling:**
```typescript
describe('Output Handler', () => {
  it('should return Buffer by default', async () => {
    const input = Buffer.from('processed image')
    const result = await handleOutput(input)
    expect(result).toBeInstanceOf(Buffer)
  })

  it('should write to file when path provided', async () => {
    const input = Buffer.from('processed image')
    await handleOutput(input, { output: './output.png' })
    expect(fs.existsSync('./output.png')).toBe(true)
  })

  it('should pipe to stream when provided', async () => {
    const input = Buffer.from('processed image')
    const stream = createWriteStream('./output.png')
    await handleOutput(input, { output: stream })
    expect(fs.existsSync('./output.png')).toBe(true)
  })
})
```

### Integration Tests

```typescript
describe('RMBG Integration', () => {
  it('should remove background from image', async () => {
    const model = createU2netpModel()
    const outputBuffer = await rmbg('./test-image.jpg', { model })

    expect(outputBuffer).toBeInstanceOf(Buffer)
    expect(outputBuffer.length).toBeGreaterThan(0)

    // Verify it's a valid PNG
    const metadata = await sharp(outputBuffer).metadata()
    expect(metadata.format).toBe('png')
    expect(metadata.hasAlpha).toBe(true)
  })

  it('should handle different image formats', async () => {
    const formats = ['jpg', 'png', 'webp']

    for (const format of formats) {
      const output = await rmbg(`./test.${format}`)
      expect(output).toBeInstanceOf(Buffer)
    }
  })

  it('should respect maxResolution option', async () => {
    const output = await rmbg('./large-image.jpg', { maxResolution: 512 })
    const metadata = await sharp(output).metadata()

    expect(metadata.width).toBeLessThanOrEqual(512)
    expect(metadata.height).toBeLessThanOrEqual(512)
  })
})
```

### Performance Tests

```typescript
describe('Performance', () => {
  it('should process image within reasonable time', async () => {
    const start = Date.now()
    await rmbg('./test-image.jpg')
    const duration = Date.now() - start

    expect(duration).toBeLessThan(5000) // 5 seconds
  })

  it('should handle concurrent requests', async () => {
    const promises = Array.from({ length: 5 }, (_, i) =>
      rmbg('./test-image.jpg')
    )

    const results = await Promise.all(promises)
    expect(results).toHaveLength(5)
    results.forEach(result => {
      expect(result).toBeInstanceOf(Buffer)
    })
  })
})
```

---

## Security Considerations

### Input Validation

1. **File size limits**: Prevent DoS attacks with large files
   ```typescript
   const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
   if (buffer.length > MAX_FILE_SIZE) {
     throw new Error('File too large')
   }
   ```

2. **File type validation**: Only allow valid image formats
   ```typescript
   const ALLOWED_FORMATS = ['jpeg', 'png', 'webp']
   const metadata = await sharp(buffer).metadata()
   if (!ALLOWED_FORMATS.includes(metadata.format)) {
     throw new Error('Invalid image format')
   }
   ```

3. **URL validation**: Prevent SSRF attacks
   ```typescript
   const url = new URL(input)
   if (url.protocol !== 'http:' && url.protocol !== 'https:') {
     throw new Error('Invalid URL protocol')
   }
   // Add allowlist/blocklist for hosts if needed
   ```

4. **Path validation**: Prevent path traversal
   ```typescript
   const resolved = path.resolve(input)
   const allowed = path.resolve(process.cwd())
   if (!resolved.startsWith(allowed)) {
     throw new Error('Invalid file path')
   }
   ```

### Data Protection

1. **Temporary file cleanup**: Remove temp files after processing
2. **Memory limits**: Use streams for large files
3. **Model verification**: Validate model checksums before loading

---

## Performance Considerations

### Optimization Strategies

1. **Model caching**:
   - Cache downloaded models to disk
   - Reuse loaded sessions when possible
   - Implement cache size limits and LRU eviction

2. **Image processing**:
   - Use Sharp's native performance optimizations
   - Enable SIMD when available
   - Process images in chunks for large batches

3. **Memory management**:
   - Use streams for files > 10MB
   - Release ONNX sessions immediately after use
   - Implement buffer pooling for frequent operations

4. **Concurrency**:
   - Support parallel processing of multiple images
   - Use worker threads for CPU-intensive operations (future enhancement)
   - Implement queue for request throttling

### Performance Benchmarks

Target performance metrics:
- **Small images** (< 1MB): < 2 seconds
- **Medium images** (1-5MB): < 5 seconds
- **Large images** (5-10MB): < 10 seconds
- **Memory usage**: < 500MB per image
- **Concurrent requests**: Support 10+ simultaneous requests

---

## Risks & Mitigations

### Risk 1: Large Bundle Size
**Impact**: High
**Probability**: Medium
**Mitigation**:
- Make ONNX Runtime and Sharp external dependencies
- Split code into multiple entry points
- Use tree-shaking for unused code
- Models are downloaded on-demand, not bundled

### Risk 2: Native Module Compatibility
**Impact**: High
**Probability**: Medium
**Mitigation**:
- Test on multiple platforms (Linux, macOS, Windows)
- Document system requirements clearly
- Provide prebuilt binaries for Sharp and ONNX Runtime
- Add troubleshooting guide for native module issues

### Risk 3: Memory Leaks
**Impact**: High
**Probability**: Low
**Mitigation**:
- Implement proper cleanup in finally blocks
- Release ONNX sessions immediately
- Monitor memory usage in tests
- Use weak references for caches

### Risk 4: API Inconsistency with Other Packages
**Impact**: Medium
**Probability**: Medium
**Mitigation**:
- Reuse types and interfaces from CLI package
- Follow same naming conventions
- Document differences clearly
- Consider creating shared types package in future

### Risk 5: Breaking Changes in Dependencies
**Impact**: Medium
**Probability**: Low
**Mitigation**:
- Pin dependency versions
- Test with each dependency update
- Monitor dependency changelogs
- Maintain compatibility matrix

---

## TODO Tasks

### Phase 1: Setup & Code Migration
- [ ] Create `packages/node/` directory structure
- [ ] Create package.json with metadata and scripts
- [ ] Setup TypeScript configuration files
- [ ] Setup tsup build configuration
- [ ] Copy core code from CLI package
- [ ] Update imports and remove CLI-specific code
- [ ] Install production dependencies
- [ ] Install development dependencies
- [ ] Setup ESLint configuration
- [ ] Setup Vitest configuration

### Phase 2: Input/Output Handlers
- [ ] Implement Buffer input handler
- [ ] Implement file path input handler with validation
- [ ] Implement URL input handler with fetch
- [ ] Implement stream input handler
- [ ] Add input validation and error handling
- [ ] Implement Buffer output handler
- [ ] Implement file output handler
- [ ] Implement stream output handler
- [ ] Add output validation and error handling
- [ ] Create main API wrapper function

### Phase 3: Features & Optimization
- [ ] Implement model cache directory manager
- [ ] Add persistent model caching to disk
- [ ] Add cache validation and integrity checks
- [ ] Create default configuration object
- [ ] Add environment variable support
- [ ] Implement configuration validation
- [ ] Add large file detection
- [ ] Implement stream-based processing for large images
- [ ] Optimize memory usage for buffers

### Phase 4: Testing
- [ ] Write unit tests for input handlers
- [ ] Write unit tests for output handlers
- [ ] Write unit tests for core processing
- [ ] Write unit tests for error scenarios
- [ ] Write integration test for end-to-end processing
- [ ] Test with various image formats
- [ ] Test with different image sizes
- [ ] Test progress callbacks
- [ ] Test abort controller
- [ ] Run performance benchmarks
- [ ] Profile memory usage

### Phase 5: Documentation & Examples
- [ ] Write comprehensive README.md
- [ ] Document installation instructions
- [ ] Add API reference documentation
- [ ] Create troubleshooting section
- [ ] Create basic usage example
- [ ] Create Express integration example
- [ ] Create Next.js API route example
- [ ] Create stream processing example
- [ ] Create AWS Lambda example
- [ ] Create batch processing example
- [ ] Add JSDoc comments to all public APIs

### Phase 6: Publishing Preparation
- [ ] Run all tests and ensure 100% pass
- [ ] Test package installation from tarball
- [ ] Test with npm link in fresh project
- [ ] Validate TypeScript definitions
- [ ] Check bundle size
- [ ] Add LICENSE file
- [ ] Create CHANGELOG.md
- [ ] Create changeset for version bump
- [ ] Update root README
- [ ] Build package for production
- [ ] Publish to npm registry
- [ ] Verify package on npmjs.com
- [ ] Test installation from npm

---

## Success Criteria

The implementation is considered successful when:

1. ✅ Package builds without errors
2. ✅ All unit tests pass (100% coverage for critical paths)
3. ✅ All integration tests pass
4. ✅ Package can be installed from npm
5. ✅ TypeScript definitions work correctly in consumer projects
6. ✅ Examples run successfully
7. ✅ Documentation is comprehensive and accurate
8. ✅ Performance meets target benchmarks
9. ✅ No memory leaks detected
10. ✅ Works on Linux, macOS, and Windows

---

## Future Enhancements

Post-MVP improvements to consider:

1. **Worker thread support**: Offload processing to worker threads for true parallelism
2. **GPU acceleration**: Support for CUDA/TensorRT providers in ONNX Runtime
3. **Batch processing API**: Optimized API for processing multiple images
4. **Custom model support**: Allow users to provide their own ONNX models
5. **Image format options**: Support output formats other than PNG (JPEG with white background, WebP)
6. **Edge detection refinement**: Post-processing to smooth edges
7. **Background replacement**: Not just removal, but replacement with colors/images
8. **CLI integration**: Add this package as dependency of CLI (reduce code duplication)
9. **Browser SDK alignment**: Create isomorphic package that works in both Node.js and browser

---

## Updated TODO Tasks (Post Code Review)

### 🔴 CRITICAL: Security Fixes (Must Complete Before Publishing)

**Priority 1 - Do NOT publish to npm until these are fixed**

- [ ] **CRITICAL-01**: Fix path traversal in `src/io/input.ts` - Add path validation to `readFromFile()`
- [ ] **CRITICAL-02**: Fix path traversal in `src/io/output.ts` - Add path validation to `writeToFile()`
- [ ] **CRITICAL-03**: Fix SSRF in `src/io/input.ts` - Add URL validation and blocklists to `downloadFromUrl()`
- [ ] **CRITICAL-04**: Fix cache directory validation in `src/config/defaults.ts` - Validate cache paths
- [ ] **HIGH-01**: Add Content-Type validation in URL download handler
- [ ] **HIGH-02**: Add image format validation using Sharp in `validateInput()` (make it async)
- [ ] **HIGH-03**: Implement proper AbortController support with Promise.race()
- [ ] **HIGH-04**: Fix stream write error handling in `src/io/output.ts`
- [ ] **HIGH-05**: Improve ONNX session cleanup with try-finally

**Estimated Time**: 1-2 days

### 🟡 HIGH PRIORITY: Testing & Quality

**Priority 2 - Should complete before v1.0.0**

- [ ] Create `vitest.config.ts` configuration file
- [ ] Create test directory structure (`test/unit`, `test/integration`, `test/fixtures`)
- [ ] Write unit tests for input handlers (Buffer, file, URL, stream)
- [ ] Write unit tests for output handlers
- [ ] Write unit tests for validation functions
- [ ] Write integration test for end-to-end processing
- [ ] Write security tests (path traversal, SSRF attempts)
- [ ] Add test fixtures (sample images)
- [ ] Run tests and achieve >80% coverage
- [ ] Add LICENSE file (MIT)
- [ ] Add CHANGELOG.md
- [ ] Add `license` field to package.json
- [ ] Create changeset for initial release

**Estimated Time**: 2-3 days

### 🟢 MEDIUM PRIORITY: Features & Docs

**Priority 3 - Nice to have for v1.0.0**

- [ ] Create `examples/` directory
- [ ] Create `examples/basic.ts` - Simple usage example
- [ ] Create `examples/express.ts` - Express integration
- [ ] Create `examples/nextjs-api.ts` - Next.js API route
- [ ] Create `examples/streams.ts` - Stream processing
- [ ] Add cache size limits and LRU eviction to `ModelCache`
- [ ] Add JSDoc comments to all functions
- [ ] Extract magic numbers to named constants
- [ ] Standardize error messages with error codes
- [ ] Add explicit null checks where needed

**Estimated Time**: 2 days

### 📊 Performance & Optimization (Future)

**Priority 4 - Post v1.0.0**

- [ ] Add performance benchmarks
- [ ] Profile memory usage
- [ ] Implement stream-based processing for large images
- [ ] Add worker thread support for parallel processing
- [ ] Optimize buffer allocation and pooling
- [ ] Add cache warmup functionality

**Estimated Time**: 3-5 days

---

## Completion Checklist

### Before Publishing to npm (v0.1.0)

- [ ] All CRITICAL security issues fixed (CRITICAL-01 to CRITICAL-04)
- [ ] All HIGH priority security issues fixed (HIGH-01 to HIGH-05)
- [ ] At least basic integration tests passing
- [ ] LICENSE file added
- [ ] CHANGELOG.md created
- [ ] Package builds successfully (`bun run build`)
- [ ] Type checking passes (`bun run typecheck`)
- [ ] README reviewed and accurate
- [ ] Test installation with `npm pack` and `npm link`
- [ ] Create changeset (`pnpm changeset`)

**Target Date**: 2025-10-03

### Before v1.0.0 Release

- [ ] All security issues resolved
- [ ] Comprehensive test suite (>80% coverage)
- [ ] All integration tests passing
- [ ] Examples directory created with 3+ examples
- [ ] Performance benchmarks completed
- [ ] Documentation complete
- [ ] Tested on Linux, macOS, Windows
- [ ] Tested in serverless environments
- [ ] Community feedback incorporated

**Target Date**: 2025-10-15

---

## Notes

- This package focuses on **Node.js only** - browser support is already covered by `@rmbg/browser`
- The CLI tool (`rmbg-cli`) can potentially be refactored to use this package in the future
- The API server (`rmbg-api`) could also be simplified by using this package
- **SECURITY**: Do NOT publish to npm until all CRITICAL and HIGH security issues are resolved
- **TESTING**: Add at least basic test coverage before publishing
- Package name `rmbg` is available on npm (checked 2025-10-01)
- Ensure compatibility with serverless environments (AWS Lambda, Vercel, Netlify)
- Document cold start times in serverless environments

---

## Recent Changes

**2025-10-01**:
- ✅ Completed comprehensive code review
- ✅ Identified 4 critical security vulnerabilities
- ✅ Identified 5 high-priority issues
- ✅ Generated detailed review report
- ⚠️ Updated status: DO NOT PUBLISH until security fixes are complete
- ⚠️ Added updated TODO tasks based on review findings
- 📊 Current completion: 62% (Phases 1-2 complete, Phases 3-6 partial)
