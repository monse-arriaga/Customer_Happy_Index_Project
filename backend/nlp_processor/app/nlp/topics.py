from bertopic import BERTopic

topic_model = BERTopic()

def extract_topics(docs):
    topics, probs = topic_model.fit_transform(docs)
    return topics, probs
