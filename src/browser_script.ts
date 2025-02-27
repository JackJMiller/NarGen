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

function loadJSON(filepath: string): any {
    // TODO
    // @ts-ignore
    return {};
}

let fs = new VirtualFileSystem();
