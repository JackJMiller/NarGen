class Grid<T> {

    public width: number;
    public height: number;
    public fillValue: T;
    public grid: T[][];

    constructor(width: number, height: number, fillValue: T) {

        this.width = width
        this.height = height
        this.fillValue = fillValue;
        this.grid = new Array(width).fill([]).map(e => new Array(height).fill(fillValue));

    }

    public value_at(x: number, y: number): T {
        return this.grid[x][y];
    }

    public set_value_at(x: number, y: number, value: T): void {
        this.grid[x][y] = value;
    }

    public is_in_bounds(x: number, y: number): boolean {
        return (0 <= x && x < this.width && 0 <= y && y < this.height);
    }

    public overlay(overlay_grid: Grid<T>, corner_x: number = 0, corner_y: number = 0): void {
        for (let _x = 0; _x < overlay_grid.width; _x++) {
            for (let _y = 0; _y < overlay_grid.height; _y++) {
                let x = corner_x + _x;
                let y = corner_y + _y;
                let value = overlay_grid.value_at(_x, _y);
                if (0 <= x && x < this.width && 0 <= y && y < this.height) {
                    this.set_value_at(x, y, value);
                }
            }
        }
    }

    public static get_height_colour(height: number): number[] {
        let v = Math.floor((1 - height) * 255);
        return [v, v, v];
    }

    //public save_image(filename, WORLD_NAME) {
    //    img = Image.new("RGB", (this.width, this.height), "black")
    //
    //    pixels = img.load()
    //
    //    for x in range(this.width) {
    //        for y in range(this.height) {
    //            v = this.grid[x][y]
    //            rgb = Grid.get_height_colour(v)
    //            pixels[x, y] = rgb
    //        }
    //    }
    //
    //    img.save(os.path.join("worlds", WORLD_NAME, "images", filename + ".png"))
    //
    //}

    public save_RGBs(filename: string, WORLD_NAME: string): void {
        //img = Image.new("RGB", (this.width, this.height), "black")
        //
        //pixels = img.load()
        //
        //for x in range(this.width) {
        //    for y in range(this.height) {
        //        pixels[x, y] = this.grid[x][y]
        //    }
        //}
        //
        //img.save(os.path.join("worlds", WORLD_NAME, "images", filename + ".png"))
    }

    public copy(): Grid<T> {
        let grid = new Grid<T>(this.width, this.height, this.fillValue);
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let v = this.value_at(x, y);
                grid.set_value_at(x, y, v);
            }
        }
        return grid;
    }

    // TODO: move out of class
    public calculate_average(): number {
        let acc = 0
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                acc += this.value_at(x, y) as number;
            }
        }
        return acc / (this.width * this.height);
    }

}

export = Grid;
