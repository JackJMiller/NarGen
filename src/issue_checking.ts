import SubBiome from "./SubBiome.js";
import World from "./World.js";
import { clamp, raiseWarning } from "./functions.js";

export function checkMaxHeight(height: number, biome: SubBiome, world: World) {
    if (height > world.maxHeight && !world.warningRecord.maxHeight.includes(biome.fullName)) {
        height = clamp(height, world.maxHeight);
        raiseWarning("Extreme terrain", "Ground map value inside " + biome.fullName + " has exceeded the maximum world height. Value has been capped at " + world.maxHeight.toString() + ".");
        world.warningRecord.maxHeight.push(biome.fullName);
    }
}
