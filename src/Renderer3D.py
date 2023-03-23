import json, math, os, simplepbr, sys

import src.constants as constants

from direct.showbase.ShowBase import ShowBase
from direct.task import Task
from panda3d.core import PointLight

class Renderer3D(ShowBase):
    def __init__(self):
        ShowBase.__init__(self)

        simplepbr.init()

        # position of camera and light
        self.camera_x = 0
        self.camera_y = -30
        self.camera_z = 10

        self.chunk = []

        self.light_source = PointLight('plight')
        self.light_source.setColor((1, 1, 1, 1))

        # add tasks to the task manager
        self.taskMgr.add(self.move_camera_task, "MoveCameraTask")
        self.load_chunk("Mundito", 3, 4)

    # load specified chunk
    def load_chunk(self, world_name, chunk_q, chunk_r):
        filepath = os.path.join("worlds", world_name, "chunks", str(chunk_q) + "x" + str(chunk_r) + ".json")
        file = open(filepath, "r")
        save_object = json.load(file)
        for x in range(constants.CHUNK_SIZE):
            for y in range(constants.CHUNK_SIZE):
                model = self.loader.loadModel("models/grass_block.egg")
                model.setPos(x, y, 0)
                height = save_object["map"][x][y][1]
                height = math.ceil(height / 16)
                model.setScale(1, 1, height)
                model.reparentTo(self.render)
                self.chunk.append(model)

    # task that moves the camera
    def move_camera_task(self, task):
        elapsed = task.time

        self.camera_x = elapsed
        self.camera_y = -30 + 2 * elapsed
        self.camera_z = 10 + elapsed

        self.camera.setPos(self.camera_x, self.camera_y, self.camera_z)
        self.camera.setHpr(0, -10, 0)
        plnp = render.attachNewNode(self.light_source)
        plnp.setPos(self.camera_x, self.camera_y, self.camera_z)
        render.setLight(plnp)
        return Task.cont
