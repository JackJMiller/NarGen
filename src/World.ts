import fs from "fs";
import path from "path";
import Biome from "./Biome.js";
import Chunk from "./Chunk.js";
import Grid from "./Grid.js";
import Rangerray from "./Rangerray.js";
import SubBiome from "./SubBiome.js";
import { BASE_BIOME_SIZE, CHUNK_SIZE, GRID_IMAGE_FILENAMES, RENDERER } from "./constants.js";
import { exitWithError, flattenNoiseDistribution, leftJustify, objectFromEntries, raiseWarning } from "./functions.js";
import { loadJSON } from "./system_script.js";
import { BiomeConfig, GridImageName, WarningRecord, WorldConfig, WorldInfo } from "./types.js";

class World {

    public filepath: string;
    public name: string;
    public config: WorldConfig;
    public renderWorld: boolean = true;
    public widthInTiles: number;
    public heightInTiles: number;
    public widthInChunks: number;
    public heightInChunks: number;
    public seed: string;
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
    public biomesRangerray: Rangerray<Biome>;
    public biomeSize: number = 1;
    public biomeSuperGridTileSize: number = 1;
    public biomeSizes!: { [index: string]: number };
    public biomeNames: string[] = [];
    public biomeColours: { [index: string]: string };
    public worldInfo: WorldInfo;

    public constructor(name: string, filepath: string) {

        this.filepath = filepath;
        this.name = name;
        let configFilePath = [this.filepath, "CONFIG.json"].join("/");
        this.config = loadJSON<WorldConfig>(configFilePath);

        this.fillConfig();

        this.seed = this.config.seed;
        this.widthInChunks = this.config.width;
        this.heightInChunks = this.config.height;
        this.widthInTiles = this.widthInChunks * CHUNK_SIZE;
        this.heightInTiles = this.heightInChunks * CHUNK_SIZE;
        this.totalAreaInTiles = this.widthInTiles * this.heightInTiles;
        this.createSaveFiles();

        this.warningRecord = { maxHeight: [], matchingBiomeColours: [] };
        this.biomeColours = {};

        this.maxHeight = Math.floor(this.config.maxHeight);
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
            q: this.config.q,
            r: this.config.r,
            maxHeight: this.maxHeight,
            maxHeightReached: 0,
            totalHeight: this.totalHeight
        };

        this.generateChunks();

        fs.writeFileSync([this.filepath, "GENERATED", "WORLD_INFO.json"].join("/"), JSON.stringify(this.worldInfo));

    }

    private fillConfig(): void {
        if (this.config.q === undefined) this.config.q = 0;
        if (this.config.r === undefined) this.config.r = 0;
    }


    public createSaveFiles() {
        if (!fs.existsSync(this.filepath)) {
            fs.mkdirSync(this.filepath);
            fs.mkdirSync([this.filepath, "GENERATED", "images"].join("/"));
            fs.mkdirSync([this.filepath, "GENERATED", "chunks"].join("/"));
        }
    }

    public configureBiomes() {

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

        for (let biomeEntry of this.config["biomes"]) {
            let upperPoint = biomeEntry[0];
            let biomeName = biomeEntry[1];
            //upperPoint = flattenNoiseDistribution(upperPoint);
            let biome = this.createBiome(biomeName);
            this.biomesRangerray.insert(upperPoint, biome);
        }

        this.biomesRangerray.print();

        this.biomeSuperGridTileSize = this.config["biomes"].length * BASE_BIOME_SIZE * this.biomeSize;

        console.log(`Biome super grid tile size: ${this.biomeSuperGridTileSize}`);

    }

    public createBiome(biomeName: string): Biome {
        let biome = new Biome(biomeName);
        let biomeConfigPath = [this.filepath, "biomes", biomeName + ".json"].join("/");
        if (!fs.existsSync(biomeConfigPath)) exitWithError("Undefined biome", `An undefined biome named '${biomeName}' is referenced in your CONFIG.json file.`);
        let biomeConfig = loadJSON<BiomeConfig>(biomeConfigPath);
        let noiseLower = 0;
        let noiseUpper = 0;

        if (Object.values(this.biomeColours).includes(biomeConfig["colour"].join(","))) {
            raiseWarning("Matching biome colours", `The biome '${biomeName}' is using a colour already in use.`);
            this.warningRecord.matchingBiomeColours.push(biomeName);
        }

        this.biomeColours[biomeName] = biomeConfig["colour"].join(",");

        Rangerray.fracrrayToRangerray(biomeConfig["ranges"])

        for (let subBiome of biomeConfig["ranges"]) {
            noiseUpper = subBiome[0];
            let subBiomeName = subBiome[1];
            if (!Object.keys(biomeConfig).includes(subBiomeName)) {
                exitWithError("Undefined sub-biome", `An undefined sub-biome named '${subBiomeName}' is referenced inside ranges attribute of biome '${biomeName}'.`);
            }
            noiseUpper = flattenNoiseDistribution(noiseUpper);
            let obj = new SubBiome(this, biomeName, subBiomeName, biomeConfig, noiseLower, noiseUpper);
            biome.insert(noiseUpper, obj);
            noiseLower = noiseUpper;
        }

        return biome;

    }


    public generateChunks() {

        let gridImageNames: GridImageName[] = (this.renderWorld) ? ["surfaceGridImage", "biomeGridImage", "subBiomeGridImage", "perlinImage"] : [];

        let gridImages: { [index: string]: Grid<number[]> } = {};
        for (let gridImageName of gridImageNames) {
            gridImages[gridImageName] = new Grid<number[]>(this.widthInTiles, this.heightInTiles, [0, 0, 0]);
        }

        for (let _q = 0; _q < this.widthInChunks; _q++) {
            for (let _r = 0; _r < this.heightInChunks; _r++) {
                let chunk = new Chunk(this, this.config.q + _q, this.config.r + _r);
                let cornerX = _q * CHUNK_SIZE;
                let cornerY = _r * CHUNK_SIZE;
                for (let gridImageName of gridImageNames) {
                    gridImages[gridImageName].overlay(chunk.getGridImage(gridImageName), cornerX, cornerY);
                }
            }
        }

        for (let gridImageName of gridImageNames) {
            let filename = GRID_IMAGE_FILENAMES[gridImageName];
            RENDERER.renderColourGrid(gridImages[gridImageName], path.join(this.filepath, "GENERATED", "images", filename));
        }

    }

    public summarise() {
        console.log(`Biome average: ${this.tempAcc / this.tempCount}`);
        for (let biomeName of Object.keys(this.biomeSizes)) {
            let biomeSize = this.biomeSizes[biomeName];
            let percentage = 100 * biomeSize / this.totalAreaInTiles;
            console.log(`${leftJustify(biomeName, 20)} ${leftJustify(biomeSize.toString(), 10)} ${percentage}%`);
        }
    }

}

export default World;
