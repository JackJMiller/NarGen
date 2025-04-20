import Chunk from "./Chunk.js";
import SubBiome from "./SubBiome.js";
import { deinterpolate } from "./functions.js";
import { BiomeBlend, Colour } from "./types.js";

class BiomeBlender {

    constructor() {

    }

    public determineBiomeBlend(x: number, y: number, chunk: Chunk): BiomeBlend {
        let height1 = chunk.biomeSuperGrid.valueAt(x, y);
        let height2 = chunk.perlinOverlayed.valueAt(x, y);
        let biomeBalance = this.determineBiomeByHeight(height1, height2, chunk);
        return biomeBalance;
    }

    public determineBiomeByHeight(height1: number, height2: number, chunk: Chunk): BiomeBlend {
        let { value: biomeObj, lowerPoint, upperPoint, index } = chunk.biomesRangerray.select(height1);
        chunk.parentWorld.biomeSizes[biomeObj.name] += 1;
        let subBiome = biomeObj.selectValue(height2);

        let portionPoint = deinterpolate(lowerPoint, upperPoint, height1);
        let blendRegion = 0.05;
        let { partnerIndex, influence } = this.determineBlendPartner(portionPoint, index, blendRegion);

        if (0 <= partnerIndex && partnerIndex < chunk.biomesRangerray.length()) {
            return this.createBlendObject(subBiome, partnerIndex, influence, height2, chunk);
        }
        else {
            return [{ biome: subBiome, influence: 1 }];
        }

    }

    private createBlendObject(subBiome: SubBiome, partnerIndex: number, influence: number, height2: number, chunk: Chunk): BiomeBlend {
        let balance = [{ biome: subBiome, influence: 1 - influence }];
        let blendedBiome = chunk.biomesRangerray.selectByIndex(partnerIndex);
        let blendedBiomeObj = blendedBiome["value"];
        subBiome = blendedBiomeObj.selectValue(height2);
        balance.push({ biome: subBiome, influence: influence });
        return balance;
    }

    private determineBlendPartner(portionPoint: number, index: number, blendRegion: number): { partnerIndex: number, influence: number } {
        if (portionPoint <= blendRegion) {
            return {
                partnerIndex: index - 1,
                influence: (1 - deinterpolate(0, blendRegion, portionPoint)) / 2
            };
        }
        else if (portionPoint >= 1 - blendRegion) {
            return {
                partnerIndex: index + 1,
                influence: deinterpolate(1 - blendRegion, 1, portionPoint) / 2
            };
        }
        else {
            return { partnerIndex: -1, influence: 0 };
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
