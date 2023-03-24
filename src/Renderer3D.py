import json, math, os, simplepbr, sys
import random

from src.constants import AVAILABLE_BLOCKS, CHUNK_SIZE

from direct.showbase.ShowBase import ShowBase
from direct.task import Task
from panda3d.core import PointLight

class Renderer3D(ShowBase):
    def __init__(self, world_name):
        ShowBase.__init__(self)

        simplepbr.init()

        self.world_name = world_name

        # position of camera and light
        self.camera_x = 0
        self.camera_y = 0
        self.camera_z = 30

        self.chunk = []
        self.chunks_loaded = []


        self.light_source = PointLight('plight')
        self.light_source.setColor((1, 1, 1, 1))

        # add tasks to the task manager
        self.taskMgr.add(self.move_camera_task, "MoveCameraTask")
        for q in range(5):
            for r in range(5):
                self.load_chunk(q, r)

    # load specified chunk
    def load_chunk(self, chunk_q, chunk_r):
        filepath = TerrainChunk.get_filepath(self.world_name, chunk_q, chunk_r)
        file = open(filepath, "r")
        save_object = json.load(file)
        chunk_corner_x = chunk_q * CHUNK_SIZE
        chunk_corner_y = chunk_r * CHUNK_SIZE
        for _x in range(CHUNK_SIZE):
            for _y in range(CHUNK_SIZE):
                tile = save_object["map"][_x][_y]
                height = tile[1]
                if height < 1:
                    height = 1
                block_name = tile[2]
                if block_name not in AVAILABLE_BLOCKS:
                    block_name = "grass"
                model = self.loader.loadModel(os.path.join("res", "3d_models", block_name + "_block.egg"))
                x = chunk_corner_x + _x
                y = chunk_corner_y + _y
                model.setPos(x, y, 0)
                model.setScale(1, 1, height)
                model.reparentTo(self.render)
                self.chunk.append(model)
                self.chunks_loaded.append(str(chunk_q) + "x" + str(chunk_r))

    # task that moves the camera
    def move_camera_task(self, task):
        elapsed = task.time

        self.camera_x = 20 + 2 * elapsed
        self.camera_y = -30 + 2 * elapsed
        # self.camera_z = 10 + elapsed

        self.camera.setPos(self.camera_x, self.camera_y, self.camera_z)
        self.camera.setHpr(0, -20, 0)
        plnp = render.attachNewNode(self.light_source)
        plnp.setPos(self.camera_x, self.camera_y, self.camera_z)
        render.setLight(plnp)

        self.camera_chunk_q = int(self.camera_x / CHUNK_SIZE)
        self.camera_chunk_r = int(self.camera_y / CHUNK_SIZE)

        if 0 <= self.camera_chunk_q and 0 <= self.camera_chunk_r and str(self.camera_chunk_q) + "x" + str(self.camera_chunk_r) not in self.chunks_loaded:
            self.load_chunk(self.camera_chunk_q, self.camera_chunk_r)

        return Task.cont
