/// <reference types="node" />
import { RMBGOptions } from './types';
export declare function rmbg(inputPath: string, { model, maxResolution, onProgress }: RMBGOptions): Promise<Buffer>;
export * from './types';
export * from './models';
