import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import apiClient from '../api/client';

const LandingPage = () => {
  const [popularBooks, setPopularBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/recommendations/popular?limit=6')
      .then(res => { setPopularBooks(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="landing-root">

      {/* ── Navbar ── */}
      <header className="landing-nav">
        <div className="landing-logo">
          <BookOpen size={26} style={{ color: 'hsl(var(--secondary))' }} />
          <span>Tomrec</span>
        </div>
        <div className="landing-nav-actions">
          <Link to="/login" className="btn btn-secondary landing-nav-btn">
            <LogIn size={15} />
            <span>Login</span>
          </Link>
          <Link to="/register" className="btn btn-primary landing-nav-btn">
            <UserPlus size={15} />
            <span>Register</span>
          </Link>
        </div>
      </header>

      {/* ── Hero — fills full viewport below navbar ── */}
      <section className="landing-hero fade-in">
        <div className="landing-hero-inner">
          <span className="badge badge-primary landing-badge">
            <Sparkles size={11} style={{ marginRight: '0.25rem' }} />
            Machine Learning Powered
          </span>

          <h1 className="landing-h1">
            Discover Your<br className="landing-br" /> Next Great Read
          </h1>

          <p className="landing-subtitle">
            Tomrec is a next-generation Library Management System using
            collaborative SVD algorithms and TF-IDF content filtering to
            deliver tailored recommendations.
          </p>

          <div className="landing-cta-group">
            <Link to="/register" className="btn btn-primary landing-cta-btn">
              Create Free Account
            </Link>
            <Link to="/catalog" className="btn btn-secondary landing-cta-btn">
              Explore Catalog
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="landing-features-grid">
            <div className="card landing-feature-card">
              <Sparkles size={30} style={{ color: 'hsl(var(--secondary))', marginBottom: '1rem' }} />
              <h3 className="landing-feature-title">SVD Recommender</h3>
              <p className="landing-feature-text">
                Collaborative SVD modeling trained on 1.1 million ratings with
                prediction MAE well below industry standards.
              </p>
            </div>
            <div className="card landing-feature-card">
              <BookOpen size={30} style={{ color: 'hsl(var(--primary))', marginBottom: '1rem' }} />
              <h3 className="landing-feature-title">Circulation Desk</h3>
              <p className="landing-feature-text">
                Borrow, return, and reserve titles in a unified interface.
                Overdue fines and holds are automatically dispatched.
              </p>
            </div>
            <div className="card landing-feature-card">
              <ShieldCheck size={30} style={{ color: 'hsl(var(--accent))', marginBottom: '1rem' }} />
              <h3 className="landing-feature-title">Secure Auditing</h3>
              <p className="landing-feature-text">
                Role-Based Access Control protecting user workflows with
                automated logs tracking all admin operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Popular Books ── */}
      <section className="landing-section landing-books-section">
        <div className="landing-container">
          <h2 className="landing-section-title">
            👍 Most Popular Books
          </h2>
          {loading ? (
            <div className="landing-loading">Loading popular books…</div>
          ) : (
            <div className="rec-carousel">
              {popularBooks.map((book, idx) => (
                <div key={idx} className="rec-item card landing-book-card">
                  <img src={book.image_url} alt={book.title} className="book-cover" />
                  <p className="landing-book-title" title={book.title}>{book.title}</p>
                  <p className="landing-book-sub">Popular choice</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <p>© 2026 Tomrec Library Systems. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
