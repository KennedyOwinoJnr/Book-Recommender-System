import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Bookmark, History, Star } from 'lucide-react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import apiClient from '../api/client';

const CatalogPage = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Search parameters
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [bookDetails, setBookDetails] = useState(null);
  const [ratingValue, setRatingValue] = useState(8);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [currentPage, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/books/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      let url = `/books?page=${currentPage}&size=20`;
      if (query) url += `&query=${encodeURIComponent(query)}`;
      if (selectedCategory) url += `&category=${encodeURIComponent(selectedCategory)}`;

      const res = await apiClient.get(url);
      setBooks(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchBooks();
  };

  const handleOpenBookDetails = async (id) => {
    setActionMessage('');
    setActionError('');
    setSelectedBookId(id);
    setBookDetails(null);

    try {
      const res = await apiClient.get(`/books/${id}`);
      setBookDetails(res.data);
    } catch (err) {
      console.error(err);
      setActionError('Error loading book metadata details');
    }
  };

  const handleBorrow = async () => {
    if (!bookDetails) return;
    setActionMessage('');
    setActionError('');

    try {
      await apiClient.post('/borrowings', { bookId: bookDetails.id });
      setSelectedBookId(null);
      navigate('/my-borrowings', { 
        state: { 
          message: `Successfully borrowed "${bookDetails.title}"! Please collect it from the circulation desk.` 
        } 
      });
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to borrow book');
    }
  };

  const handleReserve = async () => {
    if (!bookDetails) return;
    setActionMessage('');
    setActionError('');

    try {
      await apiClient.post('/reservations', { bookId: bookDetails.id });
      setSelectedBookId(null);
      navigate('/my-reservations', { 
        state: { 
          message: `Successfully reserved "${bookDetails.title}"! You will be notified when stock returns.` 
        } 
      });
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reserve book');
    }
  };

  const handleRate = async () => {
    if (!bookDetails) return;
    setActionMessage('');
    setActionError('');

    try {
      await apiClient.post(`/books/${bookDetails.id}/ratings`, { rating: ratingValue });
      setActionMessage(`Rating of ${ratingValue}/10 submitted successfully!`);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div className="header-bar">
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Search Library Catalog</h1>
            <p style={{ color: 'hsl(var(--text-muted))' }}>Browse, search, and manage books available in our library</p>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <form onSubmit={handleSearchSubmit} className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={{ flexGrow: 1, position: 'relative', minWidth: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
            <input 
              type="text" 
              className="form-control" 
              style={{ paddingLeft: '2.5rem' }} 
              placeholder="Search by book title or author..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '200px' }}>
            <select 
              className="form-control"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(0);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        {/* Books Grid */}
        {loading ? (
          <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '5rem' }}>
            Searching database catalog...
          </div>
        ) : books.length === 0 ? (
          <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '5rem' }}>
            <h3>No books found matching your query.</h3>
          </div>
        ) : (
          <>
            <div className="book-grid">
              {books.map((book) => (
                <div 
                  key={book.id} 
                  className="card" 
                  style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', padding: '0.75rem' }}
                  onClick={() => handleOpenBookDetails(book.id)}
                >
                  <img 
                    src={book.imageUrlMedium || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop'} 
                    alt={book.title} 
                    className="book-cover"
                    style={{ height: '220px' }}
                  />
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={book.title}>
                    {book.title}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {book.author}
                  </p>
                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem' }}>
                      {book.stockAvailable > 0 ? (
                        <span className="badge badge-success" style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>Available</span>
                      ) : (
                        <span className="badge badge-danger" style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>Out</span>
                      )}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                      {book.yearOfPublication}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '3rem' }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem' }}
                >
                  <ChevronLeft size={16} />
                </button>
                
                <span style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>
                  Page {currentPage + 1} of {totalPages}
                </span>

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Book Details Modal */}
      {selectedBookId && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedBookId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedBookId(null)}>&times;</button>
            
            {bookDetails ? (
              <div>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
                  <img src={bookDetails.imageUrlLarge || bookDetails.imageUrlMedium} alt={bookDetails.title} style={{ width: '150px', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} />
                  <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{bookDetails.title}</h2>
                    <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '0.25rem' }}>by <strong>{bookDetails.author}</strong></p>
                    <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', marginBottom: '1rem' }}>Publisher: {bookDetails.publisher} ({bookDetails.yearOfPublication})</p>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                      {bookDetails.categories.map((c, i) => (
                        <span key={i} className="badge badge-primary">{c}</span>
                      ))}
                    </div>

                    <p style={{ fontSize: '0.95rem' }}>
                      Status:{' '}
                      {bookDetails.stockAvailable > 0 ? (
                        <span className="badge badge-success">In Stock ({bookDetails.stockAvailable} available)</span>
                      ) : (
                        <span className="badge badge-danger">Out of Stock (Hold Queue active)</span>
                      )}
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>Description</h4>
                  <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    {bookDetails.description || 'No description available for this book.'}
                  </p>
                </div>

                {actionMessage && (
                  <div style={{ background: 'hsla(142, 70%, 45%, 0.1)', color: 'hsl(var(--success))', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                    {actionMessage}
                  </div>
                )}
                {actionError && (
                  <div style={{ background: 'hsla(0, 84%, 60%, 0.1)', color: 'hsl(var(--danger))', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                    {actionError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
                  {bookDetails.stockAvailable > 0 ? (
                    <button onClick={handleBorrow} className="btn btn-primary">
                      Borrow Book
                    </button>
                  ) : (
                    <button onClick={handleReserve} className="btn btn-primary" style={{ backgroundColor: 'hsl(var(--accent))' }}>
                      Reserve Book / Place Hold
                    </button>
                  )}

                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>My Rating:</span>
                    <select 
                      value={ratingValue} 
                      onChange={(e) => setRatingValue(parseInt(e.target.value))}
                      className="form-control" 
                      style={{ width: '70px', padding: '0.4rem' }}
                    >
                      {[...Array(11).keys()].map(val => (
                        <option key={val} value={val}>{val}</option>
                      ))}
                    </select>
                    <button onClick={handleRate} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                      Rate
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'hsl(var(--text-muted))' }}>
                {actionError ? actionError : 'Loading book details...'}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </DashboardLayout>
  );
};

export default CatalogPage;
