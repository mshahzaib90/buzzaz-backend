import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/ContentCreatorRoleSelect.css';

 const ContentCreatorRoleSelect = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState('');
  const [hovered, setHovered] = useState('');

  // Redirect users who already have a specific role
  useEffect(() => {
    if (user) {
      if (user.role === 'influencer') {
        navigate('/influencer/wizard', { replace: true });
        return;
      } else if (user.role === 'ugc_creator') {
        navigate('/ugc/wizard', { replace: true });
        return;
      } else if (user.role === 'brand') {
        navigate('/brand/dashboard', { replace: true });
        return;
      } else if (user.role !== 'content_creator') {
        // If user has any other role, redirect to login
        navigate('/login', { replace: true });
        return;
      }
    }
  }, [user, navigate]);

  const options = [
    {
      value: 'influencer',
      title: 'I am Influencer',
      description: 'Create your influencer profile',
      icon: 'bi-person-badge',
      color: 'primary',
      proceedTo: '/influencer/wizard',
    },
    {
      value: 'ugc',
      title: 'I am UGC Creator',
      description: 'Offer user-generated content services',
      icon: 'bi-collection-play',
      color: 'info',
      proceedTo: '/ugc/wizard',
    },
  ];

  const chooseRole = async (role) => {
    setError(null);
    setIsLoading(true);
    
    // Double-check user role before making API call
    if (user?.role !== 'content_creator') {
      setError('You are not authorized to select a role. Please contact support if this is an error.');
      setIsLoading(false);
      return;
    }
    
    try {
      await userAPI.setRole(role);
      // Update local user context immediately for smoother navigation
      const mappedRole = role === 'ugc' ? 'ugc_creator' : 'influencer';
      const userType = role === 'ugc' ? 'ugc' : 'influencer';
      updateUser({ role: mappedRole, userType });
      const next = role === 'influencer' ? '/influencer/wizard' : '/ugc/wizard';
      navigate(next);
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to set role';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-vh-100 d-flex align-items-center background-gradient role-select-container"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background decorative elements */}
      <div 
        className="decorative-element"
        style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '40%',
          height: '200%',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          transform: 'rotate(15deg)'
        }}
      />
      <div 
        className="decorative-element"
        style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-10%',
          width: '30%',
          height: '150%',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
          transform: 'rotate(-10deg)'
        }}
      />
      
      <Container fluid className="py-5 position-relative">
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Only show content if user has content_creator role */}
        {user?.role !== 'content_creator' ? (
          <Row className="justify-content-center">
            <Col md={8} className="text-center">
              <div 
                className="p-4 rounded-4 shadow-lg glass-effect"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Alert variant="warning" className="border-0 bg-transparent">
                  <i className="bi bi-exclamation-triangle me-2 fs-4"></i>
                  <div className="fw-semibold">You are not authorized to access this page. Redirecting...</div>
                </Alert>
              </div>
            </Col>
          </Row>
        ) : (
          <>
            <Row className="justify-content-center mb-5">
              <Col lg={8} className="text-center">
                <div 
                  className="mb-4 p-4 rounded-4 header-container glass-effect"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div className="mb-3">
                    <i 
                      className="bi bi-person-workspace display-3 text-white drop-shadow"
                      style={{ 
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                        animation: 'pulse 2s infinite'
                      }}
                    ></i>
                  </div>
                  <h1 className="display-5 fw-bold text-white mb-3 header-title text-shadow" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    Choose Your Path
                  </h1>
                  <p className="lead text-white-50 mb-0 header-subtitle" style={{ fontSize: '1.1rem' }}>
                    Select your role to unlock your creative potential
                  </p>
                </div>
              </Col>
            </Row>

            {error && (
              <Row className="justify-content-center mb-4">
                <Col lg={8}>
                  <div 
                    className="p-3 rounded-4 shadow-lg glass-effect"
                    style={{ 
                      background: 'rgba(220, 53, 69, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(220, 53, 69, 0.3)'
                    }}
                  >
                    <div className="text-white d-flex align-items-center">
                      <i className="bi bi-exclamation-triangle me-3 fs-4"></i>
                      <span className="fw-semibold">{error}</span>
                    </div>
                  </div>
                </Col>
              </Row>
            )}

            <Row className="justify-content-center g-4">
              {options.map((option, index) => (
                <Col lg={5} md={6} key={option.value}>
                  <div
                    className={`h-100 position-relative role-card interactive-element`}
                    onClick={() => setSelected(option.value)}
                    onMouseEnter={() => setHovered(option.value)}
                    onMouseLeave={() => setHovered('')}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: hovered === option.value ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                      animationDelay: `${index * 0.2}s`
                    }}
                  >
                    <Card
                      className="border-0 h-100 shadow-lg glass-effect"
                      style={{
                        background: selected === option.value 
                          ? 'rgba(255, 255, 255, 0.98)' 
                          : 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: selected === option.value 
                          ? '0 20px 40px rgba(0,0,0,0.15), 0 0 0 2px rgba(102, 126, 234, 0.4)' 
                          : '0 10px 30px rgba(0,0,0,0.1)'
                      }}
                    >
                      <Card.Body className="p-5 text-center position-relative">
                        {/* Selection indicator */}
                        {selected === option.value && (
                          <div 
                            className="position-absolute top-0 end-0 m-3 selection-indicator"
                            style={{
                              background: 'linear-gradient(135deg, #667eea, #764ba2)',
                              borderRadius: '50%',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <i className="bi bi-check-lg text-white fw-bold"></i>
                          </div>
                        )}
                        
                        {/* Icon with gradient background */}
                        <div 
                          className="mx-auto mb-4 d-flex align-items-center justify-content-center role-icon-container role-icon"
                          style={{
                            width: '80px',
                            height: '80px',
                            background: option.value === 'influencer' 
                              ? 'linear-gradient(135deg, #667eea, #764ba2)'
                              : 'linear-gradient(135deg, #17a2b8, #138496)',
                            borderRadius: '20px',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                          }}
                        >
                          <i 
                            className={`${option.icon} text-white`}
                            style={{ 
                              fontSize: '2rem',
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                            }}
                          ></i>
                        </div>
                        
                        <h3 className="fw-bold mb-3 text-dark role-title" style={{ fontSize: '1.5rem' }}>
                          {option.title}
                        </h3>
                        <p className="text-muted mb-4 role-description" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                          {option.description}
                        </p>
                        
                        {/* Enhanced selection indicator */}
                        {selected === option.value && (
                          <div 
                            className="mt-3 p-3 rounded-3 selection-indicator"
                            style={{
                              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                              border: '1px solid rgba(102, 126, 234, 0.2)'
                            }}
                          >
                            <i className="bi bi-check-circle-fill me-2" style={{ color: '#667eea' }}></i>
                            <span className="fw-semibold" style={{ color: '#667eea' }}>Selected</span>
                          </div>
                        )}
                      </Card.Body>
                      
                      <Card.Footer className="bg-transparent border-0 text-center pb-5">
                        <Button
                          variant="outline-primary"
                          disabled={isLoading || selected !== option.value}
                          onClick={() => chooseRole(option.value)}
                          className="px-5 py-3 fw-semibold border-2 continue-button"
                          style={{
                            borderRadius: '16px',
                            background: selected === option.value 
                              ? 'linear-gradient(135deg, #667eea, #764ba2)'
                              : 'transparent',
                            color: selected === option.value ? 'white' : '#667eea',
                            borderColor: '#667eea',
                            fontSize: '1.1rem',
                            transition: 'all 0.3s ease',
                            boxShadow: selected === option.value 
                              ? '0 4px 15px rgba(102, 126, 234, 0.4)' 
                              : 'none'
                          }}
                        >
                          {isLoading && selected === option.value ? (
                            <>
                              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2 loading-spinner" />
                              Continue...
                            </>
                          ) : (
                            <>
                              Continue
                              <i className="bi bi-arrow-right ms-2"></i>
                            </>
                          )}
                        </Button>
                      </Card.Footer>
                    </Card>
                  </div>
                </Col>
              ))}
            </Row>
          </>
        )}
        </div>
      </Container>
    </div>
  );
};

export default ContentCreatorRoleSelect;
