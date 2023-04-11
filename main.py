import json, os, sys

from src.GameRenderer import GameRenderer
from src.Renderer3D import Renderer3D
from src.World import World

if sys.argv[1] == "generate":
    # locate world configuration
    WORLD_NAME = sys.argv[2]
    config_file_path = os.path.join("configs", WORLD_NAME, "CONFIG.json")

    file = open(config_file_path, "r")
    config = json.load(file)

    # generate terrain world according to configuration
    world = World(WORLD_NAME, config)

elif sys.argv[1] == "render":
    WORLD_NAME = sys.argv[2]
    renderer = Renderer3D(WORLD_NAME)
    renderer.run()

elif sys.argv[1] == "render-game":
    WORLD_NAME = sys.argv[2]
    renderer = GameRenderer(WORLD_NAME)

else:
    sys.exit(1)


