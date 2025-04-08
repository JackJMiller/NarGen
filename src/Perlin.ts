import Pattern from "./Pattern.js";

class Perlin extends Pattern {

    constructor(startX: number, startY: number, width: number, height: number, chunkSize: number, AAA: number, BBB: number, CCC: number) {

        super(startX, startY, width, height, chunkSize, AAA, BBB, CCC);

    }

}

export default Perlin;
