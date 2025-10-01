import { rmbg } from '../src/index'
import { createU2netpModel } from '../src/core/models'
import { writeFileSync } from 'fs'

async function main() {
  try {
    console.log('Starting background removal...')

    // Simple usage - defaults to u2netp model
    const output = await rmbg('./input.jpg', {
      onProgress: (progress, download, process) => {
        console.log(`Progress: ${Math.round(progress * 100)}%`)
      }
    })

    // Save to file
    writeFileSync('./output.png', output)

    console.log('✓ Background removed successfully!')
    console.log(`Output size: ${(output.length / 1024).toFixed(2)} KB`)
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
