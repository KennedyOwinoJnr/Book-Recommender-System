import streamlit as st
import pickle
from io import BytesIO
import pandas as pd
import random
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer


# Load the trained SVD model
with open('svd.pkl', 'rb') as f:
    svd_model = pickle.load(f)

# Load the book data
with open('final_df.pkl', 'rb') as f:
    books_df = pickle.load(f)

global_user_id = None

def login():
    global global_user_id
    
    st.title('Welcome to Tomrec!')
    user_id = st.text_input("Enter your User ID:")

    if st.button("Log In"):
        if user_id:
            if int(user_id) in books_df['User-ID'].values:
                global_user_id = user_id  # Assign the entered user ID to the global variable
                st.session_state.page = 'home'
            else:
                st.warning('Please enter a valid User-ID')
    else:
        # Login as Guest
        if st.button("Login as Guest"):
            global_user_id = "guest"  # Assign a default guest ID
            st.session_state.page = 'guest'  # Navigate to the bookshelf page

def get_url(recommendation):
    url = []
    for book in recommendation:
        if book in books_df['Book-Title'].values:
            index = books_df[books_df['Book-Title'] == book].index[0]
            url.append(books_df.loc[index, 'Image-URL-L'])
    return url

# Defining a function to return the most popular books
def get_popular_books():
    n = 6
    df = books_df

    # Calculating the number of ratings and the average rating for each book by grouping the DataFrame by ISBN 
    # and aggregating the count of ratings and the mean rating.
    popular_books_df = (
        df.groupby("ISBN").agg({"Book-Rating": ["count", "mean"]}).reset_index()
    )
    popular_books_df.columns = ["ISBN", "NumberOfVotes", "AverageRatings"]

    # Calculating the popularity score for each book using a weighted average of the rating and number of votes
    C = popular_books_df["AverageRatings"].mean()

    m = popular_books_df["NumberOfVotes"].quantile(0.90)
    popular_books_df["Popularity"] = (
        popular_books_df["NumberOfVotes"] * popular_books_df["AverageRatings"] + m * C
    ) / (popular_books_df["NumberOfVotes"] + m)

    # Sorting the books in descending order by popularity score
    popular_books_df.sort_values(by="Popularity", ascending=False, inplace=True)

    # Merging popularity score with the books dataframe
    popular_books_df = popular_books_df.merge(df, on="ISBN", how="left")

    # Dropping the duplicate book titles
    popular_books_df.drop_duplicates(subset="Book-Title", inplace=True)

    # Return the top n most popular book titles
    book_list = popular_books_df["Book-Title"].head(n).values

    #get url
    url = get_url(book_list)

    return book_list, url

#Collaborative filtering model

def collaborative_recommender(user_id):
    users_pivot = books_df.pivot_table(index=["User-ID"], columns=["ISBN"], values="Book-Rating").fillna(0)
    
    # Get the predictions for the user
    user_predictions = [svd_model.predict(user_id, book_id) for book_id in users_pivot.columns]    
    # Convert predictions to dataframe
    predictions_df = pd.DataFrame(user_predictions, columns=['uid', 'iid', 'r_ui', 'est', 'details'])
    
    # Get the top N recommendations for the user
    top_n = predictions_df.sort_values(by='est', ascending=False).head(5)
    
    # Merge with books dataframe to get book details
    top_n_with_details = pd.merge(top_n, books_df, left_on='iid', right_on='ISBN')

    top_n_with_details.drop_duplicates(subset=['ISBN'], inplace=True)
    recommendations = top_n_with_details['Book-Title'].values

    url = get_url(recommendations)

    return recommendations, url

#test = books_df.loc[books_df['User-ID'] == global_user_id, 'Book-Title'].iloc[3]


