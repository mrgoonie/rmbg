import { tmpdir } from 'os'
import { join } from 'path'
import { createU2netpModel } from '../core/models'

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  /** Default model to use */
  model: createU2netpModel(),

  /** Default maximum resolution */
  maxResolution: 2048,

  /** Default cache directory */
  cacheDir: join(tmpdir(), 'rmbg-models'),

  /** Enable caching by default */
  enableCache: true
}

/**
 * Environment variable overrides
 */
export function getConfigFromEnv() {
  return {
    cacheDir: process.env.RMBG_CACHE_DIR || DEFAULT_CONFIG.cacheDir,
    enableCache: process.env.RMBG_ENABLE_CACHE !== 'false'
  }
}
