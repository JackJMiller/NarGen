import os, sys

from src.GameRenderer import GameRenderer

print("===== PYTHON =====");

if sys.argv[1] == "render":
    WORLD_NAME = os.path.basename(sys.argv[2])
    renderer = GameRenderer(WORLD_NAME)
