import json, math, os, random, sys

from PIL import Image

from src.Grid import Grid 
from src.Perlin import Perlin 
from src.Rangerray import Rangerray 

from src.constants import CHUNK_SIZE, OCTAVE_COUNT, SAVE_IMAGE_BIOME_MAP, SAVE_IMAGE_OCTAVE, SAVE_IMAGE_OVERLAYED, SAVE_IMAGE_SURFACE_MAP, SURFACES, ORNAMENTATION_ROOT_BLOCKS
from src.functions import clamp, get_brightness_at_height, point_at_portion_between, portion_at_point_between, raise_warning, random_element, save_json

class Chunk:

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

        initial_noise_tile_size = 10 * CHUNK_SIZE
        self.octave_count = OCTAVE_COUNT

        self.width_in_tiles = CHUNK_SIZE
        self.height_in_tiles = CHUNK_SIZE

        self.abc_gen(self.seed)

        octaves, self.overlayed = self.produce_octaves(self.octave_count, initial_noise_tile_size, 0.5, "biome_map", lacunarity = 0.5)

        spam, self.biome_super_map = self.produce_octaves(3, self.parent_world.biome_super_map_tile_size, 0.25, "biome_super_map", tile_sizes = [self.parent_world.biome_super_map_tile_size, 50, 20])

        self.parent_world.temp_acc += self.biome_super_map.calculate_average()
        self.parent_world.temp_count += 1

        # create the biome map
        self.create_biome_map(self.overlayed)

        self.perlin_image = Perlin.create_grid_image(self.biome_super_map)

        """
        if SAVE_IMAGE_OVERLAYED:
            Perlin.save_as_image(self.overlayed, self.parent_world.name + "_overlayed", self.parent_world.name)
        """

        # create the ground map
        self.abc_gen(self.seed)
        self.create_ground_map(octaves)

        # create the surface map
        self.abc_gen(random.randint(1, 100))
        self.create_surface_map()

        # create the area map to include ornamentation
        self.create_area_map()

        self.export_save_file()

    def produce_octaves(self, octave_count, noise_tile_size, persistence, octave_identifier, tile_sizes = [], lacunarity = None):

        # configure the noise tile sizes
        if len(tile_sizes) == 0:
            tile_size = noise_tile_size
            for i in range(octave_count):
                tile_sizes.append(tile_size)
                tile_size = math.ceil(tile_size * lacunarity)

        # create the octaves
        octaves = []
        for octave_no, noise_tile_size in enumerate(tile_sizes):
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

            octaves.append(octave)

        overlayed = self.overlay_octaves(octaves, persistence)

        return octaves, overlayed


    def create_area_map(self):
        self.area_map = Grid(self.width_in_tiles, self.height_in_tiles, "")
        for x in range(self.width_in_tiles):
            for y in range(self.height_in_tiles):
                area_object_name = self.decide_ornamentation_at(x, y)
                if area_object_name != "":
                    self.area_map.set_value_at(x, y, area_object_name)

    def decide_ornamentation_at(self, x, y):
        # TEMP
        # return ""
        altitude = self.ground_map.value_at(x, y)
        if altitude <= 0:
            return ""

        biome = self.get_biome_at(x, y)
        if random.random() > biome.ornament_occurrence_rate:
            return ""
        ground_tile_name = self.surface_map.value_at(x, y)
        candidates = []
        acc, candidates = 0, Rangerray()
        for veg in biome.ornaments:
            veg_name, min_altitude, max_altitude, veg_occurrence_chance = veg[0], veg[1], veg[2], veg[3]
            if min_altitude <= altitude <= max_altitude and ground_tile_name in ORNAMENTATION_ROOT_BLOCKS[veg_name]:
                acc += veg_occurrence_chance
                candidates.insert(acc, veg_name)
        if len(candidates) > 0:
            random_number = round(random.random() * acc)
            return candidates.select_value(random_number)
        else:
            return ""



    def create_ground_map(self, octaves):

        self.ground_map = Grid(self.width_in_tiles, self.height_in_tiles, 0)

        for octave_no, octave in enumerate(octaves):
            for x in range(self.width_in_tiles):
                for y in range(self.height_in_tiles):
                    original = self.ground_map.value_at(x, y)
                    v = self.get_ground_octave_value(x, y, octave, octave_no)
                    self.ground_map.set_value_at(x, y, original + v)

        for x in range(self.width_in_tiles):
            for y in range(self.height_in_tiles):
                displacement = 0
                for balance in self.biome_map.value_at(x, y):
                    biome, biome_influence = balance[0], balance[1]
                    displacement += biome.height_displacement * biome_influence
                original = self.ground_map.value_at(x, y)
                new_value = int(original + displacement)
                if new_value > self.parent_world.max_height and biome.full_name not in self.parent_world.warnings_raised["max_height"]:
                    new_value = clamp(new_value, self.parent_world.max_height)
                    raise_warning("Extreme terrain", "Ground map value inside " + biome.full_name + " has exceeded the maximum world height. Value has been capped at " + str(self.parent_world.max_height) + ".")
                    self.parent_world.warnings_raised["max_height"].append(biome.full_name)
                self.ground_map.set_value_at(x, y, new_value)

    def get_ground_octave_value(self, x, y, octave, octave_no):
        biome_balance = self.biome_map.value_at(x, y)
        V = 0
        biome_influence_sum = 0
        for balance in biome_balance:
            biome_influence_sum += balance[1]
        for balance in biome_balance:
            underlying_noise = self.overlayed.value_at(x, y)
            biome, biome_influence = balance[0], balance[1]
            amplitude = biome.get_amplitude(octave_no)
            v = octave.value_at(x, y)
            v *= amplitude * biome.get_height_multiplier(underlying_noise) * biome_influence
            v /= biome.noise_scale
            V += v
        return V

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
        self.sub_biome_map_image = Grid(perlin_grid.width, perlin_grid.height, 0)
        min_noise, max_noise = 1, 0

        for x in range(perlin_grid.width):
            for y in range(perlin_grid.height):
                height_1 = self.biome_super_map.value_at(x, y)
                height_2 = self.biome_map.value_at(x, y)
                biome_balance = self.determine_biome_by_height(height_1, height_2)
                self.biome_map.set_value_at(x, y, biome_balance)
                biome = biome_balance[0][0]
                self.biome_map_image.set_value_at(x, y, biome.parent_colour)
                self.sub_biome_map_image.set_value_at(x, y, biome.colour)

        if SAVE_IMAGE_BIOME_MAP:
            self.biome_map_image.save_RGBs(self.parent_world.name + "_biome_map", self.parent_world.name)

    def export_save_file(self):
        save_file_object = { "q": self.q, "r": self.r, "map": [] }
        for x in range(self.width_in_tiles):
            row = []
            for y in range(self.height_in_tiles):
                altitude = self.ground_map.value_at(x, y)
                ground_tile_name = self.surface_map.value_at(x, y)
                area_object_name = self.area_map.value_at(x, y)
                row.append([
                    str(self.get_biome_at(x, y)),
                    altitude,
                    ground_tile_name,
                    area_object_name
                ])
            save_file_object["map"].append(row)
        filepath = self.get_filepath(self.parent_world.name, self.q, self.r)
        save_json(save_file_object, filepath)

    def get_biome_at(self, x, y):
        return self.biome_map.value_at(x, y)[0][0]

    def determine_biome_by_height(self, height_1, height_2):
        # get main biome
        main_biome = self.biomes_rangerray.select(height_1)
        biome_obj = main_biome["value"]
        self.parent_world.biome_sizes[biome_obj.name] += 1
        sub_biome = biome_obj.select_value(height_2)

        portion_point = portion_at_point_between(main_biome["lower_point"], main_biome["upper_point"], height_1)
        blend_region = 0.05
        if portion_point <= blend_region:
            blended_biome_index = main_biome["index"] - 1
            influence = 1 - portion_at_point_between(0, blend_region, portion_point)
            influence /= 2
        elif portion_point >= 1 - blend_region:
            blended_biome_index = main_biome["index"] + 1
            influence = portion_at_point_between(1 - blend_region, 1, portion_point)
            influence /= 2
        else:
            blended_biome_index = -1

        # TEMP
        # return [(sub_biome, 1)]

        if 0 <= blended_biome_index < len(self.biomes_rangerray):
            balance = [(sub_biome, 1 - influence)]
            blended_biome = self.biomes_rangerray.select_by_index(blended_biome_index)
            blended_biome_obj = blended_biome["value"]
            sub_biome = blended_biome_obj.select_value(height_2)
            balance.append((sub_biome, influence))
        else:
            balance = [(sub_biome, 1)]


        return balance

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
            return biome.altitude_surfaces.select_value(height)

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

