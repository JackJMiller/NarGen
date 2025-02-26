import { exit_with_error } from "./functions";

export function validateOrnaments(value: any, subBiomeName: string): void {
    let keys = value.map((entry: any[]) => entry[0]);
    if (!keys.includes("OCCURRENCE")) {
        exit_with_error("Invalid configuration", `The OCCURRENCE attribute is missing from the ornaments list inside the configuration for ${subBiomeName}.`);
    }
}
