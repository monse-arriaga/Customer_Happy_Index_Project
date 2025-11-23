# ====================================================
# BERTopic sobre embeddings pre-calculados
# ====================================================
import numpy as np
import pandas as pd
from bertopic import BERTopic

# -------------------------------
# Configuración
# -------------------------------
ARCHIVO_TWEETS = "tweets_limpios_completos.csv"
ARCHIVO_EMBEDDINGS = "embeddings_multilingue.npy"
ARCHIVO_BERTOPIC = "tweets_bertopic.csv"
NUM_KEYWORDS = 8  # Número de palabras clave a mostrar por topic

# -------------------------------
# Paso 1: Cargar tweets
# -------------------------------
df = pd.read_csv(ARCHIVO_TWEETS, low_memory=False)
df = df[df["Tweet_limpio"].notna() & (df["Tweet_limpio"] != "")].reset_index(drop=True)
tweets = df["Tweet_limpio"].tolist()
print(f"✅ {len(tweets)} tweets cargados.")

# -------------------------------
# Paso 2: Cargar embeddings
# -------------------------------
embeddings = np.load(ARCHIVO_EMBEDDINGS)
print(f"✅ {len(embeddings)} embeddings cargados.")

# -------------------------------
# Paso 3: Inicializar BERTopic
# -------------------------------
topic_model = BERTopic(
    language="multilingual",
    calculate_probabilities=True,  # Permite obtener probabilidades por tweet
    verbose=True
)

# -------------------------------
# Paso 4: Ajustar modelo con embeddings
# -------------------------------
topics, probs = topic_model.fit_transform(tweets, embeddings)
print("📝 Topics generados.")

# -------------------------------
# Paso 5: Contar número de topics distintos
# -------------------------------
num_topics = len(set(topics)) - (1 if -1 in topics else 0)
print(f"📊 BERTopic generó {num_topics} topics (excluyendo outliers).")

# -------------------------------
# Paso 6: Mostrar palabras clave de los primeros topics
# -------------------------------
topic_info = topic_model.get_topic_info()
real_topics = topic_info[topic_info.Topic != -1].reset_index(drop=True)

print(f"\n🔑 Primeros {min(NUM_KEYWORDS, len(real_topics))} topics y sus palabras clave:")
for i, topic_id in enumerate(real_topics.Topic[:NUM_KEYWORDS]):
    keywords = topic_model.get_topic(topic_id)
    print(f"\nTema {topic_id}: {[k[0] for k in keywords]}")

# -------------------------------
# Paso 7: Guardar resultados en CSV
# -------------------------------
df["BERTopic_Topic"] = topics
df["BERTopic_Prob"] = [p.max() if p is not None else None for p in probs]  # probabilidad máxima por tweet
df.to_csv(ARCHIVO_BERTOPIC, index=False, encoding="utf-8-sig")
print(f"✅ Resultados guardados en {ARCHIVO_BERTOPIC}")
