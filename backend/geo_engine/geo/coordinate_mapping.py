# ==========================================================
# Prueba NER + Localizaciones específicas + Sentimiento
# ==========================================================

from flair.data import Sentence
from flair.models import SequenceTagger
from flair.nn import Classifier

# -------------------------------
# 1. Cargar modelos
# -------------------------------
tagger_es = SequenceTagger.load("flair/ner-spanish-large")  # NER español
tagger_de = SequenceTagger.load("de-ner-large")             # NER alemán
sentiment_model = Classifier.load('sentiment')             # Sentimiento general

# -------------------------------
# 2. Diccionario de lugares/metrostaciones
# -------------------------------
metro_stations = [
    "Indios Verdes", "Pantitlán", "Zócalo", "Coyoacán", "Metro", "Bellas Artes",
    "Tacuba", "Centro Médico", "Revolución", "Insurgentes"
]

# -------------------------------
# 3. Tweets de prueba
# -------------------------------
tweets = [
    {"text": "Me mamo la linea 3, siempre llega a tiempo.", "lang": "E"},
    {"text": "El Metro de Berlín está sucio y siempre retrasado.", "lang": "E"},
    {"text": "Centro medico esta llenisimo y sucio.", "lang": "E"},
    {"text": "Odio las estaciones sucias en Pantitlán.", "lang": "E"}
]

# -------------------------------
# 4. Iterar sobre tweets
# -------------------------------
for tweet in tweets:
    text = tweet["text"]
    lang = tweet["lang"]

    # 4a. NER con Flair
    sentence = Sentence(text)
    if lang.upper() == "E":
        tagger_es.predict(sentence)
    else:
        tagger_de.predict(sentence)

    loc_entities = [entity.text for entity in sentence.get_spans('ner') if entity.get_label('ner').value == "LOC"]

    # 4b. Buscar estaciones / lugares específicos en el diccionario
    detected_stations = [s for s in metro_stations if s in text]

    # 4c. Combinar localizaciones detectadas
    all_locations = list(set(loc_entities + detected_stations))  # set para evitar duplicados

    # 4d. Sentimiento
    sentiment_sentence = Sentence(text)
    sentiment_model.predict(sentiment_sentence)
    label = sentiment_sentence.labels[0].value
    score = sentiment_sentence.labels[0].score
    if label == "NEGATIVE":
        score = -score

    # 4e. Imprimir resultados
    print(f"Tweet: {text}")
    print(f"Localizaciones detectadas: {', '.join(all_locations) if all_locations else 'Ninguna'}")
    print(f"Sentimiento: {label}, Puntaje: {score:.3f}")
    print("-" * 50)
