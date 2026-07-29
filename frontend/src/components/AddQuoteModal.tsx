import React, { useState } from 'react';

interface AddQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newQuote: any) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AddQuoteModal: React.FC<AddQuoteModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [tag, setTag] = useState('wisdom');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !author.trim()) {
      setError('Please fill in both the quote text and author.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          author,
          tag,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save the quote');
      }

      const data = await response.json();
      
      // Save to LocalStorage so user can track their own added quotes responses
      const myCreated = JSON.parse(localStorage.getItem('fabulous-my-quotes') || '[]');
      if (!myCreated.includes(data.id)) {
        myCreated.push(data.id);
        localStorage.setItem('fabulous-my-quotes', JSON.stringify(myCreated));
      }

      onSuccess(data);
      setText('');
      setAuthor('');
      setTag('wisdom');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add a Custom Quote</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="modal-error">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="quote-text">Quote Text</label>
            <textarea
              id="quote-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your inspiring quote here..."
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="quote-author">Author</label>
            <input
              id="quote-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g., Albert Camus"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="quote-tag">Category / Tag</label>
            <select
              id="quote-tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            >
              <option value="wisdom">Wisdom</option>
              <option value="inspiration">Inspiration</option>
              <option value="motivation">Motivation</option>
              <option value="design">Design</option>
              <option value="tech">Tech</option>
              <option value="life">Life</option>
              <option value="general">General</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Add Quote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
