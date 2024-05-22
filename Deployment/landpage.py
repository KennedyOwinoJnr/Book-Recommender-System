import streamlit as st
from PIL import Image



def landing_page():
    # Load the header image
    header_image = Image.open("images/Test.jpg")

    # Create a centered container
    col1, col2, col3 = st.columns([1, 3, 1])

    with col2:
        st.image(header_image, use_column_width=True)
        #st.title("Welcome to Tomrec!!")
        st.write("Discover your next great read with our personalized book recommendation system.")
        st.write("Just enter your preferences, and we'll suggest books tailored just for you.")

    # Footer
    st.markdown("""
        <div style='text-align: center; margin-top: 50px;'>
            <p>&copy; 2024 Tomrec. All rights reserved.</p>
        </div>
    """, unsafe_allow_html=True)


