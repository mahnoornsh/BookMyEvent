import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import CATEGORIES from '../data/categories';

function EventCard({ event }) {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/events/${event._id}`)} style={{
      background: 'white', borderRadius: '16px', padding: '1.5rem',
      border: '1px solid #f0d4db', cursor: 'pointer',
      boxShadow: '0 4px 16px rgba(232,84,122,0.07)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      fontFamily: 'DM Sans, sans-serif'
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(232,84,122,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(232,84,122,0.07)'; }}
    >
      <div style={{ display: 'inline-block', background: '#fde8ee', color: '#e8547a', borderRadius: '20px', padding: '3px 12px', fontSize: '0.78rem', fontWeight: '600', marginBottom: '0.75rem' }}>
        {event.category}
      </div>
      <h3 style={{ margin: '0 0 6px', color: '#1c1c2e', fontFamily: 'Playfair Display, serif', fontSize: '1.1rem' }}>{event.title}</h3>
      <p style={{ margin: '0 0 4px', color: '#8a8aa0', fontSize: '0.87rem' }}>{event.city} — {event.venue}</p>
      <p style={{ margin: '0 0 12px', color: '#8a8aa0', fontSize: '0.87rem' }}>{new Date(event.date).toDateString()}</p>
      <p style={{ margin: 0, fontWeight: '700', color: '#e8547a', fontSize: '1rem' }}>Rs. {event.price}</p>
    </div>
  );
}

function HomePage() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/events')
      .then(res => { setEvents(res.data); setLoading(false); })
      .catch(() => { setError('Could not load events. Is your backend running?'); setLoading(false); });
  }, []);

  const filtered = events.filter(event => {
    //once admin approval is implemented, only approved events will appear here
    const matchesSearch =
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.city.toLowerCase().includes(search.toLowerCase()) ||
      event.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || event.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', color: '#8a8aa0', background: '#fff5f7' }}>
      Loading events...
    </div>
  );

  const toggleStyle = (cat) => ({
    padding: '0.45rem 1rem',
    borderRadius: '20px',
    border: '1.5px solid',
    borderColor: activeCategory === cat ? '#e8547a' : '#f0d4db',
    background: activeCategory === cat ? '#e8547a' : 'white',
    color: activeCategory === cat ? 'white' : '#8a8aa0',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #fff0f4 0%, #fce8ef 45%, #ffd8e6 100%)', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', color: '#1c1c2e', margin: '0 0 0.5rem' }}>
            Upcoming Events
          </h1>
          <p style={{ color: '#8a8aa0', fontSize: '1rem' }}>Discover what's happening around you</p>
        </div>

        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <input
            type="text"
            placeholder="Search by title, city or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '0.9rem 1.25rem 0.9rem 3rem',
              border: '1.5px solid #f0d4db', borderRadius: '16px',
              fontSize: '0.95rem', fontFamily: 'DM Sans, sans-serif',
              background: 'white', outline: 'none', boxSizing: 'border-box',
              boxShadow: '0 4px 16px rgba(232,84,122,0.07)'
            }}
          />
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem' }}>🔍</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <button style={toggleStyle('All')} onClick={() => setActiveCategory('All')}>All</button>
          {CATEGORIES.map(cat => (
            <button key={cat} style={toggleStyle(cat)} onClick={() => setActiveCategory(cat)}>{cat}</button>
          ))}
        </div>

        {error && <p style={{ color: '#c0243c', textAlign: 'center' }}>{error}</p>}

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#8a8aa0' }}>
            <p style={{ fontSize: '1.1rem' }}>No events found{activeCategory !== 'All' ? ` in ${activeCategory}` : ''}.</p>
            <button onClick={() => { setActiveCategory('All'); setSearch(''); }} style={{ marginTop: '1rem', background: 'none', border: '1.5px solid #f0d4db', borderRadius: '12px', padding: '0.5rem 1.25rem', color: '#e8547a', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: '600' }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {filtered.map(event => <EventCard key={event._id} event={event} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
