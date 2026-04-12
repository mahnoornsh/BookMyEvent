import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import '../styles/auth.css';
import CATEGORIES from '../data/categories';

export default function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '', description: '', category: '',
    date: '', venue: '', city: '', totalCapacity: '', price: ''
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/events/${id}`)
      .then(res => {
        const e = res.data.event || res.data;
        setForm({
          title: e.title || '',
          description: e.description || '',
          category: e.category || '',
          date: e.date ? new Date(e.date).toISOString().slice(0, 16) : '',
          venue: e.venue || '',
          city: e.city || '',
          totalCapacity: e.totalCapacity?.toString() || '',
          price: e.price?.toString() || '',
        });
        setLoading(false);
      })
      .catch(() => {
        setMessage('Failed to load event.');
        setIsError(true);
        setLoading(false);
      });
  }, [id]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'price') {
      if (value === '') setErrors(prev => ({ ...prev, price: '' }));
      else if (!/^\d+$/.test(value) || parseInt(value) <= 0)
        setErrors(prev => ({ ...prev, price: 'Price must be a positive whole number' }));
      else setErrors(prev => ({ ...prev, price: '' }));
    }
    if (name === 'totalCapacity') {
      if (value === '') setErrors(prev => ({ ...prev, totalCapacity: '' }));
      else if (!/^\d+$/.test(value) || parseInt(value) <= 0)
        setErrors(prev => ({ ...prev, totalCapacity: 'Capacity must be a positive whole number' }));
      else setErrors(prev => ({ ...prev, totalCapacity: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.category) newErrors.category = 'Please select a category';
    if (!form.price || !/^\d+$/.test(form.price) || parseInt(form.price) <= 0)
      newErrors.price = 'Price must be a positive whole number';
    if (!form.totalCapacity || !/^\d+$/.test(form.totalCapacity) || parseInt(form.totalCapacity) <= 0)
      newErrors.totalCapacity = 'Capacity must be a positive whole number';
    return newErrors;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      await API.patch(`/events/${id}`, {
        ...form,
        totalCapacity: parseInt(form.totalCapacity),
        price: parseInt(form.price),
      });
      setIsError(false);
      setMessage('Event updated successfully!');
      setTimeout(() => navigate('/business/dashboard'), 1500);
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || 'Failed to update event.');
    }
  };

  const inputStyle = {
    padding: '0.78rem 1rem', border: '1.5px solid #f0d4db',
    borderRadius: '16px', fontFamily: 'DM Sans, sans-serif',
    fontSize: '0.95rem', color: '#1c1c2e', background: '#fafafa',
    outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  const errorInputStyle = { ...inputStyle, border: '1.5px solid #c0243c', background: '#fff0f2' };
  const fieldErrorStyle = { color: '#c0243c', fontSize: '0.78rem', marginTop: '4px' };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: 'DM Sans, sans-serif', color: '#805ad5', fontSize: 18 }}>
      Loading event...
    </div>
  );

  return (
    <div className="auth-page">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div className="auth-logo">
          <span className="logo-icon">🎟</span>
          <span className="logo-text">BookMyEvent</span>
        </div>
        <h2 className="auth-title">Edit Event</h2>
        <p className="auth-subtitle">Update your event details</p>

        {message && (
          <div className={isError ? 'auth-error' : ''} style={!isError ? {
            background: '#e8f5e9', border: '1px solid #a5d6a7', color: '#2e7d32',
            borderRadius: '10px', padding: '0.7rem 1rem', fontSize: '0.87rem',
            textAlign: 'center', marginBottom: '1rem'
          } : {}}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label>Event Title</label>
            <input name="title" value={form.title} style={inputStyle} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input name="description" value={form.description} style={inputStyle} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={form.category} onChange={handleChange} style={errors.category ? errorInputStyle : inputStyle} required>
              <option value="">Select a category...</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            {errors.category && <span style={fieldErrorStyle}>{errors.category}</span>}
          </div>
          <div className="form-group">
            <label>Date & Time</label>
            <input name="date" type="datetime-local" value={form.date} style={inputStyle} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Venue</label>
            <input name="venue" value={form.venue} style={inputStyle} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>City</label>
            <input name="city" value={form.city} style={inputStyle} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Total Capacity</label>
            <input name="totalCapacity" value={form.totalCapacity} style={errors.totalCapacity ? errorInputStyle : inputStyle} onChange={handleChange} required />
            {errors.totalCapacity && <span style={fieldErrorStyle}>{errors.totalCapacity}</span>}
          </div>
          <div className="form-group">
            <label>Price (Rs.)</label>
            <input name="price" value={form.price} style={errors.price ? errorInputStyle : inputStyle} onChange={handleChange} required />
            {errors.price && <span style={fieldErrorStyle}>{errors.price}</span>}
          </div>
          <button type="submit" className="auth-btn">Save Changes</button>
          <button type="button" onClick={() => navigate('/business/dashboard')} style={{ marginTop: 10, width: '100%', padding: '0.9rem', background: 'transparent', color: '#e8547a', border: '1.5px solid #e8547a', borderRadius: '16px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
