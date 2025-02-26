type Colour = [number, number, number];
type TileSaveObject = [string, number, string, string];
type MapImageName = "surface_map_image" | "biome_map_image" | "sub_biome_map_image" | "perlin_image";
type OrnamentDefinition = [string, number, number, number];

interface PRNG {
    random: () => number
}

interface ChunkSaveObject {
    q: number,
    r: number,
    tileMap: TileSaveObject[][] 
}

interface SubBiomeConfig {
    "colour": [number, number, number],
    "altitude_surfaces": [number, string][],
    "ornaments": OrnamentDefinition[],
    "amplitudes": number[],
    "persistence": number,
    "height_multiplier": number
    "height_displacement": number,
    "lower_height_multiplier": number,
    "upper_height_multiplier": number
}

interface WarningRecord {
    "max_height": string[],
    "matching_biome_colours": string[]
}

interface WorldConfig {
    "seed": number,
    "max_height": number,
    "width": number,
    "height": number,
    "biome_size": number,
    "biomes": [number, string][]
}

interface WorldInfo {
    "seed": number,
    "width": number,
    "height": number,
    "max_height": number,
    "total_height": number
}

interface Vector2 {
    x: number,
    y: number
}
