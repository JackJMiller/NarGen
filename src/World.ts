import Biome from "./Biome.js";
import Chunk from "./Chunk.js";
import Grid from "./Grid.js";
import Perlin from "./Perlin.js";
import Rangerray from "./Rangerray.js";
import { BASE_BIOME_SIZE, CHUNK_SIZE, GRID_IMAGE_FILENAMES, RENDERER } from "./constants.js";
import { leftJustify, objectFromEntries } from "./functions.js";
import { existsSync, join, loadJSON, mkdirSync, writeFileSync } from "./env_script.js";
import { Colour, GridImageName, WarningRecord, WorldConfig, WorldInfo } from "./types.js";

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

        this.seed = this.config.seed.toString();
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
            totalHeight: this.totalHeight
        };

        this.generateChunks();

        writeFileSync([this.filepath, "GENERATED", "WORLD_INFO.json"].join("/"), JSON.stringify(this.worldInfo));

    }

    private fillConfig(): void {
        if (this.config.q === undefined) this.config.q = 0;
        if (this.config.r === undefined) this.config.r = 0;
    }


    public createSaveFiles() {
        if (!existsSync(this.filepath)) {
            mkdirSync(this.filepath);
            mkdirSync([this.filepath, "GENERATED", "images"].join("/"));
            mkdirSync([this.filepath, "GENERATED", "chunks"].join("/"));
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

        let biomeSizeSum = this.config.biomes.reduce((acc: number, x: any) => acc + x[0], 0);

        Rangerray.fracrrayToRangerray(this.config["biomes"]);

        for (let biomeEntry of this.config["biomes"]) {
            let upperPoint = biomeEntry[0];
            let biomeName = biomeEntry[1];
            upperPoint = Perlin.flatten(upperPoint);
            let biome = new Biome(biomeName, this);
            this.biomesRangerray.insert(upperPoint, biome);
        }

        this.biomeSuperGridTileSize = biomeSizeSum * BASE_BIOME_SIZE * this.biomeSize;

        console.log(`Biome super grid tile size: ${this.biomeSuperGridTileSize}`);

    }

    public generateChunks() {

        let gridImageNames: GridImageName[] = (this.renderWorld) ? ["surfaceGridImage", "biomeGridImage", "subBiomeGridImage", "perlinImage"] : [];

        let gridImages: { [index: string]: Grid<Colour> } = {};
        for (let gridImageName of gridImageNames) {
            gridImages[gridImageName] = new Grid<Colour>(this.widthInTiles, this.heightInTiles, [0, 0, 0]);
        }

        for (let _q = 0; _q < this.widthInChunks; _q++) {
            for (let _r = 0; _r < this.heightInChunks; _r++) {
                let chunk = new Chunk(this, this.config.q + _q, this.config.r + _r);
                let cornerX = _q * CHUNK_SIZE;
                let cornerY = _r * CHUNK_SIZE;
                for (let gridImageName of gridImageNames) {
                    gridImages[gridImageName].overlay(chunk[gridImageName], cornerX, cornerY);
                }
            }
        }

        for (let gridImageName of gridImageNames) {
            let filename = GRID_IMAGE_FILENAMES[gridImageName];
            RENDERER.renderColourGrid(gridImages[gridImageName], join(this.filepath, "GENERATED", "images", filename));
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
