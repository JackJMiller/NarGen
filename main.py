import json, os, sys
from src.Terrain import Terrain
from src.GameRenderer import GameRenderer
from src.Renderer3D import Renderer3D

print(sys.argv)
if sys.argv[1] == "generate":
    print("generating " + sys.argv[1])
    # locate world configuration
    WORLD_NAME = sys.argv[2]
    config_file_path = os.path.join("configs", WORLD_NAME, "CONFIG.json")

    file = open(config_file_path, "r")
    config = json.load(file)

    # generate terrain according to configuration
    terrain = Terrain(WORLD_NAME, config)

elif sys.argv[1] == "render":
    print("rendering " + sys.argv[1])
    WORLD_NAME = sys.argv[2]
    renderer = Renderer3D(WORLD_NAME)
    renderer.run()

elif sys.argv[1] == "render-game":
    print("rendering " + sys.argv[1])
    WORLD_NAME = sys.argv[2]
    renderer = GameRenderer(WORLD_NAME)

else:
    sys.exit(1)


