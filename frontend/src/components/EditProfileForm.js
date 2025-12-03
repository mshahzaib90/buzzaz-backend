import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { influencerAPI } from '../services/api';

const EditProfileForm = ({ show, onHide, profile, onProfileUpdate }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    // Basic info
    fullName: '',
    bio: '',
    location: '',
    phoneNumber: '',
    city: '',
    country: '',
    
    // New required fields
    niche: [],
    contentStyle: [],
    languages: [],
    
    // Pricing fields (will be set based on tier)
    reelPostPrice: '',
    staticPostPrice: '',
    storyVideoPrice: '',
    eventAttendancePrice: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Predefined options
  const nicheOptions = [
    'Beauty', 'Fashion', 'Skincare', 'Tech', 'Lifestyle', 'Food', 'Vegan Food', 
    'Vegetarian Food', 'Cafes', 'Fitness', 'Haircare', 'Makeup', 'Home Decor', 
    'Meal Prep', 'Self-care', 'Parenting & Family', 'Modest fashion', 'Student Life', 
    'Jewelry', 'Travel', 'Health & Wellness', 'Pets', 'Cooking', 'Educational Content', 
    'Comedy', 'Entertainment', 'Finance & Investment', 'Gaming & Esports', 
    'Sustainable Living', 'Cars', 'Men\'s Grooming', 'Music', 'Books'
  ];

  const contentStyleOptions = [
    'Product Demo', 'Tutorial', 'ASMR', 'Review', 'How to use', 'DIY', 'Unboxing', 
    'Taste Test', 'Day in my life (Vlog)', 'Comparison videos', 'Outfit styling', 
    'Skits', 'POVs', 'Storytelling', 'Long Form Video', 'Podcast', 'Hauls', 'Challenges'
  ];

  const languageOptions = [
    'Urdu', 'Sindhi', 'Punjabi', 'Pashto', 'Balochi', 'Saraiki',
    'English', 'Arabic', 'German'
  ];

  // Pricing tiers and their ranges
  const pricingTiers = {
    nano: { min: 50, max: 500 },
    micro: { min: 500, max: 2000 },
    macro: { min: 2000, max: 10000 },
    mega: { min: 10000, max: 50000 }
  };

  // Determine pricing tier based on followers
  const getPricingTier = (followers) => {
    if (followers < 10000) return 'nano';
    if (followers < 100000) return 'micro';
    if (followers < 1000000) return 'macro';
    return 'mega';
  };

  useEffect(() => {
    if (profile && show) {
      setFormData({
        fullName: profile.fullName || '',
        bio: profile.bio || '',
        location: profile.location || '',
        phoneNumber: profile.phoneNumber || '',
        city: profile.city || '',
        country: profile.country || '',
        niche: profile.niche || [],
        contentStyle: profile.contentStyle || [],
        languages: profile.languages || [],
        reelPostPrice: profile.reelPostPrice || '',
        staticPostPrice: profile.staticPostPrice || '',
        storyVideoPrice: profile.storyVideoPrice || '',
        eventAttendancePrice: profile.eventAttendancePrice || ''
      });
    }
  }, [profile, show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelectChange = (name, value) => {
    setFormData(prev => {
      const currentValues = prev[name] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [name]: newValues
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      const requiredFields = ['fullName', 'niche'];
      const missingFields = requiredFields.filter(field => {
        if (field === 'niche') {
          return !formData[field] || formData[field].length === 0;
        }
        return !formData[field];
      });
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setIsLoading(false);
        return;
      }

      if (formData.contentStyle.length === 0) {
        setError('Please select at least one content style');
        setIsLoading(false);
        return;
      }

      if (formData.languages.length === 0) {
        setError('Please select at least one language');
        setIsLoading(false);
        return;
      }

      // Update profile
      const response = await influencerAPI.updateProfile(user.uid, formData);
      
      if (response.data.success) {
        setSuccess('Profile updated successfully!');
        onProfileUpdate(); // Refresh profile data
        
        // Close modal after a brief delay
        setTimeout(() => {
          onHide();
          setSuccess('');
        }, 1500);
      } else {
        setError('Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentTier = getPricingTier(profile?.followers || 0);
  const tierRange = pricingTiers[currentTier];

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Complete Your Profile</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {error && (
          <Alert variant="danger" className="mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="mb-3">
            <i className="bi bi-check-circle me-2"></i>
            {success}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <h5 className="mb-3 text-primary">Basic Information</h5>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Full Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Bio</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself..."
            />
          </Form.Group>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>City</Form.Label>
                <Form.Control
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Country</Form.Label>
                <Form.Control
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Content & Niche */}
          <h5 className="mb-3 text-primary mt-4">Content & Niche</h5>
          
          <Form.Group className="mb-3">
            <Form.Label>Niche * (Select all that apply)</Form.Label>
            <div className="border rounded p-3" style={{ maxHeight: '150px', overflowY: 'auto' }}>
              <Row>
                {nicheOptions.map(niche => (
                  <Col md={6} key={niche}>
                    <Form.Check
                      type="checkbox"
                      id={`niche-${niche}`}
                      label={niche}
                      checked={formData.niche.includes(niche)}
                      onChange={(e) => {
                        const { checked } = e.target;
                        setFormData(prev => ({
                          ...prev,
                          niche: checked 
                            ? [...prev.niche, niche]
                            : prev.niche.filter(item => item !== niche)
                        }));
                      }}
                    />
                  </Col>
                ))}
              </Row>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Content Style * (Select all that apply)</Form.Label>
            <div className="border rounded p-3" style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {contentStyleOptions.map(style => (
                <Form.Check
                  key={style}
                  type="checkbox"
                  id={`content-${style}`}
                  label={style}
                  checked={formData.contentStyle.includes(style)}
                  onChange={() => handleMultiSelectChange('contentStyle', style)}
                  className="mb-1"
                />
              ))}
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Languages You Speak * (Select all that apply)</Form.Label>
            <div className="border rounded p-3">
              <Row>
                {languageOptions.map(language => (
                  <Col md={4} key={language}>
                    <Form.Check
                      type="checkbox"
                      id={`lang-${language}`}
                      label={language}
                      checked={formData.languages.includes(language)}
                      onChange={() => handleMultiSelectChange('languages', language)}
                      className="mb-1"
                    />
                  </Col>
                ))}
              </Row>
            </div>
          </Form.Group>

          {/* Pricing */}
          <h5 className="mb-3 text-primary mt-4">Pricing</h5>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Reel Post Price ($)</Form.Label>
                <Form.Control
                  type="number"
                  name="reelPostPrice"
                  value={formData.reelPostPrice}
                  onChange={handleInputChange}
                  min={tierRange.min}
                  max={tierRange.max}
                  placeholder={`${tierRange.min} - ${tierRange.max}`}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Static Post Price ($)</Form.Label>
                <Form.Control
                  type="number"
                  name="staticPostPrice"
                  value={formData.staticPostPrice}
                  onChange={handleInputChange}
                  min={tierRange.min}
                  max={tierRange.max}
                  placeholder={`${tierRange.min} - ${tierRange.max}`}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Story Video Price ($)</Form.Label>
                <Form.Control
                  type="number"
                  name="storyVideoPrice"
                  value={formData.storyVideoPrice}
                  onChange={handleInputChange}
                  min={tierRange.min}
                  max={tierRange.max}
                  placeholder={`${tierRange.min} - ${tierRange.max}`}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Event Attendance Price ($)</Form.Label>
                <Form.Control
                  type="number"
                  name="eventAttendancePrice"
                  value={formData.eventAttendancePrice}
                  onChange={handleInputChange}
                  min={tierRange.min}
                  max={tierRange.max}
                  placeholder={`${tierRange.min} - ${tierRange.max}`}
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            'Save Profile'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditProfileForm;