import os
from PIL import Image

class Grid:

    def __init__(self, width, height, fill):

        self.width = width
        self.height = height
        self.grid = [[fill] * height for _ in range(width)]

    def value_at(self, x, y):
        return self.grid[x][y]

    def set_value_at(self, x, y, value):
        self.grid[x][y] = value

    def is_in_bounds(self, x, y):
        return (0 <= x < self.width and 0 <= y < self.height)

    def overlay(self, overlay_grid, corner_x = 0, corner_y = 0):
        for _x in range(overlay_grid.width):
            for _y in range(overlay_grid.height):
                x, y = corner_x + _x, corner_y + _y
                value = overlay_grid.value_at(_x, _y)
                if 0 <= x < self.width and 0 <= y < self.height:
                    self.set_value_at(x, y, value)

    @staticmethod
    def get_height_colour(height):
        v = int((1 - height) * 255)
        return (v, v, v)

    def save_image(self, filename, WORLD_NAME):
        img = Image.new("RGB", (self.width, self.height), "black")

        pixels = img.load()

        for x in range(self.width):
            for y in range(self.height):
                v = self.grid[x][y]
                rgb = Grid.get_height_colour(v)
                pixels[x, y] = rgb

        img.save(os.path.join("worlds", WORLD_NAME, "GENERATED", "images", filename + ".png"))

    def save_RGBs(self, filename, WORLD_NAME):
        img = Image.new("RGB", (self.width, self.height), "black")

        pixels = img.load()

        for x in range(self.width):
            for y in range(self.height):
                pixels[x, y] = self.grid[x][y]

        img.save(os.path.join("worlds", WORLD_NAME, "GENERATED", "images", filename + ".png"))

    def copy(self):
        grid = Grid(self.width, self.height, 0)

        for x in range(self.width):
            for y in range(self.height):
                v = self.value_at(x, y)
                grid.set_value_at(x, y, v)

        return grid

    def calculate_average(self):
        acc = 0
        for x in range(self.width):
            for y in range(self.height):
                acc += self.value_at(x, y)

        return acc / (self.width * self.height)

