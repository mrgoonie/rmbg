# rmbg - Background Removal for Node.js

Remove image backgrounds in Node.js using AI models. Fast, privacy-focused (runs locally), and easy to use.

## Features

- 🔒 **Privacy-focused**: All processing happens locally, no server uploads
- ⚡ **Fast**: Optimized with ONNX Runtime for Node.js
- 🎯 **Simple API**: Just `await rmbg('image.jpg')` - that's it!
- 🔧 **Flexible**: Supports multiple input/output formats
- 🎨 **Multiple models**: Choose between quality, speed, or file size
- 📦 **TypeScript**: Full TypeScript support with type definitions
- 🚀 **Framework-ready**: Works with Express, Next.js, serverless, etc.

## Installation

```bash
npm install rmbg
# or
bun add rmbg
```

## Quick Start

```typescript
import { rmbg } from 'rmbg'

// Remove background from image
const output = await rmbg('input.jpg')

// Save to file
import { writeFileSync } from 'fs'
writeFileSync('output.png', output)
```

That's it! The background is removed and you get a PNG with transparency.

## Usage

### Basic Usage

```typescript
import { rmbg } from 'rmbg'

// From file path
const output = await rmbg('./input.jpg')

// From URL
const output = await rmbg('https://example.com/image.jpg')

// From Buffer
import { readFileSync } from 'fs'
const buffer = readFileSync('./input.jpg')
const output = await rmbg(buffer)

// Save directly to file
await rmbg('input.jpg', { output: 'output.png' })
```

### Using Different Models

```typescript
import { rmbg } from 'rmbg'
import { createBriaaiModel, createModnetModel, createU2netpModel } from 'rmbg/models'

// High quality (1024px, 44MB) - best quality
const output = await rmbg('input.jpg', {
  model: createBriaaiModel()
})

// Medium quality (512px, 25MB) - balanced
const output = await rmbg('input.jpg', {
  model: createModnetModel()
})

// Fast (320px, 4.5MB) - fastest, default
const output = await rmbg('input.jpg', {
  model: createU2netpModel()
})
```

### Progress Tracking

```typescript
await rmbg('input.jpg', {
  onProgress: (progress, download, process) => {
    console.log(`Progress: ${Math.round(progress * 100)}%`)
    console.log(`Download: ${Math.round(download * 100)}%`)
    console.log(`Process: ${Math.round(process * 100)}%`)
  }
})
```

### Advanced Options

```typescript
await rmbg('input.jpg', {
  // Custom model
  model: createBriaaiModel(),

  // Maximum output resolution
  maxResolution: 4096,

  // Save to file
  output: 'output.png',

  // Progress callback
  onProgress: (progress) => console.log(`${progress * 100}%`),

  // Abort controller for cancellation
  abortController: new AbortController(),

  // Cache directory (default: os.tmpdir())
  cacheDir: '/tmp/rmbg-models',

  // Enable model caching (default: true)
  enableCache: true
})
```

## Framework Integration

### Express.js

```typescript
import express from 'express'
import multer from 'multer'
import { rmbg } from 'rmbg'

const app = express()
const upload = multer()

app.post('/remove-bg', upload.single('image'), async (req, res) => {
  try {
    const output = await rmbg(req.file.buffer)
    res.contentType('image/png').send(output)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(3000)
```

### Next.js API Route

```typescript
// pages/api/remove-background.ts
import { rmbg } from 'rmbg'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get image from request body (multipart form data)
    const formData = await parseForm(req) // Use multiparty, formidable, etc.
    const output = await rmbg(formData.image)

    res.setHeader('Content-Type', 'image/png')
    res.send(output)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

### AWS Lambda

```typescript
import { rmbg } from 'rmbg'
import { APIGatewayProxyHandler } from 'aws-lambda'

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const imageBuffer = Buffer.from(event.body, 'base64')
    const output = await rmbg(imageBuffer)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'image/png' },
      body: output.toString('base64'),
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

## API Reference

### `rmbg(input, options?)`

Remove background from an image.

**Parameters:**
- `input`: `string | Buffer | Readable` - Image input (file path, URL, Buffer, or stream)
- `options`: `RMBGOptions` (optional) - Configuration options

**Returns:** `Promise<Buffer>` - Processed image as PNG buffer

**Options:**
- `model`: `RMBGModel` - AI model to use (default: u2netp)
- `maxResolution`: `number` - Maximum output resolution (default: 2048)
- `output`: `string | Writable` - Output destination (file path or stream)
- `onProgress`: `(progress, download, process) => void` - Progress callback
- `abortController`: `AbortController` - For cancellation support
- `cacheDir`: `string` - Model cache directory (default: os.tmpdir())
- `enableCache`: `boolean` - Enable model caching (default: true)

### Model Functions

All model functions accept an optional `publicPath` parameter to customize the CDN URL.

- `createU2netpModel(publicPath?)` - Fast (320px, 4.5MB) - **Default**
- `createModnetModel(publicPath?)` - Medium (512px, 25MB)
- `createBriaaiModel(publicPath?)` - High quality (1024px, 44MB)

## Performance

Performance depends on the model and image size:

- **u2netp** (default): 1-2 seconds for typical images
- **modnet**: 2-4 seconds for typical images
- **briaai**: 4-8 seconds for typical images

Models are cached after first download for faster subsequent use.

## Environment Variables

- `RMBG_CACHE_DIR`: Custom cache directory for models
- `RMBG_ENABLE_CACHE`: Set to `false` to disable caching

## System Requirements

- Node.js 18+ (LTS versions)
- Supported platforms: Linux, macOS, Windows
- Native dependencies: Sharp, ONNX Runtime Node

## License

MIT

## Related Packages

- [@rmbg/browser](https://npmjs.com/package/@rmbg/browser) - Browser SDK
- [rmbg-cli](https://npmjs.com/package/rmbg-cli) - Command-line tool
- [rmbg-api](https://npmjs.com/package/rmbg-api) - REST API server

## Credits

Powered by ONNX Runtime and Sharp for high-performance image processing.
