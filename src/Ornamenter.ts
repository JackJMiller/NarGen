import Chunk from "./Chunk.js";
import { ORNAMENTATION_ROOT_BLOCKS } from "./constants.js";
import Rangerray from "./Rangerray.js";

class Ornamenter {

    constructor() {

    }

    public determineArea(x: number, y: number, chunk: Chunk): string {

        let altitude = chunk.groundMap.valueAt(x, y)

        if (altitude <= 0) return "";

        let biome = chunk.getBiomeAt(x, y)
        if (chunk.prng.random() > biome.ornamentOccurrenceRate) return "";
        let groundTileName = chunk.surfaceMap.valueAt(x, y)
        let acc = 0;
        let candidates = new Rangerray<string>();
        for (let veg of biome.ornaments) {
            let vegName = veg[0];
            let minAltitude = veg[1];
            let maxAltitude = veg[2];
            let vegOccurrenceChance = veg[3];
            if (minAltitude <= altitude && altitude <= maxAltitude && ORNAMENTATION_ROOT_BLOCKS[vegName as string].includes(groundTileName)) {
                acc += vegOccurrenceChance;
                candidates.insert(acc, vegName);
            }
        }
        if (candidates.length() > 0) {
            let randomNumber = Math.round(chunk.prng.random() * acc);
            return candidates.selectValue(randomNumber);
        }
        else {
            return "";
        }
    }

}

export default Ornamenter;
