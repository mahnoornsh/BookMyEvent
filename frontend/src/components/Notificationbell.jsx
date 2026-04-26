import { useState, useEffect, useRef } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkOne = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (_) {}
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (_) {}
  };

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-label="Notifications"
        style={{
          background: open ? 'rgba(232,84,122,0.15)' : 'rgba(255,255,255,0.08)',
          border: '1.5px solid',
          borderColor: open ? '#e8547a' : 'rgba(255,255,255,0.15)',
          borderRadius: '50%',
          width: 38,
          height: 38,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.2s',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={open ? '#e8547a' : '#a0a0c0'} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: '#e8547a',
            color: 'white',
            borderRadius: '50%',
            minWidth: 18,
            height: 18,
            fontSize: '0.62rem',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'DM Sans, sans-serif',
            border: '2px solid #1a1a2e',
            padding: '0 3px',
            boxSizing: 'border-box',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 12px)',
          width: 340,
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          zIndex: 999,
          overflow: 'hidden',
          fontFamily: 'DM Sans, sans-serif',
          border: '1px solid #f0d4db',
          animation: 'fadeSlideDown 0.18s ease',
        }}>
          <style>{`
            @keyframes fadeSlideDown {
              from { opacity: 0; transform: translateY(-8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px 12px',
            borderBottom: '1px solid #fce8ef',
            background: 'linear-gradient(135deg, #fff0f4, #fce8ef)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#e8547a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span style={{ fontWeight: '700', color: '#1c1c2e', fontSize: '0.95rem' }}>
                Notifications
                {unreadCount > 0 && (
                  <span style={{
                    marginLeft: 8,
                    background: '#e8547a',
                    color: 'white',
                    borderRadius: 20,
                    padding: '1px 8px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {unreadCount > 0 && (
                <button onClick={handleMarkAll} style={{
                  background: 'none', border: 'none', color: '#e8547a',
                  fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif', padding: 0,
                }}>
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                style={{
                  background: 'rgba(232,84,122,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 26,
                  height: 26,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#e8547a',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '2.5rem 1rem',
                textAlign: 'center',
                color: '#8a8aa0',
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.5 }}>🔔</div>
                <p style={{ margin: 0, fontWeight: '600', color: '#1c1c2e', fontSize: '0.9rem' }}>All caught up!</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && handleMarkOne(n._id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: i < notifications.length - 1 ? '1px solid #fce8ef' : 'none',
                    background: n.isRead ? 'white' : '#fff5f7',
                    cursor: n.isRead ? 'default' : 'pointer',
                    transition: 'background 0.15s',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: n.isRead ? '#e2e8f0' : '#e8547a',
                    marginTop: 5,
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    {(() => {
                      const refIndex = n.message.indexOf('Ref:');
                      const mainText = refIndex !== -1 ? n.message.slice(0, refIndex).trim() : n.message;
                      const refText = refIndex !== -1 ? n.message.slice(refIndex) : null;
                      return (
                        <>
                          <p style={{
                            margin: 0,
                            fontSize: '0.84rem',
                            color: '#1c1c2e',
                            lineHeight: 1.45,
                            fontWeight: n.isRead ? '400' : '600',
                          }}>
                            {mainText}
                          </p>
                          {refText && (
                            <p style={{
                              margin: '2px 0 0',
                              fontSize: '0.72rem',
                              color: '#a0a0b8',
                              fontWeight: '400',
                              letterSpacing: '0.3px',
                            }}>
                              {refText}
                            </p>
                          )}
                        </>
                      );
                    })()}
                    <p style={{ margin: '4px 0 0', fontSize: '0.73rem', color: '#8a8aa0' }}>
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid #fce8ef',
              background: '#fff5f7',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '0.78rem', color: '#8a8aa0' }}>
                {notifications.length} total · {unreadCount} unread
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}