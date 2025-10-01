# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1] - 2025-10-01

### Added
- Initial release of RMBG Node.js SDK
- Simple API: `await rmbg('image.jpg')` for background removal
- Multiple input formats support: file paths, URLs, Buffers, and streams
- Multiple output formats support: Buffer (default), file path, or writable stream
- Support for multiple AI models:
  - u2netp (320px, 4.5MB) - Fast, default model
  - modnet (512px, 25MB) - Medium quality
  - briaai (1024px, 44MB) - High quality
- Model caching for improved performance
- Progress tracking with `onProgress` callback
- Operation cancellation with `AbortController`
- Configurable cache directory and maximum resolution
- Comprehensive TypeScript definitions
- Full ESM and CommonJS support

### Security
- Path traversal prevention for file operations
- SSRF attack prevention for URL downloads
- Blocked access to localhost, private IPs, and cloud metadata endpoints
- File size validation (50MB maximum)
- Image format validation using Sharp
- Protection against writing to system directories
- Content-Type validation for URL downloads
- Redirect limit (max 3 redirects)

### Documentation
- Comprehensive README with usage examples
- Framework integration examples (Express.js, Next.js, AWS Lambda)
- API reference documentation
- Security best practices

### Testing
- 29 tests covering:
  - Unit tests for input/output handlers
  - Security tests for path traversal and SSRF
  - Integration tests for end-to-end processing
  - Validation tests for image formats and sizes
- 100% pass rate

[unreleased]: https://github.com/mrgoonie/rmbg/compare/rmbg@0.0.1...HEAD
[0.0.1]: https://github.com/mrgoonie/rmbg/releases/tag/rmbg@0.0.1
