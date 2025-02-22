import path from "path";

import GameRenderer from "./src/GameRenderer";
import World from "./src/World";

const ARGS = process.argv.slice(1);

if (ARGS[1] == "generate") {
    // locate world configuration
    let worldName = ARGS[2];
    let mustRenderWorld = (ARGS[3] === "1");
    let configFilePath = path.join(__dirname, "configs", worldName, "CONFIG.json");

    let config = require(configFilePath);

    console.log(config);

    // generate terrain world according to configuration
    let world = new World(worldName, config, mustRenderWorld);
}
else if (ARGS[1] == "render-game") {
    let worldName = ARGS[2];
    let renderer = new GameRenderer(worldName);
}
else {
    process.exit(1);
}
