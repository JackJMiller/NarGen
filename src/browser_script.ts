const FILESYSTEM: { [index: string]: string } = {};

// TODO
export function writeFileSync(filepath: string, data: string): void {
    FILESYSTEM[filepath] = data;
}

// TODO
export function existsSync(filepath: string): boolean {
    return true;
}

// TODO
export function mkdirSync(filepath: string): void {
    return;
}

// TODO
export function loadJSON(filepath: string): any {
    return JSON.parse(FILESYSTEM[filepath]);
}

export const SPRITE_IMAGES = [];
