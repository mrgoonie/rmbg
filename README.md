# RMBG

RMBG is a image background removal application that runs on multiple platforms and incorporates a variety of open-source AI models. Designed with a strong emphasis on user privacy, RMBG does not upload your files to any servers, ensuring that your data remains secure and private.

- AI-Powered background removal
- Privacy and local execution
- Open source and free

## Features

- 🎨 **Multiple Platforms**: Browser SDK, CLI, Desktop (Tauri), and REST API
- 🤖 **Multiple AI Models**: Support for 6+ ONNX models with different quality/speed tradeoffs
- 🔒 **Privacy-First**: All processing happens locally (browser/CLI) or server-side (API) - no third-party uploads
- ⚡ **High Performance**: Optimized with ONNX Runtime (Web/Node)
- 🎯 **Easy to Use**: Simple APIs for all platforms

## Available Packages

### Browser SDK (`@rmbg/browser`)
Client-side background removal using WebAssembly and ONNX Runtime Web.

```bash
npm install @rmbg/browser
```

```javascript
import { rmbg } from '@rmbg/browser'
import { createU2netpModel } from '@rmbg/browser/models'

const model = createU2netpModel()
const blob = await rmbg(imageFile, { model })
```

### CLI (`rmbg-cli`)
Command-line tool for batch processing images.

**Installation:**
```bash
npm install -g rmbg-cli
# or
pnpm install -g rmbg-cli
```

**Basic Usage:**
```bash
# Remove background from image (uses modnet by default)
rmbg input.jpg -o output.png

# Specify a model
rmbg input.jpg -o output.png -m briaai

# Set max resolution
rmbg input.jpg -o output.png -r 4096
```

**CLI Options:**
```bash
Usage: rmbg [options] <input>

Arguments:
  input                    Input image path

Options:
  -o, --output <path>      Output image path (default: input-no-bg.png)
  -m, --model <model>      Model to use: briaai, modnet, u2netp (default: modnet)
  -r, --max-resolution <n> Maximum output resolution (default: 2048)
  -h, --help               Display help
  -V, --version            Display version
```

**Examples:**
```bash
# Basic usage
rmbg photo.jpg
# Output: photo-no-bg.png

# High quality with briaai model
rmbg portrait.jpg -m briaai -o portrait-clean.png

# Fast processing with u2netp
rmbg product.png -m u2netp -o product-nobg.png

# 4K output
rmbg image.jpg -r 4096 -o image-4k.png
```

### Desktop App (`@rmbg/desktop`)
Tauri-based desktop application with drag-and-drop interface.

```bash
cd packages/desktop
pnpm install
pnpm tauri build
```

### REST API (`rmbg-api`)
HTTP API server for background removal service.

**Quick Start with Docker:**
```bash
# Clone and run
git clone <repository-url>
cd rmbg
docker compose up -d

# Test it
curl http://localhost:3000/health
```

**Or using Node.js:**
```bash
pnpm install
pnpm --filter rmbg-api build
pnpm --filter rmbg-api start
```

**Web Interface:**

Open http://localhost:3000 in your browser for an interactive web UI with:
- 🎨 Live image upload and processing
- 📊 Model selection (6 AI models available)
- 📖 Complete API documentation
- ⬇️ Direct download of processed images

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Web UI interface |
| GET | `/health` | Health check |
| GET | `/models` | List available models |
| POST | `/remove-background` | Remove background |

**API Usage Examples:**

**Basic cURL:**
```bash
# Default model (modnet)
curl -X POST http://localhost:3000/remove-background \
  -F "image=@input.jpg" \
  --output output.png

# Specific model
curl -X POST http://localhost:3000/remove-background \
  -F "image=@input.jpg" \
  -F "model=briaai" \
  --output output.png

# Custom resolution
curl -X POST http://localhost:3000/remove-background \
  -F "image=@input.jpg" \
  -F "model=briaai" \
  -F "maxResolution=4096" \
  --output output.png
```

**JavaScript/TypeScript:**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('model', 'modnet');
formData.append('maxResolution', '2048');

const response = await fetch('http://localhost:3000/remove-background', {
  method: 'POST',
  body: formData
});

const blob = await response.blob();
const url = URL.createObjectURL(blob);
```

**Python:**
```python
import requests

url = 'http://localhost:3000/remove-background'
files = {'image': open('photo.jpg', 'rb')}
data = {'model': 'modnet', 'maxResolution': '2048'}

response = requests.post(url, files=files, data=data)

with open('result.png', 'wb') as f:
    f.write(response.content)
