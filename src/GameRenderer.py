import math, os, sys

from PIL import Image, ImageEnhance

from src.TerrainChunk import TerrainChunk

from src.functions import get_brightness_at_height, load_json
from src.constants import CHUNK_SIZE, SPRITES

class GameRenderer:

    def __init__(self, world_name):

        self.world_name = world_name
        self.world_config = load_json(os.path.join("worlds", world_name, "WORLD_INFO.json"))

        self.image_width = self.world_config["width"] * CHUNK_SIZE * 20
        self.image_height = self.world_config["height"] * CHUNK_SIZE * 20

        self.image = Image.new("RGBA", (self.image_width, self.image_height), (40, 160, 255, 255))

        for r in range(self.world_config["height"]):
            self.chunks = []
            for q in range(self.world_config["width"]):
                filepath = TerrainChunk.get_filepath(self.world_name, q, r)
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
            if tile_name + "_block" not in SPRITES.keys():
                tile_name = "grass"
            self.draw_tile(tile_name + "_block", canvas_x, canvas_y, z)
            canvas_y -= 14
        if height <= 0:
            height = abs(height)
            self.draw_tile("water_block", canvas_x, canvas_y, height)

    def draw_tile(self, tile_name, canvas_x, canvas_y, z):
        sprite = SPRITES[tile_name]
        enhancer = ImageEnhance.Brightness(sprite)
        brightness = get_brightness_at_height(z, self.world_config["max_height"])
        block_image = enhancer.enhance(brightness)
        self.image.paste(block_image, (canvas_x, canvas_y), mask = block_image)

