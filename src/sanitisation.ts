import World from "./World.js";
import { clamp, raiseWarning } from "./functions.js";
import { OrnamentDefinition, SubBiomeConfig } from "./types.js";

export function sanitiseMaxHeight(height: number, biomeName: string, world: World): number {
    if (height > world.maxHeight && !world.warningRecord.maxHeight.includes(biomeName)) {
        height = clamp(height, world.maxHeight);
        raiseWarning("Extreme terrain", `Ground map value inside '${biomeName}' has exceeded the maximum world height of ${world.maxHeight}. Value has been capped at the maximum.`);
        world.warningRecord.maxHeight.push(biomeName);
        return world.maxHeight;
    }
    return height;
}

export function sanitiseOrnament(ornament: OrnamentDefinition): void {
    if (ornament.minZ === undefined) ornament.minZ = 0;
    if (ornament.maxZ === undefined) ornament.maxZ = 1000; // TEMP
}

// TODO
export function sanitiseSubBiomeConfig(config: SubBiomeConfig, keys: string[]): void {
    if (!keys.includes("blend")) config.blend = 0.25;
}
