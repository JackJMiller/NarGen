import fs from "fs";
import Biome from "./Biome.js";
import Grid from "./Grid.js";
import Perlin from "./Perlin.js";
import Rangerray from "./Rangerray.js";
import SubBiome from "./SubBiome.js";
import World from "./World.js";
import { CHUNK_SIZE, GLOBAL_PRNG, OCTAVE_COUNT, SURFACES, ORNAMENTATION_ROOT_BLOCKS } from "./constants.js";
import { clamp, getBrightnessAtHeight, portionAtPointBetween, raiseWarning, randint } from "./functions.js";
import { mkAlea } from "./lib/alea.js";
import { ChunkSaveObject, MapImageName, TileSaveObject, WorldConfig } from "./types.js";

type BiomeBalance = { biome: SubBiome, influence: number }[];

class Chunk {

    public parentWorld: World;
    public config: WorldConfig;
    public seed: number;
    public q: number;
    public r: number;
    public biomesRangerray: Rangerray<Biome>;
    public cornerX: number;
    public cornerY: number;
    public lacunarity: number;
    public MINWORLDHEIGHT: number;
    public MAXWORLDHEIGHT: number;
    public TOTALWORLDHEIGHT: number;
    public octaveCount: number;
    public widthInTiles: number;
    public heightInTiles: number;
    public surfaceMapImage: Grid<number[]>;
    public biomeMapImage: Grid<number[]>;
    public subBiomeMapImage: Grid<number[]>;
    public perlinImage: Grid<number[]>;
    public AAA: number = 0;
    public BBB: number = 0;
    public CCC: number = 0;
    public biomeMap: Grid<BiomeBalance>;
    public groundMap: Grid<number>;
    public surfaceMap: Grid<string>;
    public areaMap: Grid<string>;
    public overlayed: Grid<number>;
    public biomeSuperMap: Grid<number>;

    constructor(parentWorld: World, q: number, r: number) {

        this.parentWorld = parentWorld
        this.config = this.parentWorld.config
        this.seed = parentWorld.seed
        this.q = q
        this.r = r
        this.biomesRangerray = this.parentWorld.biomesRangerray
        this.cornerX = this.q * CHUNK_SIZE
        this.cornerY = this.r * CHUNK_SIZE
        this.lacunarity = 0.5
        this.MINWORLDHEIGHT = -100
        this.MAXWORLDHEIGHT = 200
        this.TOTALWORLDHEIGHT = this.MAXWORLDHEIGHT - this.MINWORLDHEIGHT

        this.abcGen(this.seed)

        let initialNoiseTileSize = 10 * CHUNK_SIZE
        this.octaveCount = OCTAVE_COUNT

        this.widthInTiles = CHUNK_SIZE
        this.heightInTiles = CHUNK_SIZE

        this.abcGen(this.seed)

        let { octaves, overlayed } = this.produceOctaves(this.octaveCount, initialNoiseTileSize, 0.5, "biomeMap", [], 0.5);

        this.overlayed = overlayed;

        let result = this.produceOctaves(3, this.parentWorld.biomeSuperMapTileSize, 0.1, "biomeSuperMap", [this.parentWorld.biomeSuperMapTileSize, 50, 20]);
        this.biomeSuperMap = result.overlayed;

        this.parentWorld.tempAcc += this.biomeSuperMap.calculateAverage()
        this.parentWorld.tempCount += 1

        // create the biome map
        let biome = this.createBiomeMap(this.overlayed);
        this.biomeMap = biome.biomeMap;
        this.biomeMapImage = biome.biomeMapImage;
        this.subBiomeMapImage = biome.subBiomeMapImage;

        this.perlinImage = Perlin.createGridImage(this.biomeSuperMap)

        // create the ground map
        this.abcGen(this.seed)
        this.groundMap = this.createGroundMap(octaves);

        // create the surface map
        this.abcGen(randint(1, 100))
        let surface = this.createSurfaceMap();
        this.surfaceMap = surface.surfaceMap;
        this.surfaceMapImage = surface.surfaceMapImage;

        // create the area map to include ornamentation
        this.areaMap = this.createAreaMap();

        this.exportSaveFile()

    }

    public produceOctaves(octaveCount: number, noiseTileSize: number, persistence: number, octaveIdentifier: string, tileSizes: number[] = [], lacunarity: number | null = null): { octaves: Grid<number>[], overlayed: Grid<number> } {

        // configure the noise tile sizes
        if (tileSizes.length === 0) {
            let tileSize = noiseTileSize
            for (let i = 0; i < octaveCount; i++) {
                tileSizes.push(tileSize);
                tileSize = Math.ceil(tileSize * lacunarity!);
            }
        }

        // create the octaves
        let octaves = [];
        for (let octaveNo = 0; octaveNo < tileSizes.length; octaveNo++) {
            let noiseTileSize = tileSizes[octaveNo];
            this.abcGen(this.AAA);
            let perlin = new Perlin(
                this.cornerX,
                this.cornerY,
                this.widthInTiles,
                this.heightInTiles,
                noiseTileSize,
                this.AAA, this.BBB, this.CCC
            );
            let octave = perlin.getGrid();
            octaves.push(octave);
        }

        let overlayed = this.overlayOctaves(octaves, persistence);

        return { octaves, overlayed };

    }

