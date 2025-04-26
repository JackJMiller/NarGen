import BiomeBlender from "./BiomeBlender.js";
import Ornamenter from "./Ornamenter.js";
import SystemRenderer from "./SystemRenderer.js";
import { Colour, ConfigSanitisationObject } from "./types.js";

// TODO: remove this duplicate
const SPRITE_NAMES = ["archers_tree", "baby_archers_tree", "bruce_tree", "daisy_poppy_bed", "fat_bruce_tree", "glim_rock", "long_grass_block", "medium_grass_block", "medium_moonflower", "moonflower", "niamh_tree", "plank_tree", "ploon_tree", "poppy_bed_1", "poppy_bed_2", "sand_block", "short_grass_block", "snow_block", "stone_block", "water_block"];

function set_default_root_blocks(root_blocks: any) {
    for (let sprite_name of SPRITE_NAMES) {
        if (!Object.keys(root_blocks).includes(sprite_name)) {
            root_blocks[sprite_name] = ["short_grass", "medium_grass", "long_grass"];
        }
    }
}

export const SURFACES: { [index: string]: Colour } = {
    water: [80, 180, 255],
    short_grass: [108, 210, 26],
    medium_grass: [108, 210, 26],
    long_grass: [108, 210, 26],
    sand: [255, 240, 130],
    stone: [80, 80, 80],
    snow: [255, 255, 255]
};

export const SURFACE_COLOURS: { [index: string]: Colour } = {
    water_block: [80, 180, 255],
    short_grass_block: [108, 210, 26],
    medium_grass_block: [108, 210, 26],
    long_grass_block: [108, 210, 26],
    sand_block: [255, 240, 130],
    stone_block: [80, 80, 80],
    snow_block: [255, 255, 255]
};

export const AVAILABLE_BLOCKS = ["grass", "sand", "snow", "stone", "water"];

export const ORNAMENTATION_ROOT_BLOCKS: any = {};

set_default_root_blocks(ORNAMENTATION_ROOT_BLOCKS);

export const CHUNK_SIZE = 20;
export const TILE_WIDTH = 20;
export const TILE_HEIGHT = 14;
export const BASE_BIOME_SIZE = 40;

export const OCTAVE_COUNT = 5;

export const SAVE_IMAGE_BIOME_MAP = false;
export const SAVE_IMAGE_SURFACE_MAP = false;
export const SAVE_IMAGE_OCTAVE = false;
export const SAVE_IMAGE_OVERLAYED = true;

export const COLOUR_NONE = "\x1b[0m";
export const COLOUR_RED = "\x1b[0;31m";
export const COLOUR_RED_BOLD = "\x1b[1;31m";
export const COLOUR_GREEN = "\x1b[0;32m";
export const COLOUR_YELLOW = "\x1b[2;33m";
export const COLOUR_BLUE = "\x1b[0;34m";
export const COLOUR_MAGENTA = "\x1b[0;35m";
export const COLOUR_MAGENTA_BOLD = "\x1b[1;35m";
export const COLOUR_CYAN = "\x1b[0;36m";

export const SUB_BIOME_SAN_OBJ: ConfigSanitisationObject = {
    "altitudeSurfaces": { mandatory: false },
    "amplitudes": { mandatory: false, redundants: ["persistence"] },
    "blend": { mandatory: false, defaultValue: 0 },
    "colour": { mandatory: false },
    "heightDisplacement": { mandatory: true },
    "heightMultiplier": { mandatory: false, redundants: ["lowerHeightMultiplier", "upperHeightMultiplier"] },
    "lowerHeightMultiplier": { mandatory: false, defaultTo: "heightMultiplier" },
    "persistence": { mandatory: false },
    "upperHeightMultiplier": { mandatory: false, defaultTo: "heightMultiplier" },
    "ornaments": { mandatory: false }
};

export const GRID_IMAGE_FILENAMES = {
    "biomeGridImage": "biome.png",
    "perlinImage": "perlin.png",
    "subBiomeGridImage": "sub_biome.png",
    "surfaceGridImage": "surface.png"
};

export const ORNAMENTER = new Ornamenter();
export const RENDERER = new SystemRenderer();
export const BIOME_BLENDER = new BiomeBlender();
