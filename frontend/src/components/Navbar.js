import React, { useRef, useState } from 'react';
import { Navbar as BSNavbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [signupOpen, setSignupOpen] = useState(false);
  const closeTimerRef = useRef(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const delayedClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setSignupOpen(false);
      closeTimerRef.current = null;
    }, 200);
  };

  // Hide Navbar on homepage
  if (location.pathname === '/') {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path) => location.pathname === path;
  return (
    <BSNavbar bg="white" expand="lg" fixed="top" className="shadow-sm navbar-tall">
      <Container fluid>
        <div className="container-brand-1400" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'nowrap' }}>
        <BSNavbar.Brand as={Link} to="/" className="fw-bold text-primary">
          <i className="bi bi-lightning-charge-fill me-2"></i>
          Buzzaz
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        {/* Right-side CTAs outside collapse to keep single-line layout */}
        {!isAuthenticated && (
          <div className="d-flex align-items-center ms-auto" style={{ gap: '10px' }}>
            {/* Signup dropdown to match homepage */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => {
                clearCloseTimer();
                setSignupOpen(true);
              }}
              onMouseLeave={delayedClose}
            >
              <button
                type="button"
                className="cta-signup"
                aria-haspopup="true"
                aria-expanded={signupOpen}
                aria-label="Sign up"
                onClick={() => setSignupOpen((v) => !v)}
                onFocus={() => setSignupOpen(true)}
                onBlur={delayedClose}
              >
                Sign up <i className="bi bi-chevron-down" aria-hidden="true"></i>
              </button>
              <div style={{
                position: 'absolute', top: '100%', right: 0,
                background: '#fff', border: '1px solid #eee', boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
                borderRadius: 12, padding: 8, minWidth: 220, zIndex: 10,
                display: signupOpen ? 'block' : 'none',
                pointerEvents: signupOpen ? 'auto' : 'none'
              }}
              onMouseEnter={() => {
                clearCloseTimer();
                setSignupOpen(true);
              }}
              onMouseLeave={delayedClose}
              >
                <Link to="/register-creator" style={{ display: 'block', padding: '10px 12px', color: '#0f172a', textDecoration: 'none', borderRadius: 8 }}>Signup as content creator</Link>
                <Link to="/register-brand" style={{ display: 'block', padding: '10px 12px', color: '#0f172a', textDecoration: 'none', borderRadius: 8 }}>Signup as a business</Link>
              </div>
            </div>

            {/* Login outlined pill */}
            <Link to="/login" className="cta-login">
              Login
            </Link>
          </div>
        )}
        
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto pill-tabs">
            {isAuthenticated && user?.role === 'brand' && (
              <>
                <Nav.Link as={Link} to="/brand/dashboard" className={isActive('/brand/dashboard') ? 'active fw-semibold' : ''}>
                  Discover Creators
                </Nav.Link>
                <Nav.Link as={Link} to="/brand/campaign" className={isActive('/brand/campaign') ? 'active fw-semibold' : ''}>
                  Campaigns
                </Nav.Link>
                {location.pathname !== '/brand/campaign' && (
                  <>
                    <Nav.Link as={Link} to="/brand/saved" className={isActive('/brand/saved') ? 'active fw-semibold' : ''}>
                      Saved
                    </Nav.Link>
                    <Nav.Link as={Link} to="/brand/messages" className={isActive('/brand/messages') ? 'active fw-semibold' : ''}>
                      Messages
                    </Nav.Link>
                  </>
                )}
              </>
            )}
          </Nav>
          {isAuthenticated && (
            <Nav className="ms-auto align-items-center" style={{ gap: '12px' }}>
              <i className="bi bi-bell"></i>
              <NavDropdown 
                title={
                  <span className="d-inline-flex align-items-center">
                    <span className="rounded-circle bg-secondary text-white d-inline-flex align-items-center justify-content-center me-1" style={{ width: 28, height: 28, fontSize: 12 }}>
                      {(user?.displayName || user?.email || 'AC').slice(0,2).toUpperCase()}
                    </span>
                  </span>
                } 
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Item as={Link} to="/profile">
                  <i className="bi bi-person me-2"></i>
                  Profile
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          )}
        </BSNavbar.Collapse>
        </div>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
