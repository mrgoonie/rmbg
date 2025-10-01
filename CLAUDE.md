# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RMBG is a privacy-focused image background removal application using AI models. It runs locally without uploading files to servers, supporting browser, desktop (Tauri), and CLI platforms.

**Key principle**: All processing happens locally using ONNX Runtime (Web/Node) - no server uploads.

## Repository Structure

This is a **pnpm monorepo** with the following packages:

- **`packages/browser/`** - Browser SDK using onnxruntime-web
  - Main entry: iframe-based isolation pattern (see `src/index.ts`)
  - Runtime: isolated worker via `src/runtime.ts` (handles postMessage communication)
  - Core logic: `src/core/index.ts` (ONNX inference, image processing)

- **`packages/node/`** - Node.js SDK using onnxruntime-node
  - Entry: `src/index.ts` (main API with `rmbg()` function)
  - Core: `src/core/index.ts` (ONNX inference, uses Sharp for image processing)
  - Models: `src/models.ts` (model factory functions)
  - Security: `src/core/security.ts` (SSRF prevention, path traversal protection)
  - Input support: file paths, URLs, Buffers, streams
  - Output support: Buffer, file path, writable stream
  - Full TypeScript support with ESM and CommonJS builds
  - 28 tests covering all functionality

- **`packages/cli/`** - Node.js CLI tool using onnxruntime-node
  - Entry: `src/cli.ts` (commander-based CLI)
  - Core: `src/core/index.ts` (uses Sharp for image processing)

- **`packages/desktop/`** - Tauri desktop app
  - Frontend: React + Vite
  - Backend: Rust (Tauri) in `src-tauri/`

- **`packages/website/`** - Docusaurus documentation site

- **`packages/model-*`** - ONNX model packages (published to npm)
  - `model-briaai` (1024px, 44MB) - highest quality
  - `model-modnet` (512px, 25MB) - medium quality
  - `model-u2netp` (320px, 4.5MB) - fastest, default
  - `model-isnet-anime`, `model-silueta`, `model-u2net-cloth` - specialized models

## Architecture

### Background Removal Pipeline

1. **Model Loading**: Download ONNX model chunks from CDN (unpkg.com by default)
2. **Image Preprocessing**:
   - Load image → convert to ImageData/Buffer
   - Resize to model resolution (320/512/1024)
   - Normalize to Float32Array: `(pixel - mean) / std`
3. **Inference**: Run through ONNX Runtime
4. **Post-processing**:
   - Extract alpha mask from model output
   - Resize mask back to original dimensions
   - Apply mask to original image (set alpha channel)
5. **Output**: PNG with transparency

### Platform Implementations

- **Browser** (`packages/browser/`):
  - Uses `createImageBitmap` and Canvas API for image manipulation
  - Downloads models via `fetch()` with progress tracking
  - Runs in iframe for isolation (prevents blocking main thread)
  - Uses `onnxruntime-web` with WASM backend

- **Node.js SDK** (`packages/node/`):
  - Uses `sharp` library for high-performance image processing
  - Downloads models via `https.get()` with progress tracking
  - Uses `onnxruntime-node` with native CPU execution
  - Model caching in temp directory (configurable)
  - Programmatic API with multiple input/output formats
  - Security hardening (SSRF prevention, path traversal protection)

- **CLI** (`packages/cli/`):
  - Uses `sharp` library for high-performance image processing
  - Downloads models via `http`/`https` modules
  - Uses `onnxruntime-node` with native CPU execution
  - Progress reporting via `ora` spinners

### Model Configuration

Models are defined with:
```typescript
{
  name: string           // model identifier
  files: string[]        // ONNX file chunks to download
  publicPath: string     // CDN base URL
  resolution: number     // input size (320/512/1024)
  size: number          // total bytes (for progress)
  mime: string          // 'application/octet-stream'
}
```

## Development Commands

### Monorepo (root)

```bash
pnpm install              # Install all dependencies
pnpm -r build             # Build all packages
pnpm changeset            # Create changeset for version bump
pnpm changeset version    # Bump versions
pnpm changeset publish    # Publish packages
```

### Browser SDK

```bash
cd packages/browser
pnpm dev                  # Start Vite dev server
pnpm build                # Build library + demo (dist/ + lib/)
pnpm build:lib            # Build library only (lib/)
pnpm build:dist           # Build demo only (dist/)
```

Exports:
- Default: main API (iframe-based)
- `./models`: model factory functions
- `./runtime`: isolated runtime (for iframe)

### Node.js SDK

```bash
cd packages/node
pnpm dev                  # Run tests in watch mode
pnpm build                # Build ESM and CommonJS (lib/)
pnpm test                 # Run all tests (28 tests)
pnpm typecheck            # Type check TypeScript
```

Exports:
- Default: `rmbg()` function
- `./models`: model factory functions (createU2netpModel, createModnetModel, createBriaaiModel)

Usage:
```typescript
import { rmbg } from 'rmbg'
import { createBriaaiModel } from 'rmbg/models'

const output = await rmbg('input.jpg', { model: createBriaaiModel() })
```

