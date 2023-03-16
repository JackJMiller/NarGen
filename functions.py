def clamp(value, maximum):
    if value < 0:
        return 0
    elif value > maximum:
        return maximum
    else:
        return value
