import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

export default function BusinessDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
  const [attendees, setAttendees] = useState(null);
  const [attendeesEventTitle, setAttendeesEventTitle] = useState('');
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, eventId: null });

  useEffect(() => { fetchMyEvents(); }, []);

  const fetchMyEvents = async () => {
    setLoading(true);
    try {
      const res = await API.get('/events/my');
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/events/${id}`);
      setEvents(prev => prev.filter(e => e._id !== id));
      showMsg('Event deleted successfully.');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to delete event.');
    }
  };

  const handleConfirmDelete = () => {
    handleDelete(confirmState.eventId);
    setConfirmState({ open: false, eventId: null });
  };

  const handleViewAttendees = async (event) => {
    setAttendeesLoading(true);
    setAttendeesEventTitle(event.title);
    setActiveTab('attendees');
    try {
      const res = await API.get(`/bookings/event/${event._id}`);
      setAttendees(res.data);
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to load attendees.');
      setAttendees(null);
    } finally {
      setAttendeesLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const statusColor = (status) => {
    if (status === 'approved') return { bg: '#c6f6d5', color: '#276749' };
    if (status === 'rejected') return { bg: '#fed7d7', color: '#9b2c2c' };
    return { bg: '#fefcbf', color: '#744210' };
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: 'DM Sans, sans-serif' }}>
      <Spinner message="Loading dashboard…" size="lg" />
    </div>
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.headerTitle}>Business Dashboard</h1>
          <p style={s.headerSub}>Welcome, {user?.name || 'Business'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={s.createBtn} onClick={() => navigate('/create-event')}>
            + Create Event
          </button>
        </div>
      </div>

      <div style={s.container}>

        {actionMsg && <div style={s.actionMsg}>{actionMsg}</div>}

        {/* Stats */}
        <div style={s.statsRow}>
          {[
            { label: 'Total Events', value: events.length,                                      color: '#805ad5' },
            { label: 'Approved',     value: events.filter(e => e.status === 'approved').length, color: '#38a169' },
            { label: 'Pending',      value: events.filter(e => e.status === 'pending').length,  color: '#dd6b20' },
            { label: 'Rejected',     value: events.filter(e => e.status === 'rejected').length, color: '#e53e3e' },
          ].map(stat => (
            <div key={stat.label} style={s.statCard}>
              <span style={{ ...s.statNum, color: stat.color }}>{stat.value}</span>
              <span style={s.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={s.tabRow}>
          <button
            style={{ ...s.tabBtn, ...(activeTab === 'events' ? s.tabActive : {}) }}
            onClick={() => setActiveTab('events')}
          >
            My Events
          </button>
          {attendees !== null && (
            <button
              style={{ ...s.tabBtn, ...(activeTab === 'attendees' ? s.tabActive : {}) }}
              onClick={() => setActiveTab('attendees')}
            >
              Attendees — {attendeesEventTitle}
            </button>
          )}
        </div>

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div style={s.section}>
            <h2 style={s.sectionTitle}>My Events</h2>
            {events.length === 0 ? (
              <EmptyState
                icon="📋"
                title="No events created yet"
                subtitle="You haven't created any events. Create your first event to get started!"
                action={
                  <button style={s.createBtn} onClick={() => navigate('/create-event')}>
                    Create your first event
                  </button>
                }
              />
            ) : (
              <div style={s.cardList}>
                {events.map(event => {
                  const sc = statusColor(event.status);
                  const isPast = new Date(event.date).getTime() < Date.now();
                  const hasBookings = (event.bookingsCount || 0) > 0;
                  const cannotDelete = isPast || hasBookings;
                  return (
                    <div key={event._id} style={s.eventCard}>
                      <div style={s.eventCardLeft}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                          <span style={s.categoryTag}>{event.category}</span>

                          <span style={{ ...s.statusPill, backgroundColor: sc.bg, color: sc.color }}>
                            {event.status}
                          </span>

                          {isPast && (
                            <span style={{ ...s.statusPill, backgroundColor: '#e2e8f0', color: '#718096' }}>
                              Past
                            </span>
                          )}
                        </div>
                        <h3 style={s.eventTitle}>{event.title}</h3>
                        <p style={s.eventMeta}>{event.city} — {event.venue}</p>
                        <p style={s.eventMeta}>
                          {new Date(event.date).toLocaleDateString('en-PK', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                        <p style={s.eventMeta}>
                          PKR {event.price?.toLocaleString()} &nbsp;·&nbsp;
                          {event.remainingCapacity}/{event.totalCapacity} seats remaining
                        </p>
                      </div>
                      <div style={s.eventCardActions}>
                        <button
                          style={isPast ? s.disabledBtn : s.editBtn}
                          onClick={() => !isPast && navigate(`/edit-event/${event._id}`)}
                          disabled={isPast}
                          title={isPast ? 'Cannot edit a past event' : 'Edit event'}
                        >
                          Edit
                        </button>
                        <button style={s.attendeesBtn} onClick={() => handleViewAttendees(event)}>
                          Attendees
                        </button>
                        <button
                          style={cannotDelete ? s.disabledBtn : s.deleteBtn}
                          onClick={() => !cannotDelete && setConfirmState({ open: true, eventId: event._id })}
                          disabled={cannotDelete}
                          title={
                            isPast
                              ? 'Cannot delete a past event'
                              : hasBookings
                              ? 'Cannot delete event with bookings'
                              : 'Delete event'
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Attendees Tab */}
        {activeTab === 'attendees' && (
          <div style={s.section}>
            <h2 style={s.sectionTitle}>Attendees — {attendeesEventTitle}</h2>
            {attendeesLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Spinner message="Loading attendees…" />
              </div>
            ) : !attendees || attendees.bookings?.length === 0 ? (
              <EmptyState
                icon="🎫"
                title="No bookings yet"
                subtitle="No confirmed bookings for this event yet."
              />
            ) : (
              <>
                <div style={s.attendeeSummary}>
                  <span style={s.attendeeCount}>
                    {attendees.totalBookings} confirmed booking{attendees.totalBookings !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={s.tableWrapper}>
                  <table style={s.table}>
                    <thead>
                      <tr style={s.tableHead}>
                        <th style={s.th}>Name</th>
                        <th style={s.th}>Email</th>
                        <th style={s.th}>Tickets</th>
                        <th style={s.th}>Ref</th>
                        <th style={s.th}>Booked On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees.bookings.map(b => (
                        <tr key={b._id} style={s.tableRow}>
                          <td style={s.td}>{b.user?.name || '—'}</td>
                          <td style={s.td}>{b.user?.email || '—'}</td>
                          <td style={s.td}>{b.quantity}</td>
                          <td style={s.td}><span style={s.refPill}>{b.bookingRef}</span></td>
                          <td style={s.td}>
                            {new Date(b.createdAt).toLocaleDateString('en-PK', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmState.open}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, eventId: null })}
      />
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f7f3ff', fontFamily: "'DM Sans', sans-serif" },
  header: {
    background: 'linear-gradient(135deg, #805ad5, #b794f4)',
    padding: '24px 32px', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', flexWrap: 'wrap', gap: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: '4px 0 0' },
  createBtn: {
    backgroundColor: '#fff', color: '#805ad5', border: 'none',
    borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 700,
  },
  container: { maxWidth: 1000, margin: '0 auto', padding: '24px 16px' },
  actionMsg: {
    backgroundColor: '#c6f6d5', border: '1px solid #9ae6b4', color: '#276749',
    borderRadius: 8, padding: '10px 16px', fontSize: 14, marginBottom: 16,
  },
  statsRow: { display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' },
  statCard: {
    flex: 1, minWidth: 100, backgroundColor: '#fff', borderRadius: 12,
    padding: '16px 20px', boxShadow: '0 2px 8px rgba(128,90,213,0.08)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  },
  statNum: { fontSize: 28, fontWeight: 700 },
  statLabel: { fontSize: 12, color: '#718096', fontWeight: 600, textAlign: 'center' },
  tabRow: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tabBtn: {
    padding: '8px 18px', borderRadius: 20, border: '1.5px solid #e2e8f0',
    backgroundColor: 'white', color: '#718096', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  tabActive: { backgroundColor: '#805ad5', color: '#fff', borderColor: '#805ad5' },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: '24px 20px', boxShadow: '0 2px 8px rgba(128,90,213,0.08)' },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#2d3748', marginBottom: 20, borderBottom: '2px solid #f7f3ff', paddingBottom: 12 },
  cardList: { display: 'flex', flexDirection: 'column', gap: 16 },
  eventCard: {
    border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    gap: 16, flexWrap: 'wrap', backgroundColor: '#fafafa',
  },
  eventCardLeft: { flex: 1 },
  categoryTag: {
    display: 'inline-block', backgroundColor: '#f0ebff', color: '#553c9a',
    borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600,
  },
  statusPill: { display: 'inline-block', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 },
  eventTitle: { fontSize: 16, fontWeight: 700, color: '#2d3748', margin: '0 0 6px' },
  eventMeta: { fontSize: 13, color: '#718096', margin: '2px 0' },
  eventCardActions: { display: 'flex', flexDirection: 'column', gap: 8, minWidth: 100 },
  editBtn: {
    backgroundColor: '#805ad5', color: '#fff', border: 'none',
    borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  attendeesBtn: {
    backgroundColor: 'transparent', color: '#805ad5',
    border: '1px solid #805ad5', borderRadius: 8,
    padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  deleteBtn: {
    backgroundColor: 'transparent', color: '#e53e3e',
    border: '1px solid #e53e3e', borderRadius: 8,
    padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  disabledBtn: {
    backgroundColor: '#e2e8f0',
    color: '#a0aec0',
    border: 'none',
    borderRadius: 8,
    padding: '7px 14px',
    cursor: 'not-allowed',
    fontSize: 13,
    fontWeight: 600,
  },
  attendeeSummary: { marginBottom: 16 },
  attendeeCount: { fontSize: 14, fontWeight: 700, color: '#805ad5' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  tableHead: { backgroundColor: '#f7f3ff' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tableRow: { borderBottom: '1px solid #f0ebff' },
  td: { padding: '12px 14px', color: '#2d3748', verticalAlign: 'middle' },
  refPill: {
    backgroundColor: '#f0ebff', color: '#553c9a',
    borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600,
  },
};