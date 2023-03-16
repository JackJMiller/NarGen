import json
import sys
from Terrain import Terrain

config_file_path = sys.argv[1]
file = open(config_file_path, "r")
config = json.load(file)

terrain = Terrain(config)

