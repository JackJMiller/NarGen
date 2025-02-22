class Rangerray {

    public name: string;
    public items: any[];

    public constructor(name: string = "", items: any = []) {
        this.name = name
        this.items = items;
    }

    public select_value(v: number): any {
        let item = this.select(v)
        return item["value"];
    }

    public select(v: number): any {

        let lower_point = 0;
        for (let index = 0; index < this.items.length; index++) {
            let item = this.items[index];
            let upper_point = item[0]
            if (v < upper_point) {
                return {
                    "value": item[1],
                    "lower_point": lower_point,
                    "upper_point": item[0],
                    "index": index
                }
            }
            lower_point = upper_point;
        }

        // when v exceeds maximum choice, return the last item
        let item = this.items[-1]
        lower_point = (this.items.length > 1) ? this.items[-2][0] : 0;

        return {
            "value": item[1],
            "lower_point": lower_point,
            "upper_point": item[0],
            "index": this.items.length - 1
        }
    }

    public select_by_index(index: number): any {
        let lower_point = (index === 0) ? 0 : this.items[index - 1][0];
        let item = this.items[index];
        return {
            "value": item[1],
            "lower_point": lower_point,
            "upper_point": item[0],
            "index": index
        };
    }


    // TODO: replace all instances of len(rangerray) with rangerray.length();
    public length() {
        return this.items.length;
    }

    public insert(item_index: number, item_value: any) {
        let index = -1
        for (let i = 0; i < this.items.length; i++) {
            if (item_index <= this.items[i][0]) {
                index = i;
                break;
            }
        }
        if (index === -1) {
            this.items.push([item_index, item_value]);
        }
        else {
            this.items.splice(index, 0, [item_index, item_value]);
        }
    }

    public print() {
        console.log("------ rangerray -------")
        console.log("name: " + this.name)
        console.log("items:")
        for (let item of this.items) {
            console.log(`${item[0]}\t${item[1]}`);
        }
        console.log("--- end of rangerray ---");
        console.log();
    }

    public values() {
        let values: any[] = [];
        for (let item in this.items) {
            if (!values.includes(item[1])) {
                values.push(item[1]);
            }
        }
        return values;
    }

    // TODO: replace all instances of str(rangerray) with rangerray.toString();
    public toString(): string {
        return `<Rangerray name="${this.name}">`;
    }

    public static fracrray_to_rangerray(fracrray: any[]) {
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

export = Rangerray;
