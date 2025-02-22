import fs from "fs";
import { COLOUR_RED, COLOUR_MAGENTA, COLOUR_NONE } from "./constants";

export function clamp(value: number, maximum: number): number {
    if (value < 0) return 0;
    else if (value > maximum) return maximum;
    else return value;
}

export function limit(value: number, minimum: number, maximum: number): number {
    if (value < minimum) return minimum;
    else if (value > maximum) return maximum;
    else return value;
}

export function point_at_portion_between(a: number, b: number, portion: number): number {
    let r = b - a;
    return a + portion * r;
}

export function portion_at_point_between(a: number, b: number, point: number): number {
    b = b - a;
    point = point - a;
    return point / b;
}

// TODO: remove
export function load_json(filepath: string): any {
    return require(filepath);
}

export function save_json(data: any, filepath: string): void {
    fs.writeFileSync(filepath, data);
}

export function get_brightness_at_height(height: number, max_height: number): number {
    return 1 - clamp(height, max_height) / max_height;
}

export function int_median(arrays: number[][]): number[] {
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

export function exit_with_error(error_type: string, message: string): void {
    console.log(`NarGen: ${COLOUR_RED}ERROR${COLOUR_NONE}: ${error_type}: ${message}`);
    process.exit(1);
}

export function raise_warning(warning_type: string, message: string): void {
    console.log(`NarGen: ${COLOUR_MAGENTA}WARNING${COLOUR_NONE}: ${warning_type}: ${message}`);
}

function random(): number {
    return Math.random();
}

export function randint(min: number, max: number): number {
    return Math.floor(random() * (max + 1 - min)) + min;
}

export function random_element<T>(array: T[]): T {
    let index = randint(0, array.length - 1);
    return array[index];
}

export function flatten_noise_distribution(noise_value: number): number {
    let original_value = noise_value;
    let FLATTEN_R = -0.15;
    let mean = 0.53;
    let r = FLATTEN_R;
    let sine = (noise_value < mean) ? -1 : 1;
    noise_value = Math.abs(noise_value - mean);
    noise_value = 1 - Math.exp(noise_value * r)
    noise_value = mean + sine * noise_value
    noise_value = limit(noise_value, 0, 1)
    return noise_value;
}

export function validate(data_type: string, value: any, context: any): void {
    if (data_type === "ornaments") {
        let keys = value.map((entry: any[]) => entry[0]);
        if (!keys.includes("OCCURRENCE")) {
            exit_with_error("Invalid configuration", `The OCCURRENCE attribute is missing from the ornaments list inside the configuration for ${context["sub_biome_name"]}.`);
        }
    }
}

export function colour_average(c1: number[], c2: number[]): number[] {
    return [
        mean(c1[0], c2[0]),
        mean(c1[1], c2[1]),
        mean(c1[2], c2[2])
    ];
}

export function mean(v1: number, v2: number) {
    return Math.floor((v1 + v2) / 2);
}
