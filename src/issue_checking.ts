import SubBiome from "./SubBiome.js";
import World from "./World.js";
import { clamp, raiseWarning } from "./functions.js";
import { BiomeConfig } from "./types.js";

export function checkMaxHeight(height: number, biome: SubBiome, world: World): void {
    if (height > world.maxHeight && !world.warningRecord.maxHeight.includes(biome.fullName)) {
        height = clamp(height, world.maxHeight);
        raiseWarning("Extreme terrain", "Ground map value inside " + biome.fullName + " has exceeded the maximum world height. Value has been capped at " + world.maxHeight.toString() + ".");
        world.warningRecord.maxHeight.push(biome.fullName);
    }
}

export function checkBiomeConfig(biomeName: string, config: BiomeConfig, world: World): void {
    if (Object.values(world.biomeColours).includes(config.colour.join(","))) {
        raiseWarning("Matching biome colours", `The biome '${biomeName}' is using a colour already in use.`);
        world.warningRecord.matchingBiomeColours.push(biomeName);
    }
}
