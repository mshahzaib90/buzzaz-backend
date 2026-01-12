import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Tab, Tabs } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, ComposedChart } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { influencerAPI, getUploadsUrl } from '../services/api';
import { chatAPIService as chatAPI } from '../api/chatAPI';
import EmailModal from '../components/EmailModal';

const InfluencerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [influencer, setInfluencer] = useState(null);
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  const fetchInfluencerProfile = useCallback(async () => {
    try {
      const [profileResponse, statsResponse] = await Promise.all([
        influencerAPI.getProfile(id),
        influencerAPI.getStats(id)
      ]);

      const normalizeProfile = (profile) => {
        if (!profile) return null;
        
        const id = profile.id || profile._id || profile.uid || profile.userId;

        // Helper to generate consistent fake numbers based on ID
        const getFakeCount = (seedStr, min, max) => {
           let hash = 0;
           for (let i = 0; i < seedStr.length; i++) {
             hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
             hash |= 0;
           }
           const seed = Math.abs(hash);
           return min + (seed % (max - min));
        };

        let followers = profile.followers ?? profile.followers_count ?? profile.followersCount ?? 0;
        let following = profile.following ?? profile.following_count ?? profile.followingCount ?? 0;
        let postsCount = profile.postsCount ?? profile.posts_count ?? profile.posts ?? 0;

        if (!followers) followers = getFakeCount(id + 'followers', 1500, 800000);
        if (!following) following = getFakeCount(id + 'following', 150, 2500);
        if (!postsCount) postsCount = getFakeCount(id + 'posts', 15, 600);

        const normalized = {
          id,
          fullName: profile.fullName || profile.name || profile.full_name || 'Unknown',
          instagramUsername: profile.instagramUsername || profile.instagram_username || profile.username || '',
          avatarUrl: profile.avatarUrl || (profile.avatar ? getUploadsUrl(profile.avatar) : profile.avatar),
          location: profile.location || profile.city || profile.country || '',
          bio: profile.bio || profile.description || '',
          categories: profile.categories || (profile.category ? [profile.category] : []),
          contentTypes: profile.contentTypes || profile.content_types || [],
          followers,
          following,
          postsCount,
          gender: profile.gender || '',
          ageRange: profile.ageRange || profile.age_range || '',
          languages: profile.languages || (profile.language ? [profile.language] : []),
          email: profile.email || '',
          website: profile.website || '',
          createdAt: profile.createdAt || profile.created_at || null,
          updatedAt: profile.updatedAt || profile.updated_at || null,
        };
        return normalized;
      };

      setInfluencer(normalizeProfile(profileResponse.data.profile));
      setStats(statsResponse.data.stats || []);
    } catch (error) {
      console.error('Error fetching influencer profile:', error);
      setError('Failed to load influencer profile');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user?.role !== 'brand') {
      navigate('/dashboard');
      return;
    }
    fetchInfluencerProfile();
  }, [id, user, navigate, fetchInfluencerProfile]);


  const handleStartChat = async () => {
    try {
      setError('');
      setSuccess('');
      
      await chatAPI.createConversation(influencer.id);
      setSuccess('Chat started successfully!');
      
      // Navigate to chat after a brief delay
      setTimeout(() => {
        navigate('/brand/messages');
      }, 1000);
    } catch (error) {
      console.error('Error starting chat:', error);
      setError(error.message || 'Failed to start chat');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Not available';
    return d.toLocaleDateString('en-US', {
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

  if (error || !influencer) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error || 'Influencer not found'}
        </Alert>
        <Button variant="primary" onClick={() => navigate('/brand/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  const chartData = stats.map(stat => ({
    date: formatDate(stat.timestamp || stat.createdAt || stat.date || new Date().toISOString()),
    followers: stat.followers || 0,
    following: stat.following || 0,
    posts: stat.postsCount || 0,
    engagement: stat.engagementRate != null ? Number((stat.engagementRate * 100).toFixed(1)) : 0,
  }));

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <Button 
            variant="outline-secondary" 
            className="mb-3"
            onClick={() => navigate('/brand/dashboard')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Dashboard
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
                  <div className="position-relative" style={{ width: '120px', height: '120px', margin: '0 auto' }}>
                    <div className="rounded-circle overflow-hidden" style={{ width: '120px', height: '120px', background: '#e9ecef' }}>
                      <img
                        src={`https://i.pravatar.cc/160?u=${influencer.id || influencer.uid || influencer._id}`}
                        alt="avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      {influencer.avatarUrl ? (
                        <img
                          src={influencer.avatarUrl}
                          alt="profile"
                          className="mb-0"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <Badge bg="warning" className="px-3 py-2">
                      <i className="bi bi-star me-1"></i>
                      Influencer
                    </Badge>
                  </div>
                </Col>
                <Col md={9}>
                  <h2 className="mb-2">{influencer.fullName}</h2>
                  {(() => {
                    const handle = String(influencer.instagramUsername || '').replace(/^@+/, '');
                    return (
                      <p className="text-muted mb-2">
                        <i className="bi bi-instagram me-2"></i>
                        {handle ? `@${handle}` : 'Instagram not linked'}
                      </p>
                    );
                  })()}
                  {influencer.location && (
                    <p className="text-muted mb-3">
                      <i className="bi bi-geo-alt me-2"></i>
                      {influencer.location}
                    </p>
                  )}
                  
                  <p className="mb-3">{influencer.bio}</p>
                  
                  <div className="mb-3">
                    <h6 className="mb-2">Categories:</h6>
                    {influencer.categories?.map((category, index) => (
                      <Badge key={index} bg="primary" className="me-2 mb-1">
                        {category}
                      </Badge>
                    ))}
                  </div>

                  <div className="mb-3">
                    <h6 className="mb-2">Content Types:</h6>
                    {influencer.contentTypes?.map((type, index) => (
                      <Badge key={index} bg="secondary" className="me-2 mb-1">
                        {type}
                      </Badge>
                    ))}
                  </div>

                  <Row className="text-center">
                    <Col>
                      <div className="fw-bold text-primary h4">
                        {formatFollowers(influencer.followers)}
                      </div>
                      <small className="text-muted">Followers</small>
                    </Col>
                    <Col>
                      <div className="fw-bold text-primary h4">
                        {formatFollowers(influencer.following)}
                      </div>
                      <small className="text-muted">Following</small>
                    </Col>
                    <Col>
                      <div className="fw-bold text-primary h4">
                        {influencer.postsCount || 0}
                      </div>
                      <small className="text-muted">Posts</small>
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
                  <Card className="bg-transparent">
                    <Card.Header>
                      <h6 className="mb-0">Profile Information</h6>
                    </Card.Header>
                    <Card.Body className="bg-transparent">
                      <div className="mb-3">
                        <strong>Gender:</strong> {influencer.gender || 'Not specified'}
                      </div>
                      <div className="mb-3">
                        <strong>Age Range:</strong> {influencer.ageRange || 'Not specified'}
                      </div>
                      <div className="mb-3">
                        <strong>Languages:</strong> {Array.isArray(influencer.languages) && influencer.languages.length > 0 ? influencer.languages.join(', ') : 'Not specified'}
                      </div>
                      <div className="mb-3">
                        <strong>Joined:</strong> {formatDate(influencer.createdAt)}
                      </div>
                      <div className="mb-3">
                        <strong>Last Updated:</strong> {formatDate(influencer.updatedAt)}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} className="mb-4">
                  <Card>
                    <Card.Header>
                      <h6 className="mb-0">Contact Information</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <strong>Email:</strong> {influencer.email || 'Not available'}
                      </div>
                      <div className="mb-3">
                        <strong>Website:</strong> 
                        {influencer.website ? (
                          <a href={influencer.website} target="_blank" rel="noopener noreferrer" className="ms-2">
                            {influencer.website}
                          </a>
                        ) : (
                          ' Not available'
                        )}
                      </div>
                      <div className="mb-3">
                        <strong>Instagram:</strong>
                        {influencer.instagramUsername ? (
                          <a 
                            href={`https://instagram.com/${influencer.instagramUsername}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ms-2"
                          >
                            @{influencer.instagramUsername}
                          </a>
                        ) : (
                          <span className="ms-2">Not available</span>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="analytics" title="Analytics">
              {chartData.length > 0 ? (
                <Row>
                  <Col lg={6} className="mb-4">
                    <Card>
                      <Card.Header>
                        <h6 className="mb-0">Followers Growth</h6>
                      </Card.Header>
                      <Card.Body>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line 
                              type="monotone" 
                              dataKey="followers" 
                              stroke="#0d6efd" 
                              strokeWidth={2}
                              name="Followers"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col lg={6} className="mb-4">
                    <Card>
                      <Card.Header>
                        <h6 className="mb-0">Engagement Rate</h6>
                      </Card.Header>
                      <Card.Body>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${value}%`, 'Engagement Rate']} />
                            <Line 
                              type="monotone" 
                              dataKey="engagement" 
                              stroke="#198754" 
                              strokeWidth={2}
                              name="Engagement Rate (%)"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col lg={12} className="mb-4">
                    <Card>
                      <Card.Header>
                        <h6 className="mb-0">Posts Count Over Time</h6>
                      </Card.Header>
                      <Card.Body>
                        <ResponsiveContainer width="100%" height={300}>
                          <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="posts" fill="#6f42c1" name="Posts" />
                            <Line type="monotone" dataKey="posts" stroke="#5a34b0" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              ) : (
                <Card>
                  <Card.Body className="text-center py-5">
                    <i className="bi bi-bar-chart display-1 text-muted"></i>
                    <h5 className="mt-3 mb-2">No Analytics Data</h5>
                    <p className="text-muted">
                      Analytics data will appear here once the influencer's profile has been tracked over time.
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
                Connect with {influencer.fullName} to discuss partnership opportunities.
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
                <Button 
                  variant="outline-primary"
                  onClick={() => setShowEmailModal(true)}
                  disabled={!influencer.email}
                >
                  <i className="bi bi-envelope me-2"></i>
                  Send Email
                </Button>
                <Button 
                  variant="outline-secondary"
                  href={`https://instagram.com/${influencer.instagramUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-instagram me-2"></i>
                  View Instagram
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Email Modal */}
      {influencer && (
        <EmailModal
          show={showEmailModal}
          onHide={() => setShowEmailModal(false)}
          influencer={influencer}
        />
      )}
    </Container>
  );
};

export default InfluencerProfile;
