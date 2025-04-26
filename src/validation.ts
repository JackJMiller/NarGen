import { OCTAVE_COUNT } from "./constants.js";
import { exitWithError } from "./functions.js";
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
}
