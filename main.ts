import path from "path";
import World from "./src/World";

const ARGS = process.argv.slice(1);

if (ARGS[1] == "generate") {

    // locate world configuration
    let filepath = ARGS[2];
    let worldName = path.parse(filepath).name;
    let mustRenderWorld = (ARGS[3] === "1");

    // generate terrain world according to configuration
    let world = new World(worldName, filepath, mustRenderWorld);

    world.summarise();

}
