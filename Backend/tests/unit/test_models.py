import dataclasses

import pytest

from app.domain.models import ComparisonResult, Status, ValidationError

ERROR = ValidationError(field="budget", code="BUDGET_INVALID", message="Budget is invalid")


def test_invalid_result_clears_every_derived_field():
    result = ComparisonResult.invalid([ERROR])
    assert result.status is Status.INVALID
    assert result.errors == (ERROR,)
    assert result.importance_total is None
    assert result.budget is None
    assert result.recommended_hotel_id is None
    assert result.default_inspected_hotel_id is None
    assert result.hotels == ()


def test_invalid_result_requires_at_least_one_error():
    with pytest.raises(ValueError):
        ComparisonResult.invalid([])


def test_models_are_frozen():
    with pytest.raises(dataclasses.FrozenInstanceError):
        ERROR.code = "OTHER"  # type: ignore[misc]
