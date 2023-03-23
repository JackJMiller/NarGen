import math
import simplepbr

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

        self.light_source = PointLight('plight')
        self.light_source.setColor((1, 1, 1, 1))

        # add tasks to the task manager
        self.taskMgr.add(self.move_camera_task, "MoveCameraTask")
        self.taskMgr.add(self.move_light_task, "MoveLightTask")
        # self.taskMgr.add(self.render_task, "RenderTask")
        self.render_chunk(None)

    # TODO: render chunks
    def render_chunk(self, chunk_object):
        for x in range(-5, 6):
            for y in range(-5, 6):
                self.slope = self.loader.loadModel("../models/grass_block.egg")
                self.slope.setPos(x, y, 0)
                height = int(10 + x + y + 2)
                self.slope.setScale(1, 1, height)
                self.slope.reparentTo(self.render)

    def render_task(self, task):
        self.render_chunk(None)
        return Task.cont

    # task that moves the camera
    def move_camera_task(self, task):
        self.camera.setPos(self.camera_x, self.camera_y, self.camera_z)
        self.camera.setHpr(0, -10, 0)
        return Task.cont

    # task that moves the camera
    def move_light_task(self, task):
        plnp = render.attachNewNode(self.light_source)
        plnp.setPos(self.camera_x, self.camera_y, self.camera_z)
        render.setLight(plnp)
        return Task.cont


app = Renderer3D()
app.run()
