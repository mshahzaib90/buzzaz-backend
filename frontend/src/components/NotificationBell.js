import React, { useState, useEffect } from 'react';
import { NavDropdown, Badge, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.notifications) {
        setNotifications(res.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleToggle = (isOpen) => {
    setShow(isOpen);
    if (isOpen) {
      fetchNotifications();
      // Mark all as read? Or just when clicked? 
      // Let's keep them unread until interacted or explicitly marked?
      // Common pattern: Mark all as read when dropdown opens.
      // But for invites, we want them to persist attention.
      // So maybe just mark as read individually or visually dim them.
      // For now, let's leave read status logic simple.
    }
  };

  const handleAccept = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      setLoading(true);
      await api.post(`/notifications/${id}/accept`);
      await fetchNotifications();
    } catch (error) {
      console.error('Error accepting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Are you sure you want to decline this campaign invitation?')) return;
    try {
      setLoading(true);
      await api.post(`/notifications/${id}/decline`);
      await fetchNotifications();
    } catch (error) {
      console.error('Error declining:', error);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <NavDropdown
      title={
        <div className="d-inline-block position-relative">
          <i className="bi bi-bell" style={{ fontSize: '1.2rem', color: '#64748b' }}></i>
          {unreadCount > 0 && (
            <Badge 
              bg="danger" 
              pill 
              style={{ 
                position: 'absolute', 
                top: -5, 
                right: -5, 
                fontSize: '0.6rem',
                padding: '0.25em 0.5em'
              }}
            >
              {unreadCount}
            </Badge>
          )}
        </div>
      }
      id="notification-dropdown"
      align="end"
      show={show}
      onToggle={handleToggle}
      className="notification-dropdown"
    >
      <div style={{ width: '350px', maxHeight: '400px', overflowY: 'auto' }}>
        <div className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-bold">Notifications</h6>
            <small className="text-muted cursor-pointer" onClick={fetchNotifications}>
                <i className="bi bi-arrow-clockwise"></i> Refresh
            </small>
        </div>
        
        {notifications.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <small>No notifications</small>
          </div>
        ) : (
          notifications.map(n => (
            <NavDropdown.Item 
              key={n.id} 
              className={`px-3 py-2 border-bottom ${n.status === 'unread' ? 'bg-light' : ''}`}
              style={{ whiteSpace: 'normal' }}
            >
              <div className="d-flex flex-column gap-1">
                <div className="small text-dark">{n.message}</div>
                <div className="d-flex justify-content-between align-items-center mt-1">
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(n.created_at).toLocaleDateString()}
                    </small>
                    
                    {n.type === 'campaign_invite' && n.action_status === 'pending' && user.role === 'influencer' && (
                        <div className="d-flex gap-2">
                             <Button 
                                variant="success" 
                                size="sm" 
                                style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                                onClick={(e) => handleAccept(e, n.id)}
                                disabled={loading}
                             >
                                Accept
                             </Button>
                             <Button 
                                variant="outline-danger" 
                                size="sm" 
                                style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                                onClick={(e) => handleDecline(e, n.id)}
                                disabled={loading}
                             >
                                Decline
                             </Button>
                        </div>
                    )}
                    
                    {n.type === 'campaign_invite' && n.action_status !== 'pending' && (
                        <Badge bg={n.action_status === 'accepted' ? 'success' : 'danger'}>
                            {n.action_status.charAt(0).toUpperCase() + n.action_status.slice(1)}
                        </Badge>
                    )}
                </div>
              </div>
            </NavDropdown.Item>
          ))
        )}
      </div>
    </NavDropdown>
  );
};

export default NotificationBell;
