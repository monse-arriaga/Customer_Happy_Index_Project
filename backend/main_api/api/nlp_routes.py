from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["NLP"])


class TextIn(BaseModel):
    text: str


@router.post("/process")
def process_text(payload: TextIn):
    # Endpoint de ejemplo: devuelve el texto recibido
    return {"processed_text": payload.text}
