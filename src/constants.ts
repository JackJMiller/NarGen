import fs from "fs";
import path from "path";
import { mkAlea } from "./lib/alea";

function set_default_root_blocks(root_blocks: any) {
    for (let sprite_name of SPRITE_NAMES) {
        if (!Object.keys(root_blocks).includes(sprite_name)) {
            root_blocks[sprite_name] = ["short_grass", "medium_grass", "long_grass"];
        }
    }
}

export const SURFACES: { [index: string]: Colour } = {
    "water": [80, 180, 255],
    "short_grass": [108, 210, 26],
    "medium_grass": [108, 210, 26],
    "long_grass": [108, 210, 26],
    "sand": [255, 240, 130],
    "stone": [80, 80, 80],
    "dirt": [90, 60, 30],
    "snow": [255, 255, 255],
    "lava": [240, 30, 0],
    "coal": [0, 0, 0]
};

export const SPRITE_NAMES = fs.readdirSync("res/sprites").map((filepath: string) => path.parse(filepath).name);

export const AVAILABLE_BLOCKS = ["grass", "lava", "sand", "snow", "stone", "water"];

export const ORNAMENTATION_ROOT_BLOCKS: any = {};

set_default_root_blocks(ORNAMENTATION_ROOT_BLOCKS);

export const CHUNK_SIZE = 20;
export const BASE_BIOME_SIZE = 400;

export const OCTAVE_COUNT = 5;

export const SAVE_IMAGE_BIOME_MAP = false;
export const SAVE_IMAGE_SURFACE_MAP = false;
export const SAVE_IMAGE_OCTAVE = false;
export const SAVE_IMAGE_OVERLAYED = true;

export const COLOUR_NONE = "\x1b[0m";
export const COLOUR_RED = "\x1b[0;31m";
export const COLOUR_GREEN = "\x1b[0;32m";
export const COLOUR_YELLOW = "\x1b[2;33m";
export const COLOUR_BLUE = "\x1b[0;34m";
export const COLOUR_MAGENTA = "\x1b[0;35m";
export const COLOUR_CYAN = "\x1b[0;36m";

export const RECOGNISED_SUB_BIOME_ATTRIBUTES = [
    "altitudeSurfaces",
    "amplitudes",
    "colour",
    "heightDisplacement",
    "heightMultiplier",
    "lowerHeightMultiplier",
    "persistence",
    "upperHeightMultiplier",
    "ornaments"
];

export const NARGEN_FILEPATH = "/home/jack/Development/NarGen";

export const PRNG = mkAlea("jack");
