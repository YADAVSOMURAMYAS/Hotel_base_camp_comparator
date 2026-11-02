import ast
import io
import tokenize
from fractions import Fraction
from pathlib import Path

import pytest

from app.domain import rounding
from app.domain.rounding import format_average, rounded_tenths


def test_spec_example_140_over_5_is_28_point_0():
    assert rounded_tenths(140, 5) == 280
    assert format_average(140, 5) == "28.0"


@pytest.mark.parametrize(
    ("total", "importance", "expected"),
    [
        (1, 20, "0.1"),  # 1/20 = 0.05 exactly -> rounds up
        (3, 40, "0.1"),  # 3/40 = 0.075 -> 0.1
        (3, 20, "0.2"),  # 3/20 = 0.15 exactly -> rounds up
        (5, 4, "1.3"),  # 5/4 = 1.25 exactly -> 1.3
        (7, 4, "1.8"),  # 7/4 = 1.75 exactly -> 1.8
        (139, 5, "27.8"),  # 139/5 = 27.8 exact tenth
    ],
)
def test_exact_half_tenth_rounds_up(total, importance, expected):
    assert format_average(total, importance) == expected


@pytest.mark.parametrize(
    ("total", "importance", "expected"),
    [
        (199, 4000, "0.0"),  # 0.04975 -> just below 0.05 -> 0.0
        (19, 400, "0.0"),  # 0.0475 -> 0.0
        (29, 200, "0.1"),  # 0.145 -> just below 0.15 -> 0.1
        (14_499, 10_000, "1.4"),  # 1.4499 -> just below 1.45 -> 1.4
        (1449, 1000, "1.4"),  # 1.449 -> 1.4
    ],
)
def test_just_below_half_tenth_rounds_down(total, importance, expected):
    assert format_average(total, importance) == expected


def test_exact_tenth_is_unchanged():
    assert format_average(1, 2) == "0.5"  # 1/2 = 0.5
    assert format_average(27, 5) == "5.4"  # 27/5 = 5.4


def test_zero_total_is_zero_point_zero():
    assert rounded_tenths(0, 7) == 0
    assert format_average(0, 7) == "0.0"


def test_repeating_decimals():
    assert format_average(1, 3) == "0.3"  # 0.333...
    assert format_average(2, 3) == "0.7"  # 0.666...


def test_maximum_possible_total():
    # importance 5 x 600 minutes x 15 places = 45,000; importance_total = 75 -> average 600.0
    assert rounded_tenths(45_000, 75) == 6000
    assert format_average(45_000, 75) == "600.0"
    assert format_average(44_999, 75) == "600.0"  # 599.9867 -> 600.0
    assert format_average(44_996, 75) == "599.9"  # 599.9467 -> 599.9


def _half_up_tenths(total: int, importance: int) -> int:
    scaled = Fraction(total, importance) * 10
    return int(scaled + Fraction(1, 2))  # int() floors a non-negative Fraction


def test_matches_exact_fraction_half_up_for_every_pair():
    for importance in range(1, 76):
        for total in range(0, 2001):
            assert rounded_tenths(total, importance) == _half_up_tenths(total, importance), (
                total,
                importance,
            )


@pytest.mark.parametrize(
    ("total", "importance"),
    [(10, 0), (10, -1), (-1, 5), (-10, -5), (10.0, 5), (10, 5.0), ("10", 5), (True, 5), (10, True)],
)
def test_invalid_inputs_raise_value_error(total, importance):
    with pytest.raises(ValueError):
        rounded_tenths(total, importance)
    with pytest.raises(ValueError):
        format_average(total, importance)


def _code_tokens() -> list[str]:
    """Source tokens of rounding.py, minus comments and docstrings."""
    source = Path(rounding.__file__).read_text(encoding="utf-8")
    docstring_lines: set[int] = set()
    for node in ast.walk(ast.parse(source)):
        if isinstance(node, (ast.Module, ast.FunctionDef, ast.ClassDef)) and node.body:
            first = node.body[0]
            if isinstance(first, ast.Expr) and isinstance(first.value, ast.Constant):
                docstring_lines.update(range(first.lineno, first.end_lineno + 1))
    return [
        tok.string
        for tok in tokenize.generate_tokens(io.StringIO(source).readline)
        if tok.type != tokenize.COMMENT and tok.start[0] not in docstring_lines
    ]


def test_module_has_no_float_round_decimal_or_true_division():
    tokens = _code_tokens()
    assert not {"float", "round", "Decimal", "/", "/="} & set(tokens)
    assert "//" in tokens  # integer division is what the module is supposed to use
