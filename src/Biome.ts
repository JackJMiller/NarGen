import fs from "fs";
import Perlin from "./Perlin.js";
import Rangerray from "./Rangerray.js";
import SubBiome from "./SubBiome.js";
import World from "./World.js";
import { exitWithError, raiseWarning } from "./functions.js";
import { loadJSON } from "./system_script.js";
import { BiomeConfig } from "./types.js";

class Biome {

    public name: string;
    public rangerray;

    constructor(biomeName: string, world: World) {
        this.name = biomeName;
        this.rangerray = new Rangerray<SubBiome>(this.name);
        let biomeConfigPath = [world.filepath, "biomes", biomeName + ".json"].join("/");
        if (!fs.existsSync(biomeConfigPath)) exitWithError("Undefined biome", `An undefined biome named '${biomeName}' is referenced in your CONFIG.json file.`);
        let biomeConfig = loadJSON<BiomeConfig>(biomeConfigPath);
        let noiseLower = 0;
        let noiseUpper = 0;

        if (Object.values(world.biomeColours).includes(biomeConfig["colour"].join(","))) {
            raiseWarning("Matching biome colours", `The biome '${biomeName}' is using a colour already in use.`);
            world.warningRecord.matchingBiomeColours.push(biomeName);
        }

        world.biomeColours[biomeName] = biomeConfig["colour"].join(",");

        //Rangerray.fracrrayToRangerray(biomeConfig["ranges"])

        for (let subBiome of biomeConfig["ranges"]) {
            noiseUpper = subBiome[0];
            let subBiomeName = subBiome[1];
            if (!Object.keys(biomeConfig).includes(subBiomeName)) {
                exitWithError("Undefined sub-biome", `An undefined sub-biome named '${subBiomeName}' is referenced inside ranges attribute of biome '${biomeName}'.`);
            }
            noiseUpper = Perlin.flatten(noiseUpper);
            let obj = new SubBiome(world, biomeName, subBiomeName, biomeConfig, noiseLower, noiseUpper);
            this.insert(noiseUpper, obj);
            noiseLower = noiseUpper;
        }

    }


    public insert(noiseUpper: number, subBiome: SubBiome) {
        this.rangerray.insert(noiseUpper, subBiome);
    }

    public selectValue(height: number): SubBiome {
        return this.rangerray.selectValue(height);
    }

}

export default Biome;
