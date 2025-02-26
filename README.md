<img src="https://jackjmiller.ams3.digitaloceanspaces.com/nargen/game.png"/>

## About

NarGen is a procedural terrain generator that produces terrain for use in a computer game. Unique biomes can be generated and blended together. A demo/tutorial can be found [here](https://jackjmiller.net/articles/generating-terrain-with-nargen.html).

## Installation

After cloning this repository, set a global shell variable `$NARGEN_PATH` to the repository's location on your system. Append that value to your shell's global `$PATH` variable.

## Usage

To generate a terrain world, you must first create the configuration files that guide the generation process. A selection of example configuration files in `res/sample_worlds/` can be listed with the following command.

```
nargen list-sample-worlds
```

Once you have decided which configuration you will use, you can create a world using that same configuration. The following command uses the sample world `Rainvalley` to create a new world named `Mundo` stored in our home directory.

```
nargen new-world ~/Mundo/ Rainworld
```

A world named `Mundo` has now been configured and the configuration files for this world can be found in the `~/Mundo/` directory created. We may freely change the contents of these files to generate the terrain we want for our world. To generate terrain according to our configuration, we run the command below.

```
nargen generate ~/Mundo/
```

If there are no errors in our configuration files, we should now have a terrain world stored in `~/Mundo/GENERATED/`. An image of the world can now be rendered.

```
nargen render ~/Mundo/
```

The images will be opened once created so that you can view your world. You can view these images again with `nargen view ~/Mundo/`.

For more help on running the program, view the help page with the `--help` flag.

<img src="https://jackjmiller.ams3.digitaloceanspaces.com/nargen/readme_island.png"/>
