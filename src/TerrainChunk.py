from src.constants import CHUNK_SIZE, SAVE_IMAGE_BIOME_MAP, SAVE_IMAGE_OCTAVE, SAVE_IMAGE_OVERLAYED, SAVE_IMAGE_SURFACE_MAP, SURFACES
import json, math, os, random, sys
from src.functions import clamp, get_brightness_at_height, noise_to_decimal_portion, portion_point_between, save_json
from PIL import Image
from src.Biome import Biome 
from src.Perlin import Perlin 
from src.Grid import Grid 

class TerrainChunk:

    def __init__(self, parent_world, q, r, config):

        self.parent_world = parent_world
        self.q = q
        self.r = r
        self.biomes = self.parent_world.biomes
        self.biomes_rangerray = self.parent_world.biomes_rangerray
        self.corner_x = self.q * CHUNK_SIZE
        self.corner_y = self.r * CHUNK_SIZE
        self.config = config
        self.seed = self.config["seed"]
        self.lacunarity = 0.5
        self.seed = config["seed"]
        self.MIN_WORLD_HEIGHT = -100
        self.MAX_WORLD_HEIGHT = 200
        self.TOTAL_WORLD_HEIGHT = self.MAX_WORLD_HEIGHT - self.MIN_WORLD_HEIGHT

        self.abc_gen(self.seed)

        # TODO: size this according to number of biomes
        initial_noise_tile_size = 32 * len(self.biomes)
        self.octave_count = 5

        self.width_in_tiles = CHUNK_SIZE
        self.height_in_tiles = CHUNK_SIZE

        self.abc_gen(self.seed)

        octaves, overlayed = self.produce_octaves(initial_noise_tile_size)

        # create the biome map
        self.create_biome_map(overlayed)

        if SAVE_IMAGE_OVERLAYED:
            Perlin.save_as_image(overlayed, self.parent_world.name + "_overlayed", self.parent_world.name)

        # TODO: have separate noise maps for biome map and and ground_map

        # create the ground map
        self.abc_gen(self.seed)
        self.create_ground_map(octaves)

        # create the surface map
        self.abc_gen(random.randint(1, 100))
        self.create_surface_map()

        self.export_save_file()

    def produce_octaves(self, noise_tile_size):

        octaves = []

        # create the octaves
        for octave_no in range(self.octave_count):
            self.abc_gen(self.AAA)
            octave = Perlin(
                self.corner_x,
                self.corner_y,
                self.width_in_tiles,
                self.height_in_tiles,
                noise_tile_size,
                self.AAA, self.BBB, self.CCC
            ).get_grid()

            noise_tile_size = math.ceil(noise_tile_size * self.lacunarity)

            if SAVE_IMAGE_OCTAVE:
                Perlin.save_as_image(octave, self.parent_world.name + "_octave_" + str(octave_no), self.parent_world.name)
            octaves.append(octave)

        overlayed = self.overlay_octaves(octaves, 0.5)

        return octaves, overlayed


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
                self.ground_map.set_value_at(x, y, int(original + v))

    def create_surface_map(self):

        self.surface_map = Grid(self.width_in_tiles, self.height_in_tiles, 0)
        self.surface_map_image = Grid(self.width_in_tiles, self.height_in_tiles, 0)
        for x in range(self.width_in_tiles):
            for y in range(self.height_in_tiles):
                height = self.ground_map.value_at(x, y)
                biome = self.get_biome_at(x, y)
                v = self.determine_surface(height, biome)
                self.surface_map.set_value_at(x, y, v)
                colour = self.get_surface_colour(v, height, biome.height_displacement)
                self.surface_map_image.set_value_at(x, y, colour)

        if SAVE_IMAGE_SURFACE_MAP:
            filepath = self.get_filepath(self.parent_world.name, self.q, self.r)
            self.surface_map_image.save_RGBs(filepath, self.parent_world.name)

    @staticmethod
    def get_filepath(world_name, q, r):
        return os.path.join("worlds", world_name, "chunks", str(q) + "x" + str(r) + ".json")

    def create_biome_map(self, perlin_grid):
        self.biome_map = perlin_grid.copy()
        self.biome_map_image = Grid(perlin_grid.width, perlin_grid.height, 0)

        for x in range(perlin_grid.width):
            for y in range(perlin_grid.height):
                height = self.biome_map.value_at(x, y)
                biome = self.determine_biome_by_height(height)
                self.biome_map.set_value_at(x, y, biome)
                colour = biome.colour
                self.biome_map_image.set_value_at(x, y, colour)

        if SAVE_IMAGE_BIOME_MAP:
            self.biome_map_image.save_RGBs(self.parent_world.name + "_biome_map", self.parent_world.name)

    def export_save_file(self):
        save_file_object = { "q": self.q, "r": self.r, "map": [] }
        for x in range(self.width_in_tiles):
            row = []
            for y in range(self.height_in_tiles):
                row.append([
                    str(self.biome_map.value_at(x, y)),
                    self.ground_map.value_at(x, y),
                    self.surface_map.value_at(x, y)
                ])
            save_file_object["map"].append(row)
        filepath = self.get_filepath(self.parent_world.name, self.q, self.r)
        save_json(save_file_object, filepath)

    def get_biome_at(self, x, y):
        return self.biome_map.value_at(x, y)

    def determine_biome_by_height(self, height):
        biome_name = self.biomes_rangerray.select(height)
        return self.biomes[biome_name]

    def abc_gen(self, seed):
        random.seed(seed)
        self.AAA = random.randint(1111111111, 9999999999)
        self.BBB = random.randint(1111111111, 9999999999)
        self.CCC = random.randint(1111111111, 9999999999)

    def interpolate(self, a0, a1, w):
        # if (0.0 > w) return a0
        # if (1.0 < w) return a1

        # default
        #return (a1 - a0) * w + a0

        # smoothstep
        return (a1 - a0) * (3.0 - w * 2.0) * w * w + a0

    def determine_surface(self, height, biome):
        # sea level is at altitude 0
        if height <= 0:
            return "water"
        else:
            return biome.altitude_surfaces.select(height)

    def get_surface_colour(self, surface_name, height, height_displacement):
        if height < 0:
            height *= -1

        brightness = get_brightness_at_height(height, self.parent_world.max_height)

        v = 255 * brightness

        colour = SURFACES[surface_name]["colour"]

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

