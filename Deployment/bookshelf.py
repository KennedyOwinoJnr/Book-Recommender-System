import streamlit as st
import pickle
import pandas as pd

with open('final_df.pkl', 'rb') as f:
    books_df = pickle.load(f)

# Function to display books as posters in a grid-like manner
def display_books_grid(books_df, num_books_per_page=20, num_columns=4):
    books = books_df.drop_duplicates(subset=['Book-Title']).dropna()  # Remove duplicate books and books with NaN values
    num_books = len(books)
    start_idx = st.session_state.get("start_idx", 0)  # Get the start index from session state
    end_idx = min(start_idx + num_books_per_page, num_books)  # Calculate the end index for the current page
    
    while start_idx < num_books:
        # Create columns for the posters
        cols = st.columns(num_columns)
        for idx in range(start_idx, end_idx):
            if idx >= num_books:
                break
            book = books.iloc[idx]
            # Display the book poster and title in the respective column
            with cols[idx % num_columns]:
                # Create a container for the book cover and details
                with st.container():
                    st.image(book["Image-URL-L"], use_column_width=True)
                    st.markdown(f"<div style='text-align: center;'>{book['Book-Title']}</div>", unsafe_allow_html=True)

                    # Pop-up modal with book details
                    with st.expander("Book Details", expanded=False):
                        st.markdown("""
                            <div style='background-color: #7F0000; color: white; padding: 10px; border-radius: 5px;'>
                                <p><strong>Author:</strong> {}</p>
                                <p><strong>Rating:</strong> {}</p>
                                <p><strong>Description:</strong> {}</p>
                            </div>
                        """.format(book['Book-Author'], book['Book-Rating'], book['description']), unsafe_allow_html=True)

        # Check if there are more books to display
        start_idx = end_idx
        end_idx = min(start_idx + num_books_per_page, num_books)
        if start_idx >= num_books:
            break

    # Create the "Show More" button outside the loop
    show_more = st.button("Show More", key="show_more_button")
    if show_more:
        st.session_state.start_idx += num_books_per_page  # Update start index in session state


# Function to handle browsing books functionality
def browse_books():
    st.title("Bookshelf")
    
    # Dropdown menu for selecting categories
    category = st.selectbox("Select Category", books_df['categories'].drop_duplicates().values)
    
    search_term = st.text_input('Search by Book Title or Author')

    # Filter books by category if selected
    if category:
        filtered_books = books_df[books_df['categories'] == category]
    else:
        filtered_books = books_df
    
    # Display books as posters in a grid-like manner
    if search_term:
        filtered_books = filtered_books[(filtered_books['Book-Title'].str.contains(search_term, case=False)) |
                                        (filtered_books['Book-Author'].str.contains(search_term, case=False))]
        if not filtered_books.empty:
            st.write('Search Results')
            display_books_grid(filtered_books)
        else:
            st.subheader('No matching books found.')
    else:
        display_books_grid(filtered_books)