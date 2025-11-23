# ==========================================
# Pipeline simplificado: usar embeddings existentes + UMAP opcional + SemAxis + clustering 2 clusters
# ==========================================
import os
import pandas as pd
import numpy as np
import torch
from sentence_transformers import SentenceTransformer
from umap import UMAP
from sklearn.cluster import KMeans

# -------------------------------
# Configuración
# -------------------------------
ARCHIVO_TWEETS = "tweets_bertopic.csv"
ARCHIVO_EMBEDDINGS = "D:/Customer_Happy_Index_Project/embeddings_multilingue.npy"
ARCHIVO_FINAL = "tweets_clusters_semaxis.csv"
DEFAULT_MODELO = "paraphrase-multilingual-MiniLM-L12-v2"

# -------------------------------
# Semillas de emociones (bigramas incluidos)
# -------------------------------
# Español
neg_es = [
    "frustración","tardado","enojo","ira","molestia","enfado","robo","asalto",
    "inseguro","inseguridad","miedo","caro","costoso","insatisfacción","insatisfecho",
    "lento","mal servicio","deficiente","problema","error","fallo","decepción",
    "estrés","incidente","atraso","demora","cancelación","incómodo","sucio",
    "ruidoso","masificado","hacinamiento","desorganizado","falto de respeto",
    "peligroso","espera larga","clima adverso","mal señalizado","confusión",
    "desinformación","agotador","incivilidad","mala atención","inexacto",
    "inconveniente","sobreventa","mal mantenimiento","inseguridad vial","desagradable","frustrante",
    "perder"
]

pos_es = [
    "satisfacción","rápido","alegría","confianza","seguro","barato","excelente",
    "eficiente","buen servicio","correcto","solución","acierto","confiable",
    "agradable","éxito","contento","puntual","cómodo","limpio","tranquilo","frecuente",
    "bien señalizado","organizado","bien iluminado","accesible","ordenado","servicio amable",
    "buena frecuencia","rápida atención","sin demora","sin problemas","fluido",
    "respetuoso","efectivo","bien comunicado","entendible","coherente","práctico",
    "agradable viaje","confortable","tranquilo viaje","eficiente horario","seguro transporte",
    "limpieza","bien cuidado","buena señalización","orden","excelente atención"
]

# Alemán
neg_de = [
    "frustration","verspätung","wut","ärger","ärgernis","raub","überfall","unsicher",
    "angst","teuer","unzufrieden","langsam","schlechter_service","problem","fehler",
    "mangel","enttäuschung","ausfall","unbequem","schmutzig","laut","überfüllt",
    "enge","unorganisiert","respektlos","gefährlich","lange_wartezeit","schlechtes_wetter",
    "schlechte_beschilderung","verwirrung","fehlende_information","ermüdend","rüpelhaft",
    "unfreundlich","unzuverlässig","chaotisch","stau","konfus","problematisch","verzögerung",
    "überlastet","ungemütlich","veraltet","unpraktisch","fehlplan","schwierig","unangenehm"
]

pos_de = [
    "zufriedenheit","schnell","freude","vertrauen","sicher","günstig","exzellent",
    "effizient","guter_service","korrekt","lösung","erfolg","verlässlich","angenehm",
    "glücklich","pünktlich","komfortabel","sauber","ruhig","häufig","gut_beschildert",
    "organisiert","gut_beleuchtet","barrierefrei","geordnet","freundlicher_service",
    "gute_frequenz","schnelle_bearbeitung","ohne_verzögerung","problemfrei","fließend",
    "respektvoll","effektiv","gut_kommuniziert","verständlich","kohärent","praktisch",
    "angenehme_reise","komfortable_fahrt","ruhige_fahrt","effizienter_fahrplan","sicherer_transport",
    "sauberkeit","gut_gepflegt","gute_beschilderung","ordnung","ausgezeichneter_service"
]

# -------------------------------
# Función SemAxis
# -------------------------------
def semaxis_score(embedding_tweet, embedding_neg, embedding_pos):
    axis = embedding_pos - embedding_neg
    score = np.dot(embedding_tweet - embedding_neg, axis) / np.dot(axis, axis)
    return score

# -------------------------------
# Ejecución pipeline
# -------------------------------
if __name__ == "__main__":
    # 1️⃣ Cargar tweets
    if not os.path.exists(ARCHIVO_TWEETS):
        raise FileNotFoundError(f"No se encontró {ARCHIVO_TWEETS}")
    
    df = pd.read_csv(ARCHIVO_TWEETS)
    df = df[df["Tweet_limpio"].notna() & (df["Tweet_limpio"] != "")].reset_index(drop=True)
    print(f"✅ {len(df)} tweets cargados.")

    # 2️⃣ Cargar embeddings existentes
    if not os.path.exists(ARCHIVO_EMBEDDINGS):
        raise FileNotFoundError(f"No se encontró {ARCHIVO_EMBEDDINGS}")
    
    embeddings_tweets = np.load(ARCHIVO_EMBEDDINGS)
    print(f"💾 Embeddings cargados desde {ARCHIVO_EMBEDDINGS}")

    # 3️⃣ Reducir con UMAP (opcional)
    print("🔻 Aplicando UMAP para reducción de dimensionalidad...")
    umap_model = UMAP(n_components=20, n_neighbors=30, min_dist=0.1, metric='cosine')
    embeddings_umap = umap_model.fit_transform(embeddings_tweets)
    print(f"📉 Reducción completada a {embeddings_umap.shape[1]} dimensiones.")

    # 4️⃣ Calcular SemAxis
    print("⚡ Calculando SemAxis scores...")
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    modelo = SentenceTransformer(DEFAULT_MODELO, device=device)
    
    # Embeddings de semillas (bigramas se codifican completos)
    embedding_neg_es = modelo.encode(neg_es, convert_to_numpy=True).mean(axis=0)
    embedding_pos_es = modelo.encode(pos_es, convert_to_numpy=True).mean(axis=0)
    embedding_neg_de = modelo.encode(neg_de, convert_to_numpy=True).mean(axis=0)
    embedding_pos_de = modelo.encode(pos_de, convert_to_numpy=True).mean(axis=0)

    semaxis_scores = []

    for i, row in df.iterrows():
        emb = embeddings_tweets[i]
        lang = row["Lang"]

        if lang == "E":
            score = semaxis_score(emb, embedding_neg_es, embedding_pos_es)
        else:
            score = semaxis_score(emb, embedding_neg_de, embedding_pos_de)
        semaxis_scores.append(score)

    df["SemAxis_Score"] = semaxis_scores

    # 5️⃣ Clustering 2 clusters sobre SemAxis
    kmeans = KMeans(n_clusters=2, random_state=42)
    df["Cluster_SemAxis"] = kmeans.fit_predict(df[["SemAxis_Score"]])
    print("✅ Clusters SemAxis generados.")

    # 6️⃣ Guardar CSV final
    df.to_csv(ARCHIVO_FINAL, index=False, encoding='utf-8-sig')
    print(f"✅ Pipeline completo finalizado. CSV guardado en {ARCHIVO_FINAL}")
