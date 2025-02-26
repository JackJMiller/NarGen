class VirtualFileSystem {

    constructor() {
        // TODO
    }
    
    public writeFileSync(filepath: string, data: string): void {
        // TODO
    }

    public existsSync(filepath: string): boolean {
        // TODO
        return true;
    }

    public mkdirSync(filepath: string): void {
        // TODO
    }

}

function loadConfig(filepath: string): Config {
    // TODO
    // @ts-ignore
    return {};
}

let fs = new VirtualFileSystem();
