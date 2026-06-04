from pydantic import BaseModel
from typing import List, Optional

class RecommenderRequest(BaseModel):
    user_id: int
    n_recommendations: Optional[int] = 5

class BookRecommendation(BaseModel):
    title: str
    image_url: Optional[str] = None
    reason: Optional[str] = None

class RecommenderResponse(BaseModel):
    user_id: int
    recommendations: List[BookRecommendation]
