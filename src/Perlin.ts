import Pattern from "./Pattern.js";
import { Vector2 } from "./types.js";

class Perlin extends Pattern {

    constructor(startX: number, startY: number, width: number, height: number, chunkSize: number, AAA: number, BBB: number, CCC: number) {

        super(startX, startY, width, height, chunkSize, AAA, BBB, CCC);

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


}

export default Perlin;
