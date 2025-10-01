# rmbg-api

REST API server for removing backgrounds from images using AI models.

> **💡 Note:** If you're building a Node.js application and need programmatic access, consider using the [Node.js SDK (`rmbg`)](../node/README.md) instead. It provides a simpler API without the need for HTTP requests.

## Features

- 🚀 Fast background removal using ONNX Runtime
- 🔒 Privacy-focused - all processing done server-side (no third-party uploads)
- 📦 Multiple model support (u2netp, modnet, briaai, and more)
- 🐳 Docker support for easy deployment
- 📊 Health check and model listing endpoints

## Quick Start

### Using Docker

```bash
# Build the Docker image
docker build -t rmbg-api -f packages/api/Dockerfile .

# Run the container
docker run -p 3000:3000 rmbg-api
```

### Using Node.js

```bash
# Install dependencies
pnpm install

# Build the API
pnpm --filter rmbg-api build

# Start the server
pnpm --filter rmbg-api start

# Or run in development mode
pnpm --filter rmbg-api dev
```

## API Endpoints

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### List Models
```bash
GET /models
```

Response:
```json
{
  "models": [
    {
      "name": "u2netp",
      "resolution": 320,
      "size": 4574861
    },
    ...
  ]
}
```

### Remove Background
```bash
POST /remove-background
Content-Type: multipart/form-data

image: [file]
model: "u2netp" (optional, default: "u2netp")
maxResolution: 2048 (optional, default: 2048)
```

Example using cURL:
```bash
curl -X POST http://localhost:3000/remove-background \
  -F "image=@input.jpg" \
  -F "model=u2netp" \
  -F "maxResolution=2048" \
  --output output.png
```

Example using fetch:
```javascript
const formData = new FormData()
formData.append('image', file)
formData.append('model', 'u2netp')
formData.append('maxResolution', '2048')

const response = await fetch('http://localhost:3000/remove-background', {
  method: 'POST',
  body: formData
})

const blob = await response.blob()
```

## Available Models

- `u2netp` - 320px, 4.5MB (fastest, default)
- `modnet` - 512px, 25MB (medium quality)
- `briaai` - 1024px, 44MB (highest quality)
- `isnet-anime` - 1024px, 168MB (anime-optimized)
- `silueta` - 320px, 43MB (specialized)
- `u2net-cloth` - 768px, 170MB (clothing-focused)

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (production/development)

## Error Handling

The API returns appropriate HTTP status codes and JSON error messages:

- `400` - Bad request (invalid model, missing file, etc.)
- `413` - File too large (max 10MB)
- `500` - Internal server error

Example error response:
```json
{
  "error": "Invalid model",
  "message": "Model \"invalid\" not found. Available models: u2netp, modnet, briaai"
}
```

## Docker Deployment

### Using docker-compose

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  api:
    build:
      context: .
      dockerfile: packages/api/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
    restart: unless-stopped
```

Run:
```bash
docker-compose up -d
```

### Production Considerations

1. **Resource Limits**: Set appropriate CPU/memory limits
2. **Load Balancing**: Use multiple instances behind a load balancer
3. **Caching**: Consider caching model downloads
4. **Monitoring**: Implement logging and monitoring solutions
5. **Rate Limiting**: Add rate limiting middleware for production use

## License

See root LICENSE file.