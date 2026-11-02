"""Shared API test helpers: a client, the demo request, and catalog overrides."""

import copy

import pytest
from fastapi.testclient import TestClient

from app.data.loader import get_catalog_source, get_city
from app.main import app

CITY_ID = "surmapur"


@pytest.fixture
def client():
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def demo_request(client):
    """The Demo trip exactly as the preset endpoint serves it."""
    return client.get(f"/api/cities/{CITY_ID}/presets/demo").json()


@pytest.fixture
def override_catalog(client):
    """Call with a function that edits a deep copy of the Surmapur catalog in place."""

    def apply(edit):
        city = copy.deepcopy(get_city(CITY_ID))
        edit(city)
        app.dependency_overrides[get_catalog_source] = lambda: lambda city_id: city

    return apply
