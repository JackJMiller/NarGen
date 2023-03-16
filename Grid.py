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

    @staticmethod
    def get_height_colour(height):
        v = int((1 - height) * 255)
        return (v, v, v)

    def save_image(self, filename):
        img = Image.new("RGB", (self.width, self.height), "black")

        pixels = img.load()

        for x in range(self.width):
            for y in range(self.height):
                v = self.grid[x][y]
                rgb = Grid.get_height_colour(v)
                pixels[x, y] = rgb

        img.save("images/" + filename + ".png")

    def save_RGBs(self, filename):
        img = Image.new("RGB", (self.width, self.height), "black")

        pixels = img.load()

        for x in range(self.width):
            for y in range(self.height):
                pixels[x, y] = self.grid[x][y]

        img.save("images/" + filename + ".png")

    def copy(self):
        grid = Grid(self.width, self.height, 0)

        for x in range(self.width):
            for y in range(self.height):
                v = self.value_at(x, y)
                grid.set_value_at(x, y, v)

        return grid
