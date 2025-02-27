import Rangerray from "./Rangerray.js";
import World from "./World.js";
import { OCTAVE_COUNT, RECOGNISED_SUB_BIOME_ATTRIBUTES } from "./constants.js";
import { colourAverage, exitWithError, pointAtPortionBetween, portionAtPointBetween, raiseWarning } from "./functions.js";
import { BiomeConfig, OrnamentDefinition, SubBiomeConfig } from "./types.js";
import { validateOrnaments } from "./validation.js";

class SubBiome {

    public parentWorld: World;
    public amplitudes: number[] = [];
    public parentBiomeName: string;
    public name: string;
    public fullName: string;
    public noiseLower: number;
    public noiseUpper: number;
    public noiseScale: number = 1;
    public altitudeSurfaces: Rangerray<string>;
    public heightDisplacement: number;
    public lowerHeightMultiplier: number;
    public upperHeightMultiplier: number;
    public ornaments: OrnamentDefinition[] = [];
    public ornamentOccurrenceRate: number = 0;
    public config: SubBiomeConfig;
    public configKeys: string[];
    public parentColour: number[];
    public colour: number[];

    constructor(parentWorld: World, parentBiomeName: string, name: string, config: BiomeConfig, noiseLower: number, noiseUpper: number) {
        this.parentWorld = parentWorld;
        this.parentBiomeName = parentBiomeName;
        this.name = name;
        this.fullName = this.parentBiomeName + "." + this.name;
        this.noiseLower = noiseLower;
        this.noiseUpper = noiseUpper;

        this.config = config[this.name as string] as SubBiomeConfig;
        this.configKeys = Object.keys(this.config);
        for (let key of this.configKeys) {
            if (!RECOGNISED_SUB_BIOME_ATTRIBUTES.includes(key)) {
                exitWithError("Unrecognised attribute", "Cannot recognise attribute " + key + " in configuration for " + this.fullName + ".");
            }
        }
        this.parentColour = config["colour"];
        this.colour = colourAverage(this.config["colour"], config["colour"]);

        this.configureValues();

        this.heightDisplacement = Math.floor(this.config["heightDisplacement"]);

        if (this.configKeys.includes("heightMultiplier")) {
            this.lowerHeightMultiplier = this.config["heightMultiplier"];
            this.upperHeightMultiplier = this.config["heightMultiplier"];
        }
        else {
            if (!this.configKeys.includes("lowerHeightMultiplier") || !this.configKeys.includes("upperHeightMultiplier")) {
                exitWithError("Missing attribute", "Please specify heightMultiplier configuration value for " + this.fullName + ".");
            }
            this.lowerHeightMultiplier = this.config["lowerHeightMultiplier"];
            this.upperHeightMultiplier = this.config["upperHeightMultiplier"];
        }

        this.altitudeSurfaces = new Rangerray<string>(this.fullName, this.config["altitudeSurfaces"]);

        this.configureOrnaments();
    }
    
    public configureOrnaments() {
        this.ornaments = [];
        this.ornamentOccurrenceRate = 0;
        let keys = Object.keys(this.config);
        if (keys.includes("ornaments")) {
            validateOrnaments(this.config["ornaments"], this.fullName);
            for (let value of this.config["ornaments"]) {
                if (value[0] !== "OCCURRENCE") {
                    this.ornaments.push(value);
                }
                else {
                    this.ornamentOccurrenceRate = value[1];
                }
            }
        }
    }

    public configureValues() {
        if (this.configKeys.includes("amplitudes")) {
            this.amplitudes = this.config["amplitudes"];
            if (this.amplitudes.length !== OCTAVE_COUNT) {
                exitWithError("Invalid config value", `Length of amplitudes in configuration for ${this.fullName} is equal to ${this.amplitudes.length}. Length should be ${OCTAVE_COUNT}.`);
            }
            if (this.configKeys.includes("persistence")) {
                raiseWarning("Redundant attribute", "Both persistence and amplitudes are attributes specified in configuration for " + this.fullName + ". Program is defaulting to ampltides attributes.");
            }
        }
        else if (this.configKeys.includes("persistence")) {
            let persistence = this.config["persistence"];
            this.amplitudes = [];
            let amplitude = 1;
            for (let i = 0; i < OCTAVE_COUNT; i++) {
                this.amplitudes.push(amplitude);
                amplitude *= persistence;
            }
        }
        else {
            exitWithError("Missing attribute", `Please specify persistence or amplitudes configuration value for ${this.fullName}.`);
        }

        this.noiseScale = 0;
        for (let amplitude of this.amplitudes) {
            this.noiseScale += amplitude;
        }
    }


    public getHeightMultiplier(noiseValue: number) {
        let portion = portionAtPointBetween(this.noiseLower, this.noiseUpper, noiseValue);
        let multiplier = pointAtPortionBetween(this.lowerHeightMultiplier, this.upperHeightMultiplier, portion);
        return multiplier;
    }

    public getAmplitude(index: number): number {
        return this.amplitudes[index];
    }

    // TODO: replace _Str_ calls
    public toString() {
        return this.parentBiomeName + "." + this.name;
    }

}

export default SubBiome;
