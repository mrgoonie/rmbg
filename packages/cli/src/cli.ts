#!/usr/bin/env node

import { Command } from 'commander'
import { existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import { resolve, extname, basename } from 'path'
import ora from 'ora'
import chalk from 'chalk'
import { rmbg, createBriaaiModel, createModnetModel, createU2netpModel } from './core'

const program = new Command()

const models = {
  briaai: createBriaaiModel,
  modnet: createModnetModel,
  u2netp: createU2netpModel
}

type ModelName = keyof typeof models

program
  .name('rmbg')
  .description('CLI tool for removing backgrounds from images')
  .version('0.0.1')

program
  .argument('<input>', 'Input image path')
  .option('-o, --output <path>', 'Output image path')
  .option(
    '-m, --model <model>',
    'Model to use (briaai, modnet, u2netp)',
    'modnet'
  )
  .option(
    '-r, --max-resolution <number>',
    'Maximum output resolution',
    '2048'
  )
  .action(async (input: string, options: any) => {
    const inputPath = resolve(input)

    if (!existsSync(inputPath)) {
      console.error(chalk.red(`Error: Input file not found: ${inputPath}`))
      process.exit(1)
    }

    const modelName = options.model as ModelName
    if (!models[modelName]) {
      console.error(
        chalk.red(
          `Error: Invalid model "${modelName}". Available models: ${Object.keys(models).join(', ')}`
        )
      )
      process.exit(1)
    }

    let outputPath = options.output
    if (!outputPath) {
      const ext = extname(inputPath)
      const base = basename(inputPath, ext)
      outputPath = resolve(`${base}-no-bg.png`)
    } else {
      outputPath = resolve(outputPath)
    }

    const maxResolution = parseInt(options.maxResolution, 10)
    if (isNaN(maxResolution) || maxResolution <= 0) {
      console.error(chalk.red('Error: Invalid max resolution'))
      process.exit(1)
    }

    const spinner = ora({
      text: 'Initializing...',
      color: 'cyan'
    }).start()

    try {
      const model = models[modelName]()

      const result = await rmbg(inputPath, {
        model,
        maxResolution,
        onProgress: (progress, download, process) => {
          if (download < 1) {
            spinner.text = `Downloading model... ${(download * 100).toFixed(1)}%`
          } else if (process < 1) {
            spinner.text = `Processing image... ${(process * 100).toFixed(1)}%`
          } else {
            spinner.text = 'Finalizing...'
          }
        }
      })

      await writeFile(outputPath, result)

      spinner.succeed(chalk.green(`Background removed successfully!`))
      console.log(chalk.cyan(`Input: ${inputPath}`))
      console.log(chalk.cyan(`Output: ${outputPath}`))
      console.log(chalk.cyan(`Model: ${modelName}`))
    } catch (error) {
      spinner.fail(chalk.red('Failed to remove background'))
      console.error(
        chalk.red(error instanceof Error ? error.message : String(error))
      )
      process.exit(1)
    }
  })

program.parse()