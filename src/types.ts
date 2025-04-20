import SubBiome from "./SubBiome.js";

export type BiomeBlend = { biome: SubBiome, influence: number }[];
export type Colour = [number, number, number];
export type Config = WorldConfig | BiomeConfig;
export type TileSaveObject = [string, number, string, string];
export type GridImageName = "surfaceGridImage" | "biomeGridImage" | "subBiomeGridImage" | "perlinImage";

export interface PRNG {
    random: () => number
}

export interface ChunkSaveObject {
    q: number,
    r: number,
    tileGrid: TileSaveObject[][] 
}

export interface OrnamentDefinition {
    name: string,
    minZ: number,
    maxZ: number,
    frequency: number
}

export interface OrnamentsDefinition {
    OCCURRENCE: number,
    candidates: OrnamentDefinition[]
}

export interface BiomeConfig {
    colour: Colour,
    ranges: [number, string][],
    [biomeNames: string]: unknown
}

export interface SubBiomeConfig {
    colour: Colour,
    altitudeSurfaces: [number, string][],
    ornaments: OrnamentsDefinition,
    amplitudes: number[],
    persistence: number,
    heightMultiplier: number
    heightDisplacement: number,
    lowerHeightMultiplier: number,
    upperHeightMultiplier: number
}

export interface WarningRecord {
    maxHeight: string[],
    matchingBiomeColours: string[]
}

export interface WorldConfig {
    seed: number,
    maxHeight: number,
    width: number,
    height: number,
    q: number,
    r: number,
    biomeSize: number,
    biomes: [number, string][]
}

export interface WorldInfo {
    seed: string,
    width: number,
    height: number,
    q: number,
    r: number,
    maxHeight: number,
    totalHeight: number
}

export interface Vector2 {
    x: number,
    y: number
}
