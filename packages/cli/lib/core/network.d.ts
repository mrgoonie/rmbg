/// <reference types="node" />
import { RMBGModel } from './types';
export declare function loadModel(model: RMBGModel, options?: {
    onProgress?: (progress: number) => void;
}): Promise<Buffer>;
