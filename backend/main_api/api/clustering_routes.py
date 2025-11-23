from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Clustering"])


class DataIn(BaseModel):
    data: list


@router.post("/cluster")
def cluster(payload: DataIn):
    # Endpoint de ejemplo: devuelve la cantidad de elementos recibidos
    return {"n_items": len(payload.data)}
