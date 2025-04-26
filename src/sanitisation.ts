import World from "./World.js";
import { clamp, exitWithError, raiseWarning } from "./functions.js";
import { OrnamentDefinition } from "./types.js";

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

export function sanitiseConfig(filename: string, config: any, included: string[], sanObj: any): void {

    let recognised = Object.keys(sanObj);

    // check that all attributes are recognised
    for (let attr of included) {
        if (!recognised.includes(attr)) {
            exitWithError("Unrecognised attribute", `Attribute ${attr} is not recognised.`, filename);
        }
    }

    // check that there are no missing attributes
    for (let attr of recognised) {
        let attrSanObj = sanObj[attr];
        if (!included.includes(attr)) {
            if (attrSanObj.mandatory) {
                exitWithError("Missing attribute", `No ${attr} attribute is specified.`, filename);
            }
            else if (attrSanObj.defaultValue !== undefined) {
                // TODO: deal with arrays and other types copied by reference!
                config[attr] = attrSanObj.defaultValue;
            }
        }
    }

}
