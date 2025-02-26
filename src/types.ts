type Colour = [number, number, number];
type TileSaveObject = [string, number, string, string];
type MapImageName = "surfaceMapImage" | "biomeMapImage" | "subBiomeMapImage" | "perlinImage";
type OrnamentDefinition = [string, number, number, number];

interface PRNG {
    random: () => number
}

interface ChunkSaveObject {
    q: number,
    r: number,
    tileMap: TileSaveObject[][] 
}

interface BiomeConfig {
    "colour": Colour,
    "ranges": [number, string][],
    [biomeNames: string]: unknown
}

interface SubBiomeConfig {
    "colour": Colour,
    "altitudeSurfaces": [number, string][],
    "ornaments": OrnamentDefinition[],
    "amplitudes": number[],
    "persistence": number,
    "heightMultiplier": number
    "heightDisplacement": number,
    "lowerHeightMultiplier": number,
    "upperHeightMultiplier": number
}

interface WarningRecord {
    "maxHeight": string[],
    "matchingBiomeColours": string[]
}

interface WorldConfig {
    "seed": number,
    "maxHeight": number,
    "width": number,
    "height": number,
    "biomeSize": number,
    "biomes": [number, string][]
}

interface WorldInfo {
    "seed": number,
    "width": number,
    "height": number,
    "maxHeight": number,
    "totalHeight": number
}

interface Vector2 {
    x: number,
    y: number
}
