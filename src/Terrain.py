import json, math, os, sys

from src.constants import CHUNK_SIZE, SIZE_OF_BIOMES

from src.functions import portion_point_between, save_json

from src.Biome import Biome
from src.Grid import Grid
from src.Rangerray import Rangerray
from src.TerrainChunk import TerrainChunk

class Terrain:

    def __init__(self, name, config):

        self.name = name
        self.config = config
        self.seed = config["seed"]
        self.width_in_chunks, self.height_in_chunks = config["width"], config["height"]
        self.width_in_tiles = self.width_in_chunks * CHUNK_SIZE
        self.height_in_tiles = self.height_in_chunks * CHUNK_SIZE
        self.create_save_files()


        self.max_height = 30
        self.total_height = 2 * self.max_height

        self.configure_biomes()

        # stats
        self.min_noise, self.max_noise = 1, 0
        self.noise_acc, self.noise_count = 0, 0
        self.biome_sizes = dict(zip(self.biome_names, [0] * len(self.biome_names)))

        self.world_info = {
            "seed": self.seed,
            "width": self.width_in_chunks,
            "height": self.height_in_chunks,
            "max_height": self.max_height,
            "total_height": self.total_height
        }

        save_json(self.world_info, os.path.join("worlds", self.name, "WORLD_INFO.json"))

        self.join_chunks("surface_map_image")
        self.join_chunks("biome_map_image")

        print("Terrain generation complete")
        print("World can be found in worlds/" + self.name + "/")


    def create_save_files(self):
        filepath = os.path.join("worlds", self.name)
        if not os.path.exists(filepath):
            os.makedirs(filepath)
            os.makedirs(os.path.join(filepath, "images"))
            os.makedirs(os.path.join(filepath, "chunks"))


    def configure_biomes(self):
        self.biome_names = []
        self.biomes = { }
        self.biomes_rangerray = Rangerray()
        range_min = 0

        for biome in self.config["biomes"]:
            range_max, biome_name = biome[0], biome[1]
            if biome_name not in self.biome_names:
                self.biome_names.append(biome_name)
            biome_config_path = os.path.join("configs", self.name, "biomes", biome_name + ".json")
            file = open(biome_config_path, "r")
            biome_config = json.load(file)
            for sub_biome in biome_config["ranges"]:
                portion = sub_biome[0]
                sub_biome_name = sub_biome[1]
                portion_point = portion_point_between(range_min, range_max, portion)
                self.biomes[biome_name+"."+sub_biome_name] = Biome(self.name, biome_name, sub_biome_name, biome_config)
                self.biomes_rangerray.insert(portion_point, biome_name+"."+sub_biome_name)
            range_min = range_max

        self.biome_super_map_tile_size = len(self.config["biomes"]) * SIZE_OF_BIOMES

        print("Final biomes rangerray")
        self.biomes_rangerray.print()

    def join_chunks(self, map_image_name):

        map_image = Grid(self.width_in_tiles, self.height_in_tiles, 0)

        for q in range(self.width_in_chunks):
            for r in range(self.height_in_chunks):
                chunk = TerrainChunk(self, q, r)
                corner_x, corner_y = q * CHUNK_SIZE, r * CHUNK_SIZE
                map_image.overlay(getattr(chunk, map_image_name), corner_x, corner_y)

        map_image.save_RGBs(self.name + "_" + map_image_name, self.name)

