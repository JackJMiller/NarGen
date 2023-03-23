import math, os, sys

from PIL import Image, ImageEnhance

from src.functions import load_json
from src.constants import CHUNK_SIZE

class GameRenderer:

    def __init__(self, world_name):

        self.world_name = world_name
        self.world_config = load_json(os.path.join("worlds", world_name, "world_info.json"))

        self.image_width = self.world_config["width"] * CHUNK_SIZE * 20
        self.image_height = self.world_config["height"] * CHUNK_SIZE * 20

        self.image = Image.new("RGBA", (self.image_width, self.image_height), (40, 160, 255, 255))

        self.sprites = {
            "grass_block": Image.open("res/sprites/grass_block.png", "r").convert("RGBA"),
            "sand_block": Image.open("res/sprites/sand_block.png", "r").convert("RGBA"),
            "snow_block": Image.open("res/sprites/snow_block.png", "r").convert("RGBA"),
            "stone_block": Image.open("res/sprites/stone_block.png", "r").convert("RGBA"),
            "water_block": Image.open("res/sprites/water_block.png", "r").convert("RGBA")
        }

        for r in range(self.world_config["height"]):
            self.chunks = []
            for q in range(self.world_config["width"]):
                filepath = os.path.join("worlds", self.world_name, "chunks", str(q) + "x" + str(r) + ".json")
                chunk = load_json(filepath)
                self.chunks.append(chunk)
            self.draw_chunk_row(r)

        self.image.save(os.path.join("worlds", self.world_name, "images", "game.png"), format = "png")

        sys.exit(0)

        for x in range(self.world_config["width"]):
            for y in range(self.world_config["height"]):
                v = grid.value_at(x, y)
                v = 0.5 * (v + 1)
                rgb = Perlin.get_height_colour(v)
                pixels[x, y] = rgb

    def draw_chunk_row(self, r):
        for q in range(len(self.chunks)):
            for _y in range(CHUNK_SIZE):
                for _x in range(CHUNK_SIZE):
                    self.draw_blocks_at(q, _x, r, _y)

    def draw_blocks_at(self, chunk_q, _x, chunk_r, _y):
        x = chunk_q * CHUNK_SIZE + _x
        y = chunk_r * CHUNK_SIZE + _y
        canvas_x, canvas_y = x * CHUNK_SIZE, y * CHUNK_SIZE
        tile = self.chunks[chunk_q]["map"][_x][_y]
        height, tile_name = tile[1], tile[2]
        for z in range(height):
            if tile_name + "_block" not in self.sprites.keys():
                tile_name = "grass"
            sprite = self.sprites[tile_name + "_block"]
            enhancer = ImageEnhance.Brightness(sprite)
            brightness = 1 - 1 / math.exp(0.3 * (z + 2))
            block_image = enhancer.enhance(brightness)
            self.image.paste(block_image, (canvas_x, canvas_y), mask = block_image)
            canvas_y -= 14
        if height <= 0:
            self.image.paste(self.sprites["water_block"], (canvas_x, canvas_y), mask = self.sprites["water_block"])

