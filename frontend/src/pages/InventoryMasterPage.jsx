import React, { useEffect, useState } from 'react';
import { Database, Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import apiClient from '../api/client';

const InventoryMasterPage = () => {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    yearOfPublication: '',
    description: '',
    pageCount: '',
    language: 'en',
    maturityRating: 'NOT_MATURE',
    imageUrlLarge: '',
    stockTotal: '1',
    categories: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBooks();
  }, [currentPage]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      let url = `/books?page=${currentPage}&size=10`;
      if (query) url += `&query=${encodeURIComponent(query)}`;
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

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      isbn: '',
      title: '',
      author: '',
      publisher: '',
      yearOfPublication: new Date().getFullYear().toString(),
      description: '',
      pageCount: '250',
      language: 'en',
      maturityRating: 'NOT_MATURE',
      imageUrlLarge: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop',
      stockTotal: '5',
      categories: 'General',
    });
    setError('');
    setMessage('');
    setShowModal(true);
  };

  const handleOpenEdit = (book) => {
    setEditId(book.id);
    setFormData({
      isbn: book.isbn,
      title: book.title,
      author: book.author || '',
      publisher: book.publisher || '',
      yearOfPublication: (book.yearOfPublication || '').toString(),
      description: book.description || '',
      pageCount: (book.pageCount || '').toString(),
      language: book.language || 'en',
      maturityRating: book.maturityRating || 'NOT_MATURE',
      imageUrlLarge: book.imageUrlLarge || '',
      stockTotal: (book.stockTotal || 1).toString(),
      categories: book.categories ? book.categories.join(', ') : '',
    });
    setError('');
    setMessage('');
    setShowModal(true);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    setError('');
    setMessage('');

    try {
      await apiClient.delete(`/books/${id}`);
      setMessage('Book deleted successfully.');
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete book');
    }
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const payload = {
        ...formData,
        yearOfPublication: formData.yearOfPublication ? parseInt(formData.yearOfPublication) : null,
        pageCount: formData.pageCount ? parseInt(formData.pageCount) : null,
        stockTotal: formData.stockTotal ? parseInt(formData.stockTotal) : 1,
        categories: formData.categories.split(',').map(c => c.trim()).filter(c => c !== ''),
      };

      if (editId) {
        await apiClient.put(`/books/${editId}`, payload);
        setMessage('Book catalog updated successfully.');
      } else {
        await apiClient.post('/books', payload);
        setMessage('New book registered in catalog successfully.');
      }
      setShowModal(false);
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred while saving book details');
    }
  };

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div className="header-bar">
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={28} />
              <span>Inventory Master catalog</span>
            </h1>
            <p style={{ color: 'hsl(var(--text-muted))' }}>Manage, edit, add, and register book titles in the library inventory system</p>
          </div>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} />
            <span>Add New Book</span>
          </button>
        </div>

        {message && (
          <div style={{ background: 'hsla(142, 70%, 45%, 0.1)', color: 'hsl(var(--success))', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ background: 'hsla(0, 84%, 60%, 0.1)', color: 'hsl(var(--danger))', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={{ flexGrow: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
            <input 
              type="text" 
              className="form-control" 
              style={{ paddingLeft: '2.5rem' }} 
              placeholder="Search catalog by title/author..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>

        {/* Data Table */}
        {loading ? (
          <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '5rem' }}>
            Retrieving inventory books...
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>ISBN</th>
                  <th>Publisher</th>
                  <th>Year</th>
                  <th>Stock (Total / Available)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td>
                      <img src={book.imageUrlSmall || book.imageUrlMedium} alt="" style={{ width: '40px', height: '55px', objectFit: 'cover', borderRadius: '4px' }} />
                    </td>
                    <td style={{ fontWeight: 600, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={book.title}>
                      {book.title}
                    </td>
                    <td>{book.author}</td>
                    <td>{book.isbn}</td>
                    <td>{book.publisher}</td>
                    <td>{book.yearOfPublication}</td>
                    <td>
                      {book.stockTotal} / <span style={{ fontWeight: 'bold', color: book.stockAvailable > 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>{book.stockAvailable}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleOpenEdit(book)} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '6px' }}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(book.id, book.title)} className="btn btn-danger" style={{ padding: '0.4rem', borderRadius: '6px', backgroundColor: 'hsl(var(--danger))' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
              {editId ? 'Edit Book Details' : 'Register New Book Item'}
            </h2>

            <form onSubmit={handleFormSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">ISBN Code</label>
                  <input 
                    type="text" 
                    name="isbn" 
                    className="form-control" 
                    value={formData.isbn} 
                    onChange={handleFormChange} 
                    disabled={!!editId}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Book Title</label>
                  <input 
                    type="text" 
                    name="title" 
                    className="form-control" 
                    value={formData.title} 
                    onChange={handleFormChange} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Book Author</label>
                  <input 
                    type="text" 
                    name="author" 
                    className="form-control" 
                    value={formData.author} 
                    onChange={handleFormChange} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Publisher</label>
                  <input 
                    type="text" 
                    name="publisher" 
                    className="form-control" 
                    value={formData.publisher} 
                    onChange={handleFormChange} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Publication Year</label>
                  <input 
                    type="number" 
                    name="yearOfPublication" 
                    className="form-control" 
                    value={formData.yearOfPublication} 
                    onChange={handleFormChange} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Page Count</label>
                  <input 
                    type="number" 
                    name="pageCount" 
                    className="form-control" 
                    value={formData.pageCount} 
                    onChange={handleFormChange} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Count (Total)</label>
                  <input 
                    type="number" 
                    name="stockTotal" 
                    className="form-control" 
                    value={formData.stockTotal} 
                    onChange={handleFormChange} 
                    min="1"
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Categories / Tags (comma separated)</label>
                <input 
                  type="text" 
                  name="categories" 
                  className="form-control" 
                  placeholder="Fiction, Mystery, Classics"
                  value={formData.categories} 
                  onChange={handleFormChange} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cover Image URL (Large)</label>
                <input 
                  type="text" 
                  name="imageUrlLarge" 
                  className="form-control" 
                  value={formData.imageUrlLarge} 
                  onChange={handleFormChange} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Synopsis</label>
                <textarea 
                  name="description" 
                  className="form-control" 
                  rows="4"
                  value={formData.description} 
                  onChange={handleFormChange}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </DashboardLayout>
  );
};

export default InventoryMasterPage;
