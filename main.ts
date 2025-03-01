import path from "path";
import { RENDERER } from "./src/constants.js";
import { loadJSON } from "./src/system_script.js";
import World from "./src/World.js";
import { WorldInfo } from "./src/types.js";

const ARGS = process.argv.slice(1);

if (ARGS[1] == "generate") {

    // locate world configuration
    let filepath = ARGS[2];
    let worldName = path.parse(filepath).name;

    // generate terrain world according to configuration
    let world = new World(worldName, filepath);

    world.summarise();

}
if (ARGS[1] == "render") {

    // locate world configuration
    let filepath = ARGS[2];
    let worldName = path.parse(filepath).name;

    // generate terrain world according to configuration
    RENDERER.renderChunks(worldName, filepath);

    let worldInfoFilePath = [filepath, "GENERATED", "WORLD_INFO.json"].join("/");
    let worldInfo = loadJSON<WorldInfo>(worldInfoFilePath);

    RENDERER.renderWorld(filepath, worldInfo);

}
