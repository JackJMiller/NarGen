import fs from "fs";
import Biome from "./Biome.js";
import Grid from "./Grid.js";
import Pattern from "./Pattern.js";
import Perlin from "./Perlin.js";
import Rangerray from "./Rangerray.js";
import SubBiome from "./SubBiome.js";
import World from "./World.js";
import { CHUNK_SIZE, OCTAVE_COUNT, ORNAMENTER, SURFACES } from "./constants.js";
import { getBrightnessAtHeight, portionAtPointBetween, randint } from "./functions.js";
import { checkMaxHeight } from "./issue_checking.js";
import { AleaPRNG, mkAlea } from "./lib/alea.js";
import { ChunkSaveObject, GridImageName, TileSaveObject, WorldConfig } from "./types.js";

type BiomeBalance = { biome: SubBiome, influence: number }[];

class Chunk {

    public parentWorld: World;
    public config: WorldConfig;
    public q: number;
    public r: number;
    public prng: AleaPRNG;
    public seed: number;
    public biomesRangerray: Rangerray<Biome>;
    public cornerX: number;
    public cornerY: number;
    public octaveCount: number;
    public widthInTiles: number;
    public heightInTiles: number;
    public surfaceGridImage: Grid<number[]>;
    public biomeGridImage: Grid<number[]>;
    public subBiomeGridImage: Grid<number[]>;
    public perlinImage: Grid<number[]>;
    public biomeGrid: Grid<BiomeBalance>;
    public groundGrid: Grid<number>;
    public surfaceGrid: Grid<string>;
    public areaGrid: Grid<string>;
    public overlayed: Grid<number>;
    public biomeSuperGrid: Grid<number>;

    constructor(parentWorld: World, q: number, r: number) {

        this.parentWorld = parentWorld;
        this.config = this.parentWorld.config;
        this.q = q;
        this.r = r;
        this.prng = mkAlea(`${this.q}x${this.r}`);
        this.seed = Number.parseInt(this.parentWorld.seed);
        this.biomesRangerray = this.parentWorld.biomesRangerray;
        this.cornerX = this.q * CHUNK_SIZE;
        this.cornerY = this.r * CHUNK_SIZE;

        this.seedGen(this.parentWorld.seed);

        let initialNoiseTileSize = 10 * CHUNK_SIZE;
        this.octaveCount = OCTAVE_COUNT;

        this.widthInTiles = CHUNK_SIZE;
        this.heightInTiles = CHUNK_SIZE;

        this.seedGen(this.parentWorld.seed);

        let octaves = this.produceOctaves(this.octaveCount, initialNoiseTileSize, "biomeGrid", [], 0.5);
        this.overlayed = this.overlayOctaves(octaves, 0.5);

        let biomeSuperGridOctaves = this.produceOctaves(1, this.parentWorld.biomeSuperGridTileSize, "biomeSuperGrid", [this.parentWorld.biomeSuperGridTileSize]);
        this.biomeSuperGrid = this.overlayOctaves(biomeSuperGridOctaves, 0.1);

        //this.biomeSuperGrid.printAllValues();

        this.parentWorld.tempAcc += Grid.calculateAverage(this.biomeSuperGrid);
        this.parentWorld.tempCount += 1;

        // create the biome map
        this.biomeGrid = Grid.createGrid<BiomeBalance>(this.widthInTiles, this.heightInTiles, this.determineBiome.bind(this), []);
        this.biomeGridImage = Grid.createGrid<number[]>(this.widthInTiles, this.heightInTiles, this.determineBiomeColour.bind(this), [0, 0, 0]);
        this.subBiomeGridImage = Grid.createGrid<number[]>(this.widthInTiles, this.heightInTiles, this.determineSubBiomeColour.bind(this), [0, 0, 0]);

        this.perlinImage = Pattern.createGridImage(this.biomeSuperGrid);

        // create the ground map
        this.seedGen(this.parentWorld.seed);
        this.groundGrid = this.createGroundGrid(octaves);

        // create the surface map
        this.seedGen(this.parentWorld.seed);
        this.surfaceGrid = Grid.createGrid<string>(this.widthInTiles, this.heightInTiles, this.determineSurface.bind(this), "");
        this.surfaceGridImage = Grid.createGrid<number[]>(this.widthInTiles, this.heightInTiles, this.determineSurfaceColour.bind(this), [0, 0, 0]);

        // create the area map to include ornamentation
        // TODO: create ornamenter for each sub-biome
        this.areaGrid = Grid.createGrid<string>(this.widthInTiles, this.heightInTiles, this.determineArea.bind(this), "");

        this.exportSaveFile();

    }

    public determineSurface(x: number, y: number): string {
        let height = this.groundGrid.valueAt(x, y);
        let biome = this.getBiomeAt(x, y);
        if (height <= 0) return "water";
        else return biome.altitudeSurfaces.selectValue(height);
    }

