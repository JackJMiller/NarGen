import random
from functions import mean
from Cell import Cell
from PIL import Image

class Grid:

    def __init__(self, width, height):

        self.width = width
        self.height = height
        self.species = {}
        self.grid = self.create_grid()
        self.generation = 0

    def update(self):
        new_grid = self.create_grid()
        for x in range(self.width):
            for y in range(self.height):
                cell = self.grid[x][y]
                cell_age = cell[0]
                if cell_age > 0:
                    cell_age = cell_age
                    cell_object = cell[1]
                    neighbours = self.count_neighbours(x, y, cell_object.view)

                    if cell_object.reproduce[0] <= neighbours <= cell_object.reproduce[1]:
                        new_cell_x, new_cell_y = self.select_random_neighbour(x, y, cell_object.reach)
                        if new_cell_x != None:
                            new_grid[new_cell_x][new_cell_y] = [1, cell_object]


                    if cell_object.survive[0] <= neighbours <= cell_object.survive[1] and cell_age + 1 <= cell_object.lifespan:
                        new_grid[x][y] = [cell_age + 1, cell_object]
                    else:
                        new_grid[x][y] = [0, cell_object]

        self.generation += 1
        self.grid = new_grid

    def add_cell(self, x, y, species):
        if species not in self.species.keys():
            self.import_species(species)
        self.grid[x][y] = [1, self.species[species]]

    def is_empty_cell(self, x, y):
        return self.grid[x][y][0] == 0

    def import_species(self, species):
        self.species[species] = Cell(species)
        print(self.species)

    def select_random_neighbour(self, centre_x, centre_y, reach):
        possible_neighbours = []
        for x in range(centre_x - reach, centre_x + reach + 1):
            for y in range(centre_y - reach, centre_y + reach + 1):
                if (x != centre_x or y != centre_y) and self.is_in_bounds(x, y):
                    possible_neighbours.append((x, y))
        if len(possible_neighbours) > 0:
            i = random.randint(0, len(possible_neighbours) - 1)
            neighbour = possible_neighbours[i]
            return neighbour[0], neighbour[1]
        else:
            return None, None


    def count_neighbours(self, cell_x, cell_y, view):
        neighbours = 0
        for x in range(cell_x - view, cell_x + view + 1):
            for y in range(cell_y - view, cell_y + view + 1):
                if (x != cell_x or y != cell_y) and self.is_in_bounds(x, y):
                    cell = self.grid[x][y]
                    if cell[0] == 1:
                        neighbours += 1
        return neighbours

    def is_in_bounds(self, x, y):
        return 0 <= x < self.width and 0 <= y < self.height

    def create_grid(self):
        grid = []
        return [[[0, ""] for __ in range(self.height)] for _ in range(self.width)]

    def get_colour(self, cell):
        cell_age = cell[0]
        cell_object = cell[1]
        if cell_age == 0:
            return (255, 255, 255)
        cell_colour = tuple(cell_object.colour)
        if cell_age < int(cell_object.lifespan / 3):
            life_lived = cell_age / cell_object.lifespan

            r = cell_colour[0]
            _r = 255 - r
            r = int(255 - _r * life_lived * 3)

            g = cell_colour[1]
            _g = 255 - g
            g = int(255 - _g * life_lived * 3)

            b = cell_colour[2]
            _b = 255 - b
            b = int(255 - _b * life_lived * 3)
            return (r, g, b)
        else:
            return cell_colour

    def save_image(self):
        img = Image.new("RGB", (self.width, self.height), "white")
        pixels = img.load()

        for x in range(self.width):
            for y in range(self.height):
                pixels[x, y] = self.get_colour(self.grid[x][y])

        filename = str(self.generation)

        img.save("images/" + filename + ".png")

    def colour_average(self, c1, c2):
        return (
            int(mean(c1[0], c2[0])),
            int(mean(c1[1], c2[1])),
            int(mean(c1[2], c2[2]))
        )
