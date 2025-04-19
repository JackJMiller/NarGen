import World from "./World.js";
import { raiseWarning } from "./functions.js";
import { BiomeConfig } from "./types.js";

export function checkBiomeConfig(biomeName: string, config: BiomeConfig, world: World): void {
    if (Object.values(world.biomeColours).includes(config.colour.join(","))) {
        raiseWarning("Matching biome colours", `The biome '${biomeName}' is using a colour already in use.`);
        world.warningRecord.matchingBiomeColours.push(biomeName);
    }
}
