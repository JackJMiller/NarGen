import { AleaPRNG } from "./lib/alea.js";
import { COLOUR_RED, COLOUR_RED_BOLD, COLOUR_MAGENTA, COLOUR_MAGENTA_BOLD, COLOUR_NONE } from "./constants.js";

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

export function pointAtPortionBetween(a: number, b: number, portion: number): number {
    let r = b - a;
    return a + portion * r;
}

export function portionAtPointBetween(a: number, b: number, point: number): number {
    b = b - a;
    point = point - a;
    return point / b;
}

export function getBrightnessAtHeight(height: number, maxHeight: number): number {
    return 1 - clamp(height, maxHeight) / maxHeight;
}

export function exitWithError(errorType: string, message: string): void {
    console.log(`NarGen: ${COLOUR_RED_BOLD}ERROR: ${COLOUR_RED}${errorType}: ${message}${COLOUR_NONE}`);
    process.exit(1);
}

export function raiseWarning(warningType: string, message: string): void {
    console.log(`NarGen: ${COLOUR_MAGENTA_BOLD}WARNING: ${COLOUR_MAGENTA}${warningType}: ${message}${COLOUR_NONE}`);
}

export function randint(min: number, max: number, prng: AleaPRNG): number {
    return Math.floor(prng.random() * (max + 1 - min)) + min;
}

export function randomElement<T>(array: T[], prng: AleaPRNG): T {
    let index = randint(0, array.length - 1, prng);
    return array[index];
}

export function colourAverage(c1: number[], c2: number[]): number[] {
    return [
        mean(c1[0], c2[0]),
        mean(c1[1], c2[1]),
        mean(c1[2], c2[2])
    ];
}

export function mean(v1: number, v2: number) {
    return Math.floor((v1 + v2) / 2);
}
