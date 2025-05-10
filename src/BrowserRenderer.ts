import Renderer from "./Renderer.js";
import { CanvasType } from "./env_script.js";
import { WorldInfo } from "./types.js";

class BrowserRenderer extends Renderer {

    constructor() {

        super();

    }

    public renderWorld(filepath: string, worldInfo: WorldInfo): void {
        // TODO
    }

    public saveImage(canvas: CanvasType, filename: string): void {
        // images aren't saved in browser version
    }

}

export default BrowserRenderer;
