from conftest import CITY_ID

SECOND_CITY = "shikharpur"


def test_city_list_shape_and_content(client):
    response = client.get("/api/cities")
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"cities"}
    assert all(
        set(c) == {"city_id", "name", "hotel_count", "place_count", "has_demo_preset"}
        for c in body["cities"]
    )
    assert [c["city_id"] for c in body["cities"]] == sorted([CITY_ID, SECOND_CITY])


def test_both_cities_have_30_hotels_and_50_places(client):
    for city in client.get("/api/cities").json()["cities"]:
        assert city["hotel_count"] == 30
        assert city["place_count"] == 50


def test_only_surmapur_has_the_demo_preset(client):
    flags = {c["city_id"]: c["has_demo_preset"] for c in client.get("/api/cities").json()["cities"]}
    assert flags == {CITY_ID: True, SECOND_CITY: False}


def test_list_matches_the_detail_endpoint(client):
    for city in client.get("/api/cities").json()["cities"]:
        detail = client.get(f"/api/cities/{city['city_id']}").json()
        assert city["name"] == detail["name"]
        assert city["has_demo_preset"] == detail["has_demo_preset"]
        assert len(detail["hotels"]) == city["hotel_count"]
        assert len(detail["places"]) == city["place_count"]


def test_second_city_detail_is_the_full_catalog(client):
    body = client.get(f"/api/cities/{SECOND_CITY}").json()
    assert len(body["round_trip_minutes"]) == 30
    assert all(len(row) == 50 for row in body["round_trip_minutes"].values())


def test_unknown_city_is_404(client):
    response = client.get("/api/cities/nowhere")
    assert response.status_code == 404
    assert response.json() == {"detail": "Unknown city 'nowhere'"}


def test_city_without_a_preset_has_no_demo_preset_endpoint(client):
    response = client.get(f"/api/cities/{SECOND_CITY}/presets/demo")
    assert response.status_code == 404
    assert response.json() == {"detail": f"City '{SECOND_CITY}' has no demo preset"}
