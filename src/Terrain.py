import json, math, os

import src.constants as constants

from src.functions import noise_to_decimal_portion, portion_point_between

from src.Biome import Biome
from src.Grid import Grid
from src.TerrainChunk import TerrainChunk

class Terrain:

    def __init__(self, WORLD_NAME, config):

        self.WORLD_NAME = WORLD_NAME
        self.config = config
        self.width_in_tiles, self.height_in_tiles = config["width"], config["height"]
        self.width_in_chunks = math.ceil(self.width_in_tiles / constants.CHUNK_SIZE)
        self.height_in_chunks = math.ceil(self.width_in_tiles / constants.CHUNK_SIZE)
        self.configure_biomes()

        self.join_chunks("surface_map_image")
        self.join_chunks("biome_map_image")

        print("Terrain generation complete")
        print("World can be found in worlds/" + self.WORLD_NAME + "/")

    def configure_biomes(self):
        self.biomes = { }
        self.biomes_rangerray = []
        range_min = -1

        for biome in self.config["biomes"]:
            range_max, biome_name = biome[0], biome[1]
            biome_config_path = os.path.join("configs", self.WORLD_NAME, "biomes", biome_name, "CONFIG.json")
            file = open(biome_config_path, "r")
            biome_config = json.load(file)
            for sub_biome in biome_config["ranges"]:
                sub_biome_portion_point = sub_biome[0]
                sub_biome_name = sub_biome[1]
                portion = noise_to_decimal_portion(sub_biome_portion_point)
                portion_point = portion_point_between(range_min, range_max, portion)
                self.biomes[biome_name+"."+sub_biome_name] = Biome(self.WORLD_NAME, biome_name, sub_biome_name)
                self.biomes_rangerray.append([portion_point, biome_name+"."+sub_biome_name])
            range_min = range_max

        print("Final biomes rangerray")
        print(self.biomes_rangerray)

    def join_chunks(self, map_image_name):

        map_image = Grid(self.width_in_tiles, self.height_in_tiles, 0)

        for q in range(self.width_in_chunks):
            for r in range(self.height_in_chunks):
                chunk = TerrainChunk(
                    self.WORLD_NAME,
                    q,
                    r,
                    self.config,
                    self.biomes,
                    self.biomes_rangerray
                )

                corner_x, corner_y = q * constants.CHUNK_SIZE, r * constants.CHUNK_SIZE
                map_image.overlay(getattr(chunk, map_image_name), corner_x, corner_y)

        map_image.save_RGBs(self.WORLD_NAME + "_" + map_image_name, self.WORLD_NAME)


