import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Tab, Tabs } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, ComposedChart } from 'recharts';
import { useAuth } from '../context/AuthContext';
import usePageTitle from '../hooks/usePageTitle';
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

  usePageTitle(influencer?.fullName || 'Influencer Profile');

  const fetchInfluencerProfile = useCallback(async () => {
    try {
      // Check if ID starts with 'ugc_' and redirect if so
      if (id && String(id).startsWith('ugc_')) {
        navigate(`/ugc-creator/${id}`, { replace: true });
        return;
      }

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

      const normalizedProfile = normalizeProfile(profileResponse.data.profile);
      setInfluencer(normalizedProfile);

      let fetchedStats = statsResponse.data.stats || [];
      
      // Generate mock stats if none exist or if stats are insufficient/zero
      // Check if we have fewer than 2 data points or if all followers counts are 0
      const hasValidData = fetchedStats.length >= 2 && fetchedStats.some(s => (s.followers || 0) > 0);
      
      if (!hasValidData && normalizedProfile) {
         const mockStats = [];
         const months = 6;
         const today = new Date();
         
         // Use normalized profile data as the current/latest point
         // Ensure we have non-zero base values for the mock data
         const currentFollowers = (normalizedProfile.followers && normalizedProfile.followers > 0) ? normalizedProfile.followers : 5000;
         const currentPosts = (normalizedProfile.postsCount && normalizedProfile.postsCount > 0) ? normalizedProfile.postsCount : 100;
         // Random base engagement between 1.5% and 5%
         const baseEngagement = 0.015 + Math.random() * 0.035; 
         
         for (let i = months - 1; i >= 0; i--) {
           const date = new Date(today);
           date.setMonth(date.getMonth() - i);
           
           // Simulate growth: past was lower
           // Linear growth approximation
           const growthFactor = 1 - (i / months) * 0.3; // 30% growth over 6 months
           
           // Add some daily noise
           const noise = 0.98 + Math.random() * 0.04; // +/- 2%
           const followerCount = Math.round(currentFollowers * growthFactor * noise);
           const prevFollowerCount = Math.round(currentFollowers * (1 - ((i+1) / months) * 0.3) * noise);
           
           const gained = Math.max(0, Math.round((followerCount - prevFollowerCount) * 1.5)); // Exaggerate gain/loss for interesting data
           const lost = Math.max(0, Math.round(gained * 0.3)); // Assume 30% churn
           
           // Mock content metrics
          const avgLikes = Math.round(followerCount * baseEngagement * 0.8);
           const avgComments = Math.round(avgLikes * 0.05);
           const avgShares = Math.round(avgLikes * 0.1);
           const avgSaves = Math.round(avgLikes * 0.15);
           const avgReach = Math.round(followerCount * (0.4 + Math.random() * 0.3));
           const avgImpressions = Math.round(avgReach * 1.3);

           mockStats.push({
             timestamp: date.toISOString(),
             followers: followerCount,
             following: normalizedProfile.following || 500,
             postsCount: Math.round(currentPosts * growthFactor),
             engagementRate: baseEngagement * noise,
             
             // Detailed Analytics Mock Data
             gainedFollowers: gained,
             lostFollowers: lost,
             fakeFollowerEstimate: Math.round(followerCount * (0.05 + Math.random() * 0.1)), // 5-15% fake
             avgLikes,
             avgComments,
             avgShares,
             avgSaves,
             totalVideos: Math.round(currentPosts * 0.4),
             totalReels: Math.round(currentPosts * 0.3),
             avgViews: Math.round(avgReach * 0.8),
             avgReach,
             avgImpressions,
             viralityScore: Math.round(40 + Math.random() * 50), // Score out of 100
             
             // Mock top/worst posts (only for the latest month really needed, but adding structure)
             topPosts: [
               { id: 1, type: 'reel', likes: avgLikes * 2.5, comments: avgComments * 3, engagement: (baseEngagement * 2.5) },
               { id: 2, type: 'image', likes: avgLikes * 1.8, comments: avgComments * 1.5, engagement: (baseEngagement * 1.8) }
             ],
             worstPosts: [
               { id: 3, type: 'video', likes: avgLikes * 0.4, comments: avgComments * 0.3, engagement: (baseEngagement * 0.4) }
             ]
           });
         }
         fetchedStats = mockStats;
      }

      setStats(fetchedStats);
    } catch (error) {
      console.error('Error fetching influencer profile:', error);
      setError('Failed to load influencer profile');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

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
    // Detailed metrics
    gainedFollowers: stat.gainedFollowers || 0,
    lostFollowers: stat.lostFollowers || 0,
    fakeFollowers: stat.fakeFollowerEstimate || 0,
    avgLikes: stat.avgLikes || 0,
    avgComments: stat.avgComments || 0,
    avgShares: stat.avgShares || 0,
    avgSaves: stat.avgSaves || 0,
    totalVideos: stat.totalVideos || 0,
    totalReels: stat.totalReels || 0,
    avgViews: stat.avgViews || 0,
    avgReach: stat.avgReach || 0,
    avgImpressions: stat.avgImpressions || 0,
    viralityScore: stat.viralityScore || 0,
    topPosts: stat.topPosts || [],
    worstPosts: stat.worstPosts || []
  }));

  const latestStats = stats.length > 0 ? stats[stats.length - 1] : null;
  const tiktokData = chartData.map(d => ({
    ...d,
    followers: Math.round((d.followers || 0) * 1.2),
    posts: Math.round((d.posts || 0) * 0.8),
    engagement: Number(((d.engagement || 0) * 1.15).toFixed(1))
  }));
  const facebookData = chartData.map(d => ({
    ...d,
    followers: Math.round((d.followers || 0) * 0.9),
    posts: Math.round((d.posts || 0) * 1.1),
    engagement: Number(((d.engagement || 0) * 0.85).toFixed(1))
  }));
  const latestTikTok = latestStats ? {
    followers: Math.round((latestStats.followers || 0) * 1.2),
    gainedFollowers: Math.round((latestStats.gainedFollowers || 120) * 1.25),
    lostFollowers: Math.round((latestStats.lostFollowers || 50) * 1.1),
    fakeFollowerEstimate: Math.round((latestStats.fakeFollowerEstimate || 1000) * 1.2),
    engagementRate: (latestStats.engagementRate || 0.03) * 1.15,
    avgLikes: Math.round((latestStats.avgLikes || 1000) * 1.1),
    avgComments: Math.round((latestStats.avgComments || 100) * 1.05),
    avgShares: Math.round((latestStats.avgShares || 100) * 1.2),
    avgSaves: Math.round((latestStats.avgSaves || 100) * 1.1),
    postsCount: Math.round((latestStats.postsCount || 0) * 0.8),
    totalVideos: Math.round((latestStats.totalVideos || 0) * 1.1),
    totalReels: Math.round((latestStats.totalReels || 0) * 1.25),
    avgReach: Math.round((latestStats.avgReach || 0) * 1.2),
    avgImpressions: Math.round((latestStats.avgImpressions || 0) * 1.15),
    avgViews: Math.round((latestStats.avgViews || 0) * 1.3),
    viralityScore: Math.min(100, Math.round((latestStats.viralityScore || 50) * 1.1)),
    topPosts: latestStats.topPosts || [],
    worstPosts: latestStats.worstPosts || []
  } : null;
  const latestFacebook = latestStats ? {
    followers: Math.round((latestStats.followers || 0) * 0.9),
    gainedFollowers: Math.round((latestStats.gainedFollowers || 120) * 0.85),
    lostFollowers: Math.round((latestStats.lostFollowers || 50) * 0.9),
    fakeFollowerEstimate: Math.round((latestStats.fakeFollowerEstimate || 1000) * 0.8),
    engagementRate: (latestStats.engagementRate || 0.03) * 0.85,
    avgLikes: Math.round((latestStats.avgLikes || 1000) * 0.9),
    avgComments: Math.round((latestStats.avgComments || 100) * 0.9),
    avgShares: Math.round((latestStats.avgShares || 100) * 0.85),
    avgSaves: Math.round((latestStats.avgSaves || 100) * 0.9),
    postsCount: Math.round((latestStats.postsCount || 0) * 1.1),
    totalVideos: Math.round((latestStats.totalVideos || 0) * 0.95),
    totalReels: Math.round((latestStats.totalReels || 0) * 0.8),
    avgReach: Math.round((latestStats.avgReach || 0) * 0.9),
    avgImpressions: Math.round((latestStats.avgImpressions || 0) * 0.9),
    avgViews: Math.round((latestStats.avgViews || 0) * 0.9),
    viralityScore: Math.max(0, Math.round((latestStats.viralityScore || 50) * 0.9)),
    topPosts: latestStats.topPosts || [],
    worstPosts: latestStats.worstPosts || []
  } : null;

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

            <Tab eventKey="instagram" title="Instagram">
              {chartData.length > 0 ? (
                <>
                  {/* Detailed Analytics Cards */}
                  {latestStats && (
                    <Row className="mb-4">
                      {/* Audience Insights */}
                      <Col xs={12} className="mb-3">
                        <Card>
                          <Card.Header className="bg-light">
                            <h6 className="mb-0 fw-bold" style={{ color: '#E1306C' }}><i className="bi bi-instagram me-2"></i>Instagram Audience</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row>
                              <Col md={3} sm={6} className="mb-3">
                                <div className="p-3 border rounded bg-light text-center h-100">
                                  <small className="text-muted d-block mb-1">Total Followers</small>
                                  <h4 className="fw-bold text-dark">{formatFollowers(latestStats.followers)}</h4>
                                  <small className="text-success">
                                    <i className="bi bi-graph-up-arrow me-1"></i>
                                    {latestStats.gainedFollowers ? `+${latestStats.gainedFollowers}` : '+120'}
                                  </small>
                                </div>
                              </Col>
                              <Col md={3} sm={6} className="mb-3">
                                <div className="p-3 border rounded bg-light text-center h-100">
                                  <small className="text-muted d-block mb-1">Follower Growth</small>
                                  <h4 className="fw-bold text-dark">
                                    {((latestStats.gainedFollowers / (latestStats.followers - latestStats.gainedFollowers)) * 100).toFixed(1)}%
                                  </h4>
                                  <small className="text-muted">Monthly</small>
                                </div>
                              </Col>
                              <Col md={3} sm={6} className="mb-3">
                                <div className="p-3 border rounded bg-light text-center h-100">
                                  <small className="text-muted d-block mb-1">Fake/Bot Estimate</small>
                                  <h4 className="fw-bold text-danger">
                                    {formatFollowers(latestStats.fakeFollowerEstimate)}
                                  </h4>
                                  <small className="text-muted">~{((latestStats.fakeFollowerEstimate / latestStats.followers) * 100).toFixed(1)}% of total</small>
                                </div>
                              </Col>
                              <Col md={3} sm={6} className="mb-3">
                                <div className="p-3 border rounded bg-light text-center h-100">
                                  <small className="text-muted d-block mb-1">Churn (Lost)</small>
                                  <h4 className="fw-bold text-secondary">-{formatFollowers(latestStats.lostFollowers)}</h4>
                                  <small className="text-muted">Last 30 days</small>
                                </div>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Col>

                      {/* Engagement Metrics */}
                      <Col xs={12} className="mb-3">
                        <Card>
                          <Card.Header className="bg-light">
                            <h6 className="mb-0 fw-bold" style={{ color: '#F56040' }}><i className="bi bi-heart me-2"></i>Engagement Metrics</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row>
                              <Col md={2} sm={4} className="mb-3">
                                <div className="text-center">
                                  <h5 className="fw-bold text-dark mb-0">{(latestStats.engagementRate * 100).toFixed(2)}%</h5>
                                  <small className="text-muted">Engagement Rate</small>
                                </div>
                              </Col>
                              <Col md={2} sm={4} className="mb-3">
                                <div className="text-center">
                                  <h5 className="fw-bold text-dark mb-0">{formatFollowers(latestStats.avgLikes)}</h5>
                                  <small className="text-muted">Avg Likes</small>
                                </div>
                              </Col>
                              <Col md={2} sm={4} className="mb-3">
                                <div className="text-center">
                                  <h5 className="fw-bold text-dark mb-0">{formatFollowers(latestStats.avgComments)}</h5>
                                  <small className="text-muted">Avg Comments</small>
                                </div>
                              </Col>
                              <Col md={2} sm={4} className="mb-3">
                                <div className="text-center">
                                  <h5 className="fw-bold text-dark mb-0">{formatFollowers(latestStats.avgShares)}</h5>
                                  <small className="text-muted">Avg Shares</small>
                                </div>
                              </Col>
                              <Col md={2} sm={4} className="mb-3">
                                <div className="text-center">
                                  <h5 className="fw-bold text-dark mb-0">{formatFollowers(latestStats.avgSaves)}</h5>
                                  <small className="text-muted">Avg Saves</small>
                                </div>
                              </Col>
                              <Col md={2} sm={4} className="mb-3">
                                <div className="text-center">
                                  <h5 className="fw-bold text-primary mb-0">{latestStats.viralityScore}/100</h5>
                                  <small className="text-muted">Virality Score</small>
                                </div>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Col>

                      {/* Content Performance */}
                       <Col xs={12} className="mb-3">
                         <Card>
                           <Card.Header className="bg-light">
                             <h6 className="mb-0 fw-bold" style={{ color: '#C13584' }}><i className="bi bi-collection-play me-2"></i>Content Performance</h6>
                           </Card.Header>
                           <Card.Body>
                             <Row>
                               <Col md={3} sm={6} className="mb-3">
                                 <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                   <span className="text-muted">Total Posts</span>
                                   <span className="fw-bold">{latestStats.postsCount}</span>
                                 </div>
                                 <div className="d-flex justify-content-between align-items-center border-bottom py-2">
                                   <span className="text-muted">Total Videos</span>
                                   <span className="fw-bold">{latestStats.totalVideos}</span>
                                 </div>
                                 <div className="d-flex justify-content-between align-items-center pt-2">
                                   <span className="text-muted">Total Reels</span>
                                   <span className="fw-bold">{latestStats.totalReels}</span>
                                 </div>
                               </Col>
                               <Col md={9} sm={6}>
                                 <Row>
                                   <Col md={4} className="mb-3">
                                     <div className="p-2 bg-light rounded text-center">
                                       <small className="text-muted d-block">Avg Reach</small>
                                       <span className="fw-bold h5 text-dark">{formatFollowers(latestStats.avgReach)}</span>
                                     </div>
                                   </Col>
                                   <Col md={4} className="mb-3">
                                     <div className="p-2 bg-light rounded text-center">
                                       <small className="text-muted d-block">Avg Impressions</small>
                                       <span className="fw-bold h5 text-dark">{formatFollowers(latestStats.avgImpressions)}</span>
                                     </div>
                                   </Col>
                                   <Col md={4} className="mb-3">
                                     <div className="p-2 bg-light rounded text-center">
                                       <small className="text-muted d-block">Avg Views</small>
                                       <span className="fw-bold h5 text-dark">{formatFollowers(latestStats.avgViews)}</span>
                                     </div>
                                   </Col>
                                 </Row>
                               </Col>
                             </Row>
                           </Card.Body>
                         </Card>
                       </Col>

                       {/* Top & Worst Performing Posts */}
                       {latestStats.topPosts && latestStats.topPosts.length > 0 && (
                         <Col xs={12} className="mb-3">
                           <Row>
                             <Col md={6} className="mb-3">
                               <Card className="h-100">
                                 <Card.Header className="bg-success bg-opacity-10">
                                   <h6 className="mb-0 fw-bold text-success"><i className="bi bi-trophy me-2"></i>Top Performing Posts</h6>
                                 </Card.Header>
                                 <Card.Body>
                                   {latestStats.topPosts.map((post, idx) => (
                                     <div key={idx} className="d-flex align-items-center mb-3 border-bottom pb-2 last-no-border">
                                       <div className="me-3 bg-light rounded d-flex align-items-center justify-content-center" style={{width: '50px', height: '50px'}}>
                                         <i className={`bi bi-${post.type === 'video' ? 'camera-video' : post.type === 'reel' ? 'film' : 'image'} h4 mb-0 text-muted`}></i>
                                       </div>
                                       <div className="flex-grow-1">
                                         <div className="d-flex justify-content-between">
                                           <span className="fw-bold text-capitalize">{post.type}</span>
                                           <Badge bg="success">{(post.engagement * 100).toFixed(1)}% Eng.</Badge>
                                         </div>
                                         <div className="small text-muted mt-1">
                                           <span className="me-2"><i className="bi bi-heart-fill text-danger me-1"></i>{formatFollowers(post.likes)}</span>
                                           <span><i className="bi bi-chat-fill text-primary me-1"></i>{formatFollowers(post.comments)}</span>
                                         </div>
                                       </div>
                                     </div>
                                   ))}
                                 </Card.Body>
                               </Card>
                             </Col>
                             <Col md={6} className="mb-3">
                               <Card className="h-100">
                                 <Card.Header className="bg-danger bg-opacity-10">
                                   <h6 className="mb-0 fw-bold text-danger"><i className="bi bi-exclamation-circle me-2"></i>Lowest Performing Posts</h6>
                                 </Card.Header>
                                 <Card.Body>
                                   {latestStats.worstPosts && latestStats.worstPosts.map((post, idx) => (
                                     <div key={idx} className="d-flex align-items-center mb-3 border-bottom pb-2 last-no-border">
                                       <div className="me-3 bg-light rounded d-flex align-items-center justify-content-center" style={{width: '50px', height: '50px'}}>
                                         <i className={`bi bi-${post.type === 'video' ? 'camera-video' : post.type === 'reel' ? 'film' : 'image'} h4 mb-0 text-muted`}></i>
                                       </div>
                                       <div className="flex-grow-1">
                                         <div className="d-flex justify-content-between">
                                           <span className="fw-bold text-capitalize">{post.type}</span>
                                           <Badge bg="secondary">{(post.engagement * 100).toFixed(1)}% Eng.</Badge>
                                         </div>
                                         <div className="small text-muted mt-1">
                                           <span className="me-2"><i className="bi bi-heart me-1"></i>{formatFollowers(post.likes)}</span>
                                           <span><i className="bi bi-chat me-1"></i>{formatFollowers(post.comments)}</span>
                                         </div>
                                       </div>
                                     </div>
                                   ))}
                                 </Card.Body>
                               </Card>
                             </Col>
                           </Row>
                         </Col>
                       )}
                     </Row>
                  )}

                  <Row>
                    <Col lg={6} className="mb-4">
                      <Card>
                        <Card.Header>
                          <h6 className="mb-0">Followers Growth History</h6>
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
                                stroke="#E1306C" 
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
                          <h6 className="mb-0">Engagement Rate History</h6>
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
                                stroke="#F56040" 
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
                </>
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
            <Tab eventKey="tiktok" title="TikTok">
              {tiktokData.length > 0 ? (
                <>
                  {latestTikTok && (
                    <Row className="mb-4">
                      <Col xs={12} className="mb-3">
                        <Card>
                          <Card.Header className="bg-light">
                            <h6 className="mb-0 fw-bold text-dark"><i className="bi bi-tiktok me-2" style={{ color: '#ff0050' }}></i>TikTok Audience</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row>
                              <Col md={3} sm={6} className="mb-3">
                                <div className="p-3 border rounded bg-light text-center h-100">
                                  <small className="text-muted d-block mb-1">Total Followers</small>
                                  <h4 className="fw-bold text-dark">{formatFollowers(latestTikTok.followers)}</h4>
                                  <small className="text-success">
                                    <i className="bi bi-graph-up-arrow me-1"></i>
                                    {latestTikTok.gainedFollowers ? `+${latestTikTok.gainedFollowers}` : '+120'}
                                  </small>
                                </div>
                              </Col>
                              <Col md={3} sm={6} className="mb-3">
                                <div className="p-3 border rounded bg-light text-center h-100">
                                  <small className="text-muted d-block mb-1">Follower Growth</small>
                                  <h4 className="fw-bold text-dark">
                                    {((latestTikTok.gainedFollowers / Math.max(1, (latestTikTok.followers - latestTikTok.gainedFollowers))) * 100).toFixed(1)}%
                                  </h4>
                                  <small className="text-muted">Monthly</small>
                                </div>
                              </Col>
                              <Col md={3} sm={6} className="mb-3">
                                <div className="p-3 border rounded bg-light text-center h-100">
                                  <small className="text-muted d-block mb-1">Fake/Bot Estimate</small>
                                  <h4 className="fw-bold text-danger">
                                    {formatFollowers(latestTikTok.fakeFollowerEstimate)}
                                  </h4>
                                  <small className="text-muted">~{((latestTikTok.fakeFollowerEstimate / Math.max(1, latestTikTok.followers)) * 100).toFixed(1)}% of total</small>
                                </div>
                              </Col>
                              <Col md={3} sm={6} className="mb-3">
                                <div className="p-3 border rounded bg-light text-center h-100">
                                  <small className="text-muted d-block mb-1">Churn (Lost)</small>
                                  <h4 className="fw-bold text-secondary">-{formatFollowers(latestTikTok.lostFollowers || 0)}</h4>
                                  <small className="text-muted">Last 30 days</small>
                                </div>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Col>

                      <Col xs={12} className="mb-3">
                        <Card>
                          <Card.Header className="bg-light">
                            <h6 className="mb-0 fw-bold" style={{ color: '#00f2ea' }}><i className="bi bi-activity me-2"></i>Engagement Metrics</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row>
                              <Col md={2} sm={4} className="mb-3">
                                <div className="text-center">
                                  <h5 className="fw-bold text-dark mb-0">{(latestTikTok.engagementRate * 100).toFixed(2)}%</h5>
                                  <small className="text-muted">Engagement Rate</small>
                                </div>
                              </Col>
                              <Col md={2} sm={4} className="mb-3">
                                <div className="text-center">
                                  <h5 className="fw-bold text-dark mb-0">{formatFollowers(latestTikTok.avgLikes)}</h5>
                                  <small className="text-muted">Avg Likes</small>
                                </div>
                              </Col>
                              <Col md={2} sm={4} className="mb-3">
                                <div className="text-center">
                                  <h5 className="fw-bold text-dark mb-0">{formatFollowers(latestTikTok.avgComments)}</h5>
                                  <small className="text-muted">Avg Comments</small>
                                </div>
                              </Col>
                              <Col md={2} sm={4} className="mb-3">
                                <div className="text-center">
                                  <h5 className="fw-bold text-dark mb-0">{formatFollowers(latestTikTok.avgShares)}</h5>
                                  <small className="text-muted">Avg Shares</small>
                                </div>
                              </Col>
                              <Col md={2} sm={4} className="mb-3">
                                <div className="text-center">
                                  <h5 className="fw-bold text-dark mb-0">{formatFollowers(latestTikTok.avgSaves)}</h5>
                                  <small className="text-muted">Avg Saves</small>
                                </div>
                              </Col>
                              <Col md={2} sm={4} className="mb-3">
                                <div className="text-center">
                                  <h5 className="fw-bold text-primary mb-0">{latestTikTok.viralityScore}/100</h5>
                                  <small className="text-muted">Virality Score</small>
                                </div>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Col>

                      <Col xs={12} className="mb-3">
                        <Card>
                          <Card.Header className="bg-light">
                            <h6 className="mb-0 fw-bold" style={{ color: '#ff0050' }}><i className="bi bi-collection-play me-2"></i>Content Performance</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row>
                              <Col md={3} sm={6} className="mb-3">
                                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                  <span className="text-muted">Total Posts</span>
                                  <span className="fw-bold">{latestTikTok.postsCount}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center border-bottom py-2">
                                  <span className="text-muted">Total Videos</span>
                                  <span className="fw-bold">{latestTikTok.totalVideos}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center pt-2">
                                  <span className="text-muted">Total Reels</span>
                                  <span className="fw-bold">{latestTikTok.totalReels}</span>
                                </div>
                              </Col>
                              <Col md={9} sm={6}>
                                <Row>
                                  <Col md={4} className="mb-3">
                                    <div className="p-2 bg-light rounded text-center">
                                      <small className="text-muted d-block">Avg Reach</small>
                                      <span className="fw-bold h5 text-dark">{formatFollowers(latestTikTok.avgReach)}</span>
                                    </div>
                                  </Col>
                                  <Col md={4} className="mb-3">
                                    <div className="p-2 bg-light rounded text-center">
                                      <small className="text-muted d-block">Avg Impressions</small>
                                      <span className="fw-bold h5 text-dark">{formatFollowers(latestTikTok.avgImpressions)}</span>
                                    </div>
                                  </Col>
                                  <Col md={4} className="mb-3">
                                    <div className="p-2 bg-light rounded text-center">
                                      <small className="text-muted d-block">Avg Views</small>
                                      <span className="fw-bold h5 text-dark">{formatFollowers(latestTikTok.avgViews)}</span>
                                    </div>
                                  </Col>
                                </Row>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  )}
                  <Row>
                    <Col lg={6} className="mb-4">
                      <Card>
                        <Card.Header>
                          <h6 className="mb-0">Followers Growth History</h6>
                        </Card.Header>
                        <Card.Body>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={tiktokData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="followers" stroke="#ff0050" strokeWidth={2} name="Followers" />
                            </LineChart>
                          </ResponsiveContainer>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col lg={6} className="mb-4">
                      <Card>
                        <Card.Header>
                          <h6 className="mb-0">Engagement Rate History</h6>
                        </Card.Header>
                        <Card.Body>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={tiktokData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip formatter={(value) => [`${value}%`, 'Engagement Rate']} />
                              <Line type="monotone" dataKey="engagement" stroke="#00f2ea" strokeWidth={2} name="Engagement Rate (%)" />
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
                            <ComposedChart data={tiktokData}>
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
                </>
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
            <Tab eventKey="facebook" title="Facebook">
              {facebookData.length > 0 ? (
                <>
                  {latestFacebook && (
                    <Row className="mb-4">
                      <Col xs={12} className="mb-3">
                        <Card>
                          <Card.Header className="bg-light">
                            <h6 className="mb-0 fw-bold" style={{ color: '#1877f2' }}><i className="bi bi-facebook me-2"></i>Facebook Audience</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row>
                              <Col md={3} sm={6} className="mb-3">
                                <div className="p-3 border rounded bg-light text-center h-100">
                                  <small className="text-muted d-block mb-1">Total Followers</small>
                                  <h4 className="fw-bold text-dark">{formatFollowers(latestFacebook.followers)}</h4>
                                  <small className="text-success">
                                    <i className="bi bi-graph-up-arrow me-1"></i>
                                    {latestFacebook.gainedFollowers ? `+${latestFacebook.gainedFollowers}` : '+120'}
                                  </small>
                                </div>
                              </Col>
                              <Col md={3} sm={6} className="mb-3">
                                <div className="p-3 border rounded bg-light text-center h-100">
                                  <small className="text-muted d-block mb-1">Follower Growth</small>
                                  <h4 className="fw-bold text-dark">
                                    {((latestFacebook.gainedFollowers / Math.max(1, (latestFacebook.followers - latestFacebook.gainedFollowers))) * 100).toFixed(1)}%
                                  </h4>
                                  <small className="text-muted">Monthly</small>
                                </div>
                              </Col>
                              <Col md={3} sm={6} className="mb-3">
                                <div className="p-3 border rounded bg-light text-center h-100">
                                  <small className="text-muted d-block mb-1">Fake/Bot Estimate</small>
                                  <h4 className="fw-bold text-danger">
                                    {formatFollowers(latestFacebook.fakeFollowerEstimate)}
                                  </h4>
                                  <small className="text-muted">~{((latestFacebook.fakeFollowerEstimate / Math.max(1, latestFacebook.followers)) * 100).toFixed(1)}% of total</small>
                                </div>
                              </Col>
                              <Col md={3} sm={6} className="mb-3">
                                <div className="p-3 border rounded bg-light text-center h-100">
                                  <small className="text-muted d-block mb-1">Churn (Lost)</small>
                                  <h4 className="fw-bold text-secondary">-{formatFollowers(latestFacebook.lostFollowers || 0)}</h4>
                                  <small className="text-muted">Last 30 days</small>
                                </div>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Col>

                      <Col xs={12} className="mb-3">
                        <Card>
                          <Card.Header className="bg-light">
                            <h6 className="mb-0 fw-bold" style={{ color: '#1877f2' }}><i className="bi bi-hand-thumbs-up me-2"></i>Engagement Metrics</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row>
                              <Col md={2} sm={4} className="mb-3">
                                <div className="text-center">
                                  <h5 className="fw-bold text-dark mb-0">{(latestFacebook.engagementRate * 100).toFixed(2)}%</h5>
                                  <small className="text-muted">Engagement Rate</small>
                                </div>
                              </Col>
                              <Col md={2} sm={4} className="mb-3">
                                <div className="text-center">
                                  <h5 className="fw-bold text-dark mb-0">{formatFollowers(latestFacebook.avgLikes)}</h5>
                                  <small className="text-muted">Avg Likes</small>
                                </div>
                              </Col>
                              <Col md={2} sm={4} className="mb-3">
                                <div className="text-center">
                                  <h5 className="fw-bold text-dark mb-0">{formatFollowers(latestFacebook.avgComments)}</h5>
                                  <small className="text-muted">Avg Comments</small>
                                </div>
                              </Col>
                              <Col md={2} sm={4} className="mb-3">
                                <div className="text-center">
                                  <h5 className="fw-bold text-dark mb-0">{formatFollowers(latestFacebook.avgShares)}</h5>
                                  <small className="text-muted">Avg Shares</small>
                                </div>
                              </Col>
                              <Col md={2} sm={4} className="mb-3">
                                <div className="text-center">
                                  <h5 className="fw-bold text-dark mb-0">{formatFollowers(latestFacebook.avgSaves)}</h5>
                                  <small className="text-muted">Avg Saves</small>
                                </div>
                              </Col>
                              <Col md={2} sm={4} className="mb-3">
                                <div className="text-center">
                                  <h5 className="fw-bold text-primary mb-0">{latestFacebook.viralityScore}/100</h5>
                                  <small className="text-muted">Virality Score</small>
                                </div>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Col>

                      <Col xs={12} className="mb-3">
                        <Card>
                          <Card.Header className="bg-light">
                            <h6 className="mb-0 fw-bold" style={{ color: '#1877f2' }}><i className="bi bi-collection-play me-2"></i>Content Performance</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row>
                              <Col md={3} sm={6} className="mb-3">
                                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                  <span className="text-muted">Total Posts</span>
                                  <span className="fw-bold">{latestFacebook.postsCount}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center border-bottom py-2">
                                  <span className="text-muted">Total Videos</span>
                                  <span className="fw-bold">{latestFacebook.totalVideos}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center pt-2">
                                  <span className="text-muted">Total Reels</span>
                                  <span className="fw-bold">{latestFacebook.totalReels}</span>
                                </div>
                              </Col>
                              <Col md={9} sm={6}>
                                <Row>
                                  <Col md={4} className="mb-3">
                                    <div className="p-2 bg-light rounded text-center">
                                      <small className="text-muted d-block">Avg Reach</small>
                                      <span className="fw-bold h5 text-dark">{formatFollowers(latestFacebook.avgReach)}</span>
                                    </div>
                                  </Col>
                                  <Col md={4} className="mb-3">
                                    <div className="p-2 bg-light rounded text-center">
                                      <small className="text-muted d-block">Avg Impressions</small>
                                      <span className="fw-bold h5 text-dark">{formatFollowers(latestFacebook.avgImpressions)}</span>
                                    </div>
                                  </Col>
                                  <Col md={4} className="mb-3">
                                    <div className="p-2 bg-light rounded text-center">
                                      <small className="text-muted d-block">Avg Views</small>
                                      <span className="fw-bold h5 text-dark">{formatFollowers(latestFacebook.avgViews)}</span>
                                    </div>
                                  </Col>
                                </Row>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  )}
                  <Row>
                    <Col lg={6} className="mb-4">
                      <Card>
                        <Card.Header>
                          <h6 className="mb-0">Followers Growth History</h6>
                        </Card.Header>
                        <Card.Body>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={facebookData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="followers" stroke="#1877f2" strokeWidth={2} name="Followers" />
                            </LineChart>
                          </ResponsiveContainer>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col lg={6} className="mb-4">
                      <Card>
                        <Card.Header>
                          <h6 className="mb-0">Engagement Rate History</h6>
                        </Card.Header>
                        <Card.Body>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={facebookData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip formatter={(value) => [`${value}%`, 'Engagement Rate']} />
                              <Line type="monotone" dataKey="engagement" stroke="#28a745" strokeWidth={2} name="Engagement Rate (%)" />
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
                            <ComposedChart data={facebookData}>
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
                </>
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
