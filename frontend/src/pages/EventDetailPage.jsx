import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { createBooking } from '../api/bookings';
import { useAuth } from '../context/AuthContext';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const canBook = isAuthenticated && role === 'user';

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  //booking flow state
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState('details'); // 'details' | 'payment' | 'confirmed'
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await API.get(`/events/${id}`);
        setEvent(res.data.event || res.data);
      } catch (err) {
        setError('Failed to load event. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const isSoldOut = event && event.remainingCapacity <= 0;
  const maxQty = event ? Math.min(10, event.remainingCapacity || 0) : 1;

  //  ser clicks Book Now → go to mock payment
  const handleBookNow = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setBookingError('');
    setStep('payment');
  };

  // user confirms on mock payment page → call backend
  const handleConfirmPayment = async () => {
    setBookingLoading(true);
    setBookingError('');
    try {
      const res = await createBooking(id, quantity);
      setConfirmedBooking(res.data.booking || res.data);
      setStep('confirmed');
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed. Please try again.';
      setBookingError(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  // loading & error states
  if (loading) {
    return (
      <div style={styles.center}>
        <p style={styles.loadingText}>Loading event...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={styles.center}>
        <p style={styles.errorText}>{error || 'Event not found.'}</p>
        <button style={styles.backBtn} onClick={() => navigate('/home')}>
          ← Back to Events
        </button>
      </div>
    );
  }

  //booking confirmed screen 
  if (step === 'confirmed' && confirmedBooking) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.confirmedCard}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.confirmedTitle}>Booking Confirmed!</h2>
          <p style={styles.confirmedRef}>
            Ref: <strong>{confirmedBooking.bookingRef}</strong>
          </p>
          <div style={styles.confirmedDetails}>
            <p><strong>Event:</strong> {event.title}</p>
            <p><strong>Tickets:</strong> {confirmedBooking.quantity}</p>
            <p>
              <strong>Total Paid:</strong> PKR{' '}
              {confirmedBooking.pricePaid?.toLocaleString() || '—'}
            </p>
            <p>
              <strong>Status:</strong>{' '}
              <span style={styles.statusBadge}>{confirmedBooking.status}</span>
            </p>
          </div>
          <button
            style={styles.primaryBtn}
            onClick={() => navigate('/dashboard')}
          >
            View My Bookings
          </button>
          <button
            style={{ ...styles.secondaryBtn, marginTop: 10 }}
            onClick={() => navigate('/home')}
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  // mock payment screen 
  if (step === 'payment') {
    const total = (event.price || 0) * quantity;
    return (
      <div style={styles.wrapper}>
        <div style={styles.paymentCard}>
          <h2 style={styles.paymentTitle}>Confirm Your Booking</h2>

          <div style={styles.orderSummary}>
            <h3 style={styles.summaryHeading}>Order Summary</h3>
            <p style={styles.summaryEvent}>{event.title}</p>
            <p style={styles.summaryMeta}>
              {new Date(event.date).toLocaleDateString('en-PK', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
            <p style={styles.summaryMeta}>{event.venue}, {event.city}</p>
            <div style={styles.summaryRow}>
              <span>Price per ticket</span>
              <span>PKR {(event.price || 0).toLocaleString()}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Quantity</span>
              <span>× {quantity}</span>
            </div>
            <div style={{ ...styles.summaryRow, ...styles.totalRow }}>
              <span>Total</span>
              <span>PKR {total.toLocaleString()}</span>
            </div>
          </div>

          <div style={styles.mockPayment}>
            <p style={styles.mockNote}>
              🔒 Payment processing is not available in this version.
              Click confirm to complete your booking.
            </p>
          </div>

          {bookingError && <p style={styles.errorText}>{bookingError}</p>}

          <button
            style={bookingLoading ? styles.disabledBtn : styles.primaryBtn}
            onClick={handleConfirmPayment}
            disabled={bookingLoading}
          >
            {bookingLoading ? 'Processing...' : `Confirm Booking — PKR ${total.toLocaleString()}`}
          </button>
          <button
            style={{ ...styles.secondaryBtn, marginTop: 10 }}
            onClick={() => setStep('details')}
            disabled={bookingLoading}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  //event details screen
  const capacityPercent = event.totalCapacity
    ? Math.round(((event.totalCapacity - (event.remainingCapacity || 0)) / event.totalCapacity) * 100)
    : null;
  const categoryVisuals = {
    'Music':        { emoji: '🎵🎸🎤🎶', bg: 'linear-gradient(135deg, #9f7aea, #ccb2fa)' },
    'Sports':       { emoji: '⚽🏆🏅🎯', bg: 'linear-gradient(135deg, #55a77e, #80cb9d)' },
    'Comedy':       { emoji: '😂🎭🎪🤣', bg: 'linear-gradient(135deg, #c05621, #f6ad55)' },
    'Food & Drink': { emoji: '🍕🍜🍷🍰', bg: 'linear-gradient(135deg, #cb4d4d, #f9a9a9)' },
    'Arts & Culture':{ emoji: '🎨🖼️🎭✨', bg: 'linear-gradient(135deg, #2b6cb0, #63b3ed)' },
    'Theatre':      { emoji: '🎭🎬🎪🎠', bg: 'linear-gradient(135deg, #702459, #ed64a6)' },
    'Education':    { emoji: '📚🎓💡🔬', bg: 'linear-gradient(135deg, #2c5282, #76e4f7)' },
    'Networking':   { emoji: '🤝💼🌐📊', bg: 'linear-gradient(135deg, #1a365d, #4299e1)' },
    'Family':       { emoji: '👨‍👩‍👧‍👦🎠🎡🎢', bg: 'linear-gradient(135deg, #f6ad55, #fbd38d)' },
    'Other':        { emoji: '🎉🌟🎊✨', bg: 'linear-gradient(135deg, #553c9a, #b794f4)' },
  };

  const visual = categoryVisuals[event.category] || categoryVisuals['Other'];
  return (
    <div style={styles.wrapper}>
      {/* Back */}
      <button style={styles.backLink} onClick={() => navigate('/home')}>
        ← Back to Events
      </button>

      <div style={styles.detailCard}>
        {/* Hero block with visuals */}
        <div style={{ ...styles.heroBlock, background: visual.bg }}>
          <div style={styles.heroEmojis}>{visual.emoji}</div>

          <div style={styles.heroOverlay}>
            <span style={styles.categoryTag}>{event.category || 'Event'}</span>
            {isSoldOut && <span style={styles.soldOutBadge}>SOLD OUT</span>}
          </div>
        </div>

        {/* Main content */}
        <div style={styles.content}>
          <h1 style={styles.eventTitle}>{event.title}</h1>

          <div style={styles.metaGrid}>
            <div style={styles.metaItem}>
              <span style={styles.metaIcon}>📅</span>
              <span>
                {new Date(event.date).toLocaleDateString('en-PK', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaIcon}>📍</span>
              <span>{event.venue}, {event.city}</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaIcon}>🎟️</span>
              <span>PKR {(event.price || 0).toLocaleString()} per ticket</span>
            </div>
            {event.organizer && (
              <div style={styles.metaItem}>
                <span style={styles.metaIcon}></span>
                <span>Organised by {event.organizer?.name || 'Organizer'}</span>
              </div>
            )}
          </div>

          {/* Remaining capacity bar */}
          {!isSoldOut && event.remainingCapacity !== undefined && (
            <div style={styles.capacitySection}>
              <div style={styles.capacityHeader}>
                <span style={styles.capacityLabel}>Availability</span>
                <span
                  style={
                    event.remainingCapacity <= 10
                      ? styles.capacityLow
                      : styles.capacityOk
                  }
                >
                  {event.remainingCapacity <= 10
                    ? `⚠️ Only ${event.remainingCapacity} left!`
                    : `${event.remainingCapacity} tickets available`}
                </span>
              </div>
              {capacityPercent !== null && (
                <div style={styles.progressBg}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${capacityPercent}%`,
                      backgroundColor:
                        capacityPercent > 80 ? '#e53e3e' : capacityPercent > 50 ? '#dd6b20' : '#38a169',
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div style={styles.descSection}>
              <h3 style={styles.descHeading}>About this event</h3>
              <p style={styles.descText}>{event.description}</p>
            </div>
          )}

          {/* Booking panel */}
          {isSoldOut ? (
            <div style={styles.soldOutPanel}>
              <span style={styles.soldOutText}>This event is sold out</span>
            </div>
          ) : !canBook ? (
            <div style={styles.soldOutPanel}>
              <span style={{ color: '#718096', fontSize: 14 }}>
                {!isAuthenticated
                  ? 'Please login as a customer to book tickets.'
                  : 'Only customer accounts can book tickets.'}
              </span>
              {!isAuthenticated && (
                <button style={{ ...styles.primaryBtn, marginTop: 12 }} onClick={() => navigate('/login')}>
                  Login to Book
                </button>
              )}
            </div>
          ) : (
              <>
                <div style={styles.quantityRow}>
                  <label style={styles.qtyLabel}>Tickets</label>
                  <div style={styles.qtyStepper}>
                    <button
                      style={styles.stepBtn}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      −
                    </button>
                    <span style={styles.qtyValue}>{quantity}</span>
                    <button
                      style={styles.stepBtn}
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    >
                      +
                    </button>
                  </div>
                  <span style={styles.totalPrice}>
                    PKR {((event.price || 0) * quantity).toLocaleString()}
                  </span>
                </div>

                <button style={styles.primaryBtn} onClick={handleBookNow}>
                  {isAuthenticated ? 'Book Now' : 'Login to Book'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    backgroundColor: '#f7f3ff',
    padding: '24px 16px',
    fontFamily: "'DM Sans', sans-serif",
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: 16,
  },
  loadingText: { color: '#805ad5', fontSize: 18 },
  errorText: {
    color: '#e53e3e',
    backgroundColor: '#fff5f5',
    border: '1px solid #fed7d7',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 14,
    marginBottom: 8,
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: '#805ad5',
    cursor: 'pointer',
    fontSize: 15,
    marginBottom: 16,
    padding: 0,
  },
  backBtn: {
    backgroundColor: '#805ad5',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: 15,
  },
  detailCard: {
    maxWidth: 720,
    margin: '0 auto',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(128,90,213,0.12)',
  },
  heroBlock: {
    background: 'linear-gradient(135deg, #805ad5, #b794f4)',
    height: 200,
    position: 'relative',
    overflow: 'hidden'
  },
  heroEmojis: {
    position: 'absolute',
    fontSize: 56,
    opacity: 0.5,
    letterSpacing: 8,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    whiteSpace: 'nowrap',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
  },
  categoryTag: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    color: '#fff',
    borderRadius: 20,
    padding: '4px 14px',
    fontSize: 13,
    fontWeight: 600,
  },
  soldOutBadge: {
    backgroundColor: '#e53e3e',
    color: '#fff',
    borderRadius: 20,
    padding: '4px 14px',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
  },
  content: { padding: '24px 28px' },
  eventTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: '#2d3748',
    marginBottom: 20,
  },
  metaGrid: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 },
  metaItem: { display: 'flex', alignItems: 'center', gap: 10, color: '#4a5568', fontSize: 15 },
  metaIcon: { fontSize: 18 },
  capacitySection: { marginBottom: 20 },
  capacityHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  capacityLabel: { fontSize: 14, color: '#718096', fontWeight: 600 },
  capacityOk: { fontSize: 14, color: '#38a169', fontWeight: 600 },
  capacityLow: { fontSize: 14, color: '#e53e3e', fontWeight: 600 },
  progressBg: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, transition: 'width 0.3s ease' },
  descSection: { marginBottom: 24 },
  descHeading: { fontSize: 17, fontWeight: 700, color: '#2d3748', marginBottom: 8 },
  descText: { fontSize: 15, color: '#4a5568', lineHeight: 1.7 },
  bookingPanel: {
    borderTop: '1px solid #e2e8f0',
    paddingTop: 20,
    marginTop: 8,
  },
  soldOutPanel: {
    textAlign: 'center',
    padding: '20px 0',
  },
  soldOutText: {
    color: '#e53e3e',
    fontWeight: 700,
    fontSize: 16,
    border: '2px solid #e53e3e',
    borderRadius: 8,
    padding: '10px 24px',
  },
  quantityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  qtyLabel: { fontSize: 15, fontWeight: 600, color: '#2d3748' },
  qtyStepper: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 36,
    height: 36,
    border: 'none',
    backgroundColor: '#f7f3ff',
    color: '#805ad5',
    fontSize: 20,
    cursor: 'pointer',
    fontWeight: 700,
  },
  qtyValue: {
    width: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 600,
    color: '#2d3748',
  },
  totalPrice: { fontSize: 18, fontWeight: 700, color: '#805ad5', marginLeft: 'auto' },
  primaryBtn: {
    width: '100%',
    padding: '14px 0',
    backgroundColor: '#805ad5',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'block',
  },
  secondaryBtn: {
    width: '100%',
    padding: '12px 0',
    backgroundColor: 'transparent',
    color: '#805ad5',
    border: '2px solid #805ad5',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'block',
  },
  disabledBtn: {
    width: '100%',
    padding: '14px 0',
    backgroundColor: '#b794f4',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'not-allowed',
    display: 'block',
  },
  // Payment screen
  paymentCard: {
    maxWidth: 480,
    margin: '0 auto',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: '32px 28px',
    boxShadow: '0 4px 24px rgba(128,90,213,0.12)',
  },
  paymentTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#2d3748',
    marginBottom: 24,
    textAlign: 'center',
  },
  orderSummary: {
    backgroundColor: '#f7f3ff',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 24,
  },
  summaryHeading: { fontSize: 15, fontWeight: 700, color: '#805ad5', marginBottom: 10 },
  summaryEvent: { fontSize: 16, fontWeight: 700, color: '#2d3748', marginBottom: 4 },
  summaryMeta: { fontSize: 13, color: '#718096', marginBottom: 4 },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    color: '#4a5568',
    marginTop: 8,
  },
  totalRow: {
    borderTop: '1px solid #e2e8f0',
    marginTop: 10,
    paddingTop: 10,
    fontWeight: 700,
    fontSize: 16,
    color: '#2d3748',
  },
  mockPayment: { marginBottom: 20 },
  mockNote: {
    backgroundColor: '#fffbeb',
    border: '1px solid #f6e05e',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    color: '#744210',
    marginBottom: 16,
  },
  fakeField: { marginBottom: 12 },
  fakeLabel: { display: 'block', fontSize: 13, color: '#718096', marginBottom: 4, fontWeight: 600 },
  fakeInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 15,
    color: '#4a5568',
    backgroundColor: '#f7fafc',
    boxSizing: 'border-box',
  },
  fakeRow: { display: 'flex', gap: 12 },
  // confirmed screen
  confirmedCard: {
    maxWidth: 420,
    margin: '40px auto',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: '40px 28px',
    textAlign: 'center',
    boxShadow: '0 4px 24px rgba(128,90,213,0.12)',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    backgroundColor: '#c6f6d5',
    color: '#276749',
    fontSize: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    fontWeight: 700,
  },
  confirmedTitle: { fontSize: 24, fontWeight: 700, color: '#2d3748', marginBottom: 8 },
  confirmedRef: { fontSize: 14, color: '#718096', marginBottom: 20 },
  confirmedDetails: {
    textAlign: 'left',
    backgroundColor: '#f7f3ff',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontSize: 15,
    color: '#2d3748',
  },
  statusBadge: {
    backgroundColor: '#c6f6d5',
    color: '#276749',
    borderRadius: 20,
    padding: '2px 10px',
    fontSize: 13,
    fontWeight: 600,
  },
};