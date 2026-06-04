from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from app.schemas import RecommenderRequest, RecommenderResponse
from app import recommender

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the models
    recommender.init_recommender()
    yield

app = FastAPI(title="Tomrec ML Recommendation Service", version="1.0.0", lifespan=lifespan)

@app.post("/recommend/hybrid", response_model=RecommenderResponse)
def get_hybrid_recommendations(req: RecommenderRequest):
    try:
        recs = recommender.hybrid_recommender(req.user_id, req.n_recommendations)
        return RecommenderResponse(user_id=req.user_id, recommendations=recs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend/collaborative", response_model=RecommenderResponse)
def get_collaborative_recommendations(req: RecommenderRequest):
    try:
        recs = recommender.collaborative_recommender(req.user_id, req.n_recommendations)
        return RecommenderResponse(user_id=req.user_id, recommendations=recs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recommend/popular")
def get_popular(n: int = 6):
    try:
        return recommender.get_popular_books(n)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    if recommender.svd_model is not None and recommender.books_df is not None:
        return {"status": "healthy", "model_loaded": True}
    return {"status": "unhealthy", "model_loaded": False}
