import React from 'react';
import { Card, Nav, Dropdown, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { clearAuth } from '../services/api';

/**
 * UGC Left Sidebar Navigation
 * Props:
 * - activeKey: current active nav key
 * - onSelect: handler to set active key
 */
const UGCLeftNav = ({ activeKey, onSelect, user, profile }) => {
  const navigate = useNavigate();

  const calculateCompletion = (profileData) => {
    if (!profileData) return 0;
    const allRequiredFields = [
      'fullName',
      'bio',
      'location',
      'reelPostPrice',
      'staticPostPrice',
      'niche',
      'contentStyle'
    ];
    let completed = 0;
    allRequiredFields.forEach((field) => {
      if (field === 'niche') {
        if (profileData.niche && profileData.niche.length > 0) completed++;
      } else if (field === 'contentStyle') {
        if (profileData.contentStyle && profileData.contentStyle.length > 0) completed++;
      } else {
        if (profileData[field] && profileData[field].toString().trim() !== '') completed++;
      }
    });
    return Math.round((completed / allRequiredFields.length) * 100);
  };

  const completionPct = calculateCompletion(profile);

  return (
    <Card className="ugc-left-nav-card border-0 shadow-sm h-100">
      <Card.Body className="p-3 h-100">
        <div className="mb-3">
          <div className="d-flex align-items-center">
            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3" style={{ width: 48, height: 48 }}>
              <span className="text-muted fw-semibold" style={{ fontSize: '0.9rem' }}>
                {(profile?.fullName || user?.displayName || user?.email || 'U')
                  .split(' ')
                  .map(s => s[0])
                  .join('')
                  .slice(0,2)
                }
              </span>
            </div>
            <div className="flex-grow-1">
              <div className="fw-semibold">{profile?.fullName || user?.displayName || 'Your Profile'}</div>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>{user?.email || ''}</div>
            </div>
            <Dropdown align="end">
              <Dropdown.Toggle variant="light" className="border-0 p-0 ms-3">
                <i className="bi bi-three-dots"></i>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => navigate('/ugc/my-profile')} className="d-flex align-items-center justify-content-between">
                  <span>Your Profile</span>
                  <Badge bg="danger" className="rounded-pill">{completionPct}%</Badge>
                </Dropdown.Item>
                <Dropdown.Item onClick={() => { navigate('/ugc/dashboard'); onSelect && onSelect('dashboard'); }}>
                  Edit Portfolio
                </Dropdown.Item>
                <Dropdown.Item onClick={() => { navigate('/ugc/dashboard'); onSelect && onSelect('dashboard'); }}>
                  Edit Templates
                </Dropdown.Item>
                <Dropdown.Item onClick={() => { onSelect && onSelect('collaborations'); navigate('/ugc/dashboard'); }}>
                  Collaborations
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => { clearAuth(); navigate('/login'); }}>
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
        <Nav
          activeKey={activeKey}
          onSelect={onSelect}
          className="flex-column ugc-left-nav"
        >
          <Nav.Item>
            <Nav.Link eventKey="dashboard" className="d-flex align-items-center">
              <i className="bi bi-house me-2"></i>
              <span>Dashboard</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="insights" className="d-flex align-items-center">
              <i className="bi bi-youtube me-2 text-danger"></i>
              <span>YouTube</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="instagram" className="d-flex align-items-center">
              <i className="bi bi-instagram me-2"></i>
              <span>Instagram</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="connect-socials" className="d-flex align-items-center">
              <i className="bi bi-person-badge me-2"></i>
              <span>Connect Socials</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="collaborations" className="d-flex align-items-center">
              <i className="bi bi-people me-2"></i>
              <span>Collaborations</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="messages" className="d-flex align-items-center">
              <i className="bi bi-envelope me-2"></i>
              <span>Messages</span>
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Card.Body>
    </Card>
  );
};

export default UGCLeftNav;