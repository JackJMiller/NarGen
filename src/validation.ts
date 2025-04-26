import { OCTAVE_COUNT } from "./constants.js";
import { exitWithError } from "./functions.js";
import { sanitiseOrnament } from "./sanitisation.js";
import { OrnamentsDefinition } from "./types.js";

export function validateOrnaments(def: OrnamentsDefinition, configPath: string, subBiomeName: string): void {
    let keys = Object.keys(def);
    if (!keys.includes("OCCURRENCE")) {
        exitWithError("Invalid configuration", `The OCCURRENCE attribute is missing from the ornaments list.`, configPath, subBiomeName);
    }
    for (let ornament of def.candidates) {
        sanitiseOrnament(ornament);
    }
}

export function validateSubBiomeAmplitudes(shortPath: string, subBiomeName: string, amplitudes: number[], configKeys: string[]): void {
    if (amplitudes.length !== OCTAVE_COUNT) {
        exitWithError("Invalid config value", `Length of amplitudes is equal to ${amplitudes.length} but length should be ${OCTAVE_COUNT}.`, shortPath, subBiomeName);
    }
}