    public createAreaMap(): Grid<string> {
        this.areaMap = new Grid<string>(this.widthInTiles, this.heightInTiles, "")
        for (let x = 0; x < this.widthInTiles; x++) {
            for (let y = 0; y < this.heightInTiles; y++) {
                let areaObjectName = this.decideOrnamentationAt(x, y)
                if (areaObjectName !== "") {
                    this.areaMap.setValueAt(x, y, areaObjectName)
                }
            }
        }
        return this.areaMap;
    }

    public decideOrnamentationAt(x: number, y: number): string {
        // TEMP
        // return ""
        let altitude = this.groundMap.valueAt(x, y)
        if (altitude <= 0) return "";

        let biome = this.getBiomeAt(x, y)
        if (GLOBAL_PRNG.random() > biome.ornamentOccurrenceRate) return "";
        let groundTileName = this.surfaceMap.valueAt(x, y)
        let acc = 0;
        let candidates = new Rangerray<string>();
        for (let veg of biome.ornaments) {
            let vegName = veg[0];
            let minAltitude = veg[1];
            let maxAltitude = veg[2];
            let vegOccurrenceChance = veg[3];
            if (minAltitude <= altitude && altitude <= maxAltitude && ORNAMENTATION_ROOT_BLOCKS[vegName as string].includes(groundTileName)) {
                acc += vegOccurrenceChance;
                candidates.insert(acc, vegName);
            }
        }
        if (candidates.length() > 0) {
            let randomNumber = Math.round(GLOBAL_PRNG.random() * acc);
            return candidates.selectValue(randomNumber);
        }
        else {
            return "";
        }
    }

    public createGroundMap(octaves: Grid<number>[]): Grid<number> {

        this.groundMap = new Grid<number>(this.widthInTiles, this.heightInTiles, 0);

        for (let octaveNo = 0; octaveNo < octaves.length; octaveNo++) {
            let octave = octaves[octaveNo];
            for (let x = 0; x < this.widthInTiles; x++) {
                for (let y = 0; y < this.heightInTiles; y++) {
                    let original = this.groundMap.valueAt(x, y)
                    let v = this.getGroundOctaveValue(x, y, octave, octaveNo);
                    this.groundMap.setValueAt(x, y, original + v);
                }
            }
        }

        for (let x = 0; x < this.widthInTiles; x++) {
            for (let y = 0; y < this.heightInTiles; y++) {
                let displacement = 0;
                let biome: SubBiome = this.biomeMap.valueAt(x, y)[0].biome; // ADDED
                for (let balance of this.biomeMap.valueAt(x, y)) {
                    biome = balance.biome;
                    let biomeInfluence = balance.influence;
                    displacement += biome.heightDisplacement * biomeInfluence;
                }
                let original = this.groundMap.valueAt(x, y)
                let newValue = Math.floor(original + displacement)
                if (newValue > this.parentWorld.maxHeight && !this.parentWorld.warningRecord["maxHeight"].includes(biome.fullName)) {
                    newValue = clamp(newValue, this.parentWorld.maxHeight);
                    raiseWarning("Extreme terrain", "Ground map value inside " + biome.fullName + " has exceeded the maximum world height. Value has been capped at " + this.parentWorld.maxHeight.toString() + ".");
                    this.parentWorld.warningRecord["maxHeight"].push(biome.fullName);
                }
                this.groundMap.setValueAt(x, y, newValue);
            }
        }

        return this.groundMap;

    }

