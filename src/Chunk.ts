import path from "path";
import Grid from "./Grid";
import Perlin from "./Perlin";
import Rangerray from "./Rangerray";
import SubBiome from "./SubBiome";
import World from "./World";
import { CHUNK_SIZE, OCTAVE_COUNT, SAVE_IMAGE_BIOME_MAP, SAVE_IMAGE_OCTAVE, SAVE_IMAGE_OVERLAYED, SAVE_IMAGE_SURFACE_MAP, SURFACES, ORNAMENTATION_ROOT_BLOCKS } from "./constants";
import { clamp, get_brightness_at_height, point_at_portion_between, portion_at_point_between, raise_warning, randint, random, random_element, save_json } from "./functions";
import { mkAlea } from "./lib/alea";

type BiomeBalance = { biome: SubBiome, influence: number }[];

class Chunk {

    public parent_world: World;
    public config: WorldConfig;
    public seed: number;
    public q: number;
    public r: number;
    public biomes_rangerray: Rangerray<Rangerray<SubBiome>>;
    public corner_x: number;
    public corner_y: number;
    public lacunarity: number;
    public MIN_WORLD_HEIGHT: number;
    public MAX_WORLD_HEIGHT: number;
    public TOTAL_WORLD_HEIGHT: number;
    public octave_count: number;
    public width_in_tiles: number;
    public height_in_tiles: number;
    public surface_map_image: Grid<number[]>;
    public biome_map_image: Grid<number[]>;
    public sub_biome_map_image: Grid<number[]>;
    public perlin_image: Grid<number[]>;
    public AAA: number = 0;
    public BBB: number = 0;
    public CCC: number = 0;
    public biome_map: Grid<BiomeBalance>;
    public ground_map: Grid<number>;
    public surface_map: Grid<string>;
    public area_map: Grid<string>;
    public overlayed: Grid<number>;
    public biome_super_map: Grid<number>;

    constructor(parent_world: World, q: number, r: number) {

        this.parent_world = parent_world
        this.config = this.parent_world.config
        this.seed = parent_world.seed
        this.q = q
        this.r = r
        this.biomes_rangerray = this.parent_world.biomes_rangerray
        this.corner_x = this.q * CHUNK_SIZE
        this.corner_y = this.r * CHUNK_SIZE
        this.lacunarity = 0.5
        this.MIN_WORLD_HEIGHT = -100
        this.MAX_WORLD_HEIGHT = 200
        this.TOTAL_WORLD_HEIGHT = this.MAX_WORLD_HEIGHT - this.MIN_WORLD_HEIGHT

        this.abc_gen(this.seed)

        let initial_noise_tile_size = 10 * CHUNK_SIZE
        this.octave_count = OCTAVE_COUNT

        this.width_in_tiles = CHUNK_SIZE
        this.height_in_tiles = CHUNK_SIZE

        this.abc_gen(this.seed)

        let { octaves, overlayed } = this.produce_octaves(this.octave_count, initial_noise_tile_size, 0.5, "biome_map", [], 0.5);

        this.overlayed = overlayed;

        let result = this.produce_octaves(3, this.parent_world.biome_super_map_tile_size, 0.1, "biome_super_map", [this.parent_world.biome_super_map_tile_size, 50, 20]);
        this.biome_super_map = result.overlayed;

        this.parent_world.temp_acc += this.biome_super_map.calculate_average()
        this.parent_world.temp_count += 1

        // create the biome map
        let biome = this.create_biome_map(this.overlayed);
        this.biome_map = biome.biome_map;
        this.biome_map_image = biome.biome_map_image;
        this.sub_biome_map_image = biome.sub_biome_map_image;

        this.perlin_image = Perlin.create_grid_image(this.biome_super_map)

        // create the ground map
        this.abc_gen(this.seed)
        this.ground_map = this.create_ground_map(octaves);

        // create the surface map
        this.abc_gen(randint(1, 100))
        let surface = this.create_surface_map();
        this.surface_map = surface.surface_map;
        this.surface_map_image = surface.surface_map_image;

        // create the area map to include ornamentation
        this.area_map = this.create_area_map();

        this.export_save_file()

    }

