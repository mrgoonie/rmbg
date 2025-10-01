# rmbg-cli

CLI tool for removing backgrounds from images using ONNX Runtime and machine learning models.

## Installation

```bash
npm install -g rmbg-cli
# or
pnpm add -g rmbg-cli
```

## Usage

```bash
# Basic usage (uses u2netp model by default)
rmbg input.jpg

# Specify output path
rmbg input.jpg -o output.png

# Use a different model
rmbg input.jpg -m briaai

# Set maximum resolution
rmbg input.jpg -r 4096
```

## Options

- `-o, --output <path>` - Output image path (default: `<input>-no-bg.png`)
- `-m, --model <model>` - Model to use: `briaai`, `modnet`, `u2netp` (default: `u2netp`)
- `-r, --max-resolution <number>` - Maximum output resolution (default: `2048`)

## Models

- **u2netp** (default) - Fastest, smallest model (4.5MB)
- **modnet** - Medium quality (25MB)
- **briaai** - Highest quality (44MB)

## License

MIT