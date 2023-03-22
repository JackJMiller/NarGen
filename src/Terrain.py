from src.TerrainChunk import TerrainChunk

class Terrain:

    def __init__(self, WORLD_NAME, config):

        self.WORLD_NAME = WORLD_NAME
        for q in range(10):
            for r in range(10):
                chunk = TerrainChunk(self.WORLD_NAME, q, r, config)

        print("Terrain generation complete")
        print("World can be found in worlds/" + self.WORLD_NAME + "/")

