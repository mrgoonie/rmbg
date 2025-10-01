---
"rmbg": minor
---

Initial release of RMBG Node.js SDK

- Simple API for background removal: `await rmbg('image.jpg')`
- Multiple input formats: file paths, URLs, Buffers, and streams
- Multiple output formats: Buffer, file path, or writable stream
- Support for 3 AI models (u2netp, modnet, briaai)
- Model caching for improved performance
- Progress tracking and operation cancellation
- Comprehensive security hardening (path traversal prevention, SSRF protection)
- Full TypeScript support with ESM and CommonJS builds
- 29 tests with 100% pass rate
