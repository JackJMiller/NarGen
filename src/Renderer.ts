import Chunk from "./Chunk.js";
import Grid from "./Grid.js";
import { CHUNK_SIZE, TILE_HEIGHT, TILE_WIDTH } from "./constants.js";
import { CanvasContext, Canvas, createCanvas, loadJSON, SPRITE_IMAGES } from "./env_script.js";
import { ChunkSaveObject, Colour, WorldInfo } from "./types.js";

abstract class Renderer {

    constructor() {

    }

    public renderColourGrid(grid: Grid<Colour>, filename: string): void {

        let canvas = createCanvas(grid.width, grid.height);
        let ctx = canvas.getContext("2d")

        for (let x = 0; x < grid.width; x++) {
            for (let y = 0; y < grid.height; y++) {
                this.renderColourGridPixel(x, y, grid, ctx);
            }
        }

        this.saveChunkImage(canvas, filename);

    }

    private renderColourGridPixel(x: number, y: number, grid: Grid<Colour>, ctx: CanvasContext): void {

        let pixel = grid.valueAt(x, y);
        ctx.fillStyle = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
        ctx.fillRect(x, y, 1, 1);

    }

    public renderChunks(worldName: string, worldPath: string): void {

        let worldInfo = loadJSON<WorldInfo>([worldPath, "GENERATED", "WORLD_INFO.json"].join("/"));

        for (let r = worldInfo.r; r < worldInfo.r + worldInfo.height; r++) {
            for (let q = worldInfo.q; q < worldInfo.q + worldInfo.width; q++) {
                let filepath = Chunk.getFilepath(worldPath, q, r)
                let chunk = loadJSON<ChunkSaveObject>(filepath);
                this.gameRenderChunk(chunk, worldInfo, worldPath);
            }
        }
        
    }

    public gameRenderChunk(chunk: ChunkSaveObject, worldInfo: WorldInfo, worldPath: string): void {
        let imageWidth = CHUNK_SIZE * TILE_WIDTH;
        let imageHeight = CHUNK_SIZE * TILE_WIDTH + worldInfo.maxHeight * TILE_HEIGHT + TILE_WIDTH;
        let canvas = createCanvas(imageWidth, imageHeight);
        let ctx = canvas.getContext("2d")
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let y = 0; y < CHUNK_SIZE; y++) {
                this.drawBlocksAt(chunk, worldInfo, x, y, ctx);
            }
        }
        this.saveChunkImage(canvas, [worldPath, "GENERATED", "images", "game", `game_${chunk.q}_${chunk.r}.png`].join("/"));
    }

    public abstract saveChunkImage(canvas: Canvas, filename: string): void;

    // TODO: add brightness to communicate height
    public drawBlocksAt(chunk: ChunkSaveObject, worldInfo: WorldInfo, x: number, y: number, ctx: CanvasContext): void {
        let canvasX = x * TILE_WIDTH;
        let canvasY = y * TILE_WIDTH + worldInfo.maxHeight * TILE_HEIGHT;
        let tile = chunk.tileGrid[x][y];
        let height = tile[1];
        let surfaceName = tile[2];
        let areaObjectName = tile[3];

        for (let z = 0; z < height; z++) {
            this.drawTile(surfaceName + "_block", canvasX, canvasY, z, ctx);
            canvasY -= TILE_HEIGHT;
        }

        if (height <= 0) {
            height = Math.abs(height);
            this.drawTile("water_block", canvasX, canvasY, height, ctx);
        }

        if (areaObjectName !== "") {
            this.drawTile(areaObjectName, canvasX, canvasY, height, ctx);
        }
    }

    private drawTile(tileName: string, canvasX: number, canvasY: number, height: number, ctx: CanvasContext): void {
        ctx.drawImage(SPRITE_IMAGES[tileName], canvasX, canvasY);
    }

}

export default Renderer;
