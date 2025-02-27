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

    public valueAt(x: number, y: number): T {
        return this.grid[x][y];
    }

    public setValueAt(x: number, y: number, value: T): void {
        this.grid[x][y] = value;
    }

    public isInBounds(x: number, y: number): boolean {
        return (0 <= x && x < this.width && 0 <= y && y < this.height);
    }

    public overlay(overlayGrid: Grid<T>, cornerX: number = 0, cornerY: number = 0): void {
        for (let _x = 0; _x < overlayGrid.width; _x++) {
            for (let _y = 0; _y < overlayGrid.height; _y++) {
                let x = cornerX + _x;
                let y = cornerY + _y;
                let value = overlayGrid.valueAt(_x, _y);
                if (0 <= x && x < this.width && 0 <= y && y < this.height) {
                    this.setValueAt(x, y, value);
                }
            }
        }
    }

    public static getHeightColour(height: number): number[] {
        let v = Math.floor((1 - height) * 255);
        return [v, v, v];
    }

    public copy(): Grid<T> {
        let grid = new Grid<T>(this.width, this.height, this.fillValue);
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let v = this.valueAt(x, y);
                grid.setValueAt(x, y, v);
            }
        }
        return grid;
    }

    // TODO: move out of class
    public calculateAverage(): number {
        let acc = 0
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                acc += this.valueAt(x, y) as number;
            }
        }
        return acc / (this.width * this.height);
    }

}

export default Grid;
