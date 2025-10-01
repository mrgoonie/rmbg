export interface RMBGModel {
    name: string;
    files: string[];
    mime: string;
    publicPath: string;
    resolution: number;
    size: number;
}
export interface RMBGOptions {
    model: RMBGModel;
    maxResolution?: number;
    onProgress?: (progress: number, download: number, process: number) => void;
}
export declare const defaultMaxResolution = 2048;
//# sourceMappingURL=types.d.ts.map