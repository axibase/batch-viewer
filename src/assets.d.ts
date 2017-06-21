/**
 * Contains module declarations for non-*script files.
 * Used for Webpack compatibility
 */

declare module "*.svg" {
    const svg: string;
    export default svg;
}

declare module "*.css" {
    const classNames: { [className: string]: string };
    export = classNames;
}

declare module "*.less" {
    const classNames: { [className: string]: string };
    export = classNames;
}

declare module "*/units.json" {
    const assets: Asset[];
    export default assets;
}

declare module "*/batches.json" {
    const batches: Batch[];
    export default batches;
}

declare module "*.json" {
    const data: any;
    export default data;
}

// Define plugin substitutions
declare const __debug: boolean;
declare const __release: boolean;