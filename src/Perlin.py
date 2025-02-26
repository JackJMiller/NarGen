import src.constants as constants 
import math, os, random

from PIL import Image
from src.Grid import Grid 

class Perlin:

    def __init__(self, start_x, start_y, width, height, chunk_size, AAA, BBB, CCC):

        self.start_x = start_x
        self.start_y = start_y
        self.chunk_size = chunk_size
        self.width_in_tiles = width
        self.height_in_tiles = height
        self.end_x = self.start_x + self.width_in_tiles
        self.end_y = self.start_y + self.height_in_tiles

        self.AAA = AAA
        self.BBB = BBB
        self.CCC = CCC
        self.min_noise, self.max_noise = 1, 0
        self.noise_acc, self.noise_count = 0, 0

        self.grid = Grid(self.width_in_tiles, self.height_in_tiles, 0)

        for x in range(self.width_in_tiles):
            for y in range(self.height_in_tiles):
                map_x = self.start_x + x
                map_y = self.start_y + y
                _x = map_x % chunk_size
                _y = map_y % chunk_size
                chunk_x = int(map_x / chunk_size) + _x / self.chunk_size
                chunk_y = int(map_y / chunk_size) + _y / self.chunk_size
                NOISE = self.noise(chunk_x, chunk_y)
                if NOISE > self.max_noise:
                    self.max_noise = NOISE
                elif NOISE < self.min_noise:
                    self.min_noise = NOISE
                self.noise_acc += abs(NOISE)
                self.noise_count += 1
                self.grid.set_value_at(x, y, NOISE)

        self.average = self.noise_acc / self.noise_count

    def value_at(self, x, y):
        return self.grid.value_at(x, y)

    def get_average_value(self):
        return self.noise_acc / self.noise_count

    def get_min_value(self):
        return self.min_noise

    def get_max_value(self):
        return self.max_noise

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

        value = (value + 1) / 2

        return value

    @staticmethod
    def get_height_colour(height):
        v = height - 0.5
        v *= 5
        v += 0.5
        v = int((1 - v) * 255)
        return (v, v, v)

    def save_image(self, filename, WORLD_NAME):
        Perlin.save(self.grid, os.path.join("worlds", WORLD_NAME, "GENERATED", "images", filename + ".png"))

    @staticmethod
    def create_image(grid):
        img = Image.new("RGB", (grid.width, grid.height), "black")

        pixels = img.load()

        for x in range(grid.width):
            for y in range(grid.height):
                v = grid.value_at(x, y)
                v = 0.5 * (v + 1)
                rgb = Perlin.get_height_colour(v)
                pixels[x, y] = rgb

        return img

    @staticmethod
    def create_grid_image(grid):
        image = Grid(grid.width, grid.height, 0)

        for x in range(grid.width):
            for y in range(grid.height):
                v = grid.value_at(x, y)
                rgb = Perlin.get_height_colour(v)
                image.set_value_at(x, y, rgb)

        return image

    @staticmethod
    def save(grid, path):
        img = Perlin.create_image(grid)

        img.save(path)

    def get_grid(self):
        return self.grid