    public determineSurfaceColour(x: number, y: number): number[] {
        let height = this.groundGrid.valueAt(x, y);
        let biome = this.getBiomeAt(x, y);
        let v = this.surfaceGrid.valueAt(x, y);
        let colour = this.getSurfaceColour(v, height, biome.heightDisplacement);
        return colour;
    }

    public determineBiome(x: number, y: number): BiomeBalance {
        let height1 = this.biomeSuperGrid.valueAt(x, y);
        let height2 = this.overlayed.valueAt(x, y);
        let biomeBalance = this.determineBiomeByHeight(height1, height2);
        return biomeBalance;
    }

    public determineBiomeColour(x: number, y: number): number[] {
        let biomeBalance = this.biomeGrid.valueAt(x, y);
        let biome = biomeBalance[0].biome;
        return biome.parentColour;
    }

    public determineSubBiomeColour(x: number, y: number): number[] {
        let biomeBalance = this.biomeGrid.valueAt(x, y);
        let biome = biomeBalance[0].biome;
        return biome.colour;
    }

    public produceOctaves(octaveCount: number, noiseTileSize: number, patternName: string, tileSizes: number[] = [], lacunarity?: number): Grid<number>[] {

        // configure the noise tile sizes
        if (tileSizes.length === 0) {
            Pattern.determineTileSizes(tileSizes, noiseTileSize, octaveCount, lacunarity!);
        }

        // produce and return the octaves
        return tileSizes.map((tileSize: number) => this.produceOctave(tileSize, patternName));

    }

    public produceOctave(noiseTileSize: number, patternName: string): Grid<number> {
        this.seedGen(this.seed.toString() + patternName);
        let perlin = new Perlin(
            this.cornerX,
            this.cornerY,
            this.widthInTiles,
            this.heightInTiles,
            noiseTileSize,
            this.seed
        );
        return perlin.getGrid();
    }

    public determineArea(x: number, y: number): string {

        return ORNAMENTER.determineArea(x, y, this);

    }

    public createGroundGrid(octaves: Grid<number>[]): Grid<number> {

        this.groundGrid = new Grid<number>(this.widthInTiles, this.heightInTiles, 0);

        this.multiplyGroundOctaves(octaves);

        this.displaceGround(octaves);

        return this.groundGrid;

    }

    private multiplyGroundOctaves(octaves: Grid<number>[]) {
        for (let octaveNo = 0; octaveNo < octaves.length; octaveNo++) {
            let octave = octaves[octaveNo];
            for (let x = 0; x < this.widthInTiles; x++) {
                for (let y = 0; y < this.heightInTiles; y++) {
                    let original = this.groundGrid.valueAt(x, y)
                    let v = this.getGroundOctaveValue(x, y, octave, octaveNo);
                    this.groundGrid.setValueAt(x, y, original + v);
                }
            }
        }
    }

    private displaceGround(octaves: Grid<number>[]) {
        for (let x = 0; x < this.widthInTiles; x++) {
            for (let y = 0; y < this.heightInTiles; y++) {
                let displacement = 0;
                let biome: SubBiome = this.biomeGrid.valueAt(x, y)[0].biome; // ADDED
                for (let balance of this.biomeGrid.valueAt(x, y)) {
                    biome = balance.biome;
                    let biomeInfluence = balance.influence;
                    displacement += biome.heightDisplacement * biomeInfluence;
                }
                let original = this.groundGrid.valueAt(x, y)
                let newValue = Math.floor(original + displacement)
                if (newValue > this.parentWorld.worldInfo.maxHeightReached) {
                    this.parentWorld.worldInfo.maxHeightReached = newValue;
                }
                checkMaxHeight(newValue, biome, this.parentWorld);
                this.groundGrid.setValueAt(x, y, newValue);
            }
        }
    }

    public getGroundOctaveValue(x: number, y: number, octave: Grid<number>, octaveNo: number): number {
        let biomeBalance = this.biomeGrid.valueAt(x, y);
        let V = 0;
        for (let balance of biomeBalance) {
            let underlyingNoise = this.overlayed.valueAt(x, y);
            let biome = balance.biome;
            let biomeInfluence = balance.influence;
            let amplitude = biome.getAmplitude(octaveNo);
            let v = octave.valueAt(x, y);
            v *= amplitude * biome.getHeightMultiplier(underlyingNoise) * biomeInfluence;
            v /= biome.noiseScale;
            V += v;
        }
        return V;
    }

    public static getFilepath(worldFilepath: string, q: number, r: number): string {
        return [worldFilepath, "GENERATED", "chunks", `${q}x${r}.json`].join("/");
    }

    public exportSaveFile(): void {
        let saveFileObject = this.createSaveObject();
        let filepath = Chunk.getFilepath(this.parentWorld.filepath, this.q, this.r);
        fs.writeFileSync(filepath, JSON.stringify(saveFileObject));
    }

