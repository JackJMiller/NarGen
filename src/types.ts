type MapImageName = "surface_map_image" | "biome_map_image" | "sub_biome_map_image" | "perlin_image";

interface PRNG {
    random: () => number
}

interface Vector2 {
    x: number,
    y: number
}
