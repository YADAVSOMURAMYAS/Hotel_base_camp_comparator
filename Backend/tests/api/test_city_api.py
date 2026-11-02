from conftest import CITY_ID


def test_city_detail_has_documented_shape(client):
    response = client.get(f"/api/cities/{CITY_ID}")
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "city_id",
        "name",
        "map",
        "districts",
        "hotels",
        "places",
        "round_trip_minutes",
        "has_demo_preset",
    }
    assert body["city_id"] == CITY_ID
    assert body["has_demo_preset"] is True
    assert set(body["map"]) == {"width", "height"}
    assert set(body["districts"][0]) == {"id", "name"}
    assert set(body["hotels"][0]) == {"id", "name", "stay_cost", "district_id", "position"}
    assert set(body["places"][0]) == {
        "id",
        "name",
        "type",
        "default_importance",
        "district_id",
        "position",
    }
    assert set(body["hotels"][0]["position"]) == {"x", "y"}


def test_city_matrix_has_every_hotel_place_pair(client):
    body = client.get(f"/api/cities/{CITY_ID}").json()
    hotel_ids = {h["id"] for h in body["hotels"]}
    place_ids = {p["id"] for p in body["places"]}
    assert set(body["round_trip_minutes"]) == hotel_ids
    for row in body["round_trip_minutes"].values():
        assert set(row) == place_ids


def test_city_unknown_is_404(client):
    response = client.get("/api/cities/nowhere")
    assert response.status_code == 404
    assert response.json() == {"detail": "Unknown city 'nowhere'"}


def test_demo_preset_shape_and_counts(client):
    response = client.get(f"/api/cities/{CITY_ID}/presets/demo")
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"city_id", "hotel_ids", "place_ids", "importances", "budget"}
    assert body["city_id"] == CITY_ID
    assert len(body["hotel_ids"]) == 10
    assert len(body["place_ids"]) == 15
    assert set(body["importances"]) == set(body["place_ids"])
    assert body["budget"] == 30000


def test_demo_preset_unknown_city_is_404(client):
    assert client.get("/api/cities/nowhere/presets/demo").status_code == 404


def test_demo_preset_city_without_preset_is_404(client, override_catalog):
    override_catalog(lambda city: city.update(demo_preset=None))
    response = client.get(f"/api/cities/{CITY_ID}/presets/demo")
    assert response.status_code == 404
    assert response.json() == {"detail": f"City '{CITY_ID}' has no demo preset"}
    assert client.get(f"/api/cities/{CITY_ID}").json()["has_demo_preset"] is False