    public produce_octaves(octave_count: number, noise_tile_size: number, persistence: number, octave_identifier: string, tile_sizes: number[] = [], lacunarity: number | null = null): { octaves: Grid<number>[], overlayed: Grid<number> } {

        // configure the noise tile sizes
        if (tile_sizes.length === 0) {
            let tile_size = noise_tile_size
            for (let i = 0; i < octave_count; i++) {
                tile_sizes.push(tile_size);
                tile_size = Math.ceil(tile_size * lacunarity!);
            }
        }

        // create the octaves
        let octaves = [];
        for (let octave_no = 0; octave_no < tile_sizes.length; octave_no++) {
            let noise_tile_size = tile_sizes[octave_no];
            this.abc_gen(this.AAA);
            let perlin = new Perlin(
                this.corner_x,
                this.corner_y,
                this.width_in_tiles,
                this.height_in_tiles,
                noise_tile_size,
                this.AAA, this.BBB, this.CCC
            );
            let octave = perlin.get_grid();
            octaves.push(octave);
        }

        let overlayed = this.overlay_octaves(octaves, persistence);

        return { octaves, overlayed };

    }

    public create_area_map(): Grid<string> {
        this.area_map = new Grid<string>(this.width_in_tiles, this.height_in_tiles, "")
        for (let x = 0; x < this.width_in_tiles; x++) {
            for (let y = 0; y < this.height_in_tiles; y++) {
                let area_object_name = this.decide_ornamentation_at(x, y)
                if (area_object_name !== "") {
                    this.area_map.set_value_at(x, y, area_object_name)
                }
            }
        }
        return this.area_map;
    }

    public decide_ornamentation_at(x: number, y: number): string {
        // TEMP
        // return ""
        let altitude = this.ground_map.value_at(x, y)
        if (altitude <= 0) return "";

        let biome = this.get_biome_at(x, y)
        if (random() > biome.ornament_occurrence_rate) return "";
        let ground_tile_name = this.surface_map.value_at(x, y)
        let acc = 0;
        let candidates = new Rangerray<string>();
        for (let veg of biome.ornaments) {
            let veg_name = veg[0];
            let min_altitude = veg[1];
            let max_altitude = veg[2];
            let veg_occurrence_chance = veg[3];
            if (min_altitude <= altitude && altitude <= max_altitude && ORNAMENTATION_ROOT_BLOCKS[veg_name as string].includes(ground_tile_name)) {
                acc += veg_occurrence_chance;
                candidates.insert(acc, veg_name);
            }
        }
        if (candidates.length() > 0) {
            let random_number = Math.round(random() * acc);
            return candidates.select_value(random_number);
        }
        else {
            return "";
        }
    }

    public create_ground_map(octaves: Grid<number>[]): Grid<number> {

        this.ground_map = new Grid<number>(this.width_in_tiles, this.height_in_tiles, 0);

        for (let octave_no = 0; octave_no < octaves.length; octave_no++) {
            let octave = octaves[octave_no];
            for (let x = 0; x < this.width_in_tiles; x++) {
                for (let y = 0; y < this.height_in_tiles; y++) {
                    let original = this.ground_map.value_at(x, y)
                    let v = this.get_ground_octave_value(x, y, octave, octave_no);
                    this.ground_map.set_value_at(x, y, original + v);
                }
            }
        }

        for (let x = 0; x < this.width_in_tiles; x++) {
            for (let y = 0; y < this.height_in_tiles; y++) {
                let displacement = 0;
                let biome: SubBiome = this.biome_map.value_at(x, y)[0].biome; // ADDED
                for (let balance of this.biome_map.value_at(x, y)) {
                    biome = balance.biome;
                    let biome_influence = balance.influence;
                    displacement += biome.height_displacement * biome_influence;
                }
                let original = this.ground_map.value_at(x, y)
                let new_value = Math.floor(original + displacement)
                if (new_value > this.parent_world.max_height && !this.parent_world.warningRecord["max_height"].includes(biome.full_name)) {
                    new_value = clamp(new_value, this.parent_world.max_height);
                    raise_warning("Extreme terrain", "Ground map value inside " + biome.full_name + " has exceeded the maximum world height. Value has been capped at " + this.parent_world.max_height.toString() + ".");
                    this.parent_world.warningRecord["max_height"].push(biome.full_name);
                }
                this.ground_map.set_value_at(x, y, new_value);
            }
        }

        return this.ground_map;

    }

