import json
import math

class Cell:

    def __init__(self, species):

        file_path = "cell_configs/" + species + ".json"
        file = open(file_path, "r")
        config = json.load(file)

        self.colour = config["colour"]
        self.lifespan = config["lifespan"]
        self.half_lifespan = math.ceil(self.lifespan / 2)
        self.reach = config["reach"]
        self.view = config["view"] | 1
        self.survive = config["survive"]
        self.reproduce = config["reproduce"]

        tiles_in_view = (self.view * 2 + 1) ** 2 - 1
        for i in range(2):
            if type(self.reproduce[i]) == str:
                self.reproduce[i] = int(float(self.reproduce[i]) * tiles_in_view)
            if type(self.survive[i]) == str:
                self.survive[i] = int(float(self.survive[i]) * tiles_in_view)


