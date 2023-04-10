import json, os, sys

from src.Rangerray import Rangerray

from src.constants import COLOUR_SUB_BIOMES, OCTAVE_COUNT
from src.functions import exit_with_error, int_median, point_at_portion_between, portion_at_point_between

class SubBiome:

    def __init__(self, WORLD_NAME, parent_biome_name, name, config, noise_lower, noise_upper):
        self.parent_biome_name = parent_biome_name
        self.name = name
        self.full_name = self.parent_biome_name + "." + self.name
        self.noise_lower, self.noise_upper = noise_lower, noise_upper

        self.config = config[self.name]
        self.config_keys = self.config.keys()
        if COLOUR_SUB_BIOMES:
            self.colour = tuple(int_median([config["colour"], self.config["colour"]]))
        else:
            self.colour = tuple(config["colour"])

        self.configure_values()

        self.height_displacement = int(self.config["height_displacement"])

        if "height_multiplier" in self.config_keys:
            self.lower_height_multiplier = self.config["height_multiplier"]
            self.upper_height_multiplier = self.config["height_multiplier"]
        else:
            if "lower_height_multiplier" not in self.config_keys or "upper_height_multiplier" not in self.config_keys:
                exit_with_error("Missing attribute", "Please specify height_multiplier configuration value for " + self.full_name + ".")
            self.lower_height_multiplier = self.config["lower_height_multiplier"]
            self.upper_height_multiplier = self.config["upper_height_multiplier"]

        self.altitude_surfaces = Rangerray(self.full_name, self.config["altitude_surfaces"])


    def configure_values(self):
        if "amplitudes" in self.config_keys:
            self.amplitudes = self.config["amplitude"]
        elif "persistence" in self.config_keys:
            persistence = float(self.config["persistence"])
            self.amplitudes = []
            amplitude = 1
            for i in range(OCTAVE_COUNT):
                self.amplitudes.append(amplitude)
                amplitude *= persistence
        else:
            exit_with_error("Missing attribute", "Please specify persistence or amplitudes configuration value for " + self.full_name + ".")

        self.noise_scale = 0
        for amplitude in self.amplitudes:
            self.noise_scale += amplitude


    def get_height_multiplier(self, noise_value):
        portion = portion_at_point_between(self.noise_lower, self.noise_upper, noise_value)
        multiplier = point_at_portion_between(self.lower_height_multiplier, self.upper_height_multiplier, portion)
        return multiplier

    def get_amplitude(self, index):
        return self.amplitudes[index]

    def __str__(self):
        return self.parent_biome_name + "." + self.name

