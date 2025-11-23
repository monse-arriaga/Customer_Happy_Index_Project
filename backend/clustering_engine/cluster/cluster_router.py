from fastapi import APIRouter
import pandas as pd
from sklearn.cluster import KMeans

router = APIRouter()

@router.post("/run")
def cluster_topics():
    df = pd.read_csv("data/topics.csv")

    kmeans = KMeans(n_clusters=6)
    df["cluster"] = kmeans.fit_predict(df[["topic"]])

    df.to_csv("data/clusters.csv", index=False)

    return {"clusters": df["cluster"].nunique()}
