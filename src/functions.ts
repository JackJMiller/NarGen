import { AleaPRNG } from "./lib/alea.js";
import { Colour } from "./types.js";
import { COLOUR_CYAN_BOLD, COLOUR_RED, COLOUR_RED_BOLD, COLOUR_MAGENTA, COLOUR_MAGENTA_BOLD, COLOUR_NONE, COLOUR_YELLOW } from "./constants.js";

export function clamp(value: number, maximum: number): number {
    if (value < 0) return 0;
    else if (value > maximum) return maximum;
    else return value;
}

export function leftJustify(str: string, length: number): string {
    let padding = length - str.length;
    return str + " ".repeat(padding);
}

export function limit(value: number, minimum: number, maximum: number): number {
    if (value < minimum) return minimum;
    else if (value > maximum) return maximum;
    else return value;
}

export function objectFromEntries<T>(keys: string[], values: T[]) {
    return Object.fromEntries(keys.map((key: string, index: number) => [key, values[index]]));
}

export function interpolate(a: number, b: number, portion: number): number {
    let r = b - a;
    return a + portion * r;
}

export function deinterpolate(a: number, b: number, point: number): number {
    return (point - a) / (b - a);
}

export function getBrightnessAtHeight(height: number, maxHeight: number): number {
    return 1 - clamp(height, maxHeight) / maxHeight;
}

export function exitWithError(errorType: string, message: string, filepath: string, locationInfo: string): void {
    let locationString = (locationInfo === "") ? "" : `${COLOUR_YELLOW}${locationInfo}: `
    console.log(`${COLOUR_CYAN_BOLD}${filepath}: ${locationString}${COLOUR_RED_BOLD}ERROR: ${COLOUR_RED}${errorType}: ${message}${COLOUR_NONE}`);
    process.exit(1);
}

export function raiseWarning(warningType: string, message: string, filepath: string = ""): void {
    console.log(`${COLOUR_CYAN_BOLD}${filepath}: ${COLOUR_MAGENTA_BOLD}WARNING: ${COLOUR_MAGENTA}${warningType}: ${message}${COLOUR_NONE}`);
}

export function randint(min: number, max: number, prng: AleaPRNG): number {
    return Math.floor(prng.random() * (max + 1 - min)) + min;
}

export function randomElement<T>(array: T[], prng: AleaPRNG): T {
    let index = randint(0, array.length - 1, prng);
    return array[index];
}

export function colourAverage(c1: Colour, c2: Colour): Colour {
    return [
        mean(c1[0], c2[0]),
        mean(c1[1], c2[1]),
        mean(c1[2], c2[2])
    ];
}

export function mean(v1: number, v2: number) {
    return Math.floor((v1 + v2) / 2);
}

export function element(id: string) {
    return document.getElementById(id);
}
