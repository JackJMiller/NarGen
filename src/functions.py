import json

def clamp(value, maximum):
    if value < 0:
        return 0
    elif value > maximum:
        return maximum
    else:
        return value

def noise_to_decimal_portion(noise):
    return (noise + 1) / 2

def portion_point_between(a, b, portion):
    r = b - a
    return a + portion * r

def load_json(filepath):
    file = open(filepath, "r")
    return json.load(file)
    
def save_json(data, filepath):
    with open(filepath, "w") as file:
        json.dump(data, file, indent = 4)

def get_brightness_at_height(height, max_height):
    return 1 - clamp(height, max_height) / max_height
