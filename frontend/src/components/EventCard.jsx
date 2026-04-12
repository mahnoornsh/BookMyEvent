import { useNavigate } from 'react-router-dom';

export default function EventCard({ event }) {
  const navigate = useNavigate();
  const isSoldOut = event.remainingCapacity <= 0;

  const handleClick = () => {
    navigate(`/events/${event._id}`);
  };

  return (
    <div style={styles.card} onClick={handleClick}>
      {/* Colour header */}
      <div style={styles.cardHeader}>
        {isSoldOut && <span style={styles.soldOutBadge}>SOLD OUT</span>}
        <span style={styles.categoryBadge}>{event.category || 'Event'}</span>
      </div>

      <div style={styles.cardBody}>
        <h3 style={styles.title}>{event.title}</h3>

        <div style={styles.metaRow}>
          <span style={styles.metaText}>
            📅{' '}
            {new Date(event.date).toLocaleDateString('en-PK', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <span style={styles.metaText}>
            📍 {event.city || event.venue}
          </span>
        </div>

        <div style={styles.cardFooter}>
          <span style={styles.price}>
            {event.price === 0 ? 'Free' : `PKR ${event.price?.toLocaleString()}`}
          </span>

          {isSoldOut ? (
            <span style={styles.soldOutLabel}>Sold Out</span>
          ) : (
            <span style={styles.availableLabel}>
              {event.remainingCapacity !== undefined
                ? event.remainingCapacity <= 10
                  ? `⚠️ ${event.remainingCapacity} left`
                  : `${event.remainingCapacity} available`
                : 'Book Now →'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(128,90,213,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '1px solid #e2e8f0',
  },
  cardHeader: {
    background: 'linear-gradient(135deg, #805ad5, #b794f4)',
    height: 100,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '12px 14px',
  },
  soldOutBadge: {
    backgroundColor: '#e53e3e',
    color: '#fff',
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    color: '#fff',
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 600,
    marginLeft: 'auto',
  },
  cardBody: { padding: '14px 16px' },
  title: {
    fontSize: 15,
    fontWeight: 700,
    color: '#2d3748',
    marginBottom: 8,
    lineHeight: 1.3,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  metaRow: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 },
  metaText: { fontSize: 12, color: '#718096' },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #f0ebff',
    paddingTop: 10,
  },
  price: { fontSize: 15, fontWeight: 700, color: '#805ad5' },
  availableLabel: { fontSize: 12, color: '#38a169', fontWeight: 600 },
  soldOutLabel: {
    fontSize: 12,
    color: '#e53e3e',
    fontWeight: 700,
    backgroundColor: '#fff5f5',
    borderRadius: 20,
    padding: '2px 8px',
  },
};