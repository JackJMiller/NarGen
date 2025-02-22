class World {

    private worldName: string;
    private config: string;
    private mustRenderWorld: boolean;

    constructor(worldName: string, config: any, mustRenderWorld: boolean) {

        this.worldName = worldName;
        this.config = config;
        this.mustRenderWorld = mustRenderWorld;

    }

}

export = World;
