from fastapi import APIRouter
import pandas as pd

router = APIRouter()

@router.get("/summary")
def summary():
    df = pd.read_csv("data/clusters.csv")

    return {
        "total_messages": len(df),
        "topics": int(df["topic"].nunique()),
        "clusters": int(df["cluster"].nunique()),
        "sample": df.head(5).to_dict(orient="records")
    }
