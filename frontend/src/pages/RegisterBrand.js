import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterBrand = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Preset role for this page
  const primaryRole = 'brand';

  const { register, isAuthenticated, user, error: authError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'brand') {
        navigate('/brand/dashboard');
      } else if (user.role === 'influencer') {
        navigate('/influencer/wizard');
      } else if (user.role === 'ugc_creator') {
        navigate('/ugc/wizard');
      } else if (user.role === 'content_creator') {
        navigate('/choose-role');
      } else {
        navigate('/login');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await register({ email: formData.email, password: formData.password, role: primaryRole });
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="py-5">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <div className="text-center mb-4">
            <h1 className="h3 mb-3 fw-bold text-primary">
              <i className="bi bi-lightning-charge-fill me-2"></i>
              Join Buzzaz as a Brand
            </h1>
            <p className="text-muted">Create your account to get started</p>
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
                  <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                </Form.Group>

                {/* Role is preset to brand and hidden */}

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    isInvalid={!!errors.password}
                    placeholder="Create a password (min. 6 characters)"
                    disabled={isLoading}
                  />
                  <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    isInvalid={!!errors.confirmPassword}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                  />
                  <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100 mb-3" disabled={isLoading} size="lg">
                  {isLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </Form>

              <div className="text-center">
                <p className="mb-0 text-muted">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary text-decoration-none fw-semibold">
                    Sign in here
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      </div>
    </Container>
  );
};

export default RegisterBrand;