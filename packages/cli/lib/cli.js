#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const core_1 = require("./core");
const program = new commander_1.Command();
const models = {
    briaai: core_1.createBriaaiModel,
    modnet: core_1.createModnetModel,
    u2netp: core_1.createU2netpModel
};
program
    .name('rmbg')
    .description('CLI tool for removing backgrounds from images')
    .version('0.0.1');
program
    .argument('<input>', 'Input image path')
    .option('-o, --output <path>', 'Output image path')
    .option('-m, --model <model>', 'Model to use (briaai, modnet, u2netp)', 'u2netp')
    .option('-r, --max-resolution <number>', 'Maximum output resolution', '2048')
    .action(async (input, options) => {
    const inputPath = (0, path_1.resolve)(input);
    if (!(0, fs_1.existsSync)(inputPath)) {
        console.error(chalk_1.default.red(`Error: Input file not found: ${inputPath}`));
        process.exit(1);
    }
    const modelName = options.model;
    if (!models[modelName]) {
        console.error(chalk_1.default.red(`Error: Invalid model "${modelName}". Available models: ${Object.keys(models).join(', ')}`));
        process.exit(1);
    }
    let outputPath = options.output;
    if (!outputPath) {
        const ext = (0, path_1.extname)(inputPath);
        const base = (0, path_1.basename)(inputPath, ext);
        outputPath = (0, path_1.resolve)(`${base}-no-bg.png`);
    }
    else {
        outputPath = (0, path_1.resolve)(outputPath);
    }
    const maxResolution = parseInt(options.maxResolution, 10);
    if (isNaN(maxResolution) || maxResolution <= 0) {
        console.error(chalk_1.default.red('Error: Invalid max resolution'));
        process.exit(1);
    }
    const spinner = (0, ora_1.default)({
        text: 'Initializing...',
        color: 'cyan'
    }).start();
    try {
        const model = models[modelName]();
        const result = await (0, core_1.rmbg)(inputPath, {
            model,
            maxResolution,
            onProgress: (progress, download, process) => {
                if (download < 1) {
                    spinner.text = `Downloading model... ${(download * 100).toFixed(1)}%`;
                }
                else if (process < 1) {
                    spinner.text = `Processing image... ${(process * 100).toFixed(1)}%`;
                }
                else {
                    spinner.text = 'Finalizing...';
                }
            }
        });
        await (0, promises_1.writeFile)(outputPath, result);
        spinner.succeed(chalk_1.default.green(`Background removed successfully!`));
        console.log(chalk_1.default.cyan(`Input: ${inputPath}`));
        console.log(chalk_1.default.cyan(`Output: ${outputPath}`));
        console.log(chalk_1.default.cyan(`Model: ${modelName}`));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to remove background'));
        console.error(chalk_1.default.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=cli.js.map