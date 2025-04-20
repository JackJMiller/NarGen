import Grid from "./Grid.js";
import Rangerray from "./Rangerray.js";
import World from "./World.js";
import { OCTAVE_COUNT } from "./constants.js";
import { colourAverage, deinterpolate, interpolate } from "./functions.js";
import { sanitiseMaxHeight } from "./sanitisation.js";
import { BiomeConfig, Colour, OrnamentDefinition, SubBiomeConfig } from "./types.js";
import { validateOrnaments, validateSubBiomeAmplitudes, validateSubBiomeConfigKeys } from "./validation.js";

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
    public parentColour: Colour;
    public colour: Colour;

    constructor(parentWorld: World, parentBiomeName: string, name: string, config: BiomeConfig, noiseLower: number, noiseUpper: number) {
        this.parentWorld = parentWorld;
        this.parentBiomeName = parentBiomeName;
        this.name = name;
        this.fullName = `${this.parentBiomeName}.${this.name}`;
        this.noiseLower = noiseLower;
        this.noiseUpper = noiseUpper;

        this.config = config[this.name as string] as SubBiomeConfig;
        this.configKeys = Object.keys(this.config);
        validateSubBiomeConfigKeys(this.fullName, this.configKeys);

        this.parentColour = config.colour;
        this.colour = colourAverage(this.config.colour, config.colour);

        this.configureValues();

        this.heightDisplacement = Math.floor(this.config.heightDisplacement);

        if (this.configKeys.includes("heightMultiplier")) {
            this.lowerHeightMultiplier = this.upperHeightMultiplier = this.config.heightMultiplier;
        }
        else {
            this.lowerHeightMultiplier = this.config.lowerHeightMultiplier;
            this.upperHeightMultiplier = this.config.upperHeightMultiplier;
        }

        this.altitudeSurfaces = new Rangerray<string>(this.fullName, this.config.altitudeSurfaces);

        this.configureOrnaments();
    }

    public getHeightAt(x: number, y: number, octaves: Grid<number>[], perlinOverlayed: Grid<number>): number {
        let height = this.heightDisplacement;
        for (let octaveNo = 0; octaveNo < octaves.length; octaveNo++) {
            height += this.getGroundOctaveValue(x, y, octaves[octaveNo], octaveNo, perlinOverlayed);
        }
        height = sanitiseMaxHeight(height, this.fullName, this.parentWorld);
        return height;
    }

    private getGroundOctaveValue(x: number, y: number, octave: Grid<number>, octaveNo: number, perlinOverlayed: Grid<number>): number {
        let underlyingNoise = perlinOverlayed.valueAt(x, y);
        let amplitude = this.amplitudes[octaveNo];
        let v = octave.valueAt(x, y);
        v *= amplitude * this.getHeightMultiplier(underlyingNoise);
        v /= this.noiseScale;
        return v;
    }
    
    private configureOrnaments() {
        this.ornaments = [];
        this.ornamentOccurrenceRate = 0;
        let keys = Object.keys(this.config);
        if (keys.includes("ornaments")) {
            validateOrnaments(this.config.ornaments, this.fullName);
            this.ornamentOccurrenceRate = this.config.ornaments.OCCURRENCE;
            this.ornaments = this.config.ornaments.candidates;
        }
    }

    private configureValues() {

        if (this.configKeys.includes("amplitudes")) {
            validateSubBiomeAmplitudes(this.fullName, this.config.amplitudes, this.configKeys);
            this.amplitudes = this.config.amplitudes;
        }
        else {
            this.amplitudes = this.computeAmplitudes(this.config.persistence);
        }

        this.noiseScale = this.amplitudes.reduce((amplitude: number, acc: number) => amplitude + acc, 0);

    }

    private computeAmplitudes(persistence: number): number[] {
        return new Array(OCTAVE_COUNT).map((e: number, i: number) => Math.pow(persistence, i));
    }

    private getHeightMultiplier(noiseValue: number) {
        let portion = deinterpolate(this.noiseLower, this.noiseUpper, noiseValue);
        let multiplier = interpolate(this.lowerHeightMultiplier, this.upperHeightMultiplier, portion);
        return multiplier;
    }

    public toString() {
        return this.parentBiomeName + "." + this.name;
    }

}

export default SubBiome;
