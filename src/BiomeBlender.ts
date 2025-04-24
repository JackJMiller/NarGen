import Biome from "./Biome.js";
import Chunk from "./Chunk.js";
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

        let { mainBiome, partnerBiome, partnerInfluence } = this.weighBiomes(height1, chunk);

        chunk.parentWorld.biomeSizes[mainBiome.name] += 1;

        let mainBlend = this.createSubBiomeBlend(mainBiome, height2, 1 - partnerInfluence);

        if (partnerBiome) {
            let partnerBlend = this.createSubBiomeBlend(partnerBiome, height2, partnerInfluence);
            return mainBlend.concat(partnerBlend);
        }
        else {
            return mainBlend;
        }

    }

    private createSubBiomeBlend(biome: Biome, height2: number, biomeInfluence: number): BiomeBlend {

        let { value: sb0, lowerPoint, upperPoint, index } = biome.rangerray.select(height2);

        let portionPoint = deinterpolate(lowerPoint, upperPoint, height2);
        let blendRegion = 0.25;
        let { partnerIndex, partnerInfluence } = this.determineBlendPartner(portionPoint, index, blendRegion, biome.rangerray.length());

        let biomeBlend = [{ biome: sb0, influence: (1 - partnerInfluence) * biomeInfluence }];

        if (0 <= partnerIndex && partnerIndex < biome.rangerray.length()) {
            let partnerBiome = biome.rangerray.selectValueByIndex(partnerIndex);
            biomeBlend.push({
                biome: partnerBiome,
                influence: partnerInfluence * biomeInfluence
            });
        }

        return biomeBlend;

    }

    private weighBiomes(height1: number, chunk: Chunk): { mainBiome: Biome, partnerBiome: Biome | null, partnerInfluence: number } {
        let {
            value: mainBiome,
            lowerPoint: biomeLowerPoint,
            upperPoint: biomeUpperPoint,
            index
        } = chunk.biomesRangerray.select(height1);

        let portionPoint = deinterpolate(biomeLowerPoint, biomeUpperPoint, height1);
        let blendRegion = 0.05;
        let { partnerIndex, partnerInfluence } = this.determineBlendPartner(portionPoint, index, blendRegion, chunk.biomesRangerray.length());

        let partnerBiome = null;

        if (0 <= partnerIndex && partnerIndex < chunk.biomesRangerray.length()) {
            partnerBiome = chunk.biomesRangerray.selectValueByIndex(partnerIndex);
        }

        return { mainBiome, partnerBiome, partnerInfluence };

    }

    private determineBlendPartner(portionPoint: number, index: number, blendRegion: number, excIndex: number): { partnerIndex: number, partnerInfluence: number } {
        let partnerIndex = -1;
        let partnerInfluence = 0;
        if (portionPoint <= blendRegion) {
            partnerIndex = index - 1;
            partnerInfluence = (1 - deinterpolate(0, blendRegion, portionPoint)) / 2;
        }
        else if (portionPoint >= 1 - blendRegion) {
            partnerIndex = index + 1;
            partnerInfluence = deinterpolate(1 - blendRegion, 1, portionPoint) / 2;
        }
        if (partnerIndex < 0 || partnerIndex >= excIndex) partnerInfluence = 0;
        return { partnerIndex, partnerInfluence };
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
