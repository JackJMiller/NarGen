import fs from "fs";
import path from "path";
import { Canvas, CanvasRenderingContext2D, createCanvas } from "canvas";
import Chunk from "./Chunk.js";
import Grid from "./Grid.js";
import { CHUNK_SIZE, TILE_DEFINITION } from "./constants.js";
import { loadJSON, SPRITE_IMAGES } from "./terminal_script.js";
import { ChunkSaveObject } from "./types.js";

class Renderer {

    constructor() {

    }

    public renderColourGrid(grid: Grid<number[]>, filename: string): void {

        let canvas = createCanvas(grid.width, grid.height);
        let ctx = canvas.getContext("2d")

        for (let x = 0; x < grid.width; x++) {
            for (let y = 0; y < grid.height; y++) {
                this.renderColourGridPixel(x, y, grid, ctx);
            }
        }

        this.saveImage(canvas, filename);

    }

    private saveImage(canvas: Canvas, filename: string): void {

        let buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(`${filename}`, buffer);

    }

    private renderColourGridPixel(x: number, y: number, grid: Grid<number[]>, ctx: CanvasRenderingContext2D): void {

        let pixel = grid.valueAt(x, y);
        ctx.fillStyle = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
        ctx.fillRect(x, y, 1, 1);

    }

    public renderWorld(worldName: string, worldPath: string): void {

        let config = loadJSON(path.join(worldPath, "GENERATED", "WORLD_INFO.json"));

        let imageWidth = config["width"] * CHUNK_SIZE * TILE_DEFINITION;
        let imageHeight = config["height"] * CHUNK_SIZE * TILE_DEFINITION;

        let canvas = createCanvas(imageWidth, imageHeight);
        let ctx = canvas.getContext("2d")

        for (let r = 0; r < config["height"]; r++) {
            let chunks: ChunkSaveObject[] = [];
            for (let q = 0; q < config["width"]; q++) {
                let filepath = Chunk.getFilepath(worldPath, q, r)
                let chunk = loadJSON(filepath) as ChunkSaveObject;
                chunks.push(chunk);
            }
            this.drawChunkRow(r, chunks, ctx);
        }

        this.saveImage(canvas, path.join(worldPath, "GENERATED", "images", "game.png"));
        
    }

    public drawChunkRow(r: number, row: ChunkSaveObject[], ctx: CanvasRenderingContext2D): void {
        for (let q = 0; q < row.length; q++) {
            for (let _y = 0; _y < CHUNK_SIZE; _y++) {
                for (let _x = 0; _x < CHUNK_SIZE; _x++) {
                    this.drawBlocksAt(q, _x, r, _y, row, ctx);
                }
            }
        }
    }

    // TODO: add brightness to communicate height
    public drawBlocksAt(q: number, _x: number, r: number, _y: number, row: ChunkSaveObject[], ctx: CanvasRenderingContext2D): void {
        let x = q * CHUNK_SIZE + _x;
        let y = r * CHUNK_SIZE + _y;
        let canvasX = x * TILE_DEFINITION;
        let canvasY = y * TILE_DEFINITION;
        let tile = row[q].tileMap[_x][_y];
        let height = tile[1];
        let surfaceName = tile[2];
        let areaObjectName = tile[3];

        for (let z = 0; z < height; z++) {
            this.drawTile(surfaceName + "_block", canvasX, canvasY, z, ctx);
            canvasY -= 14;
        }

        if (height <= 0) {
            height = Math.abs(height);
            this.drawTile("water_block", canvasX, canvasY, height, ctx);
        }

        if (areaObjectName !== "") {
            this.drawTile(areaObjectName, canvasX, canvasY, height, ctx);
        }
    }

    private drawTile(tileName: string, canvasX: number, canvasY: number, height: number, ctx: CanvasRenderingContext2D): void {
        ctx.drawImage(SPRITE_IMAGES[tileName], canvasX, canvasY);
    }

}

export default Renderer;
