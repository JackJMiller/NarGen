import json, os, sys

from src.Rangerray import Rangerray

from src.constants import COLOUR_SUB_BIOMES
from src.functions import int_median

class Biome:

    def __init__(self, WORLD_NAME, parent_biome_name, name, config, noise_lower, noise_upper):
        self.parent_biome_name = parent_biome_name
        self.name = name
        self.noise_lower, self.noise_upper = noise_lower, noise_upper

        self.config = config[self.name]
        if COLOUR_SUB_BIOMES:
            self.colour = tuple(int_median([config["colour"], self.config["colour"]]))
        else:
            self.colour = tuple(config["colour"])

        # TODO: have individual values for each octave's weight
        self.persistence = float(self.config["persistence"])
        # like this
        self.amplitudes = [1, 0.5, 0.25]

        self.height_displacement = int(self.config["height_displacement"])
        self.height_multiplier = float(self.config["height_multiplier"])
        self.altitude_surfaces = Rangerray(self.config["altitude_surfaces"])

    def __str__(self):
        return self.parent_biome_name + "." + self.name
