import json, sys

from src.constants import COLOUR_RED, COLOUR_NONE

def clamp(value, maximum):
    if value < 0:
        return 0
    elif value > maximum:
        return maximum
    else:
        return value

def point_at_portion_between(a, b, portion):
    r = b - a
    return a + portion * r

def portion_at_point_between(a, b, point):
    b = b - a
    point = point - a
    return point / b

def load_json(filepath):
    file = open(filepath, "r")
    return json.load(file)

def save_json(data, filepath):
    with open(filepath, "w") as file:
        json.dump(data, file, indent = 4)

def get_brightness_at_height(height, max_height):
    return 1 - clamp(height, max_height) / max_height

def int_median(arrays):
    result = []
    length = len(arrays[0])
    for index in range(length):
        acc = 0
        for array in arrays:
            acc += array[index]
        median = int(acc / length)
        result.append(median)
    return result

def exit_with_error(error_type, message):
    print("NarGen: " + COLOUR_RED + error_type + " error: " + COLOUR_NONE + message)
    sys.exit(1)
