import Rangerray from "./Rangerray";
import World from "./World";
import { OCTAVE_COUNT, RECOGNISED_SUB_BIOME_ATTRIBUTES } from "./constants";
import { colour_average, exit_with_error, int_median, point_at_portion_between, portion_at_point_between, validate, raise_warning } from "./functions";

class SubBiome {

    public parent_world: World;
    public amplitudes: number[] = [];
    public parent_biome_name: string;
    public name: string;
    public full_name: string;
    public noise_lower: number;
    public noise_upper: number;
    public noise_scale: number = 1;
    public altitude_surfaces: Rangerray;
    public height_displacement: number;
    public lower_height_multiplier: number;
    public upper_height_multiplier: number;
    public ornaments: any[] = [];
    public ornament_occurrence_rate: number = 0;
    public config: any;
    public config_keys: string;
    public parent_colour: number[];
    public colour: number[];

    constructor(parent_world: World, parent_biome_name: string, name: string, config: any, noise_lower: number, noise_upper: number) {
        this.parent_world = parent_world;
        this.parent_biome_name = parent_biome_name;
        this.name = name;
        this.full_name = this.parent_biome_name + "." + this.name;
        this.noise_lower = noise_lower;
        this.noise_upper = noise_upper;

        this.config = config[this.name];
        this.config_keys = this.config.keys();
        for (let key of this.config_keys) {
            if (!RECOGNISED_SUB_BIOME_ATTRIBUTES.includes(key)) {
                exit_with_error("Unrecognised attribute", "Cannot recognise attribute " + key + " in configuration for " + this.full_name + ".");
            }
        }
        this.parent_colour = config["colour"];
        this.colour = colour_average(this.config["colour"], config["colour"]);

        this.configure_values();

        this.height_displacement = Math.floor(this.config["height_displacement"]);

        if (this.config_keys.includes("height_multiplier")) {
            this.lower_height_multiplier = this.config["height_multiplier"];
            this.upper_height_multiplier = this.config["height_multiplier"];
        }
        else {
            if (!this.config_keys.includes("lower_height_multiplier") || !this.config_keys.includes("upper_height_multiplier")) {
                exit_with_error("Missing attribute", "Please specify height_multiplier configuration value for " + this.full_name + ".");
            }
            this.lower_height_multiplier = this.config["lower_height_multiplier"];
            this.upper_height_multiplier = this.config["upper_height_multiplier"];
        }

        this.altitude_surfaces = new Rangerray(this.full_name, this.config["altitude_surfaces"]);

        this.configure_ornaments();
    }
    
    public configure_ornaments() {
        this.ornaments = [];
        this.ornament_occurrence_rate = 0;
        let keys = Object.keys(this.config);
        if (keys.includes("ornaments")) {
            validate("ornaments", this.config["ornaments"], { "sub_biome_name": this.full_name });
            for (let value of this.config["ornaments"]) {
                if (value[0] !== "OCCURRENCE") {
                    this.ornaments.push(value);
                }
                else {
                    this.ornament_occurrence_rate = value[1];
                }
            }
        }
    }

    public configure_values() {
        if (this.config_keys.includes("amplitudes")) {
            this.amplitudes = this.config["amplitudes"];
            if (this.amplitudes.length !== OCTAVE_COUNT) {
                exit_with_error("Invalid config value", `Length of amplitudes in configuration for ${this.full_name} is equal to ${this.amplitudes.length}. Length should be ${OCTAVE_COUNT}.`);
            }
            if (this.config_keys.includes("persistence")) {
                raise_warning("Redundant attribute", "Both persistence and amplitudes are attributes specified in configuration for " + this.full_name + ". Program is defaulting to ampltides attributes.");
            }
        }
        else if (this.config_keys.includes("persistence")) {
            let persistence = Number.parseFloat(this.config["persistence"]);
            this.amplitudes = [];
            let amplitude = 1;
            for (let i = 0; i < OCTAVE_COUNT; i++) {
                this.amplitudes.push(amplitude);
                amplitude *= persistence;
            }
        }
        else {
            exit_with_error("Missing attribute", `Please specify persistence or amplitudes configuration value for ${this.full_name}.`);
        }

        this.noise_scale = 0;
        for (let amplitude of this.amplitudes) {
            this.noise_scale += amplitude;
        }
    }


    public get_height_multiplier(noise_value: number) {
        let portion = portion_at_point_between(this.noise_lower, this.noise_upper, noise_value);
        let multiplier = point_at_portion_between(this.lower_height_multiplier, this.upper_height_multiplier, portion);
        return multiplier;
    }

    public get_amplitude(index: number): number {
        return this.amplitudes[index];
    }

    // TODO: replace __str__ calls
    public toString() {
        return this.parent_biome_name + "." + this.name;
    }

}

export = SubBiome;
