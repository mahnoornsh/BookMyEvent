import { useNavigate } from 'react-router-dom';

function EventCard({ event }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/events/${event._id}`)}
      style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '10px',
        padding: '1.25rem',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <h3 style={{ margin: '0 0 8px', color: '#1a1a2e' }}>{event.title}</h3>
      <p style={{ margin: '0 0 4px', color: '#666', fontSize: '14px' }}>{event.city} — {event.venue}</p>
      <p style={{ margin: '0 0 4px', color: '#666', fontSize: '14px' }}>{new Date(event.date).toDateString()}</p>
      <p style={{ margin: '8px 0 0', fontWeight: 'bold', color: '#534AB7' }}>Rs. {event.price}</p>
    </div>
  );
}

export default EventCard;
