import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserBookings, cancelBooking } from '../api/bookings';
import { useAuth } from '../context/AuthContext';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getUserBookings();
      // Noor's API returns { bookings: [...] }
      setBookings(res.data.bookings || res.data || []);
    } catch (err) {
      setError('Failed to load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this booking? This cannot be undone.'
    );
    if (!confirmed) return;

    setCancellingId(bookingId);
    setCancelError('');
    try {
      await cancelBooking(bookingId);
      // Refresh the list after cancel
      await fetchBookings();
    } catch (err) {
      setCancelError(
        err.response?.data?.message || 'Failed to cancel booking. Please try again.'
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Split bookings by status ─────────────────────────────────────────────
  const upcomingBookings = bookings.filter((b) => b.status === 'confirmed');
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>My Dashboard</h1>
          <p style={styles.headerSub}>Welcome back, {user?.name || 'there'} 👋</p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.browseBtn} onClick={() => navigate('/home')}>
            Browse Events
          </button>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.container}>
        {/* Stats row */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{bookings.length}</span>
            <span style={styles.statLabel}>Total Bookings</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statNumber, color: '#38a169' }}>
              {upcomingBookings.length}
            </span>
            <span style={styles.statLabel}>Confirmed</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statNumber, color: '#e53e3e' }}>
              {cancelledBookings.length}
            </span>
            <span style={styles.statLabel}>Cancelled</span>
          </div>
        </div>

        {/* Error banners */}
        {error && <p style={styles.errorBanner}>{error}</p>}
        {cancelError && <p style={styles.errorBanner}>{cancelError}</p>}

        {/* Bookings section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>My Bookings</h2>

          {loading ? (
            <div style={styles.emptyState}>
              <p style={styles.loadingText}>Loading your bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🎟️</div>
              <p style={styles.emptyTitle}>No bookings yet</p>
              <p style={styles.emptySubtitle}>
                Discover and book events to see them here.
              </p>
              <button
                style={styles.primaryBtn}
                onClick={() => navigate('/home')}
              >
                Browse Events
              </button>
            </div>
          ) : (
            <div style={styles.bookingsList}>
              {bookings.map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onCancel={handleCancel}
                  cancelling={cancellingId === booking._id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Booking Card component ───────────────────────────────────────────────────
function BookingCard({ booking, onCancel, cancelling }) {
  const event = booking.event || {};
  const isCancelled = booking.status === 'cancelled';

  const eventDate = event.date ? new Date(event.date) : null;
  const isPast = eventDate && eventDate < new Date();

  const canCancel = !isCancelled && !isPast;

  return (
    <div
      style={{
        ...styles.bookingCard,
        opacity: isCancelled ? 0.65 : 1,
        borderLeft: `4px solid ${isCancelled ? '#e53e3e' : '#805ad5'}`,
      }}
    >
      <div style={styles.cardTop}>
        <div style={styles.cardLeft}>
          <h3 style={styles.cardEventTitle}>{event.title || 'Event'}</h3>
          <div style={styles.cardMeta}>
            {eventDate && (
              <span style={styles.metaPill}>
                📅{' '}
                {eventDate.toLocaleDateString('en-PK', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            )}
            {event.venue && (
              <span style={styles.metaPill}>
                📍 {event.venue}{event.city ? `, ${event.city}` : ''}
              </span>
            )}
          </div>
        </div>

        <span
          style={{
            ...styles.statusBadge,
            backgroundColor: isCancelled ? '#fed7d7' : '#c6f6d5',
            color: isCancelled ? '#9b2c2c' : '#276749',
          }}
        >
          {isCancelled ? 'Cancelled' : 'Confirmed'}
        </span>
      </div>

      <div style={styles.cardBottom}>
        <div style={styles.cardDetails}>
          <span style={styles.detailItem}>
            <strong>Ref:</strong> {booking.bookingRef}
          </span>
          <span style={styles.detailItem}>
            <strong>Qty:</strong> {booking.quantity} ticket{booking.quantity > 1 ? 's' : ''}
          </span>
          <span style={styles.detailItem}>
            <strong>Paid:</strong> PKR {booking.pricePaid?.toLocaleString() || '—'}
          </span>
          <span style={styles.detailItem}>
            <strong>Booked:</strong>{' '}
            {new Date(booking.createdAt).toLocaleDateString('en-PK', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        {canCancel && (
          <button
            style={cancelling ? styles.cancelBtnDisabled : styles.cancelBtn}
            onClick={() => onCancel(booking._id)}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        )}

        {isCancelled && (
          <span style={styles.cancelledNote}>This booking has been cancelled</span>
        )}

        {!isCancelled && isPast && (
          <span style={styles.pastNote}>Event has passed</span>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f7f3ff',
    fontFamily: "'DM Sans', sans-serif",
  },
  header: {
    background: 'linear-gradient(135deg, #a68edb, #c4aaef)',
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: '4px 0 0' },
  headerActions: { display: 'flex', gap: 10 },
  browseBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: 8,
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: 8,
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: 14,
  },
  container: { maxWidth: 800, margin: '0 auto', padding: '24px 16px' },
  statsRow: {
    display: 'flex',
    gap: 16,
    marginBottom: 28,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: '16px 20px',
    boxShadow: '0 2px 8px rgba(128,90,213,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  statNumber: { fontSize: 28, fontWeight: 700, color: '#805ad5' },
  statLabel: { fontSize: 13, color: '#718096', fontWeight: 600 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: '24px 20px',
    boxShadow: '0 2px 8px rgba(128,90,213,0.08)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#2d3748',
    marginBottom: 20,
    borderBottom: '2px solid #f7f3ff',
    paddingBottom: 12,
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#2d3748' },
  emptySubtitle: { fontSize: 14, color: '#718096', marginBottom: 12 },
  loadingText: { color: '#805ad5', fontSize: 16 },
  primaryBtn: {
    backgroundColor: '#805ad5',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 24px',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600,
    marginTop: 8,
  },
  bookingsList: { display: 'flex', flexDirection: 'column', gap: 16 },
  bookingCard: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: '16px 20px',
    border: '1px solid #e2e8f0',
    transition: 'box-shadow 0.2s',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  cardLeft: { flex: 1 },
  cardEventTitle: { fontSize: 16, fontWeight: 700, color: '#2d3748', marginBottom: 6 },
  cardMeta: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  metaPill: {
    backgroundColor: '#f7f3ff',
    color: '#553c9a',
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: 12,
    fontWeight: 500,
  },
  statusBadge: {
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  cardBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  cardDetails: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  detailItem: { fontSize: 13, color: '#4a5568' },
  cancelBtn: {
    backgroundColor: 'transparent',
    color: '#e53e3e',
    border: '1px solid #e53e3e',
    borderRadius: 8,
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  cancelBtnDisabled: {
    backgroundColor: 'transparent',
    color: '#fc8181',
    border: '1px solid #fc8181',
    borderRadius: 8,
    padding: '6px 14px',
    cursor: 'not-allowed',
    fontSize: 13,
    fontWeight: 600,
  },
  cancelledNote: { fontSize: 12, color: '#e53e3e', fontStyle: 'italic' },
  pastNote: { fontSize: 12, color: '#718096', fontStyle: 'italic' },
  errorBanner: {
    backgroundColor: '#fff5f5',
    border: '1px solid #fed7d7',
    color: '#c53030',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 14,
    marginBottom: 16,
  },
};