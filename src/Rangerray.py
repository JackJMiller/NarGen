class Rangerray:

    def __init__(self):

        self.items = []

    def select_item(self, n):
        print("Selecting at " + str(n))
        index = -1
        for i, item in enumerate(self.items):
            if n <= item[0]:
                index = i
                break
        if index == -1 or index == 0:
            return self.items[index]
        else:
            return self.items[index - 1]
    
    def insert_item(self, item_index, item_value):
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
