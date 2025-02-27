import fs from "fs";
import path from "path";
import Chunk from "./Chunk";
import Grid from "./Grid";
import Rangerray from "./Rangerray";
import SubBiome from "./SubBiome";
import { BASE_BIOME_SIZE, CHUNK_SIZE, RENDERER } from "./constants";
import { exitWithError, flattenNoiseDistribution, leftJustify, objectFromEntries } from "./functions";
import { loadJSON } from "./terminal_script";

class World {

    public filepath: string;
    public name: string;
    public config: WorldConfig;
    public renderWorld: boolean;
    public widthInTiles: number;
    public heightInTiles: number;
    public widthInChunks: number;
    public heightInChunks: number;
    public seed: number;
    public minNoise: number;
    public maxNoise: number;
    public totalHeight: number;
    public maxHeight: number;
    public totalAreaInTiles: number;
    public tempAcc: number;
    public tempCount: number;
    public noiseAcc: number;
    public noiseCount: number;
    public warningRecord: WarningRecord;
    public biomesRangerray: Rangerray<Rangerray<SubBiome>>;
    public biomeSize: number = 1;
    public biomeSuperMapTileSize: number = 1;
    public biomeSizes!: { [index: string]: number };
    public biomeNames: string[] = [];
    public biomeColours: { [index: string]: Colour };
    public worldInfo: WorldInfo;

    public constructor(name: string, filepath: string, renderWorld: boolean) {

        this.filepath = filepath;
        this.name = name;
        let configFilePath = [this.filepath, "CONFIG.json"].join("/");
        this.config = loadJSON(configFilePath) as WorldConfig;

        this.renderWorld = renderWorld;
        this.seed = this.config["seed"];
        this.widthInChunks = this.config["width"];
        this.heightInChunks = this.config["height"];
        this.widthInTiles = this.widthInChunks * CHUNK_SIZE;
        this.heightInTiles = this.heightInChunks * CHUNK_SIZE;
        this.totalAreaInTiles = this.widthInTiles * this.heightInTiles;
        this.createSaveFiles();

        this.warningRecord = { maxHeight: [], matchingBiomeColours: [] };
        this.biomeColours = {};

        this.maxHeight = Math.floor(this.config["maxHeight"])
        this.totalHeight = 2 * this.maxHeight
        this.tempAcc = 0;
        this.tempCount = 0;

        this.biomesRangerray = new Rangerray("biomesRangerray");

        this.configureBiomes()

        // stats
        this.minNoise = 1;
        this.maxNoise = 0;
        this.noiseAcc = 0;
        this.noiseCount = 0;

        this.worldInfo = {
            seed: this.seed,
            width: this.widthInChunks,
            height: this.heightInChunks,
            maxHeight: this.maxHeight,
            totalHeight: this.totalHeight
        };

        this.generateChunks();

        fs.writeFileSync([this.filepath, "GENERATED", "WORLD_INFO.json"].join("/"), JSON.stringify(this.worldInfo));

    }


    public createSaveFiles() {
        if (!fs.existsSync(this.filepath)) {
            fs.mkdirSync(this.filepath);
            fs.mkdirSync([this.filepath, "GENERATED", "images"].join("/"));
            fs.mkdirSync([this.filepath, "GENERATED", "chunks"].join("/"));
        }
    }

    public configureBiomes() {

        let lowerPoint = 0;
        this.biomeNames = this.config["biomes"].map((biome: [number, string]) => biome[1]);
        this.biomeSizes = objectFromEntries<number>(this.biomeNames, new Array(this.biomeNames.length).fill(0));

        let keys = Object.keys(this.config);

        if (keys.includes("biomeSize")) {
            this.biomeSize = this.config["biomeSize"];
        }
        else {
            this.biomeSize = 1;
        }

        Rangerray.fracrrayToRangerray(this.config["biomes"]);

        for (let biome of this.config["biomes"]) {
            let upperPoint = biome[0];
            let biomeName = biome[1];
            upperPoint = flattenNoiseDistribution(upperPoint);
            let rangerray = this.createBiome(biomeName, lowerPoint, upperPoint);
            this.biomesRangerray.insert(upperPoint, rangerray);
            lowerPoint = upperPoint;
        }

        this.biomeSuperMapTileSize = this.config["biomes"].length * BASE_BIOME_SIZE * this.biomeSize;

    }

    public createBiome(biomeName: string, biomeNoiseLower: number, biomeNoiseUpper: number): Rangerray<SubBiome> {
        let rangerray = new Rangerray<SubBiome>(biomeName);
        let biomeConfigPath = [this.filepath, "biomes", biomeName + ".json"].join("/");
        if (!fs.existsSync(biomeConfigPath)) exitWithError("Undefined biome", `An undefined biome named '${biomeName}' is referenced in your CONFIG.json file.`);
        let biomeConfig = loadJSON(biomeConfigPath) as BiomeConfig;
        let noiseLower = 0;
        let noiseUpper = 0;

        // TODO
        // if tuple(biomeConfig["colour"]) in this.biomeColours.values() {
        //     raiseWarning("Matching biome colours", "The biome " + biomeName + " is using a colour already in use.")
        //     this.parentWorld.warningRecord["matchingBiomeColours"].push(biomeName);
        // }

        this.biomeColours[biomeName] = biomeConfig["colour"];

        Rangerray.fracrrayToRangerray(biomeConfig["ranges"])

        for (let subBiome of biomeConfig["ranges"]) {
            noiseUpper = subBiome[0];
            let subBiomeName = subBiome[1];
            if (!Object.keys(biomeConfig).includes(subBiomeName)) {
                exitWithError("Undefined sub-biome", `An undefined sub-biome named '${subBiomeName}' is referenced inside ranges attribute of biome '${biomeName}'.`);
            }
            noiseUpper = flattenNoiseDistribution(noiseUpper);
            let obj = new SubBiome(this, biomeName, subBiomeName, biomeConfig, noiseLower, noiseUpper);
            rangerray.insert(noiseUpper, obj);
            noiseLower = noiseUpper;
        }

        return rangerray;

    }


    public generateChunks() {

        let mapImageNames: MapImageName[] = (this.renderWorld) ? ["surfaceMapImage", "biomeMapImage", "subBiomeMapImage", "perlinImage"] : [];

        let mapImages: { [index: string]: Grid<number[]> } = {};
        for (let mapImageName of mapImageNames) {
            mapImages[mapImageName] = new Grid<number[]>(this.widthInTiles, this.heightInTiles, [0, 0, 0]);
        }

        for (let q = 0; q < this.widthInChunks; q++) {
            for (let r = 0; r < this.heightInChunks; r++) {
                let chunk = new Chunk(this, q, r);
                let cornerX = q * CHUNK_SIZE;
                let cornerY = r * CHUNK_SIZE;
                for (let mapImageName of mapImageNames) {
                    mapImages[mapImageName].overlay(chunk.getMapImage(mapImageName), cornerX, cornerY);
                }
            }
        }

        for (let mapImageName of mapImageNames) {
            RENDERER.renderColourGrid(mapImages[mapImageName], path.join(this.filepath, "GENERATED", "images", `${mapImageName}.png`));
        }

    }

    public summarise() {
        console.log(`Biome average = ${this.tempAcc / this.tempCount}`);
        for (let biomeName of Object.keys(this.biomeSizes)) {
            let biomeSize = this.biomeSizes[biomeName];
            let percentage = 100 * biomeSize / this.totalAreaInTiles;
            console.log(`${leftJustify(biomeName, 20)} ${leftJustify(biomeSize.toString(), 10)} ${percentage}%`);
        }
    }

}

export = World;
