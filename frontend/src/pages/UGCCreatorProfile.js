import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Tab, Tabs } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, ComposedChart } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { ugcCreatorAPI } from '../api/ugcAPI';
import { chatAPIService as chatAPI } from '../api/chatAPI';

const UGCCreatorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creator, setCreator] = useState(null);
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCreatorProfile = useCallback(async () => {
    try {
      const response = await ugcCreatorAPI.getProfile(id);
      setCreator(response.profile);
      
      // Fetch stats history
      try {
        const statsResponse = await ugcCreatorAPI.getStatsHistory(id);
        setStats(statsResponse);
      } catch (statsError) {
        console.log('Stats not available:', statsError);
        setStats([]);
      }
    } catch (error) {
      console.error('Error fetching UGC creator profile:', error);
      setError(error.message || 'Failed to load UGC creator profile');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user?.role !== 'brand') {
      navigate('/dashboard');
      return;
    }
    fetchCreatorProfile();
  }, [id, user, navigate, fetchCreatorProfile]);

  const handleStartChat = async () => {
    try {
      setError('');
      setSuccess('');
      
      await chatAPI.createConversation(creator.userId);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  if (error && !creator) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error || 'UGC Creator not found'}
        </Alert>
        <Button variant="primary" onClick={() => navigate('/browse-ugc-creators')}>
          Back to Browse UGC Creators
        </Button>
      </Container>
    );
  }

  const chartData = stats.map(stat => ({
    month: stat.month,
    projects: stat.projects,
    earnings: stat.earnings
  }));

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <Button 
            variant="outline-secondary" 
            className="mb-3"
            onClick={() => navigate('/browse-ugc-creators')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Browse UGC Creators
          </Button>

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

          {/* Profile Header */}
          <Card className="mb-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={3} className="text-center">
                  <div className="position-relative">
                    <div 
                      className="rounded-circle bg-success d-flex align-items-center justify-content-center mx-auto mb-3"
                      style={{ width: '120px', height: '120px' }}
                    >
                      <i className="bi bi-person-fill text-white" style={{ fontSize: '2rem' }}></i>
                    </div>
                  </div>
                  <div>
                    <Badge bg="success" className="px-3 py-2">
                      <i className="bi bi-camera-video me-1"></i>
                      UGC Creator
                    </Badge>
                  </div>
                </Col>
                <Col md={9}>
                  <h2 className="mb-2">{creator.fullName}</h2>
                  {creator.location && (
                    <p className="text-muted mb-3">
                      <i className="bi bi-geo-alt me-2"></i>
                      {creator.location}
                    </p>
                  )}
                  
                  <p className="mb-3">{creator.bio}</p>
                  
                  <div className="mb-3">
                    <h6 className="mb-2">Categories:</h6>
                    {creator.categories?.map((category, index) => (
                      <Badge key={index} bg="primary" className="me-2 mb-1">
                        {category}
                      </Badge>
                    ))}
                  </div>

                  <div className="mb-3">
                    <h6 className="mb-2">Content Types:</h6>
                    {creator.contentTypes?.map((type, index) => (
                      <Badge key={index} bg="secondary" className="me-2 mb-1">
                        {type}
                      </Badge>
                    ))}
                  </div>

                  <Row className="text-center">
                    <Col>
                      <div className="fw-bold text-success h4">
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
                            return creator.priceRangeMin && creator.priceRangeMax 
                              ? `$${creator.priceRangeMin} - $${creator.priceRangeMax}`
                              : 'Price not set';
                          }
                          
                          const minPrice = Math.min(...prices);
                          const maxPrice = Math.max(...prices);
                          
                          return minPrice === maxPrice 
                            ? `$${minPrice}` 
                            : `$${minPrice} - $${maxPrice}`;
                        })()}
                      </div>
                      <small className="text-muted">Price Range</small>
                    </Col>
                    <Col>
                      <div className="fw-bold text-success h4">
                        {creator.completedProjects || 0}
                      </div>
                      <small className="text-muted">Completed Projects</small>
                    </Col>
                    <Col>
                      <div className="fw-bold text-success h4">
                        {creator.averageRating ? creator.averageRating.toFixed(1) : 'N/A'}
                      </div>
                      <small className="text-muted">Average Rating</small>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Analytics Tabs */}
          <Tabs defaultActiveKey="overview" className="mb-3">
            <Tab eventKey="overview" title="Overview">
              <Row>
                <Col md={6} className="mb-4">
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-gradient" style={{background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)', color: 'white'}}>
                      <div className="d-flex align-items-center">
                        <i className="fas fa-user me-2"></i>
                        <h6 className="mb-0">Profile Information</h6>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <Row className="g-3">
                        <Col md={6}>
                          <div className="d-flex align-items-center p-3 rounded-3" style={{backgroundColor: '#f8f9fa', border: '1px solid #dee2e6'}}>
                            <div className="me-3">
                              <i className="fas fa-venus-mars text-info" style={{fontSize: '1.2rem'}}></i>
                            </div>
                            <div>
                              <div className="fw-bold text-dark">Gender</div>
                              <div className="text-muted">{creator.gender || 'Not specified'}</div>
                            </div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="d-flex align-items-center p-3 rounded-3" style={{backgroundColor: '#f8f9fa', border: '1px solid #dee2e6'}}>
                            <div className="me-3">
                              <i className="fas fa-project-diagram text-primary" style={{fontSize: '1.2rem'}}></i>
                            </div>
                            <div>
                              <div className="fw-bold text-dark">Total Projects</div>
                              <div className="text-primary fw-bold">{creator.totalProjects || 0}</div>
                            </div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="d-flex align-items-center p-3 rounded-3" style={{backgroundColor: '#e8f5e8', border: '1px solid #c3e6c3'}}>
                            <div className="me-3">
                              <i className="fas fa-tasks text-success" style={{fontSize: '1.2rem'}}></i>
                            </div>
                            <div>
                              <div className="fw-bold text-dark">Active Projects</div>
                              <div className="text-success fw-bold">{creator.activeProjects || 0}</div>
                            </div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="d-flex align-items-center p-3 rounded-3" style={{backgroundColor: '#fff8e1', border: '1px solid #ffecb3'}}>
                            <div className="me-3">
                              <i className="fas fa-coins text-warning" style={{fontSize: '1.2rem'}}></i>
                            </div>
                            <div>
                              <div className="fw-bold text-dark">Total Earnings</div>
                              <div className="text-warning fw-bold">${creator.totalEarnings || 0}</div>
                            </div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="d-flex align-items-center p-3 rounded-3" style={{backgroundColor: '#f3e5f5', border: '1px solid #e1bee7'}}>
                            <div className="me-3">
                              <i className="fas fa-calendar-plus text-purple" style={{fontSize: '1.2rem', color: '#9c27b0'}}></i>
                            </div>
                            <div>
                              <div className="fw-bold text-dark">Joined</div>
                              <div className="text-muted">{formatDate(creator.createdAt)}</div>
                            </div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="d-flex align-items-center p-3 rounded-3" style={{backgroundColor: '#e3f2fd', border: '1px solid #bbdefb'}}>
                            <div className="me-3">
                              <i className="fas fa-clock text-info" style={{fontSize: '1.2rem'}}></i>
                            </div>
                            <div>
                              <div className="fw-bold text-dark">Last Updated</div>
                              <div className="text-muted">{formatDate(creator.updatedAt)}</div>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} className="mb-4">
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-gradient" style={{background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', color: 'white'}}>
                      <div className="d-flex align-items-center">
                        <i className="fas fa-dollar-sign me-2"></i>
                        <h6 className="mb-0">Pricing Information</h6>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <Row className="g-3">
                        {/* New detailed pricing structure */}
                        {creator.reelPostPrice && (
                          <Col md={6}>
                            <div className="d-flex align-items-center p-3 rounded-3" style={{backgroundColor: '#f8f9fa', border: '1px solid #dee2e6'}}>
                              <div className="me-3">
                                <i className="fas fa-video text-primary" style={{fontSize: '1.2rem'}}></i>
                              </div>
                              <div>
                                <div className="fw-bold text-dark">Reel Post</div>
                                <div className="text-success fw-bold">${creator.reelPostPrice}</div>
                              </div>
                            </div>
                          </Col>
                        )}
                        {creator.staticPostPrice && (
                          <Col md={6}>
                            <div className="d-flex align-items-center p-3 rounded-3" style={{backgroundColor: '#f8f9fa', border: '1px solid #dee2e6'}}>
                              <div className="me-3">
                                <i className="fas fa-image text-info" style={{fontSize: '1.2rem'}}></i>
                              </div>
                              <div>
                                <div className="fw-bold text-dark">Static Post</div>
                                <div className="text-success fw-bold">${creator.staticPostPrice}</div>
                              </div>
                            </div>
                          </Col>
                        )}
                        {creator.reelStaticComboPrice && (
                          <Col md={6}>
                            <div className="d-flex align-items-center p-3 rounded-3" style={{backgroundColor: '#f8f9fa', border: '1px solid #dee2e6'}}>
                              <div className="me-3">
                                <i className="fas fa-layer-group text-warning" style={{fontSize: '1.2rem'}}></i>
                              </div>
                              <div>
                                <div className="fw-bold text-dark">Reel + Static Combo</div>
                                <div className="text-success fw-bold">${creator.reelStaticComboPrice}</div>
                              </div>
                            </div>
                          </Col>
                        )}
                        {creator.storyVideoPrice && (
                          <Col md={6}>
                            <div className="d-flex align-items-center p-3 rounded-3" style={{backgroundColor: '#f8f9fa', border: '1px solid #dee2e6'}}>
                              <div className="me-3">
                                <i className="fas fa-play-circle text-danger" style={{fontSize: '1.2rem'}}></i>
                              </div>
                              <div>
                                <div className="fw-bold text-dark">Story Video</div>
                                <div className="text-success fw-bold">${creator.storyVideoPrice}</div>
                              </div>
                            </div>
                          </Col>
                        )}
                        {creator.storyShoutoutPrice && (
                          <Col md={6}>
                            <div className="d-flex align-items-center p-3 rounded-3" style={{backgroundColor: '#f8f9fa', border: '1px solid #dee2e6'}}>
                              <div className="me-3">
                                <i className="fas fa-bullhorn text-secondary" style={{fontSize: '1.2rem'}}></i>
                              </div>
                              <div>
                                <div className="fw-bold text-dark">Story Shoutout</div>
                                <div className="text-success fw-bold">${creator.storyShoutoutPrice}</div>
                              </div>
                            </div>
                          </Col>
                        )}
                        {creator.storyUnboxingPrice && (
                          <Col md={6}>
                            <div className="d-flex align-items-center p-3 rounded-3" style={{backgroundColor: '#f8f9fa', border: '1px solid #dee2e6'}}>
                              <div className="me-3">
                                <i className="fas fa-box-open text-success" style={{fontSize: '1.2rem'}}></i>
                              </div>
                              <div>
                                <div className="fw-bold text-dark">Story Unboxing</div>
                                <div className="text-success fw-bold">${creator.storyUnboxingPrice}</div>
                              </div>
                            </div>
                          </Col>
                        )}
                        {creator.eventAttendancePrice && (
                          <Col md={6}>
                            <div className="d-flex align-items-center p-3 rounded-3" style={{backgroundColor: '#f8f9fa', border: '1px solid #dee2e6'}}>
                              <div className="me-3">
                                <i className="fas fa-calendar-check text-purple" style={{fontSize: '1.2rem', color: '#6f42c1'}}></i>
                              </div>
                              <div>
                                <div className="fw-bold text-dark">Event Attendance</div>
                                <div className="text-success fw-bold">${creator.eventAttendancePrice}</div>
                              </div>
                            </div>
                          </Col>
                        )}
                        {creator.outdoorShootPrice && (
                          <Col md={6}>
                            <div className="d-flex align-items-center p-3 rounded-3" style={{backgroundColor: '#f8f9fa', border: '1px solid #dee2e6'}}>
                              <div className="me-3">
                                <i className="fas fa-camera text-dark" style={{fontSize: '1.2rem'}}></i>
                              </div>
                              <div>
                                <div className="fw-bold text-dark">Outdoor Shoot</div>
                                <div className="text-success fw-bold">${creator.outdoorShootPrice}</div>
                              </div>
                            </div>
                          </Col>
                        )}
                        {creator.expressDeliveryCharge && (
                          <Col md={6}>
                            <div className="d-flex align-items-center p-3 rounded-3" style={{backgroundColor: '#fff3cd', border: '1px solid #ffeaa7'}}>
                              <div className="me-3">
                                <i className="fas fa-shipping-fast text-warning" style={{fontSize: '1.2rem'}}></i>
                              </div>
                              <div>
                                <div className="fw-bold text-dark">Express Delivery Charge</div>
                                <div className="text-warning fw-bold">${creator.expressDeliveryCharge}</div>
                              </div>
                            </div>
                          </Col>
                        )}
                      </Row>
                      
                      {/* Fallback to old pricing if new pricing not available */}
                      {!creator.reelPostPrice && !creator.staticPostPrice && creator.priceRangeMin && creator.priceRangeMax && (
                        <Row className="g-3">
                          <Col md={6}>
                            <div className="d-flex align-items-center p-3 rounded-3" style={{backgroundColor: '#f8f9fa', border: '1px solid #dee2e6'}}>
                              <div className="me-3">
                                <i className="fas fa-arrow-down text-success" style={{fontSize: '1.2rem'}}></i>
                              </div>
                              <div>
                                <div className="fw-bold text-dark">Minimum Price</div>
                                <div className="text-success fw-bold">${creator.priceRangeMin}</div>
                              </div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="d-flex align-items-center p-3 rounded-3" style={{backgroundColor: '#f8f9fa', border: '1px solid #dee2e6'}}>
                              <div className="me-3">
                                <i className="fas fa-arrow-up text-success" style={{fontSize: '1.2rem'}}></i>
                              </div>
                              <div>
                                <div className="fw-bold text-dark">Maximum Price</div>
                                <div className="text-success fw-bold">${creator.priceRangeMax}</div>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      )}
                      
                      <hr className="my-4" />
                      
                      <Row className="g-3">
                        <Col md={6}>
                          <div className="text-center">
                            <div className="fw-bold text-warning h5">
                              <i className="fas fa-star me-1"></i>
                              {creator.averageRating ? `${creator.averageRating.toFixed(1)}/5` : 'No ratings yet'}
                            </div>
                            <small className="text-muted">Average Rating</small>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="text-center">
                            <Badge bg={creator.isActive ? 'success' : 'secondary'} className="px-3 py-2" style={{fontSize: '0.9rem'}}>
                              <i className={`fas ${creator.isActive ? 'fa-check-circle' : 'fa-pause-circle'} me-1`}></i>
                              {creator.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Delivery Time Information */}
              <Row>
                <Col md={12} className="mb-4">
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-gradient" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
                      <div className="d-flex align-items-center">
                        <i className="fas fa-clock me-2"></i>
                        <h6 className="mb-0">Average Delivery Time</h6>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <Row className="g-4">
                        <Col md={6} lg={3}>
                          <div className="text-center p-3 rounded-3" style={{backgroundColor: '#f8f9ff', border: '1px solid #e3e6f0'}}>
                            <div className="mb-2">
                              <i className="fas fa-video text-primary" style={{fontSize: '1.5rem'}}></i>
                            </div>
                            <div className="fw-bold text-dark mb-1">Product-based UGC</div>
                            <div className="text-muted small">{creator.productBasedDelivery || '5-7 days'}</div>
                          </div>
                        </Col>
                        <Col md={6} lg={3}>
                          <div className="text-center p-3 rounded-3" style={{backgroundColor: '#fff8f0', border: '1px solid #f0e6d2'}}>
                            <div className="mb-2">
                              <i className="fas fa-image text-warning" style={{fontSize: '1.5rem'}}></i>
                            </div>
                            <div className="fw-bold text-dark mb-1">No Product UGC</div>
                            <div className="text-muted small">{creator.noProductDelivery || '3-5 days'}</div>
                          </div>
                        </Col>
                        <Col md={6} lg={3}>
                          <div className="text-center p-3 rounded-3" style={{backgroundColor: '#f0fff4', border: '1px solid #d4edda'}}>
                            <div className="mb-2">
                              <i className="fas fa-bolt text-success" style={{fontSize: '1.5rem'}}></i>
                            </div>
                            <div className="fw-bold text-dark mb-1">Express Delivery</div>
                            <div className="text-muted small">{creator.expressDelivery || '48-72 hours'}</div>
                          </div>
                        </Col>
                        <Col md={6} lg={3}>
                          <div className="text-center p-3 rounded-3" style={{backgroundColor: '#fff0f5', border: '1px solid #f8d7da'}}>
                            <div className="mb-2">
                              <i className="fas fa-camera text-danger" style={{fontSize: '1.5rem'}}></i>
                            </div>
                            <div className="fw-bold text-dark mb-1">Outdoor Shoot</div>
                            <div className="text-muted small">{creator.outdoorEventDelivery || '4-5 days'}</div>
                          </div>
                        </Col>
                      </Row>
                      <Row className="mt-3">
                        <Col md={6} className="mx-auto">
                          <div className="text-center p-3 rounded-3" style={{backgroundColor: '#f5f5f5', border: '1px solid #dee2e6'}}>
                            <div className="mb-2">
                              <i className="fas fa-edit text-info" style={{fontSize: '1.5rem'}}></i>
                            </div>
                            <div className="fw-bold text-dark mb-1">Revisions</div>
                            <div className="text-muted small">{creator.revisionsDelivery || '3-4 days'}</div>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="analytics" title="Analytics">
              {chartData.length > 0 ? (
                <Row>
                  <Col lg={6} className="mb-4">
                    <Card className="border-0 shadow-sm">
                      <Card.Header className="bg-gradient" style={{background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', color: 'white'}}>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-chart-line me-2"></i>
                          <h6 className="mb-0">Projects Over Time</h6>
                        </div>
                      </Card.Header>
                      <Card.Body className="p-4">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                            <XAxis dataKey="month" stroke="#6c757d" />
                            <YAxis stroke="#6c757d" />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #dee2e6',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="projects" 
                              stroke="#28a745" 
                              strokeWidth={3}
                              name="Projects"
                              dot={{ fill: '#28a745', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: '#28a745', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col lg={6} className="mb-4">
                    <Card className="border-0 shadow-sm">
                      <Card.Header className="bg-gradient" style={{background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)', color: 'white'}}>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-dollar-sign me-2"></i>
                          <h6 className="mb-0">Earnings Over Time</h6>
                        </div>
                      </Card.Header>
                      <Card.Body className="p-4">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                            <XAxis dataKey="month" stroke="#6c757d" />
                            <YAxis stroke="#6c757d" />
                            <Tooltip 
                              formatter={(value) => [`$${value}`, 'Earnings']}
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #dee2e6',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="earnings" 
                              stroke="#ffc107" 
                              strokeWidth={3}
                              name="Earnings ($)"
                              dot={{ fill: '#ffc107', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: '#ffc107', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col lg={12} className="mb-4">
                    <Card className="border-0 shadow-sm">
                      <Card.Header className="bg-gradient" style={{background: 'linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%)', color: 'white'}}>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-chart-bar me-2"></i>
                          <h6 className="mb-0">Monthly Performance</h6>
                        </div>
                      </Card.Header>
                      <Card.Body className="p-4">
                        <ResponsiveContainer width="100%" height={300}>
                          <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="projects" fill="#198754" name="Projects" />
                            <Line type="monotone" dataKey="projects" stroke="#116c49" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              ) : (
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center py-5">
                    <div className="mb-4">
                      <i className="fas fa-chart-bar display-1 text-muted"></i>
                    </div>
                    <h5 className="mt-3 mb-2 text-dark">No Analytics Data</h5>
                    <p className="text-muted">
                      Analytics data will appear here once the UGC creator has completed projects over time.
                    </p>
                  </Card.Body>
                </Card>
              )}
            </Tab>
          </Tabs>

          {/* Contact Actions */}
          <Card>
            <Card.Body className="text-center">
              <h5 className="mb-3">Interested in collaborating?</h5>
              <p className="text-muted mb-3">
                Connect with {creator.fullName} to discuss UGC creation opportunities.
              </p>
              <div className="d-flex gap-2 justify-content-center">
                <Button 
                  variant="primary"
                  onClick={handleStartChat}
                  size="lg"
                >
                  <i className="bi bi-chat-dots me-2"></i>
                  Start Chat
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UGCCreatorProfile;
