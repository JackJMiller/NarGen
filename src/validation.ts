import { OCTAVE_COUNT, RECOGNISED_SUB_BIOME_ATTRIBUTES } from "./constants.js";
import { exitWithError, raiseWarning } from "./functions.js";
import { sanitiseOrnament } from "./sanitisation.js";
import { OrnamentsDefinition } from "./types.js";

export function validateOrnaments(def: OrnamentsDefinition, subBiomeName: string): void {
    let keys = Object.keys(def);
    if (!keys.includes("OCCURRENCE")) {
        exitWithError("Invalid configuration", `The OCCURRENCE attribute is missing from the ornaments list inside the configuration for ${subBiomeName}.`);
    }
    for (let ornament of def.candidates) {
        sanitiseOrnament(ornament);
    }
}

export function validateSubBiomeAmplitudes(subBiomeName: string, amplitudes: number[], configKeys: string[]): void {
    if (amplitudes.length !== OCTAVE_COUNT) {
        exitWithError("Invalid config value", `Length of amplitudes in configuration for ${subBiomeName} is equal to ${amplitudes.length}. Length should be ${OCTAVE_COUNT}.`);
    }
    if (configKeys.includes("persistence")) {
        raiseWarning("Redundant attribute", `Both persistence and amplitudes are attributes specified in configuration for ${subBiomeName}. Program is defaulting to amplitudes attribute.`);
    }
}

// TODO: move much of this to sanitisation
export function validateSubBiomeConfigKeys(subBiomeName: string, configKeys: string[]): void {

    // check that all keys are recognised
    for (let key of configKeys) {
        if (!RECOGNISED_SUB_BIOME_ATTRIBUTES.includes(key)) {
            exitWithError("Unrecognised attribute", `Cannot recognise attribute ${key} in configuration for ${subBiomeName}.`);
        }
    }

    // check for redundant height multipliers
    if (configKeys.includes("heightMultiplier")) {
        let redundantKeys = ["lowerHeightMultiplier", "upperHeightMultiplier"].filter((key: string) => configKeys.includes(key));
        if (configKeys.includes("lowerHeightMultiplier") || configKeys.includes("upperHeightMultiplier")) {
            exitWithError("Missing attribute", `The heightMultiplier attribute is already specified in the configuration for ${subBiomeName}. Your configuration also specifies ${redundantKeys.join(" and ")}. Program is defaulting to heightMultiplier attribute.`);
        }
    }
    else if (!configKeys.includes("lowerHeightMultiplier") || !configKeys.includes("upperHeightMultiplier")) {
        exitWithError("Missing attribute", `Please specify heightMultiplier configuration value for ${subBiomeName}.`);
    }
  
    // check that amplitudes are defined
    if (!configKeys.includes("amplitudes") && !configKeys.includes("persistence")) {
        exitWithError("Missing attribute", `Please specify persistence or amplitudes configuration value for ${subBiomeName}.`);
    }

}
