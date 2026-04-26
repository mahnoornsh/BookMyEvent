import { useState, useContext } from 'react';
import API from '../api/axios';
import '../styles/auth.css';
import CATEGORIES from '../data/categories';
import AuthContext from '../context/AuthContext';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

function CreateEventPage() {
  const { user } = useContext(AuthContext);

  const [form, setForm] = useState({
    title: '', description: '', category: '',
    date: '', venue: '', city: '', totalCapacity: '', price: ''
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === 'price') {
      if (value === '') setErrors(prev => ({ ...prev, price: '' }));
      else if (!/^\d+$/.test(value) || parseInt(value) <= 0)
        setErrors(prev => ({ ...prev, price: 'Price must be a positive whole number (e.g. 500)' }));
      else setErrors(prev => ({ ...prev, price: '' }));
    }

    if (name === 'totalCapacity') {
      if (value === '') setErrors(prev => ({ ...prev, totalCapacity: '' }));
      else if (!/^\d+$/.test(value) || parseInt(value) <= 0)
        setErrors(prev => ({ ...prev, totalCapacity: 'Capacity must be a positive whole number (e.g. 200)' }));
      else setErrors(prev => ({ ...prev, totalCapacity: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.category) newErrors.category = 'Please select a category';
    if (!form.price || !/^\d+$/.test(form.price) || parseInt(form.price) <= 0)
      newErrors.price = 'Price must be a positive whole number (e.g. 500)';
    if (!form.totalCapacity || !/^\d+$/.test(form.totalCapacity) || parseInt(form.totalCapacity) <= 0)
      newErrors.totalCapacity = 'Capacity must be a positive whole number (e.g. 200)';
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
      const res = await API.post('/events', {
        ...form,
        totalCapacity: parseInt(form.totalCapacity),
        price: parseInt(form.price),
      });
      setIsError(false);
      setMessage(res.data.message || 'Event created!');
      setForm({ title: '', description: '', category: '', date: '', venue: '', city: '', totalCapacity: '', price: '' });
      setErrors({});
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || 'Failed to create event.');
    }
  };

  //block unapproved business accs before rendering form
  if (user && user.isApproved === false) {
    return (
      <div className="auth-page">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="pending-approval-banner">
          <span className="pending-icon">⏳</span>
          <h2>Account Pending Approval</h2>
          <p>
            Your business account is currently awaiting admin approval.
            You'll be able to create events once your account has been reviewed.
          </p>
        </div>
      </div>
    );
  }

  const inputStyle = {
    padding: '0.78rem 1rem',
    border: '1.5px solid #f0d4db',
    borderRadius: '16px',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '0.95rem',
    color: '#1c1c2e',
    background: '#fafafa',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const errorInputStyle = { ...inputStyle, border: '1.5px solid #c0243c', background: '#fff0f2' };
  const fieldErrorStyle = { color: '#c0243c', fontSize: '0.78rem', marginTop: '4px' };

  return (
    <div className="auth-page">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div className="auth-logo">
          <span className="logo-icon">🎟</span>
          <span className="logo-text">BookMyEvent</span>
        </div>
        <h2 className="auth-title">Create an Event</h2>
        <p className="auth-subtitle">Fill in the details and submit for admin approval</p>

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
            <input name="title" placeholder="e.g. Music Night at Arena" value={form.title} style={inputStyle} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input name="description" placeholder="Short description of the event" value={form.description} style={inputStyle} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              style={errors.category ? errorInputStyle : inputStyle}
              required
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <span style={fieldErrorStyle}>{errors.category}</span>}
          </div>

          <div className="form-group">
            <label>Date & Time</label>
            <input name="date" type="datetime-local" value={form.date} style={inputStyle} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Venue</label>
            <input name="venue" placeholder="e.g. Karachi Arena" value={form.venue} style={inputStyle} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>City</label>
            <input name="city" placeholder="e.g. Karachi" value={form.city} style={inputStyle} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Total Capacity</label>
            <input
              name="totalCapacity"
              placeholder="e.g. 200"
              value={form.totalCapacity}
              style={errors.totalCapacity ? errorInputStyle : inputStyle}
              onChange={handleChange}
              required
            />
            {errors.totalCapacity && <span style={fieldErrorStyle}>{errors.totalCapacity}</span>}
          </div>

          <div className="form-group">
            <label>Price (Rs.)</label>
            <input
              name="price"
              placeholder="e.g. 1500"
              value={form.price}
              style={errors.price ? errorInputStyle : inputStyle}
              onChange={handleChange}
              required
            />
            {errors.price && <span style={fieldErrorStyle}>{errors.price}</span>}
          </div>

          <button type="submit" className="auth-btn">Submit Event</button>
        </form>
      </div>
    </div>
  );
}

export default CreateEventPage;