import { exitWithError } from "./functions";

export function validateOrnaments(value: any, subBiomeName: string): void {
    let keys = value.map((entry: any[]) => entry[0]);
    if (!keys.includes("OCCURRENCE")) {
        exitWithError("Invalid configuration", `The OCCURRENCE attribute is missing from the ornaments list inside the configuration for ${subBiomeName}.`);
    }
}