#hybrid recommendation system
def hybrid_recommender(user_id, n=6):
    final_dataset = books_df

    book_title = final_dataset.loc[final_dataset['User-ID'] == user_id, 'Book-Title'].iloc[3]

    user_pivot_table = final_dataset.pivot_table(index=["User-ID"], columns=["ISBN"], values="Book-Rating").fillna(0)
    
    user_id = random.choice(final_dataset["User-ID"].values)

    user_predictions = [svd_model.predict(user_id, book_id) for book_id in user_pivot_table.columns]
    predictions_df = pd.DataFrame(user_predictions, columns=['uid', 'iid', 'r_ui', 'est', 'details'])
    collaborative_rec = predictions_df.sort_values(by='est', ascending=False).head(n)['iid'].tolist()
    collaborative_rec_ = final_dataset[final_dataset['ISBN'].isin(collaborative_rec)]
    
    collaborative_rec1 = collaborative_rec_['Book-Title'].tolist()

    if book_title in final_dataset['Book-Title'].values:
        rating_counts = final_dataset['Book-Title'].value_counts()
        rare_books = rating_counts[rating_counts.values < 30].index
        if book_title in rare_books:
            random_books = final_dataset.sample(n)['Book-Title'].values
            urls = get_url(random_books)
            return random_books, urls
        else:
            common_books = final_dataset[~final_dataset['Book-Title'].isin(rare_books)].copy() 
            common_books.drop_duplicates(subset=['Book-Title'], inplace=True)
            common_books.reset_index(inplace=True)
            target_cols = ['Book-Title', 'Book-Author', 'Publisher', 'categories', 'description']
            common_books['combined_features'] = common_books[target_cols].agg(' '.join, axis=1)
            tfidf_vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = tfidf_vectorizer.fit_transform(common_books['combined_features'])
            book_indices = common_books[common_books['Book-Title'] == book_title].index
            if not book_indices.empty:
                book_index = book_indices[0]
                cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix[book_index])
                sim_scores = list(enumerate(cosine_sim))
                sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:n+1]
                content_based_rec = [common_books.iloc[score[0]]['Book-Title'] for score in sim_scores]
            else:
                return []
    else:
        return []

    combined_rec = {}
    for item in set(collaborative_rec1 + content_based_rec):
        collaborative_score = 1 if item in collaborative_rec else 0
        content_based_score = 1 if item in content_based_rec else 0
        mean_score = (collaborative_score + content_based_score) / 2
        combined_rec[item] = mean_score
    
    sorted_rec = sorted(combined_rec.items(), key=lambda x: x[1], reverse=True)
    top_n_rec = [rec[0] for rec in sorted_rec[:n]]
    h_url = get_url(top_n_rec)

    return top_n_rec, h_url

def home_page():
    # Add your home page content here
    st.title("Home Page")
    st.write(f"Welcome to the Tomrec! You are now logged in as User-ID {global_user_id}.")

    st.markdown('-----')

    st.subheader('Top Picks For You')
    h_recommended, h_url = hybrid_recommender(int(global_user_id))
    hy1, hy2, hy3, hy4, hy5 = st.columns(5)
    with hy1:
        st.image(h_url[0], caption= h_recommended[0])
    with hy2:
        st.image(h_url[1], caption= h_recommended[1])
    with hy3:
        st.image(h_url[2], caption= h_recommended[2])
    with hy4:
        st.image(h_url[3], caption= h_recommended[3])
    with hy5:
        st.image(h_url[4], caption= h_recommended[4])

    st.markdown('-----')

    st.subheader("👍👍  We Think You'll Love These")
    recommended, r_urls = collaborative_recommender(global_user_id)
    c1, c2, c3, c4, c5 = st.columns(5)
    with c1:
        st.image(r_urls[0], caption= recommended[0])
    with c2:
        st.image(r_urls[1], caption= recommended[1])
    with c3:
        st.image(r_urls[2], caption= recommended[2])
    with c4:
        st.image(r_urls[3], caption= recommended[3])
    with c5:
        st.image(r_urls[4], caption= recommended[4])

    st.markdown('-----')

    st.subheader('Most Popular Books')

    popular_books, urls = get_popular_books()

    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        st.image(urls[1], caption= popular_books[1])
    with col2:
        st.image(urls[2], caption= popular_books[2])
    with col3:
        st.image(urls[3], caption= popular_books[3])
    with col4:
        st.image(urls[4], caption= popular_books[4])
    with col5:
        st.image(urls[5], caption= popular_books[5])


def guest_page():

    # Add your home page content here
    st.title("Guest Page")

    st.write(f"Welcome to the Tomrec! You are now logged in as Guest User.")

    st.subheader('Most Popular Books')

    popular_books, urls = get_popular_books()

    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        st.image(urls[1], caption= popular_books[1])
    with col2:
        st.image(urls[2], caption= popular_books[2])
    with col3:
        st.image(urls[3], caption= popular_books[3])
    with col4:
        st.image(urls[4], caption= popular_books[4])
    with col5:
        st.image(urls[5], caption= popular_books[5])
