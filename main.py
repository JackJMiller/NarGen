import sys

from src.GameRenderer import GameRenderer

print("===== PYTHON =====");

if sys.argv[1] == "render":
    WORLD_NAME = sys.argv[2]
    renderer = GameRenderer(WORLD_NAME)
