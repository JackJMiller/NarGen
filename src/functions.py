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

