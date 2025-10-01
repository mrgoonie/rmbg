import { Readable, Writable } from 'stream'

export interface RMBGModel {
  name: string
  files: string[]
  mime: string
  publicPath: string
  resolution: number
  size: number
}

export type ImageInput =
  | string // file path or URL
  | Buffer // image buffer
  | Readable // readable stream

export type ImageOutput =
  | Buffer // default
  | string // file path to save
  | Writable // writable stream

export interface RMBGOptions {
  /** AI model to use for background removal (optional, defaults to u2netp) */
  model?: RMBGModel

  /** Maximum output resolution (default: 2048) */
  maxResolution?: number

  /** Output destination (default: Buffer) */
  output?: string | Writable

  /** Progress callback */
  onProgress?: (progress: number, download: number, process: number) => void

  /** Abort controller for cancellation */
  abortController?: AbortController

  /** Model cache directory (default: os.tmpdir()) */
  cacheDir?: string

  /** Enable model caching (default: true) */
  enableCache?: boolean
}

export const defaultMaxResolution = 2048