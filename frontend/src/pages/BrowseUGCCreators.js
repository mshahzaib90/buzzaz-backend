import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, Alert, InputGroup, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ugcCreatorAPI } from '../api/ugcAPI';
import { chatAPIService as chatAPI } from '../api/chatAPI';
import MultiSelect from '../components/MultiSelect';

  const BrowseUGCCreators = () => {
  const [ugcCreators, setUgcCreators] = useState([]);
  const [filteredCreators, setFilteredCreators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [filters, setFilters] = useState({
    search: '',
    categories: [],
    contentTypes: [],
    minPrice: '',
    maxPrice: '',
    location: '',
    gender: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Predefined options
  const categoryOptions = [
    'Fashion', 'Beauty', 'Lifestyle', 'Travel', 'Food', 'Fitness', 'Technology',
    'Gaming', 'Music', 'Art', 'Photography', 'Business', 'Education', 'Health',
    'Parenting', 'Home & Garden', 'Sports', 'Entertainment', 'DIY', 'Pets'
  ];

  const contentTypeOptions = [
    'UGC Videos', 'Product Reviews', 'Unboxing', 'Tutorials', 'Testimonials',
    'Behind the Scenes', 'Lifestyle Content', 'Brand Storytelling', 'Social Media Posts'
  ];

  const fetchUGCCreators = React.useCallback(async () => {
    try {
      const response = await ugcCreatorAPI.browseCreators();
      setUgcCreators(response.ugcCreators || []);
    } catch (error) {
      console.error('Error fetching UGC creators:', error);
      setError('Failed to load UGC creators');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'brand') {
      navigate('/dashboard');
      return;
    }
    fetchUGCCreators();
  }, [user, navigate, fetchUGCCreators]);

  useEffect(() => {
    let filtered = [...ugcCreators];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(creator => 
        creator.fullName.toLowerCase().includes(searchTerm) ||
        creator.bio.toLowerCase().includes(searchTerm) ||
        creator.location.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(creator => 
        creator.categories?.some(category => filters.categories.includes(category))
      );
    }

    if (filters.contentTypes && filters.contentTypes.length > 0) {
      filtered = filtered.filter(creator => 
        creator.contentTypes?.some(type => filters.contentTypes.includes(type))
      );
    }

    if (filters.minPrice) {
      const min = parseFloat(filters.minPrice);
      filtered = filtered.filter(creator => {
        const pricingFields = [
          'reelPostPrice', 'staticPostPrice', 'reelStaticComboPrice', 
          'storyVideoPrice', 'storyShoutoutPrice', 'storyUnboxingPrice',
          'eventAttendancePrice', 'outdoorShootPrice'
        ];
        const hasMatchingPrice = pricingFields.some(field => {
          const price = creator[field];
          return price && price >= min;
        });
        const hasOldPriceRange = creator.priceRangeMax && creator.priceRangeMax >= min;
        return hasMatchingPrice || hasOldPriceRange;
      });
    }

    if (filters.maxPrice) {
      const max = parseFloat(filters.maxPrice);
      filtered = filtered.filter(creator => {
        const pricingFields = [
          'reelPostPrice', 'staticPostPrice', 'reelStaticComboPrice', 
          'storyVideoPrice', 'storyShoutoutPrice', 'storyUnboxingPrice',
          'eventAttendancePrice', 'outdoorShootPrice'
        ];
        const hasMatchingPrice = pricingFields.some(field => {
          const price = creator[field];
          return price && price <= max;
        });
        const hasOldPriceRange = creator.priceRangeMin && creator.priceRangeMin <= max;
        return hasMatchingPrice || hasOldPriceRange;
      });
    }

    if (filters.location) {
      filtered = filtered.filter(creator => 
        creator.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.gender) {
      filtered = filtered.filter(creator => 
        creator.gender === filters.gender
      );
    }

    setFilteredCreators(filtered);
    setCurrentPage(1);
  }, [ugcCreators, filters]);

  

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categories: [],
      contentTypes: [],
      minPrice: '',
      maxPrice: '',
      location: '',
      gender: ''
    });
  };

  const handleStartChat = async (creatorId) => {
    try {
      setError('');
      setSuccess('');
      
      await chatAPI.createConversation(creatorId);
      setSuccess('Chat started successfully!');
      
      // Navigate to chat after a brief delay
      setTimeout(() => {
        navigate('/dashboard', { state: { activeTab: 'chat' } });
      }, 1000);
    } catch (error) {
      console.error('Error starting chat:', error);
      setError(error.message || 'Failed to start chat');
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCreators = filteredCreators.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCreators.length / itemsPerPage);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="justify-content-center">
        <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
        <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
        {items}
        <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />
        <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
      </Pagination>
    );
  };

  if (isLoading) {
    return (
      <Container className="py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-1">Browse UGC Creators</h1>
              <p className="text-muted mb-0">Discover and connect with UGC creators</p>
            </div>
            <Button variant="outline-secondary" onClick={() => navigate('/dashboard')}>
              <i className="bi bi-arrow-left me-2"></i>
              Back to Dashboard
            </Button>
          </div>

          {error && (
            <Alert variant="danger" className="mb-3" dismissible onClose={() => setError('')}>
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="mb-3" dismissible onClose={() => setSuccess('')}>
              <i className="bi bi-check-circle me-2"></i>
              {success}
            </Alert>
          )}

          <Row>
            {/* Filters Sidebar */}
            <Col lg={3} className="mb-4">
              <Card className="sticky-top" style={{ top: '100px' }}>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Filters</h5>
                  <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                </Card.Header>
                <Card.Body>
                  {/* Search */}
                  <Form.Group className="mb-3">
                    <Form.Label>Search</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Name or bio..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                      <InputGroup.Text>
                        <i className="bi bi-search"></i>
                      </InputGroup.Text>
                    </InputGroup>
                  </Form.Group>

                  {/* Categories */}
                  <Form.Group className="mb-3">
                    <MultiSelect
                      label="Categories"
                      options={categoryOptions}
                      value={filters.categories}
                      onChange={(selectedCategories) => handleFilterChange('categories', selectedCategories)}
                      placeholder="Select categories..."
                    />
                  </Form.Group>

                  {/* Content Types */}
                  <Form.Group className="mb-3">
                    <MultiSelect
                      label="Content Types"
                      options={contentTypeOptions}
                      value={filters.contentTypes}
                      onChange={(selectedTypes) => handleFilterChange('contentTypes', selectedTypes)}
                      placeholder="Select content types..."
                    />
                  </Form.Group>

                  {/* Price Range */}
                  <Form.Group className="mb-3">
                    <Form.Label>Price Range ($)</Form.Label>
                    <Row>
                      <Col>
                        <Form.Control
                          type="number"
                          placeholder="Min"
                          value={filters.minPrice}
                          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        />
                      </Col>
                      <Col>
                        <Form.Control
                          type="number"
                          placeholder="Max"
                          value={filters.maxPrice}
                          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        />
                      </Col>
                    </Row>
                  </Form.Group>

                  {/* Location */}
                  <Form.Group className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="City, Country"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                    />
                  </Form.Group>

                  {/* Gender */}
                  <Form.Group className="mb-3">
                    <Form.Label>Gender</Form.Label>
                    <Form.Select
                      value={filters.gender}
                      onChange={(e) => handleFilterChange('gender', e.target.value)}
                    >
                      <option value="">All Genders</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </Form.Select>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>

            {/* UGC Creators Grid */}
            <Col lg={9}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="text-muted mb-0">
                  Showing {currentCreators.length} of {filteredCreators.length} UGC creators
                </p>
              </div>

              {currentCreators.length === 0 ? (
                <Card>
                  <Card.Body className="text-center py-5">
                    <i className="bi bi-search display-1 text-muted"></i>
                    <h5 className="mt-3 mb-2">No UGC Creators Found</h5>
                    <p className="text-muted">
                      Try adjusting your filters to find more UGC creators.
                    </p>
                  </Card.Body>
                </Card>
              ) : (
                <>
                  <Row>
                    {currentCreators.map((creator) => (
                      <Col md={6} lg={4} key={creator.id} className="mb-4">
                        <Card className="h-100">
                          <Card.Body className="text-center">
                            <div className="mb-3">
                              <div 
                                className="rounded-circle bg-success d-flex align-items-center justify-content-center mx-auto"
                                style={{ width: '80px', height: '80px' }}
                              >
                                <i className="bi bi-person-fill text-white" style={{ fontSize: '1.5rem' }}></i>
                              </div>
                            </div>
                            
                            <h6 className="mb-1">{creator.fullName}</h6>
                            <p className="small text-muted mb-2">{creator.location}</p>
                            
                            <div className="mb-3">
                              {creator.categories?.slice(0, 2).map((category, index) => (
                                <Badge key={index} bg="light" text="dark" className="me-1 mb-1 small">
                                  {category}
                                </Badge>
                              ))}
                              {creator.categories?.length > 2 && (
                                <Badge bg="light" text="dark" className="small">
                                  +{creator.categories.length - 2}
                                </Badge>
                              )}
                            </div>

                            <div className="mb-3">
                              {creator.contentTypes?.slice(0, 2).map((type, index) => (
                                <Badge key={index} bg="secondary" className="me-1 mb-1 small">
                                  {type}
                                </Badge>
                              ))}
                              {creator.contentTypes?.length > 2 && (
                                <Badge bg="secondary" className="small">
                                  +{creator.contentTypes.length - 2}
                                </Badge>
                              )}
                            </div>

                            <div className="d-flex justify-content-around text-center mb-3">
                              <div>
                                <div className="fw-bold text-success small">
                                  {(() => {
                                    const prices = [];
                                    const pricingFields = [
                                      'reelPostPrice', 'staticPostPrice', 'reelStaticComboPrice', 
                                      'storyVideoPrice', 'storyShoutoutPrice', 'storyUnboxingPrice',
                                      'eventAttendancePrice', 'outdoorShootPrice'
                                    ];
                                    
                                    pricingFields.forEach(field => {
                                      if (creator[field] && creator[field] > 0) {
                                        prices.push(parseFloat(creator[field]));
                                      }
                                    });
                                    
                                    if (prices.length === 0) {
                                      return creator.priceRangeMin ? `$${creator.priceRangeMin}` : 'N/A';
                                    }
                                    
                                    return `$${Math.min(...prices)}`;
                                  })()}
                                </div>
                                <small className="text-muted">Min Price</small>
                              </div>
                              <div>
                                <div className="fw-bold text-success small">
                                  {(() => {
                                    const prices = [];
                                    const pricingFields = [
                                      'reelPostPrice', 'staticPostPrice', 'reelStaticComboPrice', 
                                      'storyVideoPrice', 'storyShoutoutPrice', 'storyUnboxingPrice',
                                      'eventAttendancePrice', 'outdoorShootPrice'
                                    ];
                                    
                                    pricingFields.forEach(field => {
                                      if (creator[field] && creator[field] > 0) {
                                        prices.push(parseFloat(creator[field]));
                                      }
                                    });
                                    
                                    if (prices.length === 0) {
                                      return creator.priceRangeMax ? `$${creator.priceRangeMax}` : 'N/A';
                                    }
                                    
                                    return `$${Math.max(...prices)}`;
                                  })()}
                                </div>
                                <small className="text-muted">Max Price</small>
                              </div>
                              <div>
                                <div className="fw-bold text-success small">
                                  {creator.completedProjects || 0}
                                </div>
                                <small className="text-muted">Projects</small>
                              </div>
                            </div>

                            <div className="d-grid gap-2">
                              <Button 
                                variant="primary" 
                                size="sm"
                                onClick={() => handleStartChat(creator.userId)}
                              >
                                <i className="bi bi-chat-dots me-2"></i>
                                Start Chat
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  {/* Pagination */}
                  <div className="mt-4">
                    {renderPagination()}
                  </div>
                </>
              )}
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default BrowseUGCCreators;
