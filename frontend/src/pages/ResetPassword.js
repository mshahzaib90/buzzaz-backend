import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { authAPI } from '../services/api';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const useQuery = () => new URLSearchParams(useLocation().search);

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');
  const navigate = useNavigate();
  const query = useQuery();

  useEffect(() => {
    const t = query.get('token');
    if (!t) {
      setError('Invalid reset link. Please request a new one.');
    } else {
      setToken(t);
    }
  }, [query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Missing token. Please request a new link.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authAPI.resetPassword({ token, newPassword });
      setSuccess(res.data?.message || 'Password reset successful');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password';
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
              <h3 className="mb-3">Reset Password</h3>
              <p className="text-muted mb-4">Enter and confirm your new password.</p>

              {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
              {success && <Alert variant="success" className="mb-3">{success}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={isLoading}
                  />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={isLoading}
                  />
                </Form.Group>

                <Button type="submit" className="w-100" variant="primary" disabled={isLoading || !token}>
                  {isLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Updating...
                    </>
                  ) : (
                    'Reset Password'
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

export default ResetPassword;