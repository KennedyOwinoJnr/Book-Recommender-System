import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Star, History, Bookmark, Info, HelpCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import apiClient from '../api/client';

const MemberDashboard = () => {
  const navigate = useNavigate();
  const [hybridRecs, setHybridRecs] = useState([]);
  const [collabRecs, setCollabRecs] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [activeBorrowings, setActiveBorrowings] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Show all (Show More) toggle states
  const [showAllHybrid, setShowAllHybrid] = useState(false);
  const [showAllCollab, setShowAllCollab] = useState(false);
  const [showAllPopular, setShowAllPopular] = useState(false);

  // Modal State
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookDetails, setBookDetails] = useState(null);
  const [ratingValue, setRatingValue] = useState(8);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const [defaultLimit, setDefaultLimit] = useState(5);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 480;
      const isTablet = window.innerWidth <= 768;
      
      const sidebarWidth = 260; 
      const padding = isMobile ? 32 : (isTablet ? 48 : 80);
      const gap = isMobile ? 16 : 24;
      const cardWidth = isMobile ? 110 : (isTablet ? 140 : 180);
      
      const availableWidth = window.innerWidth - sidebarWidth - padding;
      const cardSpace = cardWidth + gap;
      
      const count = Math.max(5, Math.floor(availableWidth / cardSpace));
      setDefaultLimit(count);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [hybridRes, collabRes, popularRes, borrowRes, reservRes] = await Promise.all([
        apiClient.get('/recommendations/hybrid?limit=20'),
        apiClient.get('/recommendations/collaborative?limit=20'),
        apiClient.get('/recommendations/popular?limit=20'),
        apiClient.get('/borrowings/me/active'),
        apiClient.get('/reservations/me')
      ]);

      setHybridRecs(hybridRes.data);
      setCollabRecs(collabRes.data);
      setPopularBooks(popularRes.data);
      setActiveBorrowings(borrowRes.data);
      setReservations(reservRes.data);
    } catch (err) {
      console.error("Error loading dashboard content", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBookDetails = async (bookTitle) => {
    setActionMessage('');
    setActionError('');
    setSelectedBook(bookTitle);
    setBookDetails(null);

    try {
      // Find book by title in catalog search
      const res = await apiClient.get(`/books?query=${encodeURIComponent(bookTitle)}&size=1`);
      if (res.data.content && res.data.content.length > 0) {
        setBookDetails(res.data.content[0]);
      } else {
        setActionError('Book details not found in system catalog');
      }
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
      setSelectedBook(null);
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
      setSelectedBook(null);
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
      fetchDashboardData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  const visibleHybrid = showAllHybrid ? hybridRecs : hybridRecs.slice(0, defaultLimit);
  const visibleCollab = showAllCollab ? collabRecs : collabRecs.slice(0, defaultLimit);
  const visiblePopular = showAllPopular ? popularBooks : popularBooks.slice(0, defaultLimit);

  return (
    <DashboardLayout>
      <div className="fade-in">
        {/* Welcome Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 'clamp(1.4rem, 5vw, 2rem)', marginBottom: '0.5rem' }}>
            Welcome back, {user.username}!
          </h1>
          <p style={{ color: 'hsl(var(--text-muted))' }}>
            Explore your personalized portal and check your recommendations.
          </p>
        </div>

        {/* User Stats Row */}
        <div className="dashboard-grid">
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'hsla(192, 95%, 50%, 0.1)', color: 'hsl(var(--secondary))', padding: '0.75rem', borderRadius: '12px' }}>
              <History size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Active Loans</p>
              <h3 style={{ fontSize: '1.5rem' }}>{activeBorrowings.length} / 5</h3>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'hsla(320, 80%, 55%, 0.1)', color: 'hsl(var(--accent))', padding: '0.75rem', borderRadius: '12px' }}>
              <Bookmark size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Active Holds</p>
              <h3 style={{ fontSize: '1.5rem' }}>{reservations.length}</h3>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'hsla(38, 92%, 50%, 0.1)', color: 'hsl(var(--warning))', padding: '0.75rem', borderRadius: '12px' }}>
              <Star size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Fines Accrued</p>
              <h3 style={{ fontSize: '1.5rem' }}>
                ${activeBorrowings.reduce((sum, b) => sum + (b.fineAmount || 0), 0).toFixed(2)}
              </h3>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '5rem' }}>
            Loading your personal book recommendations...
          </div>
        ) : (
          <>
            {/* 1. Hybrid Picks */}
            <section style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={20} className="text-secondary" style={{ color: 'hsl(var(--secondary))' }} />
                  <span>Top Picks For You (Hybrid ML)</span>
                </h2>
                {hybridRecs.length > defaultLimit && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => setShowAllHybrid(!showAllHybrid)}
                  >
                    {showAllHybrid ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>
              <div className="rec-carousel">
                {visibleHybrid.map((rec, idx) => (
                  <div 
                    key={idx} 
                    className="rec-item card" 
                    style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                    onClick={() => handleOpenBookDetails(rec.title)}
                  >
                    <img src={rec.image_url} alt={rec.title} className="book-cover" />
                    <p style={{ fontWeight: 600, fontSize: '0.8rem', marginTop: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rec.title}>
                      {rec.title}
                    </p>
                    <p style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
                      {rec.reason || 'Hybrid Match'}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Collaborative picks */}
            <section style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Star size={20} style={{ color: 'hsl(var(--primary))' }} />
                  <span>We Think You'll Love These (Collaborative Filtering)</span>
                </h2>
                {collabRecs.length > defaultLimit && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => setShowAllCollab(!showAllCollab)}
                  >
                    {showAllCollab ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>
              <div className="rec-carousel">
                {visibleCollab.map((rec, idx) => (
                  <div 
                    key={idx} 
                    className="rec-item card" 
                    style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                    onClick={() => handleOpenBookDetails(rec.title)}
                  >
                    <img src={rec.image_url} alt={rec.title} className="book-cover" />
                    <p style={{ fontWeight: 600, fontSize: '0.8rem', marginTop: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rec.title}>
                      {rec.title}
                    </p>
                    <p style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
                      {rec.reason || 'SVD Predict'}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Popular Books */}
            <section style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bookmark size={20} style={{ color: 'hsl(var(--accent))' }} />
                  <span>Most Popular Books</span>
                </h2>
                {popularBooks.length > defaultLimit && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => setShowAllPopular(!showAllPopular)}
                  >
                    {showAllPopular ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>
              <div className="rec-carousel">
                {visiblePopular.map((rec, idx) => (
                  <div 
                    key={idx} 
                    className="rec-item card" 
                    style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                    onClick={() => handleOpenBookDetails(rec.title)}
                  >
                    <img src={rec.image_url} alt={rec.title} className="book-cover" />
                    <p style={{ fontWeight: 600, fontSize: '0.8rem', marginTop: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rec.title}>
                      {rec.title}
                    </p>
                    <p style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
                      Popular Choice
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Book Details Modal */}
      {selectedBook && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedBook(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedBook(null)}>&times;</button>
            
            {bookDetails ? (
              <div>
                <div className="modal-book-row" style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
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

                {/* Operations Message banner */}
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

                {/* Operations Section */}
                <div className="modal-actions" style={{ display: 'flex', gap: '1rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
                  {bookDetails.stockAvailable > 0 ? (
                    <button onClick={handleBorrow} className="btn btn-primary">
                      Borrow Book
                    </button>
                  ) : (
                    <button onClick={handleReserve} className="btn btn-primary" style={{ backgroundColor: 'hsl(var(--accent))' }}>
                      Reserve Book / Place Hold
                    </button>
                  )}

                  {/* Rating control */}
                  <div className="modal-rating" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

export default MemberDashboard;
