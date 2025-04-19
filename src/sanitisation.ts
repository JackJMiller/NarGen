import World from "./World.js";
import { clamp, raiseWarning } from "./functions.js";

export function sanitiseMaxHeight(height: number, biomeName: string, world: World): number {
    if (height > world.maxHeight && !world.warningRecord.maxHeight.includes(biomeName)) {
        height = clamp(height, world.maxHeight);
        raiseWarning("Extreme terrain", `Ground map value inside '${biomeName}' has exceeded the maximum world height of ${world.maxHeight}. Value has been capped at the maximum.`);
        world.warningRecord.maxHeight.push(biomeName);
        return world.maxHeight;
    }
    return height;
}
