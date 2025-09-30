import express, { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import cors from 'cors'
import { rmbg, createU2netpModel, createModnetModel, createBriaaiModel, createIsnetAnimeModel, createSiluetaModel, createU2netClothModel } from './core/index.js'

const app = express()
const port = process.env.PORT || 3000

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'))
    }
  }
})

// Middleware
app.use(cors())
app.use(express.json())

// Model registry
const models = {
  'u2netp': createU2netpModel(),
  'modnet': createModnetModel(),
  'briaai': createBriaaiModel(),
  'isnet-anime': createIsnetAnimeModel(),
  'silueta': createSiluetaModel(),
  'u2net-cloth': createU2netClothModel()
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

// List available models endpoint
app.get('/models', (req: Request, res: Response) => {
  const modelsList = Object.entries(models).map(([key, model]) => ({
    name: key,
    resolution: model.resolution,
    size: model.size
  }))

  res.json({
    models: modelsList
  })
})

// Background removal endpoint
app.post('/remove-background', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({
        error: 'No image file provided',
        message: 'Please upload an image file using the "image" field'
      })
      return
    }

    // Get model name from query or body (default to u2netp)
    const modelName = (req.query.model as string) || (req.body.model as string) || 'u2netp'
    const maxResolution = parseInt((req.query.maxResolution as string) || (req.body.maxResolution as string) || '2048')

    // Validate model
    if (!models[modelName as keyof typeof models]) {
      res.status(400).json({
        error: 'Invalid model',
        message: `Model "${modelName}" not found. Available models: ${Object.keys(models).join(', ')}`
      })
      return
    }

    // Validate maxResolution
    if (isNaN(maxResolution) || maxResolution < 1 || maxResolution > 4096) {
      res.status(400).json({
        error: 'Invalid maxResolution',
        message: 'maxResolution must be a number between 1 and 4096'
      })
      return
    }

    const model = models[modelName as keyof typeof models]

    console.log(`Processing image with model: ${modelName}, maxResolution: ${maxResolution}`)

    // Process the image
    const resultBuffer = await rmbg(req.file.buffer, {
      model,
      maxResolution,
      onProgress: (progress) => {
        // Could implement WebSocket for real-time progress updates
        console.log(`Progress: ${(progress * 100).toFixed(2)}%`)
      }
    })

    // Set response headers
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Content-Disposition', `attachment; filename="removed-bg-${Date.now()}.png"`)

    // Send the processed image
    res.send(resultBuffer)
  } catch (error) {
    next(error)
  }
})

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error.message)

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        error: 'File too large',
        message: 'Maximum file size is 10MB'
      })
      return
    }
  }

  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  })
})

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: 'Endpoint not found'
  })
})

// Start server
app.listen(port, () => {
  console.log(`RMBG API server running on port ${port}`)
  console.log(`Available endpoints:`)
  console.log(`  GET  /health - Health check`)
  console.log(`  GET  /models - List available models`)
  console.log(`  POST /remove-background - Remove background from image`)
})