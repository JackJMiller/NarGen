export type Colour = [number, number, number];
export type Config = WorldConfig | BiomeConfig;
export type TileSaveObject = [string, number, string, string];
export type MapImageName = "surfaceMapImage" | "biomeMapImage" | "subBiomeMapImage" | "perlinImage";
export type OrnamentDefinition = [string, number, number, number];

export interface PRNG {
    random: () => number
}

export interface ChunkSaveObject {
    q: number,
    r: number,
    tileMap: TileSaveObject[][] 
}

export interface BiomeConfig {
    colour: Colour,
    ranges: [number, string][],
    [biomeNames: string]: unknown
}

export interface SubBiomeConfig {
    colour: Colour,
    altitudeSurfaces: [number, string][],
    ornaments: OrnamentDefinition[],
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
    biomeSize: number,
    biomes: [number, string][]
}

export interface WorldInfo {
    seed: number,
    width: number,
    height: number,
    maxHeight: number,
    totalHeight: number
}

export interface Vector2 {
    x: number,
    y: number
}
