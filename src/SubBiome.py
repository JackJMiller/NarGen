import json, os, sys

from src.Rangerray import Rangerray

from src.constants import OCTAVE_COUNT, RECOGNISED_SUB_BIOME_ATTRIBUTES
from src.functions import colour_average, exit_with_error, int_median, point_at_portion_between, portion_at_point_between, validate, raise_warning

class SubBiome:

    def __init__(self, parent_world, parent_biome_name, name, config, noise_lower, noise_upper):
        self.parent_world = parent_world
        self.parent_biome_name = parent_biome_name
        self.name = name
        self.full_name = self.parent_biome_name + "." + self.name
        self.noise_lower, self.noise_upper = noise_lower, noise_upper

        self.config = config[self.name]
        self.config_keys = self.config.keys()
        for key in self.config_keys:
            if key not in RECOGNISED_SUB_BIOME_ATTRIBUTES:
                exit_with_error("Unrecognised attribute", "Cannot recognise attribute " + key + " in configuration for " + self.full_name + ".")
        self.parent_colour = tuple(config["colour"])
        self.colour = tuple(colour_average(self.config["colour"], config["colour"]))

        self.configure_values()

        self.heightDisplacement = int(self.config["heightDisplacement"])

        if "height_multiplier" in self.config_keys:
            self.lower_height_multiplier = self.config["height_multiplier"]
            self.upper_height_multiplier = self.config["height_multiplier"]
        else:
            if "lower_height_multiplier" not in self.config_keys or "upper_height_multiplier" not in self.config_keys:
                exit_with_error("Missing attribute", "Please specify height_multiplier configuration value for " + self.full_name + ".")
            self.lower_height_multiplier = self.config["lower_height_multiplier"]
            self.upper_height_multiplier = self.config["upper_height_multiplier"]

        self.altitude_surfaces = Rangerray(self.full_name, self.config["altitude_surfaces"])

        self.configure_ornaments()
    
    def configure_ornaments(self):
        self.ornaments = []
        self.ornament_occurrence_rate = 0
        if "ornaments" in self.config.keys():
            validate("ornaments", self.config["ornaments"], { "sub_biome_name": self.full_name })
            for value in self.config["ornaments"]:
                if value[0] != "OCCURRENCE":
                    self.ornaments.append(value)
                else:
                    self.ornament_occurrence_rate = value[1]

    def configure_values(self):
        if "amplitudes" in self.config_keys:
            self.amplitudes = self.config["amplitudes"]
            if len(self.amplitudes) != OCTAVE_COUNT:
                exit_with_error("Invalid config value", "Length of amplitudes in configuration for " + self.full_name + " is equal to " + str(len(self.amplitudes)) + ". Length should be " + str(OCTAVE_COUNT) + ".")
            if "persistence" in self.config_keys:
                raise_warning("Redundant attribute", "Both persistence and amplitudes are attributes specified in configuration for " + self.full_name + ". Program is defaulting to ampltides attributes.")
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

