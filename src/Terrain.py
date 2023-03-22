import src.constants as constants
import json, math, os, random, sys
from src.functions import clamp, noise_to_decimal_portion, portion_point_between
from PIL import Image
from src.Biome import Biome 
from src.Perlin import Perlin 
from src.Grid import Grid 

class Terrain:

    def __init__(self, WORLD_NAME, config):

        self.WORLD_NAME = WORLD_NAME
        self.create_save_files()
        self.MAX_HEIGHT = 100
        self.TOTAL_HEIGHT = 2 * self.MAX_HEIGHT
        self.config = config
        self.seed = self.config["seed"]
        self.configure_biomes()
        self.seed = config["seed"]
        self.MIN_WORLD_HEIGHT = -100
        self.MAX_WORLD_HEIGHT = 200
        self.TOTAL_WORLD_HEIGHT = self.MAX_WORLD_HEIGHT - self.MIN_WORLD_HEIGHT

        self.abc_gen(self.seed)

        chunk_size = 128
        self.octave_count = 5
        self.width_in_chunks = self.config["width"]
        self.height_in_chunks = self.config["height"]
        self.width_in_tiles = self.width_in_chunks * chunk_size
        self.height_in_tiles = self.height_in_chunks * chunk_size

        self.abc_gen(self.seed)

        width_in_chunks = self.width_in_chunks
        height_in_chunks = self.height_in_chunks

        octaves = []

        # create the octaves
        for octave_no in range(self.octave_count):
            self.abc_gen(self.AAA)
            octave = Perlin(
                width_in_chunks,
                height_in_chunks,
                chunk_size,
                self.AAA, self.BBB, self.CCC
            ).get_grid()

            width_in_chunks *= 2
            height_in_chunks *= 2
            chunk_size = int(chunk_size / 2)

            Perlin.save_as_image(octave, self.WORLD_NAME + "_octave_" + str(octave_no), self.WORLD_NAME)
            octaves.append(octave)

        overlayed = self.overlay_octaves(octaves, 0.5)

        # create the biome map
        self.create_biome_map(overlayed)

        Perlin.save_as_image(overlayed, WORLD_NAME + "_overlayed", self.WORLD_NAME)

        # create the ground map
        self.abc_gen(self.seed)
        self.create_ground_map(octaves)

        # create the surface map
        self.abc_gen(random.randint(1, 100))
        self.create_surface_map()

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

        print("Final biomes")
        print(self.biomes_rangerray)

    def create_save_files(self):
        filepath = os.path.join("worlds", self.WORLD_NAME)
        if not os.path.exists(filepath):
            os.makedirs(filepath)
            os.makedirs(os.path.join(filepath, "images"))

    def create_ground_map(self, octaves):

        self.ground_map = Grid(self.width_in_tiles, self.height_in_tiles, 0)

        for octave_no, octave in enumerate(octaves):
            for x in range(self.width_in_tiles):
                for y in range(self.height_in_tiles):
                    biome = self.get_biome_at(x, y)
                    persistence = biome.persistence
                    amplitude = persistence ** octave_no
                    original = self.ground_map.value_at(x, y)
                    v = octave.value_at(x, y)
                    v *= amplitude * biome.height_multiplier
                    self.ground_map.set_value_at(x, y, original + v)

        for x in range(self.width_in_tiles):
            for y in range(self.height_in_tiles):
                biome = self.get_biome_at(x, y)
                original = self.ground_map.value_at(x, y)
                v = biome.height_displacement
                self.ground_map.set_value_at(x, y, original + v)

    def create_surface_map(self):

        self.surface_map = Grid(self.width_in_tiles, self.height_in_tiles, 0)
        surface_map_image = Grid(self.width_in_tiles, self.height_in_tiles, 0)
        for x in range(self.width_in_tiles):
            for y in range(self.height_in_tiles):
                height = self.ground_map.value_at(x, y)
                biome = self.get_biome_at(x, y)
                v = self.determine_surface(height, biome.altitude_surfaces)
                self.surface_map.set_value_at(x, y, v)
                colour = self.get_surface_colour(v, height, biome.height_displacement, self.MAX_HEIGHT)
                surface_map_image.set_value_at(x, y, colour)

        surface_map_image.save_RGBs(self.WORLD_NAME + "_surface_map", self.WORLD_NAME)

    def create_biome_map(self, perlin_grid):
        self.biome_map = perlin_grid.copy()
        biome_map_image = Grid(perlin_grid.width, perlin_grid.height, 0)

        for x in range(perlin_grid.width):
            for y in range(perlin_grid.height):
                height = self.biome_map.value_at(x, y)
                biome = self.determine_biome_by_height(height)
                self.biome_map.set_value_at(x, y, biome)
                colour = biome.colour
                biome_map_image.set_value_at(x, y, colour)

        biome_map_image.save_RGBs(self.WORLD_NAME + "_biome_map", self.WORLD_NAME)

    def get_biome_at(self, x, y):
        return self.biome_map.value_at(x, y)

    def determine_biome_by_height(self, height):
        biome_name = self.select_in_rangerray(height, self.biomes_rangerray)
        return self.biomes[biome_name]

    def abc_gen(self, seed):
        random.seed(seed)
        self.AAA = random.randint(1111111111, 9999999999)
        self.BBB = random.randint(1111111111, 9999999999)
        self.CCC = random.randint(1111111111, 9999999999)

    def new(self, chunk_size, octave_no):

        self.chunk_size = chunk_size
        self.width_in_tiles = self.config["world_width"] * self.chunk_size
        self.height_in_tiles = self.config["world_height"] * self.chunk_size

        height_map = [[0] * self.height_in_tiles for _ in range(self.width_in_tiles)]

        for chunk_x in range(self.config["world_width"]):
            for chunk_y in range(self.config["world_height"]):
                for _x in range(self.chunk_size):
                    for _y in range(self.chunk_size):
                        x = chunk_x + _x / self.chunk_size
                        y = chunk_y + _y / self.chunk_size
                        NOISE = self.noise(x, y)
                        biome = self.determine_biome(x, y)
                        amplitude = biome.config["persistence"] ** octave_no
                        v = int((NOISE * self.TOTAL_WORLD_HEIGHT + self.MIN_WORLD_HEIGHT) * amplitude)
                        map_x = chunk_x * self.chunk_size + _x
                        map_y = chunk_y * self.chunk_size + _y
                        height_map[map_x][map_y] = v

        return height_map

    def interpolate(self, a0, a1, w):
        # if (0.0 > w) return a0
        # if (1.0 < w) return a1

        # default
        #return (a1 - a0) * w + a0

        # smoothstep
        return (a1 - a0) * (3.0 - w * 2.0) * w * w + a0

    def determine_surface(self, height, altitude_surfaces):
        # sea level is at altitude 0
        if height <= 0:
            return "water"
        else:
            return self.select_in_rangerray(height, altitude_surfaces)

    def select_in_rangerray(self, v, rangerray):

        for elem in rangerray:
            if v < elem[0]:
                return elem[1]

        # when v exceeds maximum choice, return the last item
        return rangerray[-1][1]

    def get_surface_colour(self, surface_name, height, height_displacement, max_height):
        if height < 0:
            height *= -1

        v = 255 - int(255 * clamp(height, 255) / max_height)

        colour = constants.SURFACES[surface_name]["colour"]

        colour = (
            int(0.4 * v + 0.6 * colour[0]),
            int(0.4 * v + 0.6 * colour[1]),
            int(0.4 * v + 0.6 * colour[2])
        )

        return colour

    def overlay_octaves(self, octaves, persistence):
        height_map = Grid(self.width_in_tiles, self.height_in_tiles, 0)

        for octave_no, octave in enumerate(octaves):
            amplitude = persistence ** octave_no
            for x in range(self.width_in_tiles):
                for y in range(self.height_in_tiles):
                    v = octave.value_at(x, y) * amplitude
                    original_value = height_map.value_at(x, y)
                    height_map.set_value_at(x, y, original_value + v)

        return height_map

    def limit(self, v, minimum, maximum):
        if v < minimum:
            return minimum
        elif v > maximum:
            return maximum
        else:
            return v

    def colour_average(self, c1, c2):
        return (
            self.mean(c1[0], c2[0]),
            self.mean(c1[1], c2[1]),
            self.mean(c1[2], c2[2])
        )

    def mean(self, v1, v2):
        return int((v1 + v2) / 2)

