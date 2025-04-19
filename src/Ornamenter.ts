import Chunk from "./Chunk.js";
import Rangerray from "./Rangerray.js";
import SubBiome from "./SubBiome.js";
import { ORNAMENTATION_ROOT_BLOCKS } from "./constants.js";

class Ornamenter {

    constructor() {

    }

    public determineArea(x: number, y: number, chunk: Chunk): string {

        let altitude = chunk.heightGrid.valueAt(x, y)

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
        let groundTileName = chunk.surfaceGrid.valueAt(x, y)
        let acc = 0;
        let rangerray = new Rangerray<string>();
        for (let ornament of biome.ornaments) {
            let minAltitude = ornament.minZ;
            let maxAltitude = ornament.maxZ;
            let ornamentOccurrenceChance = ornament.frequency;
            if (minAltitude <= altitude && altitude <= maxAltitude && ORNAMENTATION_ROOT_BLOCKS[ornament.name].includes(groundTileName)) {
                acc += ornamentOccurrenceChance;
                rangerray.insert(acc, ornament.name);
            }
        }
        return rangerray;
    }

}

export default Ornamenter;
