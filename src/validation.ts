import { exitWithError } from "./functions.js";
import { OrnamentsDefinition } from "./types.js";

export function validateOrnaments(def: OrnamentsDefinition, subBiomeName: string): void {
    let keys = Object.keys(def);
    if (!keys.includes("OCCURRENCE")) {
        exitWithError("Invalid configuration", `The OCCURRENCE attribute is missing from the ornaments list inside the configuration for ${subBiomeName}.`);
    }
}
