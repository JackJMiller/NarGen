import { execSync } from "child_process";
import { CHUNK_SIZE, TILE_WIDTH } from "./constants.js";
import { CanvasType, writeFileSync } from "./env_script.js";
import Renderer from "./Renderer.js";
import { WorldInfo } from "./types.js";

class SystemRenderer extends Renderer {

    constructor() {

        super();

    }

    // TODO: split world into smaller megachunks to allow larger worlds to be rendered
    public renderWorld(filepath: string, worldInfo: WorldInfo): void {
        const chunks = [];
        let imageWidth = CHUNK_SIZE * TILE_WIDTH;
        for (let r = worldInfo.r; r < worldInfo.r + worldInfo.height; r++) {
            let canvasY = imageWidth * (r - worldInfo.r);
            for (let q = worldInfo.q; q < worldInfo.q + worldInfo.width; q++) {
                let canvasX = imageWidth * (q - worldInfo.q);
                chunks.push(`\\( -page +${canvasX}+${canvasY} ${filepath}/GENERATED/images/chunks/${q}_${r}.png \\)`);
            }
        }
        let command = `magick ${chunks.join(" ")} -background none -layers merge +repage ${filepath}/GENERATED/images/world.png`;
        execSync(command);
    }

    public saveImage(canvas: CanvasType, filename: string): void {

        let buffer = canvas.toBuffer("image/png");
        writeFileSync(`${filename}`, buffer);

    }


}

export default SystemRenderer;
