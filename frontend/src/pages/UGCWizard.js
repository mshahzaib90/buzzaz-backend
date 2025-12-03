import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ugcCreatorAPI } from '../api/ugcAPI';
import MultiSelect from '../components/MultiSelect';

const UGCWizard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    city: '',
    country: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    children: '',
    bio: '',
    location: '',
    sampleContent: '',
    sampleContentLinks: [''], // Array for multiple links
    sampleContentType: 'upload', // 'upload' or 'link'
    niche: [],
    contentStyle: [],
    faceOrFaceless: '',
    languages: []
  });

  const [errors, setErrors] = useState({});

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non-binary', label: 'Non-binary' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' }
  ];

  const maritalStatusOptions = [
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' }
  ];

  const childrenOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' }
  ];

  const nicheOptions = [
    'Beauty', 'Fashion', 'Skincare', 'Tech', 'Lifestyle', 'Food', 'Fitness',
    'Haircare', 'Makeup', 'Home Decor', 'Self-care', 'Modest fashion',
    'Jewelry', 'Travel', 'Wellness', 'Coffee', 'Stationery', 'Perfumes', 'Men\'s Grooming'
  ];

  const contentStyleOptions = [
    'Product Demo', 'Tutorial', 'Voiceover', 'ASMR', 'How to use', 'DIY',
    'Unboxing', 'Taste Test', 'Day in my life', 'Comparison videos',
    'Review', 'Restock With Me', 'Trend-based'
  ];

  const faceOrFacelessOptions = [
    { value: 'face', label: 'Face' },
    { value: 'faceless', label: 'Faceless' }
  ];

  const languageOptions = [
    'Urdu', 'Sindhi', 'Punjabi', 'Pashto', 'Balochi', 'Saraiki',
    'English', 'Arabic', 'German'
  ];

  const countryOptions = [
    'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Bangladesh', 'Belgium', 'Brazil', 'Canada',
    'China', 'Denmark', 'Egypt', 'Finland', 'France', 'Germany', 'Greece', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
    'Italy', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Lebanon', 'Malaysia', 'Mexico', 'Morocco', 'Netherlands',
    'New Zealand', 'Nigeria', 'Norway', 'Oman', 'Pakistan', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Russia',
    'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Thailand',
    'Turkey', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Vietnam'
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

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

  const handleMultiSelectChange = (name, selectedValues) => {
    setFormData(prev => ({
      ...prev,
      [name]: selectedValues
    }));
    
    // Clear error when user makes selection
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        sampleContent: file
      }));
      
      // Clear error when user selects file
      if (errors.sampleContent) {
        setErrors(prev => ({
          ...prev,
          sampleContent: ''
        }));
      }
    }
  };

  // Handle multiple sample content links
  const handleLinkChange = (index, value) => {
    const newLinks = [...formData.sampleContentLinks];
    newLinks[index] = value;
    setFormData(prev => ({
      ...prev,
      sampleContentLinks: newLinks
    }));
    
    // Clear error when user types
    if (errors.sampleContent) {
      setErrors(prev => ({
        ...prev,
        sampleContent: ''
      }));
    }
  };

  const addSampleLink = () => {
    setFormData(prev => ({
      ...prev,
      sampleContentLinks: [...prev.sampleContentLinks, '']
    }));
  };

  const removeSampleLink = (index) => {
    if (formData.sampleContentLinks.length > 1) {
      const newLinks = formData.sampleContentLinks.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        sampleContentLinks: newLinks
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender selection is required';
    }

    if (!formData.maritalStatus) {
      newErrors.maritalStatus = 'Marital status is required';
    }

    if (!formData.children) {
      newErrors.children = 'Children information is required';
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required';
    }

    // Sample content validation
    if (formData.sampleContentType === 'upload' && !formData.sampleContent) {
      newErrors.sampleContent = 'Please upload a sample content file';
    } else if (formData.sampleContentType === 'link') {
      // Validate that at least one link is provided and not empty
      const validLinks = formData.sampleContentLinks.filter(link => link.trim() !== '');
      if (validLinks.length === 0) {
        newErrors.sampleContent = 'Please provide at least one sample content link';
      }
    }

    if (!formData.niche || formData.niche.length === 0) {
      newErrors.niche = 'Please select at least one niche';
    }

    if (!formData.contentStyle || formData.contentStyle.length === 0) {
      newErrors.contentStyle = 'Please select at least one content style';
    }

    if (!formData.faceOrFaceless) {
      newErrors.faceOrFaceless = 'Please select face or faceless preference';
    }

    if (!formData.languages || formData.languages.length === 0) {
      newErrors.languages = 'Please select at least one language';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('User authentication state:', { isAuthenticated, user });
      console.log('User role:', user?.role);
      console.log('Token in localStorage:', localStorage.getItem('token'));
      
      // Create FormData for file upload
      const profileFormData = new FormData();
      
      // Add all form fields
      profileFormData.append('fullName', formData.fullName.trim());
      profileFormData.append('email', user.email); // Use logged-in user's email
      profileFormData.append('phoneNumber', formData.phoneNumber.trim());
      profileFormData.append('city', formData.city.trim());
      profileFormData.append('country', formData.country.trim());
      profileFormData.append('location', formData.location.trim());
      profileFormData.append('dateOfBirth', formData.dateOfBirth);
      profileFormData.append('gender', formData.gender);
      profileFormData.append('maritalStatus', formData.maritalStatus);
      profileFormData.append('children', formData.children);
      profileFormData.append('bio', formData.bio.trim());
      profileFormData.append('sampleContentType', formData.sampleContentType);
      profileFormData.append('faceOrFaceless', formData.faceOrFaceless);
      
      // Handle sample content (file or link)
      if (formData.sampleContentType === 'upload' && formData.sampleContent) {
        profileFormData.append('sampleContent', formData.sampleContent);
      } else if (formData.sampleContentType === 'link') {
        // Filter out empty links and send as JSON array
        const validLinks = formData.sampleContentLinks.filter(link => link.trim() !== '');
        profileFormData.append('sampleContent', JSON.stringify(validLinks));
      }
      
      // Convert arrays to JSON strings for FormData
      profileFormData.append('niche', JSON.stringify(formData.niche));
      profileFormData.append('contentStyle', JSON.stringify(formData.contentStyle));
      profileFormData.append('languages', JSON.stringify(formData.languages));

      console.log('Creating UGC profile with FormData');
      console.log('Form validation state:', errors);
      
      const response = await ugcCreatorAPI.createProfile(profileFormData);
      console.log('UGC Profile creation response:', response);
      
      // Dispatch custom event to notify ProtectedRoute
      console.log('Dispatching profileCreated event...');
      window.dispatchEvent(new CustomEvent('profileCreated'));
      
      console.log('Navigating to UGC dashboard...');
      navigate('/ugc/dashboard');
    } catch (error) {
      console.error('UGC Profile creation error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to create profile. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors array
        if (Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.map(err => err.msg || err.message).join(', ');
        } else {
          errorMessage = JSON.stringify(error.response.data.errors);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'ugc_creator') {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h4 className="mb-0">UGC Creator Profile Setup</h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}

              <div>
                <h5 className="mb-4">Personal Information</h5>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        isInvalid={!!errors.fullName}
                        placeholder="Enter your full name"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.fullName}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number *</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        isInvalid={!!errors.phoneNumber}
                        placeholder="Enter your phone number"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.phoneNumber}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Location *</Form.Label>
                      <Form.Control
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        isInvalid={!!errors.location}
                        placeholder="Enter your location"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.location}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>City *</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        isInvalid={!!errors.city}
                        placeholder="Enter your city"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.city}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Country *</Form.Label>
                      <Form.Select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        isInvalid={!!errors.country}
                      >
                        <option value="">Select your country</option>
                        {countryOptions.map(country => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.country}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date of Birth *</Form.Label>
                      <Form.Control
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        isInvalid={!!errors.dateOfBirth}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.dateOfBirth}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Gender *</Form.Label>
                      <Form.Select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        isInvalid={!!errors.gender}
                      >
                        <option value="">Select gender</option>
                        {genderOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.gender}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Marital Status *</Form.Label>
                      <Form.Select
                        name="maritalStatus"
                        value={formData.maritalStatus}
                        onChange={handleChange}
                        isInvalid={!!errors.maritalStatus}
                      >
                        <option value="">Select marital status</option>
                        {maritalStatusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.maritalStatus}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Children *</Form.Label>
                      <Form.Select
                        name="children"
                        value={formData.children}
                        onChange={handleChange}
                        isInvalid={!!errors.children}
                      >
                        <option value="">Select children status</option>
                        {childrenOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.children}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Bio *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    isInvalid={!!errors.bio}
                    placeholder="Tell us about yourself and your content creation experience..."
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.bio}
                  </Form.Control.Feedback>
                </Form.Group>

                <h5 className="mb-4 mt-4">Content Information</h5>

                <Form.Group className="mb-3">
                  <Form.Label>Sample Content *</Form.Label>
                  <div className="mb-3">
                    <Form.Check
                      type="radio"
                      id="upload-content"
                      name="sampleContentType"
                      value="upload"
                      label="Upload sample content (video or image)"
                      checked={formData.sampleContentType === 'upload'}
                      onChange={handleChange}
                    />
                    <Form.Check
                      type="radio"
                      id="link-content"
                      name="sampleContentType"
                      value="link"
                      label="Provide link to sample content"
                      checked={formData.sampleContentType === 'link'}
                      onChange={handleChange}
                    />
                  </div>
                  
                  {formData.sampleContentType === 'upload' && (
                    <Form.Control
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      isInvalid={!!errors.sampleContent}
                    />
                  )}
                  
                  {formData.sampleContentType === 'link' && (
                    <div>
                      {formData.sampleContentLinks.map((link, index) => (
                        <div key={index} className="mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <Form.Control
                              type="url"
                              value={link}
                              onChange={(e) => handleLinkChange(index, e.target.value)}
                              placeholder={`Sample content link ${index + 1}`}
                              isInvalid={!!errors.sampleContent}
                            />
                            {formData.sampleContentLinks.length > 1 && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => removeSampleLink(index)}
                                className="px-2"
                              >
                                ×
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={addSampleLink}
                        className="mt-2"
                      >
                        + Add Another Link
                      </Button>
                    </div>
                  )}
                  <Form.Control.Feedback type="invalid">
                    {errors.sampleContent}
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Niche *</Form.Label>
                      <MultiSelect
                        options={nicheOptions}
                        value={formData.niche}
                        onChange={(selectedValues) => handleMultiSelectChange('niche', selectedValues)}
                        placeholder="Select your niches..."
                        isInvalid={!!errors.niche}
                      />
                      {errors.niche && (
                        <div className="invalid-feedback d-block">
                          {errors.niche}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Content Style *</Form.Label>
                      <MultiSelect
                        options={contentStyleOptions}
                        value={formData.contentStyle}
                        onChange={(selectedValues) => handleMultiSelectChange('contentStyle', selectedValues)}
                        placeholder="Select your content styles..."
                        isInvalid={!!errors.contentStyle}
                      />
                      {errors.contentStyle && (
                        <div className="invalid-feedback d-block">
                          {errors.contentStyle}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Face / Faceless *</Form.Label>
                      <Form.Select
                        name="faceOrFaceless"
                        value={formData.faceOrFaceless}
                        onChange={handleChange}
                        isInvalid={!!errors.faceOrFaceless}
                      >
                        <option value="">Select content type</option>
                        {faceOrFacelessOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.faceOrFaceless}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Languages you speak *</Form.Label>
                      <MultiSelect
                        options={languageOptions}
                        value={formData.languages}
                        onChange={(selectedValues) => handleMultiSelectChange('languages', selectedValues)}
                        placeholder="Select languages you speak..."
                        isInvalid={!!errors.languages}
                      />
                      {errors.languages && (
                        <div className="invalid-feedback d-block">
                          {errors.languages}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end mt-4">
                  <Button 
                    variant="primary" 
                    onClick={handleCreateProfile}
                    disabled={isLoading}
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Creating Profile...
                      </>
                    ) : (
                      'Complete Profile'
                    )}
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UGCWizard;