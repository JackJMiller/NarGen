import Rangerray from "./Rangerray.js";
import SubBiome from "./SubBiome.js";

class Biome {

    public name: string;
    public rangerray;

    constructor(name: string) {
        this.name = name;
        this.rangerray = new Rangerray<SubBiome>(this.name);
    }

    public insert(noiseUpper: number, subBiome: SubBiome) {
        this.rangerray.insert(noiseUpper, subBiome);
    }

    public selectValue(height: number): SubBiome {
        return this.rangerray.selectValue(height);
    }

}

export default Biome;
