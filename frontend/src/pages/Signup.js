import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signupUser } from '../api/auth';
import '../styles/auth.css';

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const Signup = () => {
  const [role, setRole] = useState('customer');
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setForm({ fullName: '', email: '', password: '' });
    setShowPassword(false);
    setError('');
  };

  const validate = () => {
    if (!form.fullName.trim()) return 'Name is required.';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return 'A valid email is required.';
    if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const data = await signupUser({ ...form, role });
      login(data.user, data.token);
      if (role === 'business') navigate('/business/dashboard');
      else navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">🎟</span>
          <span className="logo-text">BookMyEvent</span>
        </div>

        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">Your social calendar awaits!</p>

        <div className="role-toggle">
          <button
            type="button"
            className={`role-btn ${role === 'customer' ? 'active' : ''}`}
            onClick={() => handleRoleChange('customer')}
          >
            Customer
          </button>
          <button
            type="button"
            className={`role-btn ${role === 'business' ? 'active' : ''}`}
            onClick={() => handleRoleChange('business')}
          >
            Business
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="fullName">
              {role === 'business' ? 'Business Name' : 'Full Name'}
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder={role === 'business' ? 'Enter your business name' : 'Enter your full name'}
              value={form.fullName}
              onChange={handleChange}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            <span className="field-hint">Minimum 6 characters</span>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Log in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Signup;