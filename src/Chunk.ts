import Biome from "./Biome.js";
import Grid from "./Grid.js";
import Pattern from "./Pattern.js";
import Perlin from "./Perlin.js";
import Rangerray from "./Rangerray.js";
import SubBiome from "./SubBiome.js";
import World from "./World.js";
import { BIOME_BLENDER, CHUNK_SIZE, OCTAVE_COUNT, ORNAMENTER, SURFACES } from "./constants.js";
import { RENDERER, writeFileSync } from "./env_script.js";
import { getBrightnessAtHeight, randint } from "./functions.js";
import { AleaPRNG, mkAlea } from "./lib/alea.js";
import { BiomeBlend, ChunkSaveObject, Colour, TileSaveObject, WorldConfig } from "./types.js";

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
    public surfaceGridImage: Grid<Colour>;
    public biomeGridImage: Grid<Colour>;
    public subBiomeGridImage: Grid<Colour>;
    public perlinImage: Grid<Colour>;
    public biomeGrid: Grid<BiomeBlend>;
    public heightGrid: Grid<number>;
    public surfaceGrid: Grid<string>;
    public areaGrid: Grid<string>;
    public perlinOverlayed: Grid<number>;
    public biomeSuperGrid: Grid<number>;

    constructor(parentWorld: World, q: number, r: number) {

        this.parentWorld = parentWorld;
        this.config = this.parentWorld.config;
        this.q = q;
        this.r = r;
        let indexString = `${this.q}_${this.r}`;
        this.prng = mkAlea(indexString);
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
        this.perlinOverlayed = this.overlayOctaves(octaves, 0.5);

        let biomeSuperGridOctaves = this.produceOctaves(1, this.parentWorld.biomeSuperGridTileSize, "biomeSuperGrid", [this.parentWorld.biomeSuperGridTileSize]);
        this.biomeSuperGrid = this.overlayOctaves(biomeSuperGridOctaves, 0.1);

        this.parentWorld.tempAcc += Grid.calculateAverage(this.biomeSuperGrid);
        this.parentWorld.tempCount += 1;

        // create the biome map
        this.biomeGrid = Grid.createGrid<BiomeBlend>(this.widthInTiles, this.heightInTiles, (x: number, y: number) => BIOME_BLENDER.determineBiomeBlend(x, y, this), []);
        this.biomeGridImage = Grid.createGrid<Colour>(this.widthInTiles, this.heightInTiles, (x: number, y: number) => BIOME_BLENDER.determineBiomeColour(x, y, this), [0, 0, 0]);
        RENDERER.renderColourGrid(this.biomeGridImage, [this.parentWorld.filepath, "GENERATED", "images", "biome", `biome_${indexString}.png`].join("/"));

        // create the sub-biome map
        this.subBiomeGridImage = Grid.createGrid<Colour>(this.widthInTiles, this.heightInTiles, (x: number, y: number) => BIOME_BLENDER.determineSubBiomeColour(x, y, this), [0, 0, 0]);
        RENDERER.renderColourGrid(this.subBiomeGridImage, [this.parentWorld.filepath, "GENERATED", "images", "sub_biome", `sub_biome_${indexString}.png`].join("/"));

        // create the perlin image
        this.perlinImage = Pattern.createGridImage(this.biomeSuperGrid);
        RENDERER.renderColourGrid(this.perlinImage, [this.parentWorld.filepath, "GENERATED", "images", "perlin", `perlin_${indexString}.png`].join("/"));

        // create the ground map
        this.seedGen(this.parentWorld.seed);
        this.heightGrid = this.createHeightGrid(octaves);

        // create the surface map
        this.seedGen(this.parentWorld.seed);
        this.surfaceGrid = Grid.createGrid<string>(this.widthInTiles, this.heightInTiles, this.determineSurface.bind(this), "");
        this.surfaceGridImage = Grid.createGrid<Colour>(this.widthInTiles, this.heightInTiles, this.determineSurfaceColour.bind(this), [0, 0, 0]);
        RENDERER.renderColourGrid(this.surfaceGridImage, [this.parentWorld.filepath, "GENERATED", "images", "surface", `surface_${indexString}.png`].join("/"));

        // create the area map to include ornamentation
        // TODO: create ornamenter for each sub-biome
        this.areaGrid = Grid.createGrid<string>(this.widthInTiles, this.heightInTiles, this.determineArea.bind(this), "");

        this.exportSaveFile();

    }

    public determineSurface(x: number, y: number): string {
        let height = this.heightGrid.valueAt(x, y);
        let biome = this.getBiomeAt(x, y);
        if (height <= 0) return "water";
        else return biome.altitudeSurfaces.selectValue(height);
    }

    public determineSurfaceColour(x: number, y: number): Colour {
        let height = this.heightGrid.valueAt(x, y);
        let biome = this.getBiomeAt(x, y);
        let v = this.surfaceGrid.valueAt(x, y);
        let colour = this.getSurfaceColour(v, height, biome.heightDisplacement);
        return colour;
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

    public createHeightGrid(octaves: Grid<number>[]): Grid<number> {

        this.heightGrid = new Grid<number>(this.widthInTiles, this.heightInTiles, 0);

        for (let x = 0; x < this.widthInTiles; x++) {
            for (let y = 0; y < this.heightInTiles; y++) {
                this.generateGroundAt(x, y, octaves);
            }
        }

        return this.heightGrid;

    }

    public generateGroundAt(x: number, y: number, octaves: Grid<number>[]): void {
        let height = 0;
        for (let balance of this.biomeGrid.valueAt(x, y)) {
            height += balance.biome.getHeightAt(x, y, octaves, this.perlinOverlayed) * balance.influence;
        }
        this.heightGrid.setValueAt(x, y, height);
    }

    public static getFilepath(worldFilepath: string, q: number, r: number): string {
        return [worldFilepath, "GENERATED", "chunks", `${q}x${r}.json`].join("/");
    }

    public exportSaveFile(): void {
        let saveFileObject = this.createSaveObject();
        let filepath = Chunk.getFilepath(this.parentWorld.filepath, this.q, this.r);
        writeFileSync(filepath, JSON.stringify(saveFileObject));
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
        let altitude = this.heightGrid.valueAt(x, y);
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

    public seedGen(seed: string): void {
        let prng = mkAlea(seed);
        this.seed = randint(1111111111, 9999999999, prng);
    }

    public getSurfaceColour(surfaceName: string, height: number, heightDisplacement: number): Colour {
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

}

export default Chunk;
