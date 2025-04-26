import World from "./World.js";
import { clamp, exitWithError, raiseWarning } from "./functions.js";
import { AttributeSanitisationObject, ConfigSanitisationObject, OrnamentDefinition } from "./types.js";

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

export function sanitiseConfig(filepath: string, config: any, sanObj: ConfigSanitisationObject, locationInfo: string = ""): void {
    checkForUnrecognisedAttributes(config, sanObj, filepath, locationInfo);
    sanitiseAttributes(config, sanObj, filepath, locationInfo);
}

function checkForUnrecognisedAttributes(config: any, sanObj: ConfigSanitisationObject, filepath: string, locationInfo: string): void {
    let included = Object.keys(config);
    let recognised = Object.keys(sanObj);
    for (let attr of included) {
        if (!recognised.includes(attr)) {
            exitWithError("Unrecognised attribute", `Attribute ${attr} is not recognised.`, filepath, locationInfo);
        }
    }
}

function sanitiseAttributes(config: any, sanObj: ConfigSanitisationObject, filepath: string, locationInfo: string): void {
    let included = Object.keys(config);
    let recognised = Object.keys(sanObj);
    for (let attr of recognised) {
        sanitiseAttribute(attr, included, recognised, config, sanObj, filepath, locationInfo);
    }
}

function sanitiseAttribute(attr: string, included: string[], recognised: string[], config: any, sanObj: ConfigSanitisationObject, filepath: string, locationInfo: string): void {
    let attrSanObj = sanObj[attr];
    if (included.includes(attr)) {
        sanitiseIncludedAttribute(attr, attrSanObj, included, config, sanObj, filepath, locationInfo);
    }
    else {
        sanitiseOmittedAttribute(attr, attrSanObj, included, config, sanObj, filepath, locationInfo);
    }
}

function sanitiseOmittedAttribute(attr: string, attrSanObj: AttributeSanitisationObject, included: string[], config: any, sanObj: ConfigSanitisationObject, filepath: string, locationInfo: string): void {
    if (attrSanObj.mandatory) {
        exitWithError("Missing attribute", `No ${attr} attribute is specified.`, filepath, locationInfo);
    }
    else if (attrSanObj.fallback !== undefined) {
        if (included.includes(attrSanObj.fallback)) {
            config[attr] = config[attrSanObj.fallback];
        }
        else {
            exitWithError("Missing fallback", `Neither the ${attr} or ${attrSanObj.fallback} attributes are specified.`, filepath, locationInfo);
        }
    }
    else if (attrSanObj.defaultValue !== undefined) {
        // TODO: deal with arrays and other types copied by reference!
        config[attr] = attrSanObj.defaultValue;
    }
}

function sanitiseIncludedAttribute(attr: string, attrSanObj: AttributeSanitisationObject, included: string[], config: any, sanObj: ConfigSanitisationObject, filepath: string, locationInfo: string): void {
    if (attrSanObj.redundants !== undefined) {
        for (let redundant of attrSanObj.redundants) {
            if (included.includes(redundant)) {
                exitWithError("Redundant attribute", `The ${redundant} attribute is specified despite the ${attr} attribute having already being specified.`, filepath, locationInfo);
            }
        }
    }
}
