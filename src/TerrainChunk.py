from src.constants import CHUNK_SIZE, OCTAVE_COUNT, SAVE_IMAGE_BIOME_MAP, SAVE_IMAGE_OCTAVE, SAVE_IMAGE_OVERLAYED, SAVE_IMAGE_SURFACE_MAP, SURFACES
import json, math, os, random, sys
from src.functions import clamp, get_brightness_at_height, portion_point_between, save_json
from PIL import Image
from src.SubBiome import SubBiome 
from src.Perlin import Perlin 
from src.Grid import Grid 

class TerrainChunk:

    def __init__(self, parent_world, q, r):

        self.parent_world = parent_world
        self.config = self.parent_world.config
        self.seed = parent_world.seed
        self.q = q
        self.r = r
        self.biomes_rangerray = self.parent_world.biomes_rangerray
        self.corner_x = self.q * CHUNK_SIZE
        self.corner_y = self.r * CHUNK_SIZE
        self.lacunarity = 0.5
        self.MIN_WORLD_HEIGHT = -100
        self.MAX_WORLD_HEIGHT = 200
        self.TOTAL_WORLD_HEIGHT = self.MAX_WORLD_HEIGHT - self.MIN_WORLD_HEIGHT

        self.abc_gen(self.seed)

        # TODO: size this according to number of biomes
        initial_noise_tile_size = 10 * CHUNK_SIZE
        self.octave_count = OCTAVE_COUNT

        self.width_in_tiles = CHUNK_SIZE
        self.height_in_tiles = CHUNK_SIZE

        self.abc_gen(self.seed)

        octaves, overlayed = self.produce_octaves(self.octave_count, initial_noise_tile_size, 0.5, "biome_map")

        spam, self.biome_super_map = self.produce_octaves(3, self.parent_world.biome_super_map_tile_size, 0.5, "biome_super_map")

        # create the biome map
        self.create_biome_map(overlayed)

        if SAVE_IMAGE_OVERLAYED:
            Perlin.save_as_image(overlayed, self.parent_world.name + "_overlayed", self.parent_world.name)

        # create the ground map
        self.abc_gen(self.seed)
        self.create_ground_map(octaves)

        # create the surface map
        self.abc_gen(random.randint(1, 100))
        self.create_surface_map()

        self.export_save_file()

    def produce_octaves(self, octave_count, noise_tile_size, persistence, octave_identifier):

        octaves = []
        save_stats = (octave_identifier == "biome_super_map")

        # create the octaves
        for octave_no in range(octave_count):
            self.abc_gen(self.AAA)
            perlin = Perlin(
                self.corner_x,
                self.corner_y,
                self.width_in_tiles,
                self.height_in_tiles,
                noise_tile_size,
                self.AAA, self.BBB, self.CCC
            )

            octave = perlin.get_grid()

            noise_tile_size = math.ceil(noise_tile_size * self.lacunarity)

            if SAVE_IMAGE_OCTAVE:
                Perlin.save_as_image(octave, self.parent_world.name + "_" + octave_identifier + "_octave_" + str(octave_no), self.parent_world.name)
            octaves.append(octave)

        overlayed = self.overlay_octaves(octaves, persistence)

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
                new_value = original / biome.noise_scale
                new_value += biome.height_displacement
                self.ground_map.set_value_at(x, y, int(new_value))

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
        min_noise, max_noise = 1, 0

        for x in range(perlin_grid.width):
            for y in range(perlin_grid.height):
                height_1 = self.biome_super_map.value_at(x, y)
                height_2 = self.biome_map.value_at(x, y)
                biome = self.determine_biome_by_height(height_1, height_2)
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

    def determine_biome_by_height(self, height_1, height_2):
        biome_obj = self.biomes_rangerray.select(height_1)
        sub_biome = biome_obj.select(height_2)
        return sub_biome

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

        colour = SURFACES[surface_name]["colour"]

        colour = (
            int(brightness * colour[0]),
            int(brightness * colour[1]),
            int(brightness * colour[2])
        )

        return colour

    def overlay_octaves(self, octaves, persistence):
        height_map = Grid(self.width_in_tiles, self.height_in_tiles, 0)

        # if i were smart i would turn this into an equation
        # sadly i am not
        persistence_sum = 0
        for index in range(len(octaves)):
            persistence_sum += persistence ** index
        noise_scale_inverse = 1 / persistence_sum

        for octave_no, octave in enumerate(octaves):
            amplitude = persistence ** octave_no
            for x in range(self.width_in_tiles):
                for y in range(self.height_in_tiles):
                    original_value = height_map.value_at(x, y)
                    v = octave.value_at(x, y) * amplitude * noise_scale_inverse
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

