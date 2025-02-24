import Grid from "./Grid";

class Perlin {

    public start_x: number;
    public start_y: number;
    public chunk_size: number;
    public width_in_tiles: number;
    public height_in_tiles: number;
    public end_x: number;
    public end_y: number;
    public AAA: number;
    public BBB: number;
    public CCC: number;
    public min_noise: number;
    public max_noise: number;
    public noise_acc: number;
    public noise_count: number;
    public grid: Grid<number>;
    public average: number;

    constructor(start_x: number, start_y: number, width: number, height: number, chunk_size: number, AAA: number, BBB: number, CCC: number) {

        this.start_x = start_x;
        this.start_y = start_y;
        this.chunk_size = chunk_size;
        this.width_in_tiles = width;
        this.height_in_tiles = height;
        this.end_x = this.start_x + this.width_in_tiles;
        this.end_y = this.start_y + this.height_in_tiles;

        this.AAA = AAA;
        this.BBB = BBB;
        this.CCC = CCC;
        this.min_noise = 1;
        this.max_noise = 0;
        this.noise_acc = 0;
        this.noise_count = 0;

        this.grid = new Grid<number>(this.width_in_tiles, this.height_in_tiles, 0);

        for (let x = 0; x < this.width_in_tiles; x++) {
            for (let y = 0; y < this.height_in_tiles; y++) {
                let map_x = this.start_x + x;
                let map_y = this.start_y + y;
                let _x = map_x % chunk_size;
                let _y = map_y % chunk_size;
                let chunk_x = Math.floor(map_x / chunk_size) + _x / this.chunk_size;
                let chunk_y = Math.floor(map_y / chunk_size) + _y / this.chunk_size;
                let NOISE = this.noise(chunk_x, chunk_y);
                if (NOISE > this.max_noise) {
                    this.max_noise = NOISE
                }
                else if (NOISE < this.min_noise) {
                    this.min_noise = NOISE
                }
                this.noise_acc += Math.abs(NOISE)
                this.noise_count += 1
                this.grid.set_value_at(x, y, NOISE)
            }
        }

        this.average = this.noise_acc / this.noise_count;

    }

    public value_at(x: number, y: number): number {
        return this.grid.value_at(x, y);
    }

    public get_average_value(): number {
        return this.noise_acc / this.noise_count;
    }

    public get_min_value(): number {
        return this.min_noise;
    }

    public get_max_value(): number {
        return this.max_noise;
    }

    public interpolate(a0: number, a1: number, w: number): number {
        // if (0.0 > w) return a0
        // if (1.0 < w) return a1

        // default
        // return (a1 - a0) * w + a0

        // smoothstep
        return (a1 - a0) * (3.0 - w * 2.0) * w * w + a0;
    }

    public random_gradient(ix: number, iy: number): Vector2 {
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
        
        let v = {
            "x": Math.cos(r),
            "y": Math.sin(r)
        };

        return v;
    }

    public dot_grid_gradient(ix: number, iy: number, x: number, y: number): number {
        let gradient = this.random_gradient(ix, iy);

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

        let n0 = this.dot_grid_gradient(x0, y0, x, y);
        let n1 = this.dot_grid_gradient(x1, y0, x, y);
        let ix0 = this.interpolate(n0, n1, sx);

        n0 = this.dot_grid_gradient(x0, y1, x, y);
        n1 = this.dot_grid_gradient(x1, y1, x, y);
        let ix1 = this.interpolate(n0, n1, sx);

        let value = this.interpolate(ix0, ix1, sy);

        value = (value + 1) / 2;

        return value;

    }

    public static get_height_colour(height: number): number[] {
        let v = height - 0.5;
        v *= 5;
        v += 0.5;
        v = Math.floor((1 - v) * 255);
        return [v, v, v];
    }

    //public save_image(filename, WORLD_NAME) {
    //    Perlin.save(this.grid, os.path.join("worlds", WORLD_NAME, "images", filename + ".png"))

    //public static create_image(grid) {
    //    img = Image.new("RGB", (grid.width, grid.height), "black")
    //
    //    pixels = img.load()
    //
    //    for x in range(grid.width) {
    //        for y in range(grid.height) {
    //            v = grid.value_at(x, y)
    //            v = 0.5 * (v + 1)
    //            rgb = Perlin.get_height_colour(v)
    //            pixels[x, y] = rgb
    //        }
    //    }
    //
    //    return img
    //}

    public static create_grid_image(grid: Grid<number>): Grid<number[]> {
        let image = new Grid<number[]>(grid.width, grid.height, [0, 0, 0]);

        for (let x = 0; x < grid.width; x++) {
            for (let y = 0; y < grid.height; y++) {
                let v = grid.value_at(x, y);
                let rgb = Perlin.get_height_colour(v);
                image.set_value_at(x, y, rgb);
            }
        }

        return image;

    }

    //public static save(grid, path) {
    //    img = Perlin.create_image(grid)
    //
    //    img.save(path)
    //}

    public get_grid(): Grid<number> {
        return this.grid
    }
}

export = Perlin;