    public getGroundOctaveValue(x: number, y: number, octave: Grid<number>, octaveNo: number): number {
        let biomeBalance = this.biomeMap.valueAt(x, y);
        let V = 0;
        let biomeInfluenceSum = 0;
        for (let balance of biomeBalance) {
            biomeInfluenceSum += balance.influence;
        }
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

    public createSurfaceMap(): { surfaceMap: Grid<string>, surfaceMapImage: Grid<number[]> } {
        this.surfaceMap = new Grid<string>(this.widthInTiles, this.heightInTiles, "");
        this.surfaceMapImage = new Grid<number[]>(this.widthInTiles, this.heightInTiles, []);
        for (let x = 0; x < this.widthInTiles; x++) {
            for (let y = 0; y < this.heightInTiles; y++) {
                let height = this.groundMap.valueAt(x, y);
                let biome = this.getBiomeAt(x, y);
                let v = this.determineSurface(height, biome);
                this.surfaceMap.setValueAt(x, y, v)
                let colour = this.getSurfaceColour(v, height, biome.heightDisplacement);
                this.surfaceMapImage.setValueAt(x, y, colour)
            }
        }

        return { surfaceMap: this.surfaceMap, surfaceMapImage: this.surfaceMapImage };
    }

    public static getFilepath(worldFilepath: string, q: number, r: number): string {
        return [worldFilepath, "GENERATED", "chunks", `${q}x${r}.json`].join("/");
    }

    public createBiomeMap(perlinGrid: Grid<number>): { biomeMap: Grid<BiomeBalance>, biomeMapImage: Grid<number[]>, subBiomeMapImage: Grid<number[]> } {
        let perlinCopy = perlinGrid.copy();
        let biomeMap = new Grid<BiomeBalance>(perlinGrid.width, perlinGrid.height, []);
        this.biomeMapImage = new Grid<number[]>(perlinGrid.width, perlinGrid.height, []);
        this.subBiomeMapImage = new Grid<number[]>(perlinGrid.width, perlinGrid.height, []);

        for (let x = 0; x < perlinGrid.width; x++) {
            for (let y = 0; y < perlinGrid.height; y++) {
                let height1 = this.biomeSuperMap.valueAt(x, y);
                let height2 = perlinCopy.valueAt(x, y);
                let biomeBalance = this.determineBiomeByHeight(height1, height2);
                biomeMap.setValueAt(x, y, biomeBalance);
                let biome = biomeBalance[0].biome;
                this.biomeMapImage.setValueAt(x, y, biome.parentColour)
                this.subBiomeMapImage.setValueAt(x, y, biome.colour)
            }
        }

        return { biomeMap: biomeMap, biomeMapImage: this.biomeMapImage, subBiomeMapImage: this.subBiomeMapImage };

    }

    public exportSaveFile(): void {
        let saveFileObject = this.createSaveObject();
        let filepath = Chunk.getFilepath(this.parentWorld.filepath, this.q, this.r);
        fs.writeFileSync(filepath, JSON.stringify(saveFileObject));
    }

    private createSaveObject(): ChunkSaveObject {
        let saveFileObject: ChunkSaveObject = { q: this.q, r: this.r, tileMap: [] };
        for (let x = 0; x < this.widthInTiles; x++) {
            let row: TileSaveObject[] = [];
            for (let y = 0; y < this.heightInTiles; y++) {
                row.push(this.createTileSaveObject(x, y));
            }
            saveFileObject.tileMap.push(row);
        }
        return saveFileObject;
    }

    private createTileSaveObject(x: number, y: number): TileSaveObject {
        let altitude = this.groundMap.valueAt(x, y);
        let groundTileName = this.surfaceMap.valueAt(x, y);
        let areaObjectName = this.areaMap.valueAt(x, y);
        return [
            this.getBiomeAt(x, y).toString(),
            altitude,
            groundTileName,
            areaObjectName
        ];
    }

    public getBiomeAt(x: number, y: number): SubBiome {
        return this.biomeMap.valueAt(x, y)[0].biome as SubBiome;
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

    public abcGen(seed: number): void {
        let prng = mkAlea(seed.toString());
        this.AAA = randint(1111111111, 9999999999, prng);
        this.BBB = randint(1111111111, 9999999999, prng);
        this.CCC = randint(1111111111, 9999999999, prng);
    }

    public interpolate(a0: number, a1: number, w: number): number {
        // if (0.0 > w) return a0
        // if (1.0 < w) return a1

        // default
        // return (a1 - a0) * w + a0

        // smoothstep
        return (a1 - a0) * (3.0 - w * 2.0) * w * w + a0;
    }

    public determineSurface(height: number, biome: SubBiome): string {
        // sea level is at altitude 0
        if (height <= 0) return "water";
        else return biome.altitudeSurfaces.selectValue(height);
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
        let heightMap = new Grid<number>(this.widthInTiles, this.heightInTiles, 0);

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
                    let originalValue = heightMap.valueAt(x, y);
                    let v = octave.valueAt(x, y) * amplitude * noiseScaleInverse;
                    heightMap.setValueAt(x, y, originalValue + v);
                }
            }
        }

        return heightMap;

    }

    public limit(v: number, minimum: number, maximum: number): number {
        if (v < minimum) return minimum;
        else if (v > maximum) return maximum;
        else return v;
    }

    public getMapImage(imageName: MapImageName): Grid<number[]> {

        switch (imageName) {
            case "surfaceMapImage":
                return this.surfaceMapImage;
            case "biomeMapImage":
                return this.biomeMapImage;
            case "subBiomeMapImage":
                return this.subBiomeMapImage;
            case "perlinImage":
                return this.perlinImage;
            default:
                return this.perlinImage;
        }

    }

}

export default Chunk;
