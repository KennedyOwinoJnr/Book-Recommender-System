import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, LogIn, UserPlus } from 'lucide-react';
import apiClient from '../api/client';

const LandingPage = () => {
  const [popularBooks, setPopularBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch popular books
    apiClient.get('/recommendations/popular?limit=6')
      .then(res => {
        setPopularBooks(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% -20%, hsla(262, 80%, 55%, 0.15), transparent 70%), hsl(var(--bg))' }}>
      {/* Header navbar */}
      <header style={{ borderBottom: '1px solid hsl(var(--border))', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.5rem', background: 'linear-gradient(135deg, white, hsl(var(--secondary)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          <BookOpen size={28} className="text-secondary" style={{ color: 'hsl(var(--secondary))' }} />
          <span>Tomrec</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
            <LogIn size={16} />
            <span>Login</span>
          </Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
            <UserPlus size={16} />
            <span>Register</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }} className="fade-in">
        <div style={{ marginBottom: '3rem' }}>
          <span className="badge badge-primary" style={{ marginBottom: '1rem', letterSpacing: '0.05em' }}>
            <Sparkles size={12} style={{ marginRight: '0.25rem' }} />
            Machine Learning Powered
          </span>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 850, lineHeight: 1.1, marginBottom: '1.5rem', background: 'linear-gradient(to right, #fff, hsl(var(--text-muted)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Discover Your Next Great Read
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'hsl(var(--text-muted))', maxWidth: '650px', margin: '0 auto 2.5rem', fontWeight: 400 }}>
            Tomrec is a next-generation Library Management System utilizing advanced collaborative SVD algorithms and TF-IDF content filtering to deliver tailored recommendations.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.05rem' }}>
              Create Free Account
            </Link>
            <Link to="/catalog" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.05rem' }}>
              Explore Catalog
            </Link>
          </div>
        </div>

        {/* Features Row */}
        <div className="dashboard-grid" style={{ margin: '4rem 0' }}>
          <div className="card" style={{ textAlign: 'left' }}>
            <div style={{ color: 'hsl(var(--secondary))', marginBottom: '1rem' }}>
              <Sparkles size={32} />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>SVD Recommender</h3>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
              Collaborative SVD modeling trained on 1.1 million ratings guarantees a prediction MAE well below industry standards.
            </p>
          </div>

          <div className="card" style={{ textAlign: 'left' }}>
            <div style={{ color: 'hsl(var(--primary))', marginBottom: '1rem' }}>
              <BookOpen size={32} />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Circulation Desk</h3>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
              Borrow, return, and reserve titles in a single unified interface. Overdue fines and holds are automatically dispatched.
            </p>
          </div>

          <div className="card" style={{ textAlign: 'left' }}>
            <div style={{ color: 'hsl(var(--accent))', marginBottom: '1rem' }}>
              <LogIn size={32} />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Secure Auditing</h3>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
              Role-Based Access Control protecting user workflows with automated logs tracking admin operations.
            </p>
          </div>
        </div>

        {/* Popular Books Carousel */}
        <section style={{ textAlign: 'left', marginTop: '5rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>👍 Most Popular Books</span>
          </h2>

          {loading ? (
            <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '3rem' }}>
              Loading popular books...
            </div>
          ) : (
            <div className="rec-carousel">
              {popularBooks.map((book, idx) => (
                <div key={idx} className="rec-item card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column' }}>
                  <img src={book.image_url} alt={book.title} className="book-cover" style={{ height: '200px' }} />
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={book.title}>
                    {book.title}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                    Popular choice
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer style={{ borderTop: '1px solid hsl(var(--border))', padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
        <p>&copy; 2026 Tomrec Library Systems. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
