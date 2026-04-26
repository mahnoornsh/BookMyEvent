import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('events');
  const [stats, setStats] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingBusinesses, setPendingBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, action: null, id: null });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, eventsRes, usersRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/events'),
        API.get('/admin/users'),
      ]);
      setStats(statsRes.data);
      setPendingEvents(eventsRes.data.filter(e => e.status === 'pending'));
      const allUsers = usersRes.data;
      setUsers(allUsers);
      setPendingBusinesses(allUsers.filter(u => u.role === 'business' && !u.isApproved));
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

  const approveEvent = async (id) => {
    try {
      await API.patch(`/events/${id}/approve`);
      showMsg('Event approved successfully.');
      fetchAll();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to approve event.');
    }
  };

  const rejectEvent = async (id) => {
    try {
      await API.patch(`/events/${id}/reject`);
      setPendingEvents(prev => prev.filter(e => e._id !== id));
      showMsg('Event rejected.');
      fetchAll();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to reject event.');
    }
  };

  const deactivateUser = async (id) => {
    try {
      await API.patch(`/admin/users/${id}/deactivate`);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isApproved: false } : u));
      showMsg('User deactivated.');
      fetchAll();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to deactivate user.');
    }
  };

  const approveBusiness = async (id) => {
    try {
      await API.patch(`/admin/businesses/${id}/approve`);
      setPendingBusinesses(prev => prev.filter(b => b._id !== id));
      showMsg('Business account approved.');
      fetchAll();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to approve business.');
    }
  };

  const rejectBusiness = async (id) => {
    try {
      await API.patch(`/admin/businesses/${id}/reject`);

      setPendingBusinesses(prev =>
        prev.filter(b => b._id !== id)
      );

      showMsg('Business application rejected.');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to reject business.');
    }
  };

  const handleConfirm = () => {
    const { action, id } = confirmState;
    if (action === 'rejectEvent') rejectEvent(id);
    if (action === 'deactivateUser') deactivateUser(id);
    if (action === 'rejectBusiness') rejectBusiness(id);
    setConfirmState({ open: false, action: null, id: null });
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return (
    <div style={s.center}>
      <Spinner message="Loading admin data…" size="lg" />
    </div>
  );

  const tabs = ['events', 'businesses', 'users'];

  const confirmMeta = {
    rejectEvent:    { title: 'Reject Event', message: 'Are you sure you want to reject this event?', label: 'Reject' },
    deactivateUser: { title: 'Deactivate User', message: 'Are you sure you want to deactivate this user?', label: 'Deactivate' },
    rejectBusiness: { title: 'Reject Business Account', message: 'Are you sure you want to reject this business application?', label: 'Reject' },
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.headerTitle}>Admin Dashboard</h1>
          <p style={s.headerSub}>Welcome, {user?.name || 'Admin'}</p>
        </div>
      </div>

      <div style={s.container}>

        {actionMsg && <div style={s.actionMsg}>{actionMsg}</div>}

        {/* Stats */}
        {stats && (
          <div style={s.statsRow}>
            {[
              { label: 'Total Users',      value: stats.totalUsers,                             color: '#805ad5' },
              { label: 'Approved Events',  value: stats.totalEvents,                            color: '#38a169' },
              { label: 'Total Bookings',   value: stats.totalBookings,                          color: '#e8547a' },
              { label: 'Pending Events',   value: stats.pendingEvents ?? pendingEvents.length,  color: '#dd6b20' },
              { label: 'Rejected Events',  value: stats.rejectedEvents ?? 0,                   color: '#718096' },
            ].map(stat => (
              <div key={stat.label} style={s.statCard}>
                <span style={{ ...s.statNum, color: stat.color }}>{stat.value}</span>
                <span style={s.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={s.tabRow}>
          {tabs.map(tab => (
            <button
              key={tab}
              style={{ ...s.tabBtn, ...(activeTab === tab ? s.tabActive : {}) }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'events'     ? `Pending Events (${pendingEvents.length})`
               : tab === 'businesses' ? `Business Approvals (${pendingBusinesses.length})`
               : `Users (${users.length})`}
            </button>
          ))}
        </div>

        {/* Pending Events Tab */}
        {activeTab === 'events' && (
          <div style={s.section}>
            <h2 style={s.sectionTitle}>Pending Event Approvals</h2>
            {pendingEvents.length === 0 ? (
              <EmptyState
                icon="📋"
                title="No pending events"
                subtitle="All caught up! No events are awaiting approval."
              />
            ) : (
              <div style={s.cardList}>
                {pendingEvents.map(event => (
                  <div key={event._id} style={s.eventCard}>
                    <div style={s.eventCardLeft}>
                      <div style={s.categoryTag}>{event.category}</div>
                      <h3 style={s.eventTitle}>{event.title}</h3>
                      <p style={s.eventMeta}>{event.city} — {event.venue}</p>
                      <p style={s.eventMeta}>
                        {new Date(event.date).toLocaleDateString('en-PK', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                      <p style={s.eventMeta}>
                        PKR {event.price?.toLocaleString()} &nbsp;·&nbsp; {event.totalCapacity} seats
                      </p>
                      {event.organizer && (
                        <p style={s.eventOrg}>By: {event.organizer.name} ({event.organizer.email})</p>
                      )}
                      <p style={s.eventDesc}>{event.description}</p>
                    </div>
                    <div style={s.eventCardActions}>
                      <button style={s.approveBtn} onClick={() => approveEvent(event._id)}>
                        Approve
                      </button>
                      <button
                        style={s.rejectBtn}
                        onClick={() => setConfirmState({ open: true, action: 'rejectEvent', id: event._id })}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Business Approvals Tab */}
        {activeTab === 'businesses' && (
          <div style={s.section}>
            <h2 style={s.sectionTitle}>Pending Business Account Approvals</h2>
            {pendingBusinesses.length === 0 ? (
              <EmptyState
                icon="🏢"
                title="No pending business applications"
                subtitle="All business applications have been reviewed."
              />
            ) : (
              <div style={s.cardList}>
                {pendingBusinesses.map(biz => (
                  <div key={biz._id} style={s.userCard}>
                    <div style={s.userCardLeft}>
                      <div style={s.avatar}>{biz.name?.charAt(0).toUpperCase()}</div>
                      <div>
                        <p style={s.userName}>{biz.name}</p>
                        <p style={s.userEmail}>{biz.email}</p>
                        <span style={s.rolePill}>Business</span>
                      </div>
                    </div>
                    <div style={s.userCardActions}>
                      <button style={s.approveBtn} onClick={() => approveBusiness(biz._id)}>
                        Approve
                      </button>
                      <button
                        style={s.rejectBtn}
                        onClick={() => setConfirmState({ open: true, action: 'rejectBusiness', id: biz._id })}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div style={s.section}>
            <h2 style={s.sectionTitle}>All Users</h2>
            {users.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No users found"
                subtitle="No registered users yet."
              />
            ) : (
              <div style={s.tableWrapper}>
                <table style={s.table}>
                  <thead>
                    <tr style={s.tableHead}>
                      <th style={s.th}>Name</th>
                      <th style={s.th}>Email</th>
                      <th style={s.th}>Role</th>
                      <th style={s.th}>Status</th>
                      <th style={s.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} style={s.tableRow}>
                        <td style={s.td}>{u.name}</td>
                        <td style={s.td}>{u.email}</td>
                        <td style={s.td}>
                          <span style={{
                            ...s.rolePill,
                            backgroundColor: u.role === 'admin' ? '#ebf8ff' : '#f0fff4',
                            color: u.role === 'admin' ? '#2b6cb0' : '#276749'
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={s.td}>
                          <span style={{
                            ...s.rolePill,
                            backgroundColor: u.isApproved === false ? '#fff5f5' : '#f0fff4',
                            color: u.isApproved === false ? '#c53030' : '#276749'
                          }}>
                            <span style={{
                              ...s.rolePill,
                              backgroundColor: u.role === 'business' && !u.isApproved ? '#fff5f5' : '#f0fff4',
                              color: u.role === 'business' && !u.isApproved ? '#c53030' : '#276749'
                            }}>
                              {u.role === 'business' && !u.isApproved ? 'Pending Approval' : 'Active'}
                            </span>
                          </span>
                        </td>
                        <td style={s.td}>
                          {u.role === 'business' && u.isApproved && (
                            <button
                              style={s.deactivateBtn}
                              onClick={() =>
                                setConfirmState({ open: true, action: 'deactivateUser', id: u._id })
                              }
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.open}
        title={confirmMeta[confirmState.action]?.title || 'Confirm'}
        message={confirmMeta[confirmState.action]?.message || 'Are you sure?'}
        confirmLabel={confirmMeta[confirmState.action]?.label || 'Confirm'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState({ open: false, action: null, id: null })}
      />
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f7f3ff', fontFamily: "'DM Sans', sans-serif" },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  header: {
    background: 'linear-gradient(135deg, #553c9a, #805ad5)',
    padding: '24px 32px', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', flexWrap: 'wrap', gap: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: '4px 0 0' },
  container: { maxWidth: 1000, margin: '0 auto', padding: '24px 16px' },
  actionMsg: {
    backgroundColor: '#c6f6d5', border: '1px solid #9ae6b4', color: '#276749',
    borderRadius: 8, padding: '10px 16px', fontSize: 14, marginBottom: 16,
  },
  statsRow: { display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' },
  statCard: {
    flex: 1, minWidth: 120, backgroundColor: '#fff', borderRadius: 12,
    padding: '16px 20px', boxShadow: '0 2px 8px rgba(128,90,213,0.08)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  },
  statNum: { fontSize: 28, fontWeight: 700 },
  statLabel: { fontSize: 12, color: '#718096', fontWeight: 600, textAlign: 'center' },
  tabRow: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tabBtn: {
    padding: '8px 18px', borderRadius: 20, border: '1.5px solid #e2e8f0',
    backgroundColor: 'white', color: '#718096', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
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
    borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, marginBottom: 6,
  },
  eventTitle: { fontSize: 16, fontWeight: 700, color: '#2d3748', margin: '0 0 6px' },
  eventMeta: { fontSize: 13, color: '#718096', margin: '2px 0' },
  eventOrg: { fontSize: 12, color: '#805ad5', margin: '4px 0', fontWeight: 600 },
  eventDesc: { fontSize: 13, color: '#4a5568', marginTop: 6, lineHeight: 1.5 },
  eventCardActions: { display: 'flex', flexDirection: 'column', gap: 8, minWidth: 100 },
  approveBtn: {
    backgroundColor: '#38a169', color: '#fff', border: 'none',
    borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  rejectBtn: {
    backgroundColor: 'transparent', color: '#e53e3e',
    border: '1px solid #e53e3e', borderRadius: 8,
    padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  userCard: {
    border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: 16, flexWrap: 'wrap', backgroundColor: '#fafafa',
  },
  userCardLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  avatar: {
    width: 44, height: 44, borderRadius: '50%',
    backgroundColor: '#e9d8fd', color: '#553c9a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, fontWeight: 700,
  },
  userName: { fontSize: 15, fontWeight: 700, color: '#2d3748', margin: 0 },
  userEmail: { fontSize: 13, color: '#718096', margin: '2px 0 4px' },
  userCardActions: { display: 'flex', gap: 8 },
  rolePill: {
    display: 'inline-block', borderRadius: 20, padding: '2px 10px',
    fontSize: 11, fontWeight: 700, backgroundColor: '#f0ebff', color: '#553c9a',
  },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  tableHead: { backgroundColor: '#f7f3ff' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tableRow: { borderBottom: '1px solid #f0ebff' },
  td: { padding: '12px 14px', color: '#2d3748', verticalAlign: 'middle' },
  deactivateBtn: {
    backgroundColor: 'transparent', color: '#e53e3e',
    border: '1px solid #e53e3e', borderRadius: 6,
    padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
  },
};