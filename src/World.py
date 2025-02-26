import json, math, os, sys

from src.constants import BASE_BIOME_SIZE, CHUNK_SIZE

from src.functions import exit_with_error, flatten_noise_distribution, point_at_portion_between, raise_warning, save_json

from src.SubBiome import SubBiome
from src.Grid import Grid
from src.Rangerray import Rangerray
from src.Chunk import Chunk

class World:

    def __init__(self, name, config, render_world):

        self.name = name
        self.config = config
        self.render_world = render_world
        self.seed = config["seed"]
        self.width_in_chunks, self.height_in_chunks = config["width"], config["height"]
        self.width_in_tiles = self.width_in_chunks * CHUNK_SIZE
        self.height_in_tiles = self.height_in_chunks * CHUNK_SIZE
        self.total_area_in_tiles = self.width_in_tiles * self.height_in_tiles
        self.create_save_files()

        self.warnings_raised = {
            "maxHeight": [],
            "matching_biome_colours": []
        }
        self.biome_colours = dict()

        self.maxHeight = int(self.config["maxHeight"])
        self.total_height = 2 * self.maxHeight
        self.temp_acc, self.temp_count = 0, 0

        self.configure_biomes()

        # stats
        self.min_noise, self.max_noise = 1, 0
        self.noise_acc, self.noise_count = 0, 0

        self.world_info = {
            "seed": self.seed,
            "width": self.width_in_chunks,
            "height": self.height_in_chunks,
            "maxHeight": self.maxHeight,
            "total_height": self.total_height
        }

        self.generate_chunks()

        save_json(self.world_info, os.path.join("worlds", self.name, "WORLD_INFO.json"))

        self.summarise()



    def create_save_files(self):
        filepath = os.path.join("worlds", self.name)
        if not os.path.exists(filepath):
            os.makedirs(filepath)
            os.makedirs(os.path.join(filepath, "images"))
            os.makedirs(os.path.join(filepath, "chunks"))

    def configure_biomes(self):
        self.biomes_rangerray = Rangerray("biomes_rangerray")
        lower_point = 0
        self.biome_names = [biome[1] for biome in self.config["biomes"]]
        self.biome_sizes = dict(zip(self.biome_names, [0]*len(self.biome_names)))

        if "biome_size" in self.config.keys():
            self.biome_size = self.config["biome_size"]
        else:
            self.biome_size = 1

        Rangerray.fracrray_to_rangerray(self.config["biomes"])

        for biome in self.config["biomes"]:
            upper_point, biome_name = biome[0], biome[1]
            upper_point = flatten_noise_distribution(upper_point)
            rangerray = self.create_biome(biome_name, lower_point, upper_point)
            self.biomes_rangerray.insert(upper_point, rangerray)
            lower_point = upper_point

        self.biome_super_map_tile_size = len(self.config["biomes"]) * BASE_BIOME_SIZE * self.biome_size


    def create_biome(self, biome_name, biome_noise_lower, biome_noise_upper):
        rangerray = Rangerray(biome_name)
        biome_config_path = os.path.join("configs", self.name, "biomes", biome_name + ".json")
        file = open(biome_config_path, "r")
        biome_config = json.load(file)
        noise_lower, noise_upper = 0, 0

        if tuple(biome_config["colour"]) in self.biome_colours.values():
            raise_warning("Matching biome colours", "The biome " + biome_name + " is using a colour already in use.")
        self.biome_colours[biome_name] = tuple(biome_config["colour"])

        Rangerray.fracrray_to_rangerray(biome_config["ranges"])

        for sub_biome in biome_config["ranges"]:
            noise_upper, sub_biome_name = sub_biome[0], sub_biome[1]
            if sub_biome_name not in biome_config:
                exit_with_error("Undefined sub-biome", "An undefined sub-biome named " + sub_biome_name + " is referenced inside ranges attribute of biome " + biome_name + ".")
            noise_upper = flatten_noise_distribution(noise_upper)
            obj = SubBiome(self, biome_name, sub_biome_name, biome_config, noise_lower, noise_upper)
            rangerray.insert(noise_upper, obj)
            noise_lower = noise_upper

        return rangerray


    def generate_chunks(self):

        if self.render_world:
            map_image_names = ["surface_map_image", "biome_map_image", "sub_biome_map_image", "perlin_image"]
        else:
            map_image_names = []
        grids = [Grid(self.width_in_tiles, self.height_in_tiles, 0) for _ in map_image_names]

        map_images = dict(zip(map_image_names, grids))

        for q in range(self.width_in_chunks):
            for r in range(self.height_in_chunks):
                chunk = Chunk(self, q, r)
                corner_x, corner_y = q * CHUNK_SIZE, r * CHUNK_SIZE
                for map_image_name in map_image_names:
                    map_images[map_image_name].overlay(getattr(chunk, map_image_name), corner_x, corner_y)

        for map_image_name in map_image_names:
            map_images[map_image_name].save_RGBs(self.name + "_" + map_image_name, self.name)

    def summarise(self):
        print("Biome average = " + str(self.temp_acc / self.temp_count))
        for biome_name, biome_size in zip(self.biome_sizes.keys(), self.biome_sizes.values()):
            percentage = 100 * biome_size / self.total_area_in_tiles
            print(str.ljust(biome_name, 20) + "\t" + str.ljust(str(biome_size), 10), str(percentage) + "%")

