import json, os, sys

from src.Rangerray import Rangerray

class Biome:

    def __init__(self, WORLD_NAME, parent_biome_name, name, config):
        self.parent_biome_name = parent_biome_name
        self.name = name

        self.config = config
        self.colour = tuple(self.config["colour"])
        self.persistence = float(self.config["persistence"])
        self.height_displacement = int(self.config["height_displacement"])
        self.height_multiplier = float(self.config["height_multiplier"])
        self.altitude_surfaces = Rangerray(self.config["altitude_surfaces"])

    def __str__(self):
        return self.parent_biome_name + "." + self.name
