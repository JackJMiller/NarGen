import json, os, sys
from src.Terrain import Terrain

# locate world configuration
WORLD_NAME = sys.argv[1]
config_file_path = os.path.join("configs", WORLD_NAME, "config.json")

file = open(config_file_path, "r")
config = json.load(file)

# generate terrain according to configuration
terrain = Terrain(WORLD_NAME, config)

