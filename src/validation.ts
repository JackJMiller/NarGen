import { exitWithError } from "./functions.js";
import { OrnamentDefinition } from "./types.js";

export function validateOrnaments(value: OrnamentDefinition[], subBiomeName: string): void {
    let keys = value.map((entry: OrnamentDefinition) => entry[0]);
    if (!keys.includes("OCCURRENCE")) {
        exitWithError("Invalid configuration", `The OCCURRENCE attribute is missing from the ornaments list inside the configuration for ${subBiomeName}.`);
    }
}
