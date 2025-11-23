from fastapi import APIRouter
import csv
from ..nlp.sentiment3 import analyze_sentiment
from ..nlp.Emociones4 import extract_topics
from ..core.preprocessing import clean_text

router = APIRouter()

@router.post("/sentiment")
def sentiment_analyze():
    rows = []
    with open("data/raw_data.csv", encoding="utf-8") as f:
        for id_, text, user, timestamp in csv.reader(f):
            clean = clean_text(text)
            label, score = analyze_sentiment(clean)
            rows.append([id_, clean, label, score, user, timestamp])

    with open("data/sentiments.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "text", "sentiment", "score", "user", "timestamp"])
        writer.writerows(rows)

    return {"status": "ok", "processed": len(rows)}


@router.post("/topics")
def topic_modeling():
    docs = [row[1] for row in csv.reader(open("data/sentiments.csv", encoding="utf-8"))]

    topics, _ = extract_topics(docs)

    with open("data/topics.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "topic"])
        for doc, top in zip(docs, topics):
            writer.writerow([doc, top])

    return {"topics": len(set(topics))}
