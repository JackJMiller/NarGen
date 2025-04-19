import Grid from "./Grid.js";
import { Colour, Vector2 } from "./types.js";

abstract class Pattern {

    public startX: number;
    public startY: number;
    public chunkSize: number;
    public widthInTiles: number;
    public heightInTiles: number;
    public endX: number;
    public endY: number;
    public minNoise: number = 1;
    public maxNoise: number = 0;
    public noiseAcc: number = 0;
    public noiseCount: number = 0;
    public grid: Grid<number>;
    public average: number;
    public seed: number;

    constructor(startX: number, startY: number, width: number, height: number, chunkSize: number, seed: number) {

        this.startX = startX;
        this.startY = startY;
        this.chunkSize = chunkSize;
        this.seed = seed;
        this.widthInTiles = width;
        this.heightInTiles = height;
        this.endX = this.startX + this.widthInTiles;
        this.endY = this.startY + this.heightInTiles;

        this.grid = new Grid<number>(this.widthInTiles, this.heightInTiles, 0);

        this.drawPattern();

        this.average = this.noiseAcc / this.noiseCount;

    }

    public drawPattern(): void {

        for (let x = 0; x < this.widthInTiles; x++) {
            for (let y = 0; y < this.heightInTiles; y++) {
                let value = this.computeValueAt(this.startX + x, this.startY + y);
                this.noiseAcc += Math.abs(value);
                this.noiseCount += 1;
                this.grid.setValueAt(x, y, value);
            }
        }

    }

    protected getTileBounds(x: number, y: number): { x0: number, x1: number, y0: number, y1: number } {
        let x0 = Math.floor(x);
        let x1 = x0 + 1;
        let y0 = Math.floor(y);
        let y1 = y0 + 1;
        return { x0, x1, y0, y1 };
    }

    private computeValueAt(x: number, y: number): number {
        let _x = x % this.chunkSize;
        let _y = y % this.chunkSize;
        let chunkX = Math.floor(x / this.chunkSize) + _x / this.chunkSize;
        let chunkY = Math.floor(y / this.chunkSize) + _y / this.chunkSize;
        let value = this.compute(chunkX, chunkY);
        if (value > this.maxNoise) {
            this.maxNoise = value
        }
        else if (value < this.minNoise) {
            this.minNoise = value
        }
        return value;
    }

    public abstract compute(x: number, y: number): number;

    public abstract randomGradient(ix: number, iy: number): Vector2;

    public abstract dotGridGradient(ix: number, iy: number, x: number, y: number): number;

    public valueAt(x: number, y: number): number {
        return this.grid.valueAt(x, y);
    }

    public getAverageValue(): number {
        return this.noiseAcc / this.noiseCount;
    }

    public getMinValue(): number {
        return this.minNoise;
    }

    public getMaxValue(): number {
        return this.maxNoise;
    }

    public interpolate(a0: number, a1: number, w: number): number {
        // if (0.0 > w) return a0;
        // if (1.0 < w) return a1;

        // default
        // return (a1 - a0) * w + a0;

        // smoothstep
        return (a1 - a0) * (3.0 - w * 2.0) * w * w + a0;
    }

    public static getHeightColour(height: number): Colour {
        let v = Math.floor((1 - height) * 256);
        return [v, v, v];
    }

    public static createGridImage(grid: Grid<number>, verbose: boolean = false): Grid<Colour> {
        let image = new Grid<Colour>(grid.width, grid.height, [0, 0, 0]);

        for (let x = 0; x < grid.width; x++) {
            for (let y = 0; y < grid.height; y++) {
                let v = grid.valueAt(x, y);
                let rgb = Pattern.getHeightColour(v);
                image.setValueAt(x, y, rgb);
                if (verbose) console.log(`${v} -> (${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
            }
        }

        return image;

    }

    public getGrid(): Grid<number> {
        return this.grid
    }

    public static determineTileSizes(tileSizes: number[], noiseTileSize: number, octaveCount: number, lacunarity: number): void {
        let tileSize = noiseTileSize;
        for (let i = 0; i < octaveCount; i++) {
            tileSizes.push(tileSize);
            tileSize = Math.ceil(tileSize * lacunarity);
        }
    }

}

export default Pattern;
