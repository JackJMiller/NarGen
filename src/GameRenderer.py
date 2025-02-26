import math, os, sys

from PIL import Image, ImageEnhance

from src.Chunk import Chunk

from src.functions import get_brightness_at_height, load_json
from src.constants import CHUNK_SIZE, SPRITES

class GameRenderer:

    def __init__(self, world_path):

        print(world_path)
        self.world_path = os.path.normpath(world_path)
        self.world_name = os.path.basename(self.world_path)
        print(self.world_name)

        self.world_config = load_json(os.path.join(self.world_path, "GENERATED", "WORLD_INFO.json"))

        self.image_width = self.world_config["width"] * CHUNK_SIZE * 20
        self.image_height = self.world_config["height"] * CHUNK_SIZE * 20

        self.image = Image.new("RGBA", (self.image_width, self.image_height), (40, 160, 255, 255))

        for r in range(self.world_config["height"]):
            self.chunks = []
            for q in range(self.world_config["width"]):
                filepath = Chunk.get_filepath(self.world_path, q, r)
                chunk = load_json(filepath)
                self.chunks.append(chunk)
            self.draw_chunk_row(r)

        self.image.save(os.path.join(self.world_path, "GENERATED", "images", "game.png"), format = "png")


    def draw_chunk_row(self, r):
        for q in range(len(self.chunks)):
            for _y in range(CHUNK_SIZE):
                for _x in range(CHUNK_SIZE):
                    self.draw_blocks_at(q, _x, r, _y)


    def draw_blocks_at(self, chunk_q, _x, chunk_r, _y):
        x = chunk_q * CHUNK_SIZE + _x
        y = chunk_r * CHUNK_SIZE + _y
        canvas_x, canvas_y = x * CHUNK_SIZE, y * CHUNK_SIZE
        tile = self.chunks[chunk_q]["tileMap"][_x][_y]
        height, tile_name, area_object_name = tile[1], tile[2], tile[3]
        for z in range(height):
            if tile_name + "_block" not in SPRITES.keys():
                tile_name = "grass"
            self.draw_tile(tile_name + "_block", canvas_x, canvas_y, z)
            canvas_y -= 14

        if height <= 0:
            height = abs(height)
            self.draw_tile("water_block", canvas_x, canvas_y, height)

        if area_object_name != "":
            self.draw_tile(area_object_name, canvas_x, canvas_y, height)


    def draw_tile(self, tile_name, canvas_x, canvas_y, z):
        sprite = SPRITES[tile_name]
        enhancer = ImageEnhance.Brightness(sprite)
        brightness = get_brightness_at_height(z, self.world_config["maxHeight"])
        block_image = enhancer.enhance(brightness)
        self.image.paste(block_image, (canvas_x, canvas_y), mask = block_image)

