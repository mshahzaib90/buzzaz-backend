import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';

const EmailModal = ({ show, onHide, influencer }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/email/collaboration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          influencerName: influencer.fullName,
          influencerEmail: influencer.email,
          influencerInstagram: influencer.instagramUsername,
          instagramProfileUrl: `https://instagram.com/${influencer.instagramUsername}`
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onHide();
          setSuccess(false);
          setFormData({ name: '', email: '', phone: '', message: '' });
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to send email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-envelope me-2"></i>
          Send Collaboration Email
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="mb-3">
            <i className="bi bi-check-circle me-2"></i>
            Email sent successfully!
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Your Name *</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
              disabled={isLoading}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Your Email *</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Your Phone *</Form.Label>
            <Form.Control
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
              disabled={isLoading}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Instagram Profile URL</Form.Label>
            <Form.Control
              type="url"
              value={`https://instagram.com/${influencer.instagramUsername}`}
              readOnly
              disabled
              className="bg-light"
            />
            <Form.Text className="text-muted">
              This is {influencer.fullName}'s Instagram profile
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Message *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Write your collaboration message..."
              required
              disabled={isLoading}
            />
          </Form.Group>

          <div className="d-flex gap-2 justify-content-end">
            <Button 
              variant="outline-secondary" 
              onClick={onHide}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Sending...
                </>
              ) : (
                <>
                  <i className="bi bi-send me-2"></i>
                  Send Email
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EmailModal;