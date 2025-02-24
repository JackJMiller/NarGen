import fs from "fs";
import path from "path";
import Chunk from "./Chunk";
import Grid from "./Grid";
import Rangerray from "./Rangerray";
import SubBiome from "./SubBiome";
import { BASE_BIOME_SIZE, CHUNK_SIZE } from "./constants";
import { exit_with_error, flatten_noise_distribution, leftJustify, objectFromEntries, point_at_portion_between, raise_warning, save_json } from "./functions";

class World {

    public name: string;
    public config: any;
    public render_world: boolean;
    public width_in_tiles: number;
    public height_in_tiles: number;
    public width_in_chunks: number;
    public height_in_chunks: number;
    public seed: number;
    public min_noise: number;
    public max_noise: number;
    public total_height: number;
    public max_height: number;
    public total_area_in_tiles: number;
    public temp_acc: number;
    public temp_count: number;
    public noise_acc: number;
    public noise_count: number;
    public warnings_raised: any;
    public biomes_rangerray: Rangerray<Rangerray<SubBiome>>;
    public biome_size: number = 1;
    public biome_super_map_tile_size: number = 1;
    public biome_sizes: any = {};
    public biome_names: string[] = [];
    public biome_colours: any;
    public world_info: any = {};

    public constructor(name: string, config: any, render_world: boolean) {

        this.name = name;
        this.config = config;
        this.render_world = render_world;
        this.seed = config["seed"];
        this.width_in_chunks = config["width"];
        this.height_in_chunks = config["height"];
        this.width_in_tiles = this.width_in_chunks * CHUNK_SIZE;
        this.height_in_tiles = this.height_in_chunks * CHUNK_SIZE;
        this.total_area_in_tiles = this.width_in_tiles * this.height_in_tiles;
        this.create_save_files();

        this.warnings_raised = {
            "max_height": [],
            "matching_biome_colours": []
        }
        this.biome_colours = {};

        this.max_height = Math.floor(this.config["max_height"])
        this.total_height = 2 * this.max_height
        this.temp_acc = 0;
        this.temp_count = 0;

        this.biomes_rangerray = new Rangerray("biomes_rangerray");

        this.configure_biomes()

        // stats
        this.min_noise = 1;
        this.max_noise = 0;
        this.noise_acc = 0;
        this.noise_count = 0;

        this.world_info = {
            "seed": this.seed,
            "width": this.width_in_chunks,
            "height": this.height_in_chunks,
            "max_height": this.max_height,
            "total_height": this.total_height
        };

        this.generate_chunks();

        save_json(this.world_info, path.join(__dirname, "worlds", this.name, "WORLD_INFO.json"));

        this.summarise()

    }


    public create_save_files() {
        let filepath = path.join(__dirname, "worlds", this.name);
        if (!fs.existsSync(filepath)) {
            fs.mkdirSync(filepath);
            fs.mkdirSync(path.join(filepath, "images"));
            fs.mkdirSync(path.join(filepath, "chunks"));
        }
    }

    public configure_biomes() {

        let lower_point = 0;
        this.biome_names = this.config["biomes"].map((biome: any) => biome[1]);
        this.biome_sizes = Object.fromEntries(this.biome_names.map((biomeName: any) => [biomeName as string, 0]));

        let keys = Object.keys(this.config);

        if (keys.includes("biome_size")) {
            this.biome_size = this.config["biome_size"];
        }
        else {
            this.biome_size = 1;
        }

        Rangerray.fracrray_to_rangerray(this.config["biomes"]);

        for (let biome of this.config["biomes"]) {
            let upper_point = biome[0];
            let biome_name = biome[1];
            upper_point = flatten_noise_distribution(upper_point);
            let rangerray = this.create_biome(biome_name, lower_point, upper_point);
            this.biomes_rangerray.insert(upper_point, rangerray);
            lower_point = upper_point;
        }

        this.biome_super_map_tile_size = this.config["biomes"].length * BASE_BIOME_SIZE * this.biome_size;

    }

    public create_biome(biome_name: string, biome_noise_lower: number, biome_noise_upper: number): Rangerray<SubBiome> {
        let rangerray = new Rangerray(biome_name);
        let biome_config_path = path.join(__dirname, "configs", this.name, "biomes", biome_name + ".json");
        let biome_config = require(biome_config_path);
        let noise_lower = 0;
        let noise_upper = 0;

        // TODO
        // if tuple(biome_config["colour"]) in this.biome_colours.values() {
        //     raise_warning("Matching biome colours", "The biome " + biome_name + " is using a colour already in use.")
        // }

        this.biome_colours[biome_name] = biome_config["colour"];

        Rangerray.fracrray_to_rangerray(biome_config["ranges"])

        for (let sub_biome of biome_config["ranges"]) {
            noise_upper = sub_biome[0];
            let sub_biome_name = sub_biome[1];
            if (!Object.keys(biome_config).includes(sub_biome_name)) {
                exit_with_error("Undefined sub-biome", `An undefined sub-biome named ${sub_biome_name} is referenced inside ranges attribute of biome ${biome_name}.`);
            }
            noise_upper = flatten_noise_distribution(noise_upper);
            let obj = new SubBiome(this, biome_name, sub_biome_name, biome_config, noise_lower, noise_upper);
            rangerray.insert(noise_upper, obj);
            noise_lower = noise_upper;
        }

        return rangerray;

    }


    public generate_chunks() {

        let map_image_names: MapImageName[] = (this.render_world) ? ["surface_map_image", "biome_map_image", "sub_biome_map_image", "perlin_image"] : [];

        let grids: Grid<number>[] = map_image_names.map((imageName: string) => new Grid<number>(this.width_in_tiles, this.height_in_tiles, 0));

        let map_images = objectFromEntries(map_image_names, grids);

        for (let q = 0; q < this.width_in_chunks; q++) {
            for (let r = 0; r < this.height_in_chunks; r++) {
                let chunk = new Chunk(this, q, r);
                let corner_x = q * CHUNK_SIZE;
                let corner_y = r * CHUNK_SIZE;
                for (let map_image_name of map_image_names) {
                    map_images[map_image_name].overlay(chunk.getMapImage(map_image_name), corner_x, corner_y);
                }
            }
        }

        for (let map_image_name of map_image_names) {
            map_images[map_image_name].save_RGBs(this.name + "_" + map_image_name, this.name);
        }

    }

    public summarise() {
        console.log(`Biome average = ${this.temp_acc / this.temp_count}`);
        for (let biome_name of Object.keys(this.biome_sizes)) {
            let biome_size = this.biome_sizes[biome_name];
            let percentage = 100 * biome_size / this.total_area_in_tiles;
            console.log(`${leftJustify(biome_name, 20)} ${leftJustify(biome_size.toString(), 10)} ${percentage}%`);
        }
    }

}

export = World;
