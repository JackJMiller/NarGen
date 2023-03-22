import math

import src.constants as constants

from src.Grid import Grid
from src.TerrainChunk import TerrainChunk

class Terrain:

    def __init__(self, WORLD_NAME, config):

        self.WORLD_NAME = WORLD_NAME
        self.width_in_tiles, self.height_in_tiles = config["width"], config["height"]
        self.width_in_chunks = math.ceil(self.width_in_tiles / constants.CHUNK_SIZE)
        self.height_in_chunks = math.ceil(self.width_in_tiles / constants.CHUNK_SIZE)
        self.surface_map_image = Grid(self.width_in_tiles, self.height_in_tiles, 0)

        for q in range(self.width_in_chunks):
            for r in range(self.height_in_chunks):
                chunk = TerrainChunk(self.WORLD_NAME, q, r, config)
                corner_x, corner_y = q * constants.CHUNK_SIZE, r * constants.CHUNK_SIZE
                self.surface_map_image.overlay(
                    chunk.surface_map_image,
                    corner_x,
                    corner_y
                )

        self.surface_map_image.save_RGBs(self.WORLD_NAME + "_surface_map", self.WORLD_NAME)

        print("Terrain generation complete")
        print("World can be found in worlds/" + self.WORLD_NAME + "/")