    public get_ground_octave_value(x: number, y: number, octave: Grid<number>, octave_no: number): number {
        let biome_balance = this.biome_map.value_at(x, y);
        let V = 0;
        let biome_influence_sum = 0;
        for (let balance of biome_balance) {
            biome_influence_sum += balance.influence;
        }
        for (let balance of biome_balance) {
            let underlying_noise = this.overlayed.value_at(x, y);
            let biome = balance.biome;
            let biome_influence = balance.influence;
            let amplitude = biome.get_amplitude(octave_no);
            let v = octave.value_at(x, y);
            v *= amplitude * biome.get_height_multiplier(underlying_noise) * biome_influence;
            v /= biome.noise_scale;
            V += v;
        }
        return V;
    }

    public create_surface_map(): { surface_map: Grid<string>, surface_map_image: Grid<number[]> } {
        this.surface_map = new Grid<string>(this.width_in_tiles, this.height_in_tiles, "");
        this.surface_map_image = new Grid<number[]>(this.width_in_tiles, this.height_in_tiles, []);
        for (let x = 0; x < this.width_in_tiles; x++) {
            for (let y = 0; y < this.height_in_tiles; y++) {
                let height = this.ground_map.value_at(x, y);
                let biome = this.get_biome_at(x, y);
                let v = this.determine_surface(height, biome);
                this.surface_map.set_value_at(x, y, v)
                let colour = this.get_surface_colour(v, height, biome.height_displacement);
                this.surface_map_image.set_value_at(x, y, colour)
            }
        }

        if (SAVE_IMAGE_SURFACE_MAP) {
            let filepath = Chunk.get_filepath(this.parent_world.name, this.q, this.r);
            this.surface_map_image.save_RGBs(filepath, this.parent_world.name)
        }

        return { surface_map: this.surface_map, surface_map_image: this.surface_map_image };
    }

    public static get_filepath(world_name: string, q: number, r: number): string {
        return path.join("worlds", world_name, "chunks", `${q}x${r}.json`);
    }

    public create_biome_map(perlin_grid: Grid<number>): { biome_map: Grid<BiomeBalance>, biome_map_image: Grid<number[]>, sub_biome_map_image: Grid<number[]> } {
        let perlin_copy = perlin_grid.copy();
        let biome_map = new Grid<BiomeBalance>(perlin_grid.width, perlin_grid.height, []);
        this.biome_map_image = new Grid<number[]>(perlin_grid.width, perlin_grid.height, []);
        this.sub_biome_map_image = new Grid<number[]>(perlin_grid.width, perlin_grid.height, []);
        let min_noise = 1;
        let max_noise = 0;

        for (let x = 0; x < perlin_grid.width; x++) {
            for (let y = 0; y < perlin_grid.height; y++) {
                let height_1 = this.biome_super_map.value_at(x, y);
                let height_2 = perlin_copy.value_at(x, y);
                let biome_balance = this.determine_biome_by_height(height_1, height_2);
                biome_map.set_value_at(x, y, biome_balance);
                let biome = biome_balance[0].biome;
                this.biome_map_image.set_value_at(x, y, biome.parent_colour)
                this.sub_biome_map_image.set_value_at(x, y, biome.colour)
            }
        }

        if (SAVE_IMAGE_BIOME_MAP) {
            this.biome_map_image.save_RGBs(this.parent_world.name + "_biome_map", this.parent_world.name)
        }

        return { biome_map: biome_map, biome_map_image: this.biome_map_image, sub_biome_map_image: this.sub_biome_map_image };

    }

    public export_save_file(): void {
        let save_file_object = this.createSaveObject();
        let filepath = Chunk.get_filepath(this.parent_world.name, this.q, this.r);
        save_json(save_file_object, filepath);
    }

    private createSaveObject(): ChunkSaveObject {
        let saveFileObject: ChunkSaveObject = { q: this.q, r: this.r, tileMap: [] };
        for (let x = 0; x < this.width_in_tiles; x++) {
            let row: TileSaveObject[] = [];
            for (let y = 0; y < this.height_in_tiles; y++) {
                row.push(this.createTileSaveObject(x, y));
            }
            saveFileObject.tileMap.push(row);
        }
        return saveFileObject;
    }

