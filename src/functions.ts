import fs from "fs";
import { AleaPRNG } from "./lib/alea";
import { COLOUR_RED, COLOUR_MAGENTA, COLOUR_NONE, PRNG } from "./constants";

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

export function saveJson(data: object, filepath: string): void {
    fs.writeFileSync(filepath, JSON.stringify(data));
}

export function getBrightnessAtHeight(height: number, maxHeight: number): number {
    return 1 - clamp(height, maxHeight) / maxHeight;
}

export function intMedian(arrays: number[][]): number[] {
    let result = [];
    let len = arrays[0].length;
    for (let index = 0; index < len; index++) {
        let acc = 0;
        for (let array of arrays) {
            acc += array[index];
        }
        let median = Math.floor(acc / len);
        result.push(median);
    }
    return result;
}

export function exitWithError(errorType: string, message: string): void {
    console.log(`NarGen: ${COLOUR_RED}ERROR${COLOUR_NONE}: ${errorType}: ${message}`);
    process.exit(1);
}

export function raiseWarning(warningType: string, message: string): void {
    console.log(`NarGen: ${COLOUR_MAGENTA}WARNING${COLOUR_NONE}: ${warningType}: ${message}`);
}

export function random(prng: AleaPRNG = PRNG): number {
    return prng.random();
}

export function randint(min: number, max: number, prng: AleaPRNG = PRNG): number {
    return Math.floor(random(prng) * (max + 1 - min)) + min;
}

export function randomElement<T>(array: T[], prng: AleaPRNG = PRNG): T {
    let index = randint(0, array.length - 1, prng);
    return array[index];
}

export function flattenNoiseDistribution(noiseValue: number): number {
    let originalValue = noiseValue;
    let FLATTENR = -0.15;
    let mean = 0.53;
    let r = FLATTENR;
    let sine = (noiseValue < mean) ? -1 : 1;
    noiseValue = Math.abs(noiseValue - mean);
    noiseValue = 1 - Math.exp(noiseValue * r)
    noiseValue = mean + sine * noiseValue
    noiseValue = limit(noiseValue, 0, 1)
    return noiseValue;
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
