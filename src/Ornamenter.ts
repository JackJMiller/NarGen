import Chunk from "./Chunk.js";
import Rangerray from "./Rangerray.js";
import SubBiome from "./SubBiome.js";
import { ORNAMENTATION_ROOT_BLOCKS } from "./constants.js";

class Ornamenter {

    constructor() {

    }

    public determineArea(x: number, y: number, chunk: Chunk): string {

        let altitude = chunk.groundMap.valueAt(x, y)

        if (altitude <= 0) return "";

        let biome = chunk.getBiomeAt(x, y)

        if (chunk.prng.random() > biome.ornamentOccurrenceRate) return "";

        let rangerray = this.createRangerray(x, y, biome, altitude, chunk);

        if (rangerray.length() > 0) {
            let randomNumber = Math.round(chunk.prng.random() * rangerray.maxValue);
            return rangerray.selectValue(randomNumber);
        }
        else {
            return "";
        }

    }

    public createRangerray(x: number, y: number, biome: SubBiome, altitude: number, chunk: Chunk): Rangerray<string> {
        let groundTileName = chunk.surfaceMap.valueAt(x, y)
        let acc = 0;
        let rangerray = new Rangerray<string>();
        for (let ornament of biome.ornaments) {
            let ornamentName = ornament[0];
            let minAltitude = ornament[1];
            let maxAltitude = ornament[2];
            let ornamentOccurrenceChance = ornament[3];
            if (minAltitude <= altitude && altitude <= maxAltitude && ORNAMENTATION_ROOT_BLOCKS[ornamentName as string].includes(groundTileName)) {
                acc += ornamentOccurrenceChance;
                rangerray.insert(acc, ornamentName);
            }
        }
        return rangerray;
    }

}

export default Ornamenter;
