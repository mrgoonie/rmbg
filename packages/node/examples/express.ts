/**
 * Express.js integration example
 * Install: npm install express multer @types/express @types/multer
 */
import express from 'express'
import multer from 'multer'
import { rmbg } from '../src/index'

const app = express()
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }) // 50MB limit

app.post('/remove-bg', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' })
    }

    const outputBuffer = await rmbg(req.file.buffer, {
      onProgress: (progress) => {
        console.log(`Processing: ${Math.round(progress * 100)}%`)
      }
    })

    res.contentType('image/png').send(outputBuffer)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Upload images to http://localhost:${PORT}/remove-bg`)
})
