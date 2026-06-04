import os
import pickle
import random
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

MODELS_DIR = "/app/models"
SVD_PATH = os.path.join(MODELS_DIR, "svd.pkl")
DF_PATH = os.path.join(MODELS_DIR, "final_df.pkl")

# Load models globally at startup
svd_model = None
books_df = None
user_pivot_table = None
tfidf_vectorizer = None
tfidf_matrix = None
common_books = None

def init_recommender():
    global svd_model, books_df, user_pivot_table, tfidf_vectorizer, tfidf_matrix, common_books
    print("Initializing recommendation models...")
    
    if not os.path.exists(SVD_PATH) or not os.path.exists(DF_PATH):
        # Fallback to local files for local testing if not running in Docker
        local_svd = "./Deployment/svd.pkl"
        local_df = "./Deployment/final_df.pkl"
        if os.path.exists(local_svd) and os.path.exists(local_df):
            with open(local_svd, "rb") as f:
                svd_model = pickle.load(f)
            with open(local_df, "rb") as f:
                books_df = pickle.load(f)
        else:
            raise FileNotFoundError(f"Required models not found at {SVD_PATH} or {local_svd}")
    else:
        with open(SVD_PATH, "rb") as f:
            svd_model = pickle.load(f)
        with open(DF_PATH, "rb") as f:
            books_df = pickle.load(f)
            
    print(f"Loaded books dataset: {books_df.shape}")
    
    # Pre-build pivot table for collaborative filtering to speed up requests
    user_pivot_table = books_df.pivot_table(index=["User-ID"], columns=["ISBN"], values="Book-Rating").fillna(0)
    print("Pre-built user pivot table.")

    # Pre-build content-based TF-IDF matrix
    rating_counts = books_df['Book-Title'].value_counts()
    rare_books = rating_counts[rating_counts.values < 30].index
    common_books = books_df[~books_df['Book-Title'].isin(rare_books)].copy()
    common_books.drop_duplicates(subset=['Book-Title'], inplace=True)
    common_books.reset_index(drop=True, inplace=True)
    
    # Fill NA and combine features
    target_cols = ['Book-Title', 'Book-Author', 'Publisher', 'categories', 'description']
    for col in target_cols:
        common_books[col] = common_books[col].fillna('')
    
    common_books['combined_features'] = common_books[target_cols].agg(' '.join, axis=1)
    tfidf_vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf_vectorizer.fit_transform(common_books['combined_features'])
    print("Pre-built TF-IDF feature matrix.")


def get_image_url(title: str) -> str:
    """Helper to get book image URL by title from books_df."""
    matches = books_df[books_df['Book-Title'] == title]
    if not matches.empty:
        url = matches.iloc[0]['Image-URL-L']
        if pd.notna(url) and url:
            return url
    return "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop"


def get_popular_books(n=6):
    """Port of get_popular_books from Streamlit app."""
    # Calculating the popularity score
    popular_books_df = (
        books_df.groupby("ISBN").agg({"Book-Rating": ["count", "mean"]}).reset_index()
    )
    popular_books_df.columns = ["ISBN", "NumberOfVotes", "AverageRatings"]
    
    C = popular_books_df["AverageRatings"].mean()
    m = popular_books_df["NumberOfVotes"].quantile(0.90)
    
    popular_books_df["Popularity"] = (
        popular_books_df["NumberOfVotes"] * popular_books_df["AverageRatings"] + m * C
    ) / (popular_books_df["NumberOfVotes"] + m)
    
    # Sort and merge details
    popular_books_df.sort_values(by="Popularity", ascending=False, inplace=True)
    popular_books_df = popular_books_df.merge(books_df, on="ISBN", how="left")
    popular_books_df.drop_duplicates(subset="Book-Title", inplace=True)
    
    popular_titles = popular_books_df["Book-Title"].head(n).values
    results = []
    for title in popular_titles:
        results.append({
            "title": title,
            "image_url": get_image_url(title),
            "reason": "Top Popular Book on Tomrec"
        })
    return results


