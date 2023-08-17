class Rangerray:

    def __init__(self, name = "", items = None):

        self.name = name
        if items == None:
            items = []
        self.items = items

    def select_value(self, v):

        item = self.select(v)
        return item["value"]

    def select(self, v):

        lower_point = 0
        for index, item in enumerate(self.items):
            upper_point = item[0]
            if v < upper_point:
                return {
                    "value": item[1],
                    "lower_point": lower_point,
                    "upper_point": item[0],
                    "index": index
                }
            lower_point = upper_point

        # when v exceeds maximum choice, return the last item
        item = self.items[-1]
        if len(self.items) > 1:
            lower_point = self.items[-2][0]
        else:
            lower_point = 0

        return {
            "value": item[1],
            "lower_point": lower_point,
            "upper_point": item[0],
            "index": len(self.items) - 1
        }

    def select_by_index(self, index):
        if index == 0:
            lower_point = 0
        else:
            lower_point = self.items[index - 1][0]
        item = self.items[index]
        return {
            "value": item[1],
            "lower_point": lower_point,
            "upper_point": item[0],
            "index": index
        }


    def __len__(self):
        return len(self.items)

    def insert(self, item_index, item_value):
        index = -1
        for i in range(len(self.items)):
            if item_index <= self.items[i][0]:
                index = i
                break
        if index == -1:
            self.items.append([item_index, item_value])
        else:
            self.items.insert(i, [item_index, item_value])

    def print(self):
        print("------ rangerray -------")
        print("name: " + self.name)
        print("items:")
        for item in self.items:
            print(str(item[0]) + "\t" + str(item[1]))
        print("--- end of rangerray ---")
        print()

    def values(self):
        values = []
        for item in self.items:
            if item[1] not in values:
                values.append(item[1])
        return values

    def __str__(self):
        return "<Rangerray name=\"" + self.name + "\">"

    @staticmethod
    def fracrray_to_rangerray(fracrray):
        total = 0
        for element in fracrray:
            total += element[0]
        acc = 0
        for element in fracrray:
            acc += element[0]
            element[0] = acc / total
