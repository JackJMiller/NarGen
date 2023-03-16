import random
from Grid import Grid

random.seed(100)

WIDTH = 384
HEIGHT = 384

WIDTH = int(WIDTH / 2)
HEIGHT = int(HEIGHT / 2)

CENTRE_X = WIDTH / 2
CENTRE_Y = HEIGHT / 2

grid = Grid(WIDTH, HEIGHT)

species = ["TREE_3"]
species = ["TREE_2", "TREE_3"]

def create_spawn_forest():
    SPAWN_FOREST_SIZE = 4

    FOREST_CENTRE_X = random.randint(int(0.4 * WIDTH), int(0.6 * WIDTH))
    FOREST_CENTRE_Y = random.randint(int(0.4 * HEIGHT), int(0.6 * HEIGHT))

    LEFT_BOUND = int(FOREST_CENTRE_X - SPAWN_FOREST_SIZE)
    RIGHT_BOUND = int(FOREST_CENTRE_X + SPAWN_FOREST_SIZE - 1)
    TOP_BOUND = int(FOREST_CENTRE_Y - SPAWN_FOREST_SIZE)
    BOTTOM_BOUND = int(FOREST_CENTRE_Y + SPAWN_FOREST_SIZE - 1)

    for counter in range(3):
        for s in species:
            x = random.randint(LEFT_BOUND, RIGHT_BOUND)
            y = random.randint(TOP_BOUND, BOTTOM_BOUND)
            while not grid.is_empty_cell(x, y):
                x = random.randint(LEFT_BOUND, RIGHT_BOUND)
                y = random.randint(TOP_BOUND, BOTTOM_BOUND)
            grid.add_cell(x, y, s)

create_spawn_forest()

for i in range(100):
    grid.save_image()
    grid.update()

