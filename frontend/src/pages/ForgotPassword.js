import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { authAPI } from '../services/api';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [devLink, setDevLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDevLink('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authAPI.forgotPassword(email);
      setSuccess(res.data?.message || 'If the email exists, a reset link has been sent.');
      if (res.data?.devResetLink) {
        setDevLink(res.data.devResetLink);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to request password reset';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-sm">
            <Card.Body>
              <h3 className="mb-3">Forgot Password</h3>
              <p className="text-muted mb-4">Enter your email to receive a password reset link.</p>

              {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
              {success && <Alert variant="success" className="mb-3">{success}</Alert>}
              {devLink && (
                <Alert variant="warning" className="mb-3">
                  Development link: <a href={devLink}>{devLink}</a>
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </Form.Group>

                <Button type="submit" className="w-100" variant="primary" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </Form>

              <div className="mt-3 text-center">
                <Link to="/login" className="text-primary text-decoration-none">Back to login</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPassword;