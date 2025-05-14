import Renderer from "./Renderer.js";
import { Canvas } from "./env_script.js";
import { WorldInfo } from "./types.js";

class BrowserRenderer extends Renderer {

    constructor() {

        super();

    }

    public renderWorld(filepath: string, worldInfo: WorldInfo): void {
        // TODO
    }

    public saveImage(canvas: Canvas, filename: string): void {
        // images aren't saved in browser version
    }

}

export default BrowserRenderer;
