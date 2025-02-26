import sys

from src.GameRenderer import GameRenderer

if sys.argv[1] == "render":
    WORLD_PATH = sys.argv[2]
    renderer = GameRenderer(WORLD_PATH)