```

**Request Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image` | File | Yes | - | Image file (JPEG, PNG, WebP, max 10MB) |
| `model` | String | No | `modnet` | Model name (see available models below) |
| `maxResolution` | Number | No | `2048` | Max output resolution (1-4096) |

**Response:**
- **Success**: PNG image with transparent background (Content-Type: `image/png`)
- **Error**: JSON with error details

**Error Responses:**
```json
// Missing image
{
  "error": "No image file provided",
  "message": "Please upload an image file using the 'image' field"
}

// Invalid model
{
  "error": "Invalid model",
  "message": "Model 'xyz' not found. Available models: u2netp, modnet, briaai, isnet-anime, silueta, u2net-cloth"
}

// File too large
{
  "error": "File too large",
  "message": "Maximum file size is 10MB"
}
```

## Available Models

| Model | Resolution | Size | Description |
|-------|------------|------|-------------|
| **modnet** | 512px | 25MB | **Default** - Best balance of quality/speed |
| u2netp | 320px | 4.5MB | Fastest, lightweight |
| briaai | 1024px | 44MB | Highest quality |
| isnet-anime | 1024px | 168MB | Optimized for anime/manga |
| silueta | 320px | 43MB | Portrait-focused |
| u2net-cloth | 768px | 170MB | Clothing/fashion-focused |

## Quick Start

### Using Docker (API Server)

1. Clone the repository:
```bash
git clone <repository-url>
cd rmbg
```

2. Run with Docker Compose:
```bash
docker-compose up -d
```

3. Test the API:
```bash
curl -X POST http://localhost:3000/remove-background \
  -F "image=@test.jpg" \
  --output result.png
```

### Using npm/pnpm

1. Install dependencies:
```bash
pnpm install
```

2. Build all packages:
```bash
pnpm -r build
```

3. Run a specific package:
```bash
# Browser demo
pnpm --filter @rmbg/browser dev

# CLI
pnpm --filter rmbg-cli dev input.jpg

# API server
pnpm --filter rmbg-api dev

# Desktop app
pnpm --filter @rmbg/desktop tauri dev
```

## Development

This is a pnpm monorepo with the following structure:

```
rmbg/
├── packages/
│   ├── api/           # REST API server (Express + ONNX Runtime Node)
│   ├── browser/       # Browser SDK (ONNX Runtime Web)
│   ├── cli/           # Command-line tool (Node.js + Sharp)
│   ├── desktop/       # Desktop app (Tauri + React)
│   ├── website/       # Documentation (Docusaurus)
│   └── model-*/       # ONNX model packages
├── docker-compose.yml # Docker Compose for API server
└── pnpm-workspace.yaml
```

### Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r build

# Create changeset for version bump
pnpm changeset

# Version bump
pnpm changeset version

# Publish packages
pnpm changeset publish

# Lint
pnpm -r lint
```

## Architecture

### Browser & CLI Processing Pipeline

1. **Model Loading**: Download ONNX model chunks from CDN
2. **Image Preprocessing**: Load, resize, normalize to Float32Array
3. **Inference**: Run through ONNX Runtime
4. **Post-processing**: Extract alpha mask, resize, apply to original image
5. **Output**: PNG with transparency

### API Server

- **Framework**: Express.js with TypeScript
- **Upload**: Multer for multipart/form-data (10MB limit)
- **Processing**: Same core logic as CLI (Sharp + ONNX Runtime Node)
- **Deployment**: Docker with multi-stage builds

## API Documentation

Full API documentation is available in [`packages/api/README.md`](packages/api/README.md).

### Authentication
Currently no authentication is required. Consider adding API keys or rate limiting for production use.

### Rate Limiting
No rate limiting is implemented by default. For production deployment, consider using middleware like `express-rate-limit`.

### CORS
CORS is enabled for all origins by default. Configure appropriately for production.

## Docker Deployment

### Production Considerations

1. **Resource Limits**: Set CPU/memory limits in docker-compose.yml
2. **Load Balancing**: Use multiple API instances behind nginx/traefik
3. **Monitoring**: Add logging (Winston, Pino) and metrics (Prometheus)
4. **Security**:
   - Add rate limiting
   - Implement authentication
   - Configure CORS properly
   - Use HTTPS in production

Example docker-compose with resource limits:
```yaml
services:
  api:
    build:
      context: .
      dockerfile: packages/api/Dockerfile
    ports:
      - "3000:3000"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    restart: unless-stopped
```

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## License

See LICENSE file for details.