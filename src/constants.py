import os

from PIL import Image, ImageEnhance

def load_sprites():
    SPRITES = dict()
    for filename in os.listdir("res/sprites"):
        name = os.path.splitext(filename)[0]
        SPRITES[name] = Image.open(os.path.join("res", "sprites", filename), "r").convert("RGBA")
    SPRITE_NAMES = SPRITES.keys()
    return SPRITES, SPRITE_NAMES

def set_default_root_blocks(root_blocks):
    for sprite_name in SPRITE_NAMES:
        if sprite_name not in root_blocks.keys():
            root_blocks[sprite_name] = ["short_grass", "medium_grass", "long_grass"]

SURFACES = {
    "water": { "colour": (80, 180, 255) },
    "short_grass": { "colour": (108, 210, 26) },
    "medium_grass": { "colour": (108, 210, 26) },
    "long_grass": { "colour": (108, 210, 26) },
    "sand": { "colour": (255, 240, 130) },
    "stone": { "colour": (80, 80, 80) },
    "dirt": { "colour": (90, 60, 30) },
    "snow": { "colour": (255, 255, 255) },
    "lava": { "colour": (240, 30, 0) },
    "coal": { "colour": (0, 0, 0) }
}

SPRITES, SPRITE_NAMES = load_sprites()

AVAILABLE_BLOCKS = ["grass", "lava", "sand", "snow", "stone", "water"]

ORNAMENTATION_ROOT_BLOCKS = {
}

set_default_root_blocks(ORNAMENTATION_ROOT_BLOCKS)

CHUNK_SIZE = 20
BASE_BIOME_SIZE = 400

OCTAVE_COUNT = 5

SAVE_IMAGE_BIOME_MAP = False
SAVE_IMAGE_SURFACE_MAP = False
SAVE_IMAGE_OCTAVE = False
SAVE_IMAGE_OVERLAYED = True

COLOUR_NONE = "\033[0m"
COLOUR_RED = "\033[0;31m"
COLOUR_GREEN = "\033[0;32m"
COLOUR_YELLOW = "\033[2;33m"
COLOUR_BLUE = "\033[0;34m"
COLOUR_MAGENTA = "\033[0;35m"
COLOUR_CYAN = "\033[0;36m"

RECOGNISED_SUB_BIOME_ATTRIBUTES = [
    "altitude_surfaces",
    "amplitudes",
    "colour",
    "height_displacement",
    "height_multiplier",
    "lower_height_multiplier",
    "persistence",
    "upper_height_multiplier",
    "ornaments"
]
