import Chunk from "./Chunk.js";
import { deinterpolate } from "./functions.js";
import { BiomeBlend, Colour } from "./types.js";

class BiomeBlender {

    constructor() {

    }

    public determineBiomeBlend(x: number, y: number, chunk: Chunk): BiomeBlend {
        let height1 = chunk.biomeSuperGrid.valueAt(x, y);
        let height2 = chunk.overlayed.valueAt(x, y);
        let biomeBalance = this.determineBiomeByHeight(height1, height2, chunk);
        return biomeBalance;
    }

    // TODO: tidy
    public determineBiomeByHeight(height1: number, height2: number, chunk: Chunk): BiomeBlend {
        // get main biome
        let mainBiome = chunk.biomesRangerray.select(height1);
        let biomeObj = mainBiome["value"];
        chunk.parentWorld.biomeSizes[biomeObj.name] += 1;
        let subBiome = biomeObj.selectValue(height2);

        let portionPoint = deinterpolate(mainBiome["lowerPoint"], mainBiome["upperPoint"], height1);
        let blendRegion = 0.05;
        let blendedBiomeIndex = -1;
        let influence = 0;
        if (portionPoint <= blendRegion) {
            blendedBiomeIndex = mainBiome["index"] - 1
            influence = 1 - deinterpolate(0, blendRegion, portionPoint)
            influence /= 2
        }
        else if (portionPoint >= 1 - blendRegion) {
            blendedBiomeIndex = mainBiome["index"] + 1
            influence = deinterpolate(1 - blendRegion, 1, portionPoint)
            influence /= 2
        }
        else {
            blendedBiomeIndex = -1
        }

        if (0 <= blendedBiomeIndex && blendedBiomeIndex < chunk.biomesRangerray.length()) {
            let balance = [{ biome: subBiome, influence: 1 - influence }];
            let blendedBiome = chunk.biomesRangerray.selectByIndex(blendedBiomeIndex);
            let blendedBiomeObj = blendedBiome["value"];
            subBiome = blendedBiomeObj.selectValue(height2);
            balance.push({ biome: subBiome, influence: influence });
            return balance;
        }
        else {
            let balance = [{ biome: subBiome, influence: 1 }];
            return balance;
        }
    }

    public determineBiomeColour(x: number, y: number, chunk: Chunk): Colour {
        let biomeBalance = chunk.biomeGrid.valueAt(x, y);
        let biome = biomeBalance[0].biome;
        return biome.parentColour;
    }

    public determineSubBiomeColour(x: number, y: number, chunk: Chunk): Colour {
        let biomeBalance = chunk.biomeGrid.valueAt(x, y);
        let biome = biomeBalance[0].biome;
        return biome.colour;
    }

}

export default BiomeBlender;
