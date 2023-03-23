import json, os, sys

class Biome:

    def __init__(self, WORLD_NAME, parent_biome_name, name):
        self.parent_biome_name = parent_biome_name
        self.name = name

        config_file_path = os.path.join("configs", WORLD_NAME, "biomes", parent_biome_name, self.name + ".json")

        file = open(config_file_path, "r")
        config = json.load(file)

        self.config = config
        self.colour = tuple(self.config["colour"])
        self.persistence = float(self.config["persistence"])
        self.height_displacement = int(self.config["height_displacement"])
        self.height_multiplier = float(self.config["height_multiplier"])
        self.altitude_surfaces = self.config["altitude_surfaces"]

    def __str__(self):
        return self.parent_biome_name + "." + self.name
