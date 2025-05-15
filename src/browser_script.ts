import BrowserRenderer from "./BrowserRenderer.js";

export const WORLD_NAME = "Empty_Hills";

const FILESYSTEM: { [index: string]: any } = {
    "Empty_Hills/CONFIG.json": {
        "seed": 12345,
        "maxHeight": 50,
        "width": 20,
        "height": 20,
        "q": 0,
        "r": 0,
        "biomeSize": 1,
        "biomes": [
            [1, "hills"]
        ]
    },
    "Empty_Hills/biomes/hills.json": {
        "colour": [0, 255, 0],
        "ranges": [
            [1, "hills"]
        ],
        "hills": {
            "colour": [255, 255, 255],
            "altitudeSurfaces": [
                [50, "medium_grass"]
            ],
            "amplitudes": [0, 0, 0, 1, 0.5],
            "heightDisplacement": -16,
            "heightMultiplier": 40
        }
    }
};

export function createCanvas(width: number, height: number): HTMLCanvasElement {
    console.log("Creating canvas");
    let canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    document.getElementById("surface-layer")!.appendChild(canvas);
    return canvas;
}

export function writeFileSync(filepath: string, data: string): void {
    FILESYSTEM[filepath] = data;
}

// TODO
export function existsSync(filepath: string): boolean {
    return Object.keys(FILESYSTEM).includes(filepath);
}

export function mkdirSync(filepath: string): void {
    return;
}

// TODO
export function loadJSON(filepath: string): object {
    return FILESYSTEM[filepath];
}

// const SPRITE_NAMES = ["archers_tree", "baby_archers_tree", "bruce_tree", "daisy_poppy_bed", "fat_bruce_tree", "glim_rock", "long_grass_block", "medium_grass_block", "medium_moonflower", "moonflower", "niamh_tree", "plank_tree", "ploon_tree", "poppy_bed_1", "poppy_bed_2", "sand_block", "short_grass_block", "snow_block", "stone_block", "water_block"];

export const IN_BROWSER = true;

// load sprite images from system
const IMAGES: { [index: string]: any } = {};
// TODO: initialise IMAGES

export const SPRITE_IMAGES: { [index: string]: any } = IMAGES;

export const RENDERER = new BrowserRenderer();
