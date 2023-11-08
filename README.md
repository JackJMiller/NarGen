<img src="https://jackjmiller.ams3.digitaloceanspaces.com/nargen/game.png"/>

## About

NarGen is a procedural terrain generator that produces terrain for use in a computer game. It is in its early days, though a demo/tutorial can be found [here](https://jackjmiller.net/articles/generating-terrain-with-nargen.html).

## Installation

After you have cloned this repository, add it to $PATH. Move inside the project directory and run the following.

```
nargen install
```

## Usage

To generate a terrain world, you must first create the config files that configure the generation process. A selection of example config files in `res/sample_worlds/` can be listed with the following command.

```
nargen list-sample-worlds
```

Once you have decided which configuration you will use, you can create a world using that same configuration. The following command configures a new world named `Mundo` using the sample configuration `Rainworld`.

```
nargen new-world Mundo Rainworld
```

A world named `Mundo` has now been configured and the config files for this world can be found in `configs/Mundo/`. We may freely change the contents of these files to configure the generation process to produce the world that we want. Once configured, we can generate our terrain world with the following command.

```
nargen generate Mundo
```

We now have a terrain world stored in `worlds/Mundo/`. A top-down image of the world can now be created.

```
nargen render-game Mundo
```

The image will be opened once created and you can view your world.

For more help on running the program, view the help page with the `--help` flag.
