class Rangerray<T> {

    public name: string;
    public maxValue: number;
    public items: [number, T][];

    public constructor(name: string = "", items: [number, T][] = []) {
        this.name = name
        this.items = items;
        this.maxValue = (items.length === 0) ? 0 : items[items.length - 1][0];
    }

    public selectValue(v: number): T {
        let item = this.select(v)
        return item["value"];
    }

    public select(v: number): { value: T, lowerPoint: number, upperPoint: number, index: number } {

        let lowerPoint = 0;
        for (let index = 0; index < this.items.length; index++) {
            let item = this.items[index];
            let upperPoint = item[0];
            if (v < upperPoint) {
                return {
                    value: item[1],
                    lowerPoint: lowerPoint,
                    upperPoint: item[0],
                    index: index
                }
            }
            lowerPoint = upperPoint;
        }

        // when v exceeds maximum choice, return the last item
        let item = this.items[this.items.length - 1];
        lowerPoint = (this.items.length > 1) ? this.items[this.items.length - 2][0] : 0;

        return {
            value: item[1],
            lowerPoint: lowerPoint,
            upperPoint: item[0],
            index: this.items.length - 1
        }
    }

    public selectByIndex(index: number): { value: T, lowerPoint: number, upperPoint: number, index: number } {
        let lowerPoint = (index === 0) ? 0 : this.items[index - 1][0];
        let item = this.items[index];
        return {
            value: item[1],
            lowerPoint: lowerPoint,
            upperPoint: item[0],
            index: index
        };
    }

    public selectValueByIndex(index: number): T {
        return this.selectByIndex(index).value;
    }

    public length() {
        return this.items.length;
    }

    public insert(itemIndex: number, itemValue: T) {
        let index = -1
        for (let i = 0; i < this.items.length; i++) {
            if (itemIndex <= this.items[i][0]) {
                index = i;
                break;
            }
        }
        if (index === -1) {
            this.items.push([itemIndex, itemValue]);
        }
        else {
            this.items.splice(index, 0, [itemIndex, itemValue]);
        }
        if (itemIndex > this.maxValue) this.maxValue = itemIndex;
    }

    public print() {
        console.log("------ rangerray -------")
        console.log("name: " + this.name)
        console.log("items:")
        for (let item of this.items) {
            console.log(`${item[0]}\t${item[1]}`);
        }
        console.log("--- end of rangerray ---");
    }

    public values(): T[] {
        let values: T[] = [];
        this.items.forEach((item: [number, T]) => {
            if (!values.includes(item[1])) {
                values.push(item[1]);
            }
        });
        return values;
    }

    public toString(): string {
        return `<Rangerray name="${this.name}">`;
    }

    public static fracrrayToRangerray(fracrray: [number, string][]) {
        let total = 0;
        for (let element of fracrray) {
            total += element[0];
        }
        let acc = 0;
        for (let element of fracrray) {
            acc += element[0];
            element[0] = acc / total;
        }
    }

}

export default Rangerray;
