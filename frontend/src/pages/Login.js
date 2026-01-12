import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated, user, error: authError } = useAuth();
  const navigate = useNavigate();
  // Navigation handled via useEffect after successful login

  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'influencer':
          navigate('/influencer/dashboard');
          break;
        case 'ugc_creator':
          navigate('/ugc/dashboard');
          break;
        case 'brand':
          navigate('/brand/dashboard');
          break;
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'support':
          navigate('/support-dashboard');
          break;
        default:
          navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Role selection chosen during signup
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      await login({
        email: formData.email,
        password: formData.password
      });
      // Navigation will be handled by useEffect
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <Container fluid className="py-5">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <div className="text-center mb-4">
            <h1 className="h3 mb-3 fw-bold text-primary">
              <i className="bi bi-lightning-charge-fill me-2"></i>
              Welcome Back
            </h1>
            <p className="text-muted">Sign in to your Buzzaz account</p>
          </div>
          
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              {authError && (
                <Alert variant="danger" className="mb-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {authError}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={!!errors.email}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    isInvalid={!!errors.password}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 mb-3"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <div className="d-flex justify-content-end align-items-center mb-3">
                  <Link to="/forgot-password" className="text-muted small text-decoration-none">
                    Forgot password?
                  </Link>
                </div>
              </Form>
              
              {/* Removed signup role hint */}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      </div>
    </Container>

    
    </>
  );
};

export default Login;
