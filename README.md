# NarGen

Terrain generation for Nargon. Created by Jack Miller.

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

We now have a terrain world stored in `worlds/Mundo/`. The world can finally be rendered with the `render` command.

```
nargen render Mundo
```

For more help on running the program, view the help page with `nargen --help`.

