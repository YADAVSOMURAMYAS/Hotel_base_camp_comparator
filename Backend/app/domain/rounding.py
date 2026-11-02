def rounded_tenths(weighted_total: int, importance_total: int) -> int:
    """Weighted average in tenths, rounded half up, using integer arithmetic only."""
    _require_int(weighted_total, "weighted_total", minimum=0)
    _require_int(importance_total, "importance_total", minimum=1)
    return (20 * weighted_total + importance_total) // (2 * importance_total)


def format_average(weighted_total: int, importance_total: int) -> str:
    """Display string such as "28.0" for the weighted average."""
    tenths = rounded_tenths(weighted_total, importance_total)
    return f"{tenths // 10}.{tenths % 10}"


def _require_int(value: int, name: str, minimum: int) -> None:
    if type(value) is not int:
        raise ValueError(f"{name} must be an int, got {type(value).__name__}")
    if value < minimum:
        raise ValueError(f"{name} must be at least {minimum}, got {value}")
