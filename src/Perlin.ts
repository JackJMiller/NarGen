import Pattern from "./Pattern.js";
import { limit } from "./functions.js";
import { mkAlea } from "./lib/alea.js";
import { Vector2 } from "./types.js";

class Perlin extends Pattern {

    constructor(startX: number, startY: number, width: number, height: number, chunkSize: number, seed: number) {

        super(startX, startY, width, height, chunkSize, seed);

    }

    public compute(x: number, y: number): number {

        let { x0, x1, y0, y1 } = this.getTileBounds(x, y);

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

        let prng = mkAlea(`${ix}-${iy}-${this.seed}`);
        
        return {
            x: Math.cos(prng.random() * Math.PI),
            y: Math.sin(prng.random() * Math.PI)
        };

    }

    public dotGridGradient(ix: number, iy: number, x: number, y: number): number {
        let gradient = this.randomGradient(ix, iy);

        let dx = x - ix;
        let dy = y - iy;

        return (dx * gradient["x"] + dy * gradient["y"]);
    }

    public static flatten(noiseValue: number): number {
        let r = -0.25;
        let sine = (noiseValue < 0.5) ? -1 : 1;
        noiseValue = Math.abs(noiseValue - 0.5);
        noiseValue = 1 - Math.exp(noiseValue * r);
        noiseValue = 0.5 + sine * noiseValue;
        noiseValue = limit(noiseValue, 0, 1);
        return noiseValue;
    }

}

export default Perlin;
