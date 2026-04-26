import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

function Navbar() {
  const { isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: '#1a1a2e',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.75rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/home" style={{
        color: 'white', fontWeight: 'bold',
        fontSize: '1.2rem', textDecoration: 'none',
        fontFamily: 'Playfair Display, serif'
      }}>
        🎟 BookMyEvent
      </Link>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Link to="/home" style={{ color: '#a0a0c0', textDecoration: 'none', fontSize: '0.9rem' }}>
          Browse Events
        </Link>

        {isAuthenticated && role === 'business' && (
          <Link to="/create-event" style={{ color: '#a0a0c0', textDecoration: 'none', fontSize: '0.9rem' }}>
            Create Event
          </Link>
        )}

        {isAuthenticated && (
          <Link to={
            role === 'business' ? '/business/dashboard' :
            role === 'admin' ? '/admin/dashboard' :
            '/dashboard'
          } style={{ color: '#a0a0c0', textDecoration: 'none', fontSize: '0.9rem' }}>
            My Dashboard
          </Link>
        )}

        {isAuthenticated && <NotificationBell />}

        {!isAuthenticated ? (
          <>
            <Link to="/login" style={{
              color: 'white', textDecoration: 'none', fontSize: '0.9rem',
              background: '#e8547a', padding: '0.4rem 1rem',
              borderRadius: '20px', fontWeight: '600'
            }}>Login</Link>
            <Link to="/signup" style={{
              color: '#e8547a', textDecoration: 'none', fontSize: '0.9rem',
              border: '1.5px solid #e8547a', padding: '0.4rem 1rem',
              borderRadius: '20px', fontWeight: '600'
            }}>Sign Up</Link>
          </>
        ) : (
          <button onClick={handleLogout} style={{
            color: 'white', fontSize: '0.9rem',
            background: '#e8547a', padding: '0.4rem 1rem',
            borderRadius: '20px', fontWeight: '600',
            border: 'none', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif'
          }}>Logout</button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;