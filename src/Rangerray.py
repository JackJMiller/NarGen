class Rangerray:

    def __init__(self, items = []):

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
        self.print()

    def print(self):
        for item in self.items:
            print(item[0], "\t", item[1])
        print()

    def __str__(self):
        return str(self.items)