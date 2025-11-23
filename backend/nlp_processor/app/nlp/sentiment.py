# Sentiment analysis functions
from flair.models import TextClassifier
from flair.data import Sentence

classifier = TextClassifier.load('sentiment')

def analyze_sentiment(text):
    sentence = Sentence(text)
    classifier.predict(sentence)
    return sentence.labels[0].value, sentence.labels[0].score
