import json, os, sys

from src.Rangerray import Rangerray

from src.constants import COLOUR_SUB_BIOMES, OCTAVE_COUNT
from src.functions import int_median

class Biome:

    def __init__(self, WORLD_NAME, parent_biome_name, name, config, noise_lower, noise_upper):
        self.parent_biome_name = parent_biome_name
        self.name = name
        self.full_name = self.parent_biome_name + "." + self.name
        self.noise_lower, self.noise_upper = noise_lower, noise_upper

        self.config = config[self.name]
        if COLOUR_SUB_BIOMES:
            self.colour = tuple(int_median([config["colour"], self.config["colour"]]))
        else:
            self.colour = tuple(config["colour"])

        self.persistence = float(self.config["persistence"])
        self.configure_values()

        self.height_displacement = int(self.config["height_displacement"])
        self.height_multiplier = float(self.config["height_multiplier"])
        self.altitude_surfaces = Rangerray(self.full_name, self.config["altitude_surfaces"])


    def configure_values(self):
        self.noise_scale = 0
        self.amplitudes = []
        amplitude = 1
        for i in range(OCTAVE_COUNT):
            self.amplitudes.append(amplitude)
            self.noise_scale += amplitude
            amplitude *= self.persistence

    def __str__(self):
        return self.parent_biome_name + "." + self.name

