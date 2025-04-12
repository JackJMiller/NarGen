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
    public AAA: number;
    public BBB: number;
    public CCC: number;
    public minNoise: number;
    public maxNoise: number;
    public noiseAcc: number;
    public noiseCount: number;
    public grid: Grid<number>;
    public average: number;

    constructor(startX: number, startY: number, width: number, height: number, chunkSize: number, AAA: number, BBB: number, CCC: number) {

        this.startX = startX;
        this.startY = startY;
        this.chunkSize = chunkSize;
        this.widthInTiles = width;
        this.heightInTiles = height;
        this.endX = this.startX + this.widthInTiles;
        this.endY = this.startY + this.heightInTiles;

        this.AAA = AAA;
        this.BBB = BBB;
        this.CCC = CCC;
        this.minNoise = 1;
        this.maxNoise = 0;
        this.noiseAcc = 0;
        this.noiseCount = 0;

        this.grid = new Grid<number>(this.widthInTiles, this.heightInTiles, 0);

        for (let x = 0; x < this.widthInTiles; x++) {
            for (let y = 0; y < this.heightInTiles; y++) {
                let mapX = this.startX + x;
                let mapY = this.startY + y;
                let _x = mapX % chunkSize;
                let _y = mapY % chunkSize;
                let chunkX = Math.floor(mapX / chunkSize) + _x / this.chunkSize;
                let chunkY = Math.floor(mapY / chunkSize) + _y / this.chunkSize;
                let NOISE = this.noise(chunkX, chunkY);
                if (NOISE > this.maxNoise) {
                    this.maxNoise = NOISE
                }
                else if (NOISE < this.minNoise) {
                    this.minNoise = NOISE
                }
                this.noiseAcc += Math.abs(NOISE)
                this.noiseCount += 1
                this.grid.setValueAt(x, y, NOISE)
            }
        }

        this.average = this.noiseAcc / this.noiseCount;

    }

    public abstract noise(x: number, y: number): number;

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

    public static createGridImage(grid: Grid<number>, verbose: boolean = false): Grid<number[]> {
        let image = new Grid<number[]>(grid.width, grid.height, [0, 0, 0]);

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
            tileSize = Math.ceil(tileSize * lacunarity!);
        }
    }

}

export default Pattern;
