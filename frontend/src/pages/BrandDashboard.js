import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, Alert, InputGroup, Pagination, Nav, Tab } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { influencersAPI } from '../services/api';
import { chatAPIService as chatAPI } from '../api/chatAPI';
import MultiSelect from '../components/MultiSelect';
import ChatInterface from '../components/Chat/ChatInterface';

const BrandDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('discover');
  const [influencers, setInfluencers] = useState([]);
  const [filteredInfluencers, setFilteredInfluencers] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    contentTypes: [],
    locations: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    search: '',
    categories: [], // Changed from category to categories array
    minFollowers: '',
    maxFollowers: '',
    location: '',
    gender: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  const { user } = useAuth();
  
  useEffect(() => {
    fetchInfluencers();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [influencers, filters]);

  const fetchInfluencers = async () => {
    try {
      const response = await influencersAPI.getList();
      setInfluencers(response.data.influencers || []);
    } catch (error) {
      console.error('Error fetching influencers:', error);
      setError('Failed to load influencers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await influencersAPI.getFilters();
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...influencers];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(influencer => 
        influencer.fullName.toLowerCase().includes(searchTerm) ||
        influencer.instagramUsername.toLowerCase().includes(searchTerm) ||
        influencer.bio.toLowerCase().includes(searchTerm)
      );
    }

    // Category filter - Updated for multiple categories
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(influencer => 
        influencer.categories?.some(category => filters.categories.includes(category))
      );
    }

    // Followers range filter - fix the data access
    if (filters.minFollowers) {
      const min = parseInt(filters.minFollowers);
      filtered = filtered.filter(influencer => 
        (influencer.followers || 0) >= min
      );
    }

    if (filters.maxFollowers) {
      const max = parseInt(filters.maxFollowers);
      filtered = filtered.filter(influencer => 
        (influencer.followers || 0) <= max
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(influencer => 
        influencer.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Gender filter
    if (filters.gender) {
      filtered = filtered.filter(influencer => 
        influencer.gender === filters.gender
      );
    }

    setFilteredInfluencers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categories: [], // Updated for multiple categories
      minFollowers: '',
      maxFollowers: '',
      location: '',
      gender: ''
    });
  };

  const handleStartChat = async (influencer) => {
    try {
      setError(''); // Clear any previous errors
      
      // Check if user is authenticated
      if (!user) {
        setError('Please log in to start a chat');
        return;
      }
      
      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        navigate('/login');
        return;
      }
      
      console.log('Starting chat with influencer:', influencer);
      console.log('Current user:', user);
      console.log('Auth token exists:', !!token);
      
      // Use the correct ID field from the influencer data
      const participantId = influencer.userId || influencer._id || influencer.id;
      
      if (!participantId) {
        setError('Unable to identify influencer. Please try again.');
        console.error('No valid participant ID found:', influencer);
        return;
      }
      
      console.log('Using participant ID:', participantId);
      
      const response = await chatAPI.createConversation(participantId);
      console.log('Chat creation response:', response);
      setActiveTab('chat');
    } catch (error) {
      console.error('Error starting chat:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 401) {
        setError('Authentication expired. Please log in again.');
        navigate('/login');
      } else {
        setError(error.response?.data?.message || error.message || 'Failed to start chat');
      }
    }
  };

  const formatFollowers = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count?.toLocaleString() || '0';
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInfluencers = filteredInfluencers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInfluencers.length / itemsPerPage);

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
              <h1 className="h3 mb-1">Brand Dashboard</h1>
              <p className="text-muted mb-0">Discover and connect with influencers</p>
            </div>
            <Badge bg="success" className="px-3 py-2">
              <i className="bi bi-building me-1"></i>
              Brand
            </Badge>
          </div>

          {error && (
            <Alert variant="danger" className="mb-3">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="discover">
                  <i className="bi bi-search me-2"></i>
                  Discover Influencers
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="chat">
                  <i className="bi bi-chat-dots me-2"></i>
                  Messages
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              {/* Discover Tab */}
              <Tab.Pane eventKey="discover">
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
                        placeholder="Name or username..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                      <InputGroup.Text>
                        <i className="bi bi-search"></i>
                      </InputGroup.Text>
                    </InputGroup>
                  </Form.Group>

                  {/* Category - Multiple Selection */}
                  <Form.Group className="mb-3">
                    <MultiSelect
                      label="Categories"
                      options={filterOptions.categories}
                      value={filters.categories}
                      onChange={(selectedCategories) => handleFilterChange('categories', selectedCategories)}
                      placeholder="Select categories..."
                    />
                  </Form.Group>

                  {/* Followers Range */}
                  <Form.Group className="mb-3">
                    <Form.Label>Followers Range</Form.Label>
                    <Row>
                      <Col>
                        <Form.Control
                          type="number"
                          placeholder="Min"
                          value={filters.minFollowers}
                          onChange={(e) => handleFilterChange('minFollowers', e.target.value)}
                        />
                      </Col>
                      <Col>
                        <Form.Control
                          type="number"
                          placeholder="Max"
                          value={filters.maxFollowers}
                          onChange={(e) => handleFilterChange('maxFollowers', e.target.value)}
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

            {/* Influencers Grid */}
            <Col lg={9}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="text-muted mb-0">
                  Showing {currentInfluencers.length} of {filteredInfluencers.length} influencers
                </p>
              </div>

              {currentInfluencers.length === 0 ? (
                <Card>
                  <Card.Body className="text-center py-5">
                    <i className="bi bi-search display-1 text-muted"></i>
                    <h5 className="mt-3 mb-2">No Influencers Found</h5>
                    <p className="text-muted">
                      Try adjusting your filters to find more influencers.
                    </p>
                  </Card.Body>
                </Card>
              ) : (
                <>
                  <Row>
                    {currentInfluencers.map((influencer) => (
                      <Col md={6} lg={4} key={influencer.id} className="mb-4">
                        <Card className="h-100">
                          <Card.Body className="text-center">
                            <div className="mb-3">
                              {influencer.avatarUrl ? (
                                <img
                                  src={influencer.avatarUrl}
                                  alt="Profile"
                                  className="rounded-circle"
                                  style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className="rounded-circle bg-primary d-flex align-items-center justify-content-center mx-auto"
                                style={{ 
                                  width: '80px', 
                                  height: '80px',
                                  display: influencer.avatarUrl ? 'none' : 'flex'
                                }}
                              >
                                <i className="bi bi-person-fill text-white" style={{ fontSize: '1.5rem' }}></i>
                              </div>
                            </div>
                            
                            <h6 className="mb-1">{influencer.fullName}</h6>
                            <p className="text-muted small mb-2">@{influencer.instagramUsername}</p>
                            <p className="small text-muted mb-2">{influencer.location}</p>
                            
                            <div className="mb-3">
                              {influencer.categories?.slice(0, 2).map((category, index) => (
                                <Badge key={index} bg="light" text="dark" className="me-1 mb-1 small">
                                  {category}
                                </Badge>
                              ))}
                              {influencer.categories?.length > 2 && (
                                <Badge bg="light" text="dark" className="small">
                                  +{influencer.categories.length - 2}
                                </Badge>
                              )}
                            </div>

                            <div className="d-flex justify-content-around text-center mb-3">
                              <div>
                                <div className="fw-bold text-primary small">
                                  {formatFollowers(influencer.followers)}
                                </div>
                                <small className="text-muted">Followers</small>
                              </div>
                              <div>
                                <div className="fw-bold text-primary small">
                                  {influencer.postsCount || 0}
                                </div>
                                <small className="text-muted">Posts</small>
                              </div>
                              <div>
                                <div className="fw-bold text-primary small">
                                  {formatFollowers(influencer.following)}
                                </div>
                                <small className="text-muted">Following</small>
                              </div>
                            </div>

                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleStartChat(influencer)}
                              className="me-2"
                            >
                              <i className="bi bi-chat-dots me-1"></i>
                              Start Chat
                            </Button>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigate(`/influencer/${influencer._id}`)}
                            >
                              View Profile
                            </Button>
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
        </Tab.Pane>

        {/* Chat Tab */}
        <Tab.Pane eventKey="chat">
          <ChatInterface currentUser={user} />
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
        </Col>
      </Row>
    </Container>
  );
};

export default BrandDashboard;