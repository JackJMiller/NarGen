from PIL import Image, ImageEnhance

SURFACES = {
    "water": { "colour": (80, 180, 255) },
    "grass": { "colour": (108, 210, 26) },
    "grass-1": { "colour": (50, 230, 115) },
    "sand": { "colour": (255, 240, 130) },
    "stone": { "colour": (80, 80, 80) },
    "dirt": { "colour": (90, 60, 30) },
    "snow": { "colour": (255, 255, 255) },
    "lava": { "colour": (240, 30, 0) },
    "coal": { "colour": (0, 0, 0) }
}

SPRITES = {
    "grass_block": Image.open("res/sprites/grass_block.png", "r").convert("RGBA"),
    "sand_block": Image.open("res/sprites/sand_block.png", "r").convert("RGBA"),
    "snow_block": Image.open("res/sprites/snow_block.png", "r").convert("RGBA"),
    "stone_block": Image.open("res/sprites/stone_block.png", "r").convert("RGBA"),
    "water_block": Image.open("res/sprites/water_block.png", "r").convert("RGBA")
}


AVAILABLE_BLOCKS = ["grass", "lava", "sand", "snow", "stone", "water"]

CHUNK_SIZE = 20
MAX_HEIGHT = 200
SIZE_OF_BIOMES = 80

OCTAVE_COUNT = 5

COLOUR_SUB_BIOMES = True
SAVE_IMAGE_BIOME_MAP = False
SAVE_IMAGE_SURFACE_MAP = False
SAVE_IMAGE_OCTAVE = False
SAVE_IMAGE_OVERLAYED = False

COLOUR_NONE = "\033[0m"
COLOUR_RED = "\033[0;31m"
COLOUR_GREEN = "\033[0;32m"
COLOUR_YELLOW = "\033[2;33m"
COLOUR_BLUE = "\033[0;34m"
COLOUR_PURPLE = "\033[0;35m"
COLOUR_CYAN = "\033[0;36m"