### CLI

```bash
cd packages/cli
pnpm dev input.jpg        # Run CLI via tsx (no build needed)
pnpm build                # Compile TypeScript → lib/
node lib/cli.js input.jpg # Run built CLI
```

Options: `-m <model>`, `-o <output>`, `-r <max-resolution>`

### Desktop (Tauri)

```bash
cd packages/desktop
pnpm dev                  # Start Tauri in dev mode
pnpm build                # Build desktop app
pnpm tauri <cmd>          # Run Tauri commands
```

Dev server runs on port 11420.

### Website (Docusaurus)

```bash
cd packages/website
pnpm start                # Dev server with hot reload
pnpm build                # Build static site
pnpm serve                # Preview production build
```

## Important Technical Details

### Image Processing Utils

**Browser** (`packages/browser/src/core/utils.ts`):
- `imageSourceToImageData()` - Converts string/URL/Blob/ArrayBuffer to ImageData
- `imageDataResize()` - Uses `createImageBitmap` with `resizeQuality: 'high'`
- `imageDataToFloat32Array()` - Converts RGBA to planar RGB float32 (CHW format)
- `imageDataToBlob()` - Converts back to PNG/JPEG blob

**Node.js SDK** (`packages/node/src/core/utils.ts`):
- Uses Sharp for all image operations
- `imageDataToFloat32Array()` - Converts Uint8ClampedArray to planar float32
- `loadImageFromSource()` - Handles file paths, URLs, Buffers, streams
- `saveImageToDestination()` - Saves to file path or writable stream
- Security validation for URLs and file paths

**CLI** (`packages/cli/src/core/utils.ts`):
- Uses Sharp for all image operations
- `imageDataToFloat32Array()` - Converts Uint8ClampedArray to planar float32

### Network Loading

- Models split into chunks for better caching and parallel downloads
- Progress tracking: `loaded / totalSize`
- Supports AbortController for cancellation
- Browser: `fetch()` with `response.body.getReader()`
- CLI: `http.get()` with stream chunks

### ONNX Runtime Configuration

**Browser**:
```javascript
{
  executionProviders: ['wasm'],
  graphOptimizationLevel: 'all',
  executionMode: 'parallel',
  enableCpuMemArena: true
}
```

**Node.js SDK & CLI**:
```javascript
{
  executionProviders: ['cpu'],
  graphOptimizationLevel: 'all',
  enableCpuMemArena: true
}
```

## Adding New Models

1. Create `packages/model-<name>/` directory
2. Add ONNX files (split large models into chunks)
3. Add package.json with version
4. Add model factory to:
   - `packages/browser/src/models.ts` (for browser SDK)
   - `packages/node/src/models.ts` (for Node.js SDK)
   - `packages/cli/src/core/models.ts` (for CLI)
5. Publish model package to npm

## Testing

When testing background removal:
- Use images with clear foreground/background separation
- Test different resolutions (small/medium/large)
- Verify progress callbacks work
- Check output file size is reasonable
- Ensure transparency is preserved in PNG output

## Changesets

This repo uses **@changesets/cli** for version management:
- Run `pnpm changeset` after making changes
- Select packages that changed
- Choose semver bump (major/minor/patch)
- Write changeset description
- Commit the `.changeset/*.md` file

The `@rmbg/website` package is ignored in changeset config.

---

## Development Rules

### General
- Use `bun` instead of `npm` or `yarn` or `pnpm` for package management
- Use `context7` mcp tools for exploring latest docs of plugins/packages
- Use `eyes` mcp tools for describing details of images, videos, documents, etc.
- Use `hands` mcp tools for generating images, videos, documents, etc.
- Use `brain` mcp tools for sequential thinking, analyzing code, debugging, etc.
- Follow [these principles](https://www.anthropic.com/engineering/writing-tools-for-agents) to write effective tools for AI agents.

### Code Quality Guidelines
- Read and follow strictly codebase structure and code standards in `./docs`
- Don't be too harsh on code linting, but make sure there are no syntax errors and code are compilable
- Prioritize functionality and readability over strict style enforcement and code formatting
- Use reasonable code quality standards that enhance developer productivity
- Use try catch error handling & cover security standards
- Use `code-reviewer` agent to review code after every implementation
- Always use `debugger` agent to analyze `./logs.txt` to find possible root causes and provide a report with solutions.
- Use `bun run typecheck` to check type errors and fix them all.
- Make sure the code is compilable and runs successfully without any errors.

### Pre-commit/Push Rules
- Run linting before commit
- Run tests before push (DO NOT ignore failed tests just to pass the build or github actions)
- Keep commits focused on the actual code changes
- **DO NOT** commit and push any confidential information (such as dotenv files, API keys, database credentials, etc.) to git repository!
- NEVER automatically add AI attribution signatures like:
  "🤖 Generated with [Claude Code]"
  "Co-Authored-By: Claude noreply@anthropic.com"
  Any AI tool attribution or signature
- Create clean, professional commit messages without AI references. Use conventional commit format.