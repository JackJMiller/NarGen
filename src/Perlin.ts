import Grid from "./Grid.js";
import { Vector2 } from "./types.js";

class Perlin {

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
        // if (0.0 > w) return a0
        // if (1.0 < w) return a1

        // default
        // return (a1 - a0) * w + a0

        // smoothstep
        return (a1 - a0) * (3.0 - w * 2.0) * w * w + a0;
    }

    public randomGradient(ix: number, iy: number): Vector2 {
        let w = 8;
        let s = Math.floor(w / 2);
        let a = ix;
        let b = iy;

        a *= this.AAA
        b ^= a << s | a >> w-s
        b *= this.BBB
        a ^= b << s | b >> w-s
        a *= this.CCC
        let r = a * (3.14159265 / (~(~0 >> 1) | 1));
        
        let v = { x: Math.cos(r), y: Math.sin(r) };

        return v;
    }

    public dotGridGradient(ix: number, iy: number, x: number, y: number): number {
        let gradient = this.randomGradient(ix, iy);

        let dx = x - ix;
        let dy = y - iy;

        return (dx*gradient["x"] + dy*gradient["y"]);
    }

    public noise(x: number, y: number): number {

        let x0 = Math.floor(x);
        let x1 = x0 + 1;
        let y0 = Math.floor(y);
        let y1 = y0 + 1;

        let sx = x - x0;
        let sy = y - y0;

        let n0 = this.dotGridGradient(x0, y0, x, y);
        let n1 = this.dotGridGradient(x1, y0, x, y);
        let ix0 = this.interpolate(n0, n1, sx);

        n0 = this.dotGridGradient(x0, y1, x, y);
        n1 = this.dotGridGradient(x1, y1, x, y);
        let ix1 = this.interpolate(n0, n1, sx);

        let value = this.interpolate(ix0, ix1, sy);

        value = (value + 1) / 2;

        return value;

    }

    public static getHeightColour(height: number): number[] {
        let v = height - 0.5;
        v *= 5;
        v += 0.5;
        v = Math.floor((1 - v) * 255);
        return [v, v, v];
    }

    //public saveImage(filename, WORLDNAME) {
    //    Perlin.save(this.grid, os.path.join("worlds", WORLDNAME, "images", filename + ".png"))

    //public static createImage(grid) {
    //    img = Image.new("RGB", (grid.width, grid.height), "black")
    //
    //    pixels = img.load()
    //
    //    for x in range(grid.width) {
    //        for y in range(grid.height) {
    //            v = grid.valueAt(x, y)
    //            v = 0.5 * (v + 1)
    //            rgb = Perlin.getHeightColour(v)
    //            pixels[x, y] = rgb
    //        }
    //    }
    //
    //    return img
    //}

    public static createGridImage(grid: Grid<number>): Grid<number[]> {
        let image = new Grid<number[]>(grid.width, grid.height, [0, 0, 0]);

        for (let x = 0; x < grid.width; x++) {
            for (let y = 0; y < grid.height; y++) {
                let v = grid.valueAt(x, y);
                let rgb = Perlin.getHeightColour(v);
                image.setValueAt(x, y, rgb);
            }
        }

        return image;

    }

    //public static save(grid, path) {
    //    img = Perlin.createImage(grid)
    //
    //    img.save(path)
    //}

    public getGrid(): Grid<number> {
        return this.grid
    }
}

export default Perlin;
