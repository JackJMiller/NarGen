import src.constants as constants 
import math, os, random
from PIL import Image
from src.Biome import Biome 
from src.Grid import Grid 

class Perlin:

    def __init__(self, width, height, chunk_size, AAA, BBB, CCC):

        self.chunk_size = chunk_size
        self.width_in_tiles = width
        self.height_in_tiles = height

        self.AAA = AAA
        self.BBB = BBB
        self.CCC = CCC

        self.grid = Grid(self.width_in_tiles, self.height_in_tiles, 0)

        for map_x in range(self.width_in_tiles):
            for map_y in range(self.height_in_tiles):
                _x = map_x % chunk_size
                _y = map_y % chunk_size
                chunk_x = int(map_x / chunk_size) + _x / self.chunk_size
                chunk_y = int(map_y / chunk_size) + _y / self.chunk_size
                NOISE = self.noise(chunk_x, chunk_y)
                self.grid.set_value_at(map_x, map_y, NOISE)

    def value_at(self, x, y):
        return self.grid.value_at(x, y)

    def interpolate(self, a0, a1, w):
        # if (0.0 > w) return a0
        # if (1.0 < w) return a1

        # default
        #return (a1 - a0) * w + a0

        # smoothstep
        return (a1 - a0) * (3.0 - w * 2.0) * w * w + a0

    def random_gradient(self, ix, iy):
        w = 8
        s = int(w / 2)
        a = ix
        b = iy

        a *= self.AAA
        b ^= a << s | a >> w-s
        b *= self.BBB
        a ^= b << s | b >> w-s
        a *= self.CCC
        r = a * (3.14159265 / (~(~0 >> 1) | 1))
        
        v = {
            "x": math.cos(r),
            "y": math.sin(r)
        }

        return v

    def dot_grid_gradient(self, ix, iy, x, y):
        gradient = self.random_gradient(ix, iy);

        dx = x - ix
        dy = y - iy

        return (dx*gradient["x"] + dy*gradient["y"])

    def noise(self, x, y):

        x0 = int(x)
        x1 = x0 + 1
        y0 = int(y)
        y1 = y0 + 1

        sx = x - x0
        sy = y - y0

        n0 = self.dot_grid_gradient(x0, y0, x, y)
        n1 = self.dot_grid_gradient(x1, y0, x, y)
        ix0 = self.interpolate(n0, n1, sx)

        n0 = self.dot_grid_gradient(x0, y1, x, y)
        n1 = self.dot_grid_gradient(x1, y1, x, y)
        ix1 = self.interpolate(n0, n1, sx)

        value = self.interpolate(ix0, ix1, sy)

        return value

    @staticmethod
    def get_height_colour(height):
        v = int((1 - height) * 255)
        return (v, v, v)

    def save_image(self, filename, WORLD_NAME):
        Perlin.save_as_image(self.grid, filename, WORLD_NAME)

    @staticmethod
    def save_as_image(grid, filename, WORLD_NAME):
        img = Image.new("RGB", (grid.width, grid.height), "black")

        pixels = img.load()

        for x in range(grid.width):
            for y in range(grid.height):
                v = grid.value_at(x, y)
                v = 0.5 * (v + 1)
                rgb = Perlin.get_height_colour(v)
                pixels[x, y] = rgb

        img.save(os.path.join("worlds", WORLD_NAME, "images", filename + ".png"))

    def get_grid(self):
        return self.grid
