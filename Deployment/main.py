import streamlit as st
from PIL import Image
import landpage
import recomend
import bookshelf
import community
# Set the page configuration
st.set_page_config(page_title="Tomrec", page_icon=":books:", layout="wide")

# Initialize the page state
if 'page' not in st.session_state:
    st.session_state['page'] = 'landing'

# Check if the "Get Started" button is clicked
if st.button("Get Started"):
    st.session_state.page = 'login'  # Set the page state to 'login'

# Display the appropriate page based on the state
if st.session_state.page == 'landing':
    landpage.landing_page()  # Display the landing page
elif st.session_state.page == 'login':
    recomend.login()  # Display the login page
elif st.session_state.page == 'home':
    selected_option = st.sidebar.radio("Dashboard", ["Home", "Bookshelf", 'Community'])
    if selected_option == "Home":
        recomend.home_page()  # Display the home page
    elif selected_option == "Bookshelf":
        bookshelf.browse_books()  # Display the browse books functionality
    elif selected_option == "Community":
        community.build_community()
elif st.session_state.page == 'guest':
    selected_option = st.sidebar.radio("Dashboard", ["Home", "Bookshelf"])
    if selected_option == 'Bookshelf':
        bookshelf.browse_books()  # Display the browse books functionality
    elif selected_option == 'Home':
        recomend.guest_page()