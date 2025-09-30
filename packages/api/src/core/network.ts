import * as https from 'https'
import * as http from 'http'
import { RMBGModel } from './types.js'

async function downloadFile(
  url: string,
  onProgress?: (loaded: number) => void
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http

    client.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        if (response.headers.location) {
          return downloadFile(response.headers.location, onProgress)
            .then(resolve)
            .catch(reject)
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`))
        return
      }

      const chunks: Buffer[] = []
      let receivedLength = 0

      response.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
        receivedLength += chunk.length
        onProgress?.(receivedLength)
      })

      response.on('end', () => {
        resolve(Buffer.concat(chunks))
      })

      response.on('error', reject)
    }).on('error', reject)
  })
}

export async function loadModel(
  model: RMBGModel,
  options?: {
    onProgress?: (progress: number) => void
  }
): Promise<Buffer> {
  const { onProgress } = options ?? {}
  const loaded: number[] = Array(model.files.length)

  const chunks = await Promise.all(
    model.files.map(async (file, index) => {
      loaded[index] = 0
      const url = model.publicPath + file

      return downloadFile(url, (length) => {
        loaded[index] = length
        onProgress?.(loaded.reduce((acc, item) => acc + item, 0) / model.size)
      })
    })
  )

  const data = Buffer.concat(chunks)

  if (data.length !== model.size) {
    throw new Error(
      `Failed to fetch ${model.name} with size ${model.size} but got ${data.length}`
    )
  }

  return data
}