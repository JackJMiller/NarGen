import json, math, os, random, sys

from src.constants import COLOUR_RED, COLOUR_MAGENTA, COLOUR_NONE

def clamp(value, maximum):
    if value < 0:
        return 0
    elif value > maximum:
        return maximum
    else:
        return value

def limit(value, minimum, maximum):
    if value < minimum:
        return minimum
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

def get_brightness_at_height(height, maxHeight):
    return 1 - clamp(height, maxHeight) / maxHeight

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
    print("NarGen: " + COLOUR_RED + "ERROR" + COLOUR_NONE + ": " + error_type + ": " + message)
    sys.exit(1)

def raise_warning(warning_type, message):
    print("NarGen: " + COLOUR_MAGENTA + "WARNING" + COLOUR_NONE + ": " + warning_type + ": " + message)

def random_element(array):
    index = random.randrange(0, len(array))
    return array[index]

def flatten_noise_distribution(noise_value):
    original_value = noise_value
    FLATTEN_R = -0.15
    mean = 0.53
    r = FLATTEN_R
    if noise_value < mean:
        sine = -1
    else:
        sine = 1
    noise_value = abs(noise_value - mean)
    noise_value = 1 - math.exp(noise_value * r)
    noise_value = mean + sine * noise_value
    noise_value = limit(noise_value, 0, 1)
    return noise_value

def validate(data_type, value, context):
    if data_type == "ornaments":
        keys = [e[0] for e in value]
        if "OCCURRENCE" not in keys:
            exit_with_error("Invalid configuration", "The OCCURRENCE attribute is missing from the ornaments list inside the configuration for " + context["sub_biome_name"] + ".")

def colour_average(c1, c2):
    return (
        mean(c1[0], c2[0]),
        mean(c1[1], c2[1]),
        mean(c1[2], c2[2])
    )

def mean(v1, v2):
    return int((v1 + v2) / 2)