    private createSaveObject(): ChunkSaveObject {
        let saveFileObject: ChunkSaveObject = { q: this.q, r: this.r, tileGrid: [] };
        for (let x = 0; x < this.widthInTiles; x++) {
            let row: TileSaveObject[] = [];
            for (let y = 0; y < this.heightInTiles; y++) {
                row.push(this.createTileSaveObject(x, y));
            }
            saveFileObject.tileGrid.push(row);
        }
        return saveFileObject;
    }

    private createTileSaveObject(x: number, y: number): TileSaveObject {
        let altitude = this.groundGrid.valueAt(x, y);
        let groundTileName = this.surfaceGrid.valueAt(x, y);
        let areaObjectName = this.areaGrid.valueAt(x, y);
        return [
            this.getBiomeAt(x, y).toString(),
            altitude,
            groundTileName,
            areaObjectName
        ];
    }

    public getBiomeAt(x: number, y: number): SubBiome {
        return this.biomeGrid.valueAt(x, y)[0].biome as SubBiome;
    }

    public determineBiomeByHeight(height1: number, height2: number): BiomeBalance {
        // get main biome
        let mainBiome = this.biomesRangerray.select(height1);
        let biomeObj = mainBiome["value"];
        this.parentWorld.biomeSizes[biomeObj.name] += 1;
        let subBiome = biomeObj.selectValue(height2);

        let portionPoint = portionAtPointBetween(mainBiome["lowerPoint"], mainBiome["upperPoint"], height1);
        let blendRegion = 0.05;
        let blendedBiomeIndex = -1;
        let influence = 0;
        if (portionPoint <= blendRegion) {
            blendedBiomeIndex = mainBiome["index"] - 1
            influence = 1 - portionAtPointBetween(0, blendRegion, portionPoint)
            influence /= 2
        }
        else if (portionPoint >= 1 - blendRegion) {
            blendedBiomeIndex = mainBiome["index"] + 1
            influence = portionAtPointBetween(1 - blendRegion, 1, portionPoint)
            influence /= 2
        }
        else {
            blendedBiomeIndex = -1
        }

        if (0 <= blendedBiomeIndex && blendedBiomeIndex < this.biomesRangerray.length()) {
            let balance = [{ biome: subBiome, influence: 1 - influence }];
            let blendedBiome = this.biomesRangerray.selectByIndex(blendedBiomeIndex);
            let blendedBiomeObj = blendedBiome["value"];
            subBiome = blendedBiomeObj.selectValue(height2);
            balance.push({ biome: subBiome, influence: influence });
            return balance;
        }
        else {
            let balance = [{ biome: subBiome, influence: 1 }];
            return balance;
        }
    }

    public seedGen(seed: string): void {
        let prng = mkAlea(seed);
        this.seed = randint(1111111111, 9999999999, prng);
    }

    public getSurfaceColour(surfaceName: string, height: number, heightDisplacement: number): number[] {
        if (height < 0) height *= -1;

        let brightness = getBrightnessAtHeight(height, this.parentWorld.maxHeight);

        let colour = SURFACES[surfaceName];

        colour = [
            Math.floor(brightness * colour[0]),
            Math.floor(brightness * colour[1]),
            Math.floor(brightness * colour[2])
        ];

        return colour;
    }

    public overlayOctaves(octaves: Grid<number>[], persistence: number): Grid<number> {
        let heightGrid = new Grid<number>(this.widthInTiles, this.heightInTiles, 0);

        // if i were smart i would turn this into an equation
        // sadly i am not
        let persistenceSum = 0
        for (let index = 0; index < octaves.length; index++) {
            persistenceSum += Math.pow(persistence, index);
        }

        let noiseScaleInverse = 1 / persistenceSum;

        for (let octaveNo = 0; octaveNo < octaves.length; octaveNo++) {
            let octave = octaves[octaveNo];
            let amplitude = persistence ** octaveNo;
            for (let x = 0; x < this.widthInTiles; x++) {
                for (let y = 0; y < this.heightInTiles; y++) {
                    let originalValue = heightGrid.valueAt(x, y);
                    let v = octave.valueAt(x, y) * amplitude * noiseScaleInverse;
                    heightGrid.setValueAt(x, y, originalValue + v);
                }
            }
        }

        return heightGrid;

    }

    public limit(v: number, minimum: number, maximum: number): number {
        if (v < minimum) return minimum;
        else if (v > maximum) return maximum;
        else return v;
    }

    public getGridImage(imageName: GridImageName): Grid<number[]> {

        switch (imageName) {
            case "surfaceGridImage":
                return this.surfaceGridImage;
            case "biomeGridImage":
                return this.biomeGridImage;
            case "subBiomeGridImage":
                return this.subBiomeGridImage;
            case "perlinImage":
                return this.perlinImage;
            default:
                return this.perlinImage;
        }

    }

}

export default Chunk;
