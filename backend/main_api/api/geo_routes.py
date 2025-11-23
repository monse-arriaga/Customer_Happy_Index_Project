from fastapi import APIRouter

router = APIRouter(tags=["Geo"])


@router.get("/locate")
def locate_place(q: str):
    # Endpoint de ejemplo: retorna la query recibida
    return {"query": q, "location": None}
