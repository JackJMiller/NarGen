import fs from "fs";
import Perlin from "./Perlin.js";
import Rangerray from "./Rangerray.js";
import SubBiome from "./SubBiome.js";
import World from "./World.js";
import { exitWithError } from "./functions.js";
import { checkBiomeConfig } from "./issue_checking.js";
import { loadJSON } from "./env_script.js";
import { BiomeConfig } from "./types.js";

class Biome {

    public name: string;
    public shortPath: string;
    public filepath: string;
    public rangerray: Rangerray<SubBiome>;
    public config: BiomeConfig;

    constructor(name: string, world: World) {
        this.name = name;
        this.shortPath = ["biomes", this.name + ".json"].join("/");
        this.filepath = [world.filepath, this.shortPath].join("/");

        if (!fs.existsSync(this.filepath)) exitWithError("Undefined biome", `An undefined biome named '${this.name}' is referenced.`, "CONFIG.json", "biomes");
        this.config = loadJSON<BiomeConfig>(this.filepath);

        checkBiomeConfig(this.name, this.config, world);

        world.biomeColours[this.name] = this.config["colour"].join(",");

        this.rangerray = this.createRangerray(this.config.ranges, world);
        
    }

    private createRangerray(ranges: [number, string][], world: World): Rangerray<SubBiome> {

        let noiseLower = 0;

        // TODO: clean up
        let output: [number, SubBiome][] = ranges.map((item: [number, string]) => {
            let noiseUpper = item[0];
            let subBiomeName = item[1];
            if (!Object.keys(this.config).includes(subBiomeName)) {
                exitWithError("Undefined sub-biome", `An undefined sub-biome named '${subBiomeName}' is referenced.`, this.shortPath, "ranges");
            }
            noiseUpper = Perlin.flatten(noiseUpper);
            let obj = new SubBiome(world, this, subBiomeName, this.config, noiseLower, noiseUpper);
            noiseLower = noiseUpper;
            return [noiseUpper, obj];
        });

        let rangerray = new Rangerray<SubBiome>(this.name, output);

        return rangerray;

    }

    public selectValue(height: number): SubBiome {
        return this.rangerray.selectValue(height);
    }

}

export default Biome;
