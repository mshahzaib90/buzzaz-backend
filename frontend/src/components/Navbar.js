import React, { useState } from 'react';
import { Navbar as BSNavbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [signupOpen, setSignupOpen] = useState(false);

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
    <BSNavbar bg="white" expand="lg" fixed="top" className="shadow-sm">
      <Container fluid>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'nowrap' }}>
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
              onMouseEnter={() => setSignupOpen(true)}
              onMouseLeave={() => setSignupOpen(false)}
            >
              <button type="button" className="cta-signup" aria-haspopup="true" aria-expanded={signupOpen} aria-label="Sign up">
                Sign up <i className="bi bi-chevron-down" aria-hidden="true"></i>
              </button>
              <div style={{
                position: 'absolute', top: '110%', right: 0,
                background: '#fff', border: '1px solid #eee', boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
                borderRadius: 12, padding: 8, minWidth: 220, zIndex: 10,
                display: signupOpen ? 'block' : 'none'
              }}>
                <Link to="/register-creator" style={{ display: 'block', padding: '8px 10px', color: '#0f172a', textDecoration: 'none', borderRadius: 8 }}>Signup as content creator</Link>
                <Link to="/register-brand" style={{ display: 'block', padding: '8px 10px', color: '#0f172a', textDecoration: 'none', borderRadius: 8 }}>Signup as a business</Link>
              </div>
            </div>

            {/* Login outlined pill */}
            <Link to="/login" className="cta-login">
              Login
            </Link>
          </div>
        )}
        
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && user?.role === 'brand' && (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/brand/dashboard" 
                  className={isActive('/brand/dashboard') ? 'active fw-semibold' : ''}
                >
                  Dashboard
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/influencers" 
                  className={isActive('/influencers') ? 'active fw-semibold' : ''}
                >
                  Find Influencers
                </Nav.Link>
              </>
            )}
            
            {isAuthenticated && user?.role === 'influencer' && (
              <>
              </>
            )}

            {isAuthenticated && user?.role === 'ugc_creator' && (
              <>
              </>
            )}
          </Nav>
          
          {isAuthenticated && (
            <Nav className="ms-auto">
              <NavDropdown 
                title={
                  <span>
                    <i className="bi bi-person-circle me-1"></i>
                    {user?.email || 'User'}
                  </span>
                } 
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Item as={Link} to="/profile">
                  <i className="bi bi-person me-2"></i>
                  Profile
                </NavDropdown.Item>
                
                {user?.role === 'influencer' && (
                  <NavDropdown.Item as={Link} to="/influencer/profile">
                    <i className="bi bi-star me-2"></i>
                    Influencer Profile
                  </NavDropdown.Item>
                )}

                {(user?.role === 'influencer' || user?.role === 'ugc_creator') && (
                  <NavDropdown.Item as={Link} to="/connect-social">
                    <i className="bi bi-link-45deg me-2"></i>
                    Connect Social
                  </NavDropdown.Item>
                )}
                
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