def collaborative_recommender(user_id, n=5):
    """Port of collaborative_recommender."""
    # If the user is not in the system, pick a random user or return popular books
    if user_id not in user_pivot_table.index:
        user_id = random.choice(user_pivot_table.index)
        
    user_predictions = [svd_model.predict(user_id, book_id) for book_id in user_pivot_table.columns]
    predictions_df = pd.DataFrame(user_predictions, columns=['uid', 'iid', 'r_ui', 'est', 'details'])
    
    top_n = predictions_df.sort_values(by='est', ascending=False).head(n * 2)
    top_n_with_details = pd.merge(top_n, books_df, left_on='iid', right_on='ISBN')
    top_n_with_details.drop_duplicates(subset=['Book-Title'], inplace=True)
    
    recommendations = top_n_with_details['Book-Title'].head(n).values
    results = []
    for title in recommendations:
        results.append({
            "title": title,
            "image_url": get_image_url(title),
            "reason": "Based on similar users' ratings (Collaborative)"
        })
    return results


def hybrid_recommender(user_id, n=6):
    """Port of hybrid_recommender."""
    # Find user's history
    user_books = books_df[books_df['User-ID'] == user_id]
    
    # Fallback to random if user not in dataset
    if user_id not in user_pivot_table.index or user_books.empty:
        # User has no history, return collaborative for a random user combined with popular
        random_user = random.choice(user_pivot_table.index)
        return collaborative_recommender(random_user, n)
        
    # Get a book that this user has rated to use as the seed for content-based matching
    # In Streamlit, they took the 4th book (.iloc[3]). Let's handle generic sizes.
    try:
        book_title = user_books['Book-Title'].iloc[min(3, len(user_books) - 1)]
    except Exception:
        book_title = user_books['Book-Title'].iloc[0]

    # Collaborative part (always uses the actual user ID or fallback)
    user_predictions = [svd_model.predict(user_id, book_id) for book_id in user_pivot_table.columns]
    predictions_df = pd.DataFrame(user_predictions, columns=['uid', 'iid', 'r_ui', 'est', 'details'])
    collaborative_rec_isbns = predictions_df.sort_values(by='est', ascending=False).head(n)['iid'].tolist()
    collaborative_rec = books_df[books_df['ISBN'].isin(collaborative_rec_isbns)]['Book-Title'].tolist()

    # Content-based part
    content_based_rec = []
    rating_counts = books_df['Book-Title'].value_counts()
    rare_books = rating_counts[rating_counts.values < 30].index
    
    if book_title in rare_books:
        # For rare books, content based falls back to random selection
        content_based_rec = books_df.sample(n)['Book-Title'].tolist()
    else:
        book_indices = common_books[common_books['Book-Title'] == book_title].index
        if not book_indices.empty:
            book_index = book_indices[0]
            # Calculate cosine similarity of this book with others
            cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix[book_index])
            sim_scores = list(enumerate(cosine_sim))
            sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:n+1]
            content_based_rec = [common_books.iloc[score[0]]['Book-Title'] for score in sim_scores]
        else:
            # Fallback to random if not found in common_books
            content_based_rec = books_df.sample(n)['Book-Title'].tolist()

    # Combine scores (Ported logic)
    combined_rec = {}
    for item in set(collaborative_rec + content_based_rec):
        collaborative_score = 1 if item in collaborative_rec else 0
        content_based_score = 1 if item in content_based_rec else 0
        mean_score = (collaborative_score + content_based_score) / 2
        combined_rec[item] = mean_score
        
    sorted_rec = sorted(combined_rec.items(), key=lambda x: x[1], reverse=True)
    top_n_rec = [rec[0] for rec in sorted_rec[:n]]
    
    results = []
    for title in top_n_rec:
        results.append({
            "title": title,
            "image_url": get_image_url(title),
            "reason": f"Hybrid match based on '{book_title}'"
        })
    return results
