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
        let biomeBlend = this.determineBiomeByHeight(height1, height2, chunk);
        return biomeBlend;
    }

    public determineBiomeByHeight(height1: number, height2: number, chunk: Chunk): BiomeBlend {
        let { value: biomeObj, lowerPoint: biomeLowerPoint, upperPoint: biomeUpperPoint, index } = chunk.biomesRangerray.select(height1);
        chunk.parentWorld.biomeSizes[biomeObj.name] += 1;
        let subBiome = biomeObj.selectValue(height2);

        let portionPoint = deinterpolate(biomeLowerPoint, biomeUpperPoint, height1);
        let blendRegion = 0.05;
        let { partnerIndex, partnerInfluence } = this.determineBlendPartner(portionPoint, index, blendRegion);

        if (0 <= partnerIndex && partnerIndex < chunk.biomesRangerray.length()) {
            return this.createBlendObject(subBiome, partnerIndex, partnerInfluence, height2, chunk);
        }
        else {
            return [{ biome: subBiome, influence: 1 }];
        }

    }

    private createBlendObject(subBiome: SubBiome, partnerIndex: number, partnerInfluence: number, height2: number, chunk: Chunk): BiomeBlend {
        let blendedBiome = chunk.biomesRangerray.selectByIndex(partnerIndex);
        let blendedBiomeObj = blendedBiome["value"];
        let partnerSubBiome = blendedBiomeObj.selectValue(height2);
        return [
            { biome: subBiome, influence: 1 - partnerInfluence },
            { biome: partnerSubBiome, influence: partnerInfluence }
        ];
    }

    private determineBlendPartner(portionPoint: number, index: number, blendRegion: number): { partnerIndex: number, partnerInfluence: number } {
        if (portionPoint <= blendRegion) {
            return {
                partnerIndex: index - 1,
                partnerInfluence: (1 - deinterpolate(0, blendRegion, portionPoint)) / 2
            };
        }
        else if (portionPoint >= 1 - blendRegion) {
            return {
                partnerIndex: index + 1,
                partnerInfluence: deinterpolate(1 - blendRegion, 1, portionPoint) / 2
            };
        }
        else {
            return { partnerIndex: -1, partnerInfluence: 0 };
        }
    }

    public determineBiomeColour(x: number, y: number, chunk: Chunk): Colour {
        let biomeBlend = chunk.biomeGrid.valueAt(x, y);
        let biome = biomeBlend[0].biome;
        return biome.parentColour;
    }

    public determineSubBiomeColour(x: number, y: number, chunk: Chunk): Colour {
        let biomeBlend = chunk.biomeGrid.valueAt(x, y);
        let biome = biomeBlend[0].biome;
        return biome.colour;
    }

}

export default BiomeBlender;