    private createTileSaveObject(x: number, y: number): TileSaveObject {
        let altitude = this.ground_map.value_at(x, y);
        let ground_tile_name = this.surface_map.value_at(x, y);
        let area_object_name = this.area_map.value_at(x, y);
        return [
            this.get_biome_at(x, y).toString(),
            altitude,
            ground_tile_name,
            area_object_name
        ];
    }

    public get_biome_at(x: number, y: number): SubBiome {
        return this.biome_map.value_at(x, y)[0].biome as SubBiome;
    }

    public determine_biome_by_height(height_1: number, height_2: number): BiomeBalance {
        // get main biome
        let main_biome = this.biomes_rangerray.select(height_1);
        let biome_obj = main_biome["value"];
        this.parent_world.biome_sizes[biome_obj.name] += 1;
        let sub_biome = biome_obj.select_value(height_2);

        let portion_point = portion_at_point_between(main_biome["lower_point"], main_biome["upper_point"], height_1);
        let blend_region = 0.05;
        let blended_biome_index = -1;
        let influence = 0;
        if (portion_point <= blend_region) {
            blended_biome_index = main_biome["index"] - 1
            influence = 1 - portion_at_point_between(0, blend_region, portion_point)
            influence /= 2
        }
        else if (portion_point >= 1 - blend_region) {
            blended_biome_index = main_biome["index"] + 1
            influence = portion_at_point_between(1 - blend_region, 1, portion_point)
            influence /= 2
        }
        else {
            blended_biome_index = -1
        }

        if (0 <= blended_biome_index && blended_biome_index < this.biomes_rangerray.length()) {
            let balance = [{ biome: sub_biome, influence: 1 - influence }];
            let blended_biome = this.biomes_rangerray.select_by_index(blended_biome_index);
            let blended_biome_obj = blended_biome["value"];
            sub_biome = blended_biome_obj.select_value(height_2);
            balance.push({ biome: sub_biome, influence: influence });
            return balance;
        }
        else {
            let balance = [{ biome: sub_biome, influence: 1 }];
            return balance;
        }
    }

    public abc_gen(seed: number): void {
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

    public determine_surface(height: number, biome: SubBiome): string {
        // sea level is at altitude 0
        if (height <= 0) return "water";
        else return biome.altitude_surfaces.select_value(height);
    }

    public get_surface_colour(surface_name: string, height: number, height_displacement: number): number[] {
        if (height < 0) height *= -1;

        let brightness = get_brightness_at_height(height, this.parent_world.max_height);

        let colour = (SURFACES[surface_name])["colour"];

        colour = [
            Math.floor(brightness * colour[0]),
            Math.floor(brightness * colour[1]),
            Math.floor(brightness * colour[2])
        ];

        return colour;
    }

    public overlay_octaves(octaves: Grid<number>[], persistence: number): Grid<number> {
        let height_map = new Grid<number>(this.width_in_tiles, this.height_in_tiles, 0);

        // if i were smart i would turn this into an equation
        // sadly i am not
        let persistence_sum = 0
        for (let index = 0; index < octaves.length; index++) {
            persistence_sum += Math.pow(persistence, index);
        }

        let noise_scale_inverse = 1 / persistence_sum;

        for (let octave_no = 0; octave_no < octaves.length; octave_no++) {
            let octave = octaves[octave_no];
            let amplitude = persistence ** octave_no;
            for (let x = 0; x < this.width_in_tiles; x++) {
                for (let y = 0; y < this.height_in_tiles; y++) {
                    let original_value = height_map.value_at(x, y);
                    let v = octave.value_at(x, y) * amplitude * noise_scale_inverse;
                    height_map.set_value_at(x, y, original_value + v);
                }
            }
        }

        return height_map;

    }

    public limit(v: number, minimum: number, maximum: number): number {
        if (v < minimum) return minimum;
        else if (v > maximum) return maximum;
        else return v;
    }

    public getMapImage(imageName: MapImageName): Grid<number[]> {

        switch (imageName) {
            case "surface_map_image":
                return this.surface_map_image;
            case "biome_map_image":
                return this.biome_map_image;
            case "sub_biome_map_image":
                return this.sub_biome_map_image;
            case "perlin_image":
                return this.perlin_image;
        }

    }

}

export = Chunk;
