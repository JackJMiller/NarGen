import fs from "fs";
import { Image, loadImage } from "canvas";

export function loadJSON<T>(filepath: string): T {
    let object = fs.readFileSync(filepath).toString();
    return JSON.parse(object) as T;
}

const SPRITE_NAMES = ["archers_tree", "baby_archers_tree", "bruce_tree", "daisy_poppy_bed", "fat_bruce_tree", "glim_rock", "long_grass_block", "medium_grass_block", "medium_moonflower", "moonflower", "niamh_tree", "plank_tree", "ploon_tree", "poppy_bed_1", "poppy_bed_2", "sand_block", "short_grass_block", "snow_block", "stone_block", "water_block"];

// load sprite images from system
const IMAGES: { [index: string]: Image } = {};
for (let spriteName of SPRITE_NAMES){
    let image = await loadImage(`/home/jack/Development/NarGen/res/sprites/${spriteName}.png`);      
    IMAGES[spriteName] = image;
}
export const SPRITE_IMAGES: { [index: string]: Image } = IMAGES;
