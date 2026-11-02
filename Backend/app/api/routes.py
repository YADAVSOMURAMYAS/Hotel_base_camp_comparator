from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException

from app.api.schemas import CompareRequest, catalog_view, preset_view, result_view
from app.data.loader import CatalogSource, UnknownCityError, get_catalog_source
from app.domain.compare import compare_request

router = APIRouter(prefix="/api")
Source = Annotated[CatalogSource, Depends(get_catalog_source)]


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _city(source: CatalogSource, city_id: str) -> dict[str, Any]:
    try:
        return source(city_id)
    except UnknownCityError as error:
        raise HTTPException(status_code=404, detail=str(error)) from None


@router.get("/cities/{city_id}")
def city_detail(city_id: str, source: Source):
    return catalog_view(_city(source, city_id))


@router.get("/cities/{city_id}/presets/demo")
def demo_preset(city_id: str, source: Source):
    city = _city(source, city_id)
    if city.get("demo_preset") is None:
        raise HTTPException(status_code=404, detail=f"City '{city_id}' has no demo preset")
    return preset_view(city)


@router.post("/compare")
def compare(request: CompareRequest, source: Source):
    city = _city(source, request.city_id)
    return result_view(
        compare_request(
            city, request.hotel_ids, request.place_ids, request.importances, request.budget
        )
    )
