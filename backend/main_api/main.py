from fastapi import FastAPI

# Usar imports relativos (esto requiere que `main_api` sea paquete)
from .api.nlp_routes import router as nlp_router
from .api.clustering_routes import router as clustering_router
from .api.geo_routes import router as geo_router

app = FastAPI(title="Transportation Insight API")

# Registrar routers (los routers internos no definen prefijos)
app.include_router(nlp_router, prefix="/nlp")
app.include_router(clustering_router, prefix="/clustering")
app.include_router(geo_router, prefix="/geo")
