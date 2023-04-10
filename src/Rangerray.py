class Rangerray:

    def __init__(self, name, items = None):

        self.name = name
        if items == None:
            items = []
        self.items = items

    def select(self, v):

        for item in self.items:
            if v < item[0]:
                return item[1]

        # when v exceeds maximum choice, return the last item
        return self.items[-1][1]

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
