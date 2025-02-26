import path from "path";
import World from "./src/World";
import { NARGEN_PATH } from "./src/constants";

const ARGS = process.argv.slice(1);

if (ARGS[1] == "generate") {
    // locate world configuration
    let filepath = ARGS[2];
    let mustRenderWorld = (ARGS[3] === "1");

    // generate terrain world according to configuration
    let world = new World(filepath, mustRenderWorld);
}
