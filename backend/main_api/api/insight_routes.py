from fastapi import APIRouter
from insights_api.app.api.insights_service import generate_insights

router = APIRouter(prefix="/insights", tags=["Insights"])

@router.get("/")
def insights():
    return generate_insights()
