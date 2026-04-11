import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import '../styles/auth.css';

function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/events/${id}`)
      .then(res => { setEvent(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-screen">Loading event...</div>;
  if (!event) return <div className="loading-screen" style={{ color: '#c0243c' }}>Event not found.</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #fff0f4 0%, #fce8ef 45%, #ffd8e6 100%)', padding: '2rem 1rem', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', background: 'white', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 12px 48px rgba(232,84,122,0.13)', border: '1px solid #f0d4db' }}>

        <button onClick={() => navigate('/home')} style={{
          background: 'none', border: '1.5px solid #f0d4db', borderRadius: '12px',
          padding: '0.5rem 1.25rem', cursor: 'pointer', color: '#e8547a',
          fontFamily: 'DM Sans, sans-serif', fontWeight: '600', fontSize: '0.9rem',
          marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          ← Back to Events
        </button>

        <div style={{ display: 'inline-block', background: '#fde8ee', color: '#e8547a', borderRadius: '20px', padding: '4px 14px', fontSize: '0.82rem', fontWeight: '600', marginBottom: '1rem' }}>
          {event.category}
        </div>

        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', color: '#1c1c2e', margin: '0 0 0.5rem' }}>
          {event.title}
        </h1>

        <p style={{ color: '#8a8aa0', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          {event.city} — {event.venue}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Date', value: new Date(event.date).toDateString() },
            { label: 'Time', value: new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            { label: 'Capacity', value: `${event.totalCapacity} seats` },
            { label: 'Price', value: `Rs. ${event.price}` },
          ].map(item => (
            <div key={item.label} style={{ background: '#fff5f7', borderRadius: '12px', padding: '1rem', border: '1px solid #f0d4db' }}>
              <p style={{ fontSize: '0.75rem', color: '#8a8aa0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{item.label}</p>
              <p style={{ fontSize: '1rem', color: '#1c1c2e', fontWeight: '500', margin: 0 }}>{item.value}</p>
            </div>
          ))}
        </div>

        <p style={{ color: '#1c1c2e', lineHeight: '1.7', marginBottom: '2rem' }}>{event.description}</p>

        <button style={{
          width: '100%', padding: '0.9rem', background: '#e8547a', color: 'white',
          border: 'none', borderRadius: '16px', fontSize: '1rem', fontWeight: '600',
          cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          boxShadow: '0 4px 16px rgba(232,84,122,0.3)'
        }}>
          Book Now
        </button>
      </div>
    </div>
  );
}

export default EventDetailPage;
