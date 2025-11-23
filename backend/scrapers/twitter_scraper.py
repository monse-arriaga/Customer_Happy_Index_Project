# Twitter scraper
import csv

def save_tweets_to_csv(tweets, path="data/raw_data.csv"):
    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        for t in tweets:
            writer.writerow([t["id"], t["text"], t["user"], t["timestamp"]])
