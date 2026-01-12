import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Tab, Tabs, Form } from 'react-bootstrap';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ugcCreatorAPI } from '../api/ugcAPI';
import { influencerAPI } from '../services/api';
import { chatAPIService as chatAPI } from '../api/chatAPI';
import UGCLeftNav from '../components/UGCLeftNav';
import MultiSelect from '../components/MultiSelect';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ComposedChart, Bar, Area } from 'recharts';

const UGCCreatorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [creator, setCreator] = useState(null);
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('account');
  const [collabOptions, setCollabOptions] = useState({ reels: true, stories: true, post: true });
  const [paymentOptions, setPaymentOptions] = useState({ gifted: true, paid: true, affiliate: true });
  const [minPrice, setMinPrice] = useState('8000');
  const [maxPrice, setMaxPrice] = useState('95000');
  const [aboutText, setAboutText] = useState('');
  const [passionsText, setPassionsText] = useState('');
  const [nicheValues, setNicheValues] = useState([]);
  const [contentStyleValues, setContentStyleValues] = useState([]);
  const [faceOrFaceless, setFaceOrFaceless] = useState('');
  const [savingCreatorAccount, setSavingCreatorAccount] = useState(false);
  const [preferredCompanies, setPreferredCompanies] = useState([]);
  const [preferredBrandInterests, setPreferredBrandInterests] = useState([]);
  const [instagramUsernameInput, setInstagramUsernameInput] = useState('');
  const [tiktokUsernameInput, setTiktokUsernameInput] = useState('');
  const [youtubeChannelQuery, setYoutubeChannelQuery] = useState('');
  const [connectingYouTube, setConnectingYouTube] = useState(false);
  const [savingSocialProfiles, setSavingSocialProfiles] = useState(false);
  const [editingInstagram, setEditingInstagram] = useState(false);
  const [verifyingInstagram, setVerifyingInstagram] = useState(false);
  const [editingYouTube, setEditingYouTube] = useState(false);
  const [instagramProfileAvatar, setInstagramProfileAvatar] = useState('');
  const categoryOptions = [
    'Fashion', 'Beauty', 'Lifestyle', 'Travel', 'Food', 'Fitness', 'Technology',
    'Gaming', 'Music', 'Art', 'Photography', 'Business', 'Education', 'Health',
    'Parenting', 'Home & Garden', 'Sports', 'Entertainment', 'DIY', 'Pets'
  ];
  const contentTypeOptions = [
    'UGC Videos', 'Product Reviews', 'Unboxing', 'Tutorials', 'Testimonials',
    'Behind the Scenes', 'Lifestyle Content', 'Brand Storytelling', 'Social Media Posts'
  ];
  const preferredCompanyOptions = [
    'E-Commerce', 'Marketplace', 'Digital Services', 'DTC', 'Retail', 'SaaS'
  ];
  const brandInterestOptions = [
    'Beauty & Care', 'Consumer Goods', 'Electronics', 'Essentials', 'Fashion & Apparel',
    'Sports & Fitness', 'Food & Beverages', 'Home Goods', 'Jewellery & Extras', 'Kids & Family',
    'Makeup', 'Other', 'Outdoors', 'Pets', 'Skincare', 'Software', 'Health & Wellness'
  ];

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const tab = qs.get('tab');
    if (tab && ['account', 'match', 'social'].includes(tab)) {
      setActiveSubTab(tab);
    }
  }, [location.search]);
  useEffect(() => {
    if (creator) {
      setNicheValues(Array.isArray(creator.niche) ? creator.niche : []);
      setContentStyleValues(Array.isArray(creator.contentStyle) ? creator.contentStyle : []);
      setFaceOrFaceless(creator.faceOrFaceless || '');
      setPreferredCompanies(Array.isArray(creator.preferredCompanies) ? creator.preferredCompanies : []);
      setPreferredBrandInterests(Array.isArray(creator.preferredBrandInterests) ? creator.preferredBrandInterests : []);
      setInstagramUsernameInput(creator.instagramUsername || '');
      setTiktokUsernameInput(creator.tiktokUsername || '');
    }
  }, [creator]);

  useEffect(() => {
    const fetchSocialAvatars = async () => {
      try {
        const targetId = id || user?.uid;
        if (activeSubTab === 'social' && (creator?.instagramUsername || instagramUsernameInput)) {
          const resp = await influencerAPI.getInstagramData(targetId);
          const av = resp?.data?.profile?.avatarUrl;
          if (av) setInstagramProfileAvatar(av);
        }
      } catch (e) {}
    };
    fetchSocialAvatars();
  }, [activeSubTab, creator, instagramUsernameInput, id, user]);
  const saveCreatorAccount = async () => {
    try {
      setSavingCreatorAccount(true);
      const targetId = id || user?.uid;
      await ugcCreatorAPI.updateProfile(targetId, {
        niche: nicheValues,
        contentStyle: contentStyleValues,
        faceOrFaceless,
        preferredCompanies,
        preferredBrandInterests
      });
      setSuccess('Creator account updated');
    } catch (e) {
      setError(typeof e === 'string' ? e : e?.message || 'Failed to update');
    } finally {
      setSavingCreatorAccount(false);
    }
  };

  const connectYouTubeChannel = async () => {
    try {
      setConnectingYouTube(true);
      setError('');
      const targetId = id || user?.uid;
      const resp = await ugcCreatorAPI.connectYouTube(targetId, { channelQuery: youtubeChannelQuery });
      setSuccess(resp?.message || 'YouTube channel connected');
      const refreshed = await ugcCreatorAPI.getProfile(targetId);
      setCreator(refreshed.profile);
      setYoutubeChannelQuery('');
    } catch (e) {
      setError(typeof e === 'string' ? e : e?.message || 'Failed to connect YouTube');
    } finally {
      setConnectingYouTube(false);
    }
  };

  const saveSocialProfiles = async () => {
    try {
      setSavingSocialProfiles(true);
      setError('');
      const targetId = id || user?.uid;
      await ugcCreatorAPI.updateProfile(targetId, {
        instagramUsername: instagramUsernameInput,
        tiktokUsername: tiktokUsernameInput
      });
      setSuccess('Social profiles updated');
      setEditingInstagram(false);
    } catch (e) {
      setError(typeof e === 'string' ? e : e?.message || 'Failed to update social profiles');
    } finally {
      setSavingSocialProfiles(false);
    }
  };

  const handleVerifyInstagram = async () => {
    try {
      setVerifyingInstagram(true);
      setError('');
      const username = (instagramUsernameInput || creator?.instagramUsername || '').replace('@','');
      if (!username) {
        setError('Instagram username is required');
        return;
      }
      await influencerAPI.validateApify(username);
      const targetId = id || user?.uid;
      const refreshed = await ugcCreatorAPI.getProfile(targetId);
      setCreator(refreshed.profile);
      setSuccess('Instagram data synced');
    } catch (e) {
      setError(typeof e === 'string' ? e : e?.message || 'Failed to verify Instagram');
    } finally {
      setVerifyingInstagram(false);
    }
  };

  const deleteYouTubeConnection = async () => {
    try {
      setError('');
      const targetId = id || user?.uid;
      await ugcCreatorAPI.updateProfile(targetId, {
        youtubeChannelId: '',
        youtubeChannelTitle: '',
        youtubeChannelUrl: ''
      });
      const refreshed = await ugcCreatorAPI.getProfile(targetId);
      setCreator(refreshed.profile);
      setSuccess('YouTube connection removed');
    } catch (e) {
      setError(typeof e === 'string' ? e : e?.message || 'Failed to remove YouTube');
    }
  };
  // YouTube detailed analytics for recent videos
  const [youtubeDetailed, setYoutubeDetailed] = useState(null);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeError, setYoutubeError] = useState('');
  const [analyticsRange, setAnalyticsRange] = useState('7'); // '7' or '30'

  const formatNumber = (num) => {
    if (!num || num === 0) return '0';
    const number = parseInt(num);
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'K';
    }
    return number.toLocaleString();
  };

  const calculateCompletionPercentage = (profileData) => {
    if (!profileData) return 0;
    const allRequiredFields = [
      'fullName',
      'bio',
      'location',
      'reelPostPrice',
      'staticPostPrice',
      'niche',
      'contentStyle'
    ];
    let completedFields = 0;
    allRequiredFields.forEach((field) => {
      if (field === 'niche') {
        const isComplete = profileData.niche && profileData.niche.length > 0;
        if (isComplete) completedFields++;
      } else if (field === 'contentStyle') {
        const isComplete = profileData.contentStyle && profileData.contentStyle.length > 0;
        if (isComplete) completedFields++;
      } else {
        const isComplete = profileData[field] && profileData[field].toString().trim() !== '';
        if (isComplete) completedFields++;
      }
    });
    return Math.round((completedFields / allRequiredFields.length) * 100);
  };

  const getAnalyticsSeries = () => {
    const videos = youtubeDetailed?.recentVideos || [];
    const count = analyticsRange === '7' ? 7 : 30;
    const slice = videos.slice(0, count);
    const series = slice.map(v => {
      const views = Number(v.viewCount || 0);
      const likes = Number(v.likeCount || 0);
      const comments = Number(v.commentCount || 0);
      const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;
      return Number(engagement.toFixed(1));
    });
    return series;
  };

  const buildChartData = () => {
    const count = analyticsRange === '7' ? 7 : 30;
    const videos = (youtubeDetailed?.recentVideos || []).slice(0, count);
    const today = new Date();
    const fallbackLabels = Array.from({ length: count }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (count - 1 - i));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const data = videos.map((v, i) => {
      const views = Number(v.viewCount || 0);
      const label = v.publishedAt
        ? new Date(v.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : fallbackLabels[i];
      return { name: label, views: Math.min(views, 10000) };
    });
    // If not enough points, pad with zeros to keep the chart shape
    if (data.length < count) {
      const remain = count - data.length;
      for (let i = 0; i < remain; i++) {
        data.unshift({ name: fallbackLabels[i], views: 0 });
      }
    }
    return data;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const targetId = id || user?.uid;
    const viewingOwnProfile = !id || id === user?.uid;
    if (!viewingOwnProfile && user?.role !== 'brand') {
      navigate('/dashboard');
      return;
    }
    fetchCreatorProfile(targetId);
  }, [id, user, navigate]);

  const fetchCreatorProfile = async (targetId) => {
    try {
      const response = await ugcCreatorAPI.getProfile(targetId);
      setCreator(response.profile);
      
      // Fetch stats history
      try {
        const statsResponse = await ugcCreatorAPI.getStatsHistory(targetId);
        setStats(statsResponse);
      } catch (statsError) {
        console.log('Stats not available:', statsError);
        setStats([]);
      }

      // Fetch YouTube detailed analytics for recent videos
      try {
        setYoutubeLoading(true);
        setYoutubeError('');
        const ytResp = await ugcCreatorAPI.getYouTubeAnalytics(targetId);
        // Support both { success, data } and raw data
        const ytData = ytResp?.data || ytResp;
        setYoutubeDetailed(ytData || null);
      } catch (ytErr) {
        console.log('YouTube analytics not available for this creator:', ytErr);
        setYoutubeDetailed(null);
        setYoutubeError(
          ytErr?.response?.data?.message || 'Failed to load recent YouTube videos'
        );
      } finally {
        setYoutubeLoading(false);
      }
    } catch (error) {
      console.error('Error fetching UGC creator profile:', error);
      setError(error.message || 'Failed to load UGC creator profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async () => {
    try {
      setError('');
      setSuccess('');
      
      await chatAPI.createConversation(creator.userId);
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
  const viewingOwnProfile = !id || id === user?.uid;

  return (
    <Container className="py-4 ugc-my-profile">
      {viewingOwnProfile ? (
        <Row className="g-3 align-items-stretch">
          <Col xs={12} md="auto" className="mb-3 ugc-left-nav-sticky" style={{ flex: '0 0 20%', maxWidth: '20%' }}>
            <UGCLeftNav activeKey={activeNav} onSelect={(key) => {
              setActiveNav(key);
              navigate('/ugc/dashboard');
            }} user={user} profile={creator} />
          </Col>
          <Col xs={12} style={{ flex: '0 0 80%', maxWidth: '80%' }}>
            <Card className="border-0 shadow-sm mb-3" style={{ borderRadius: '16px', background: '#ffffff' }}>
              <Card.Body className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <h3 className="mb-0">Your Profile</h3>
                  <Badge bg="danger" className="rounded-pill">{`${calculateCompletionPercentage(creator)}% COMPLETE`}</Badge>
                </div>
                <Button variant="outline-secondary">Preview</Button>
              </Card.Body>
              <Card.Body className="pt-0">
                <div className="d-flex align-items-center gap-4 text-muted" style={{ fontWeight: 500 }}>
                  <span onClick={() => setActiveSubTab('account')} style={{ cursor: 'pointer', color: activeSubTab==='account' ? '#0ea5e9' : undefined, borderBottom: activeSubTab==='account' ? '2px solid #0ea5e9' : 'none' }}>Account Settings</span>
                  <span onClick={() => setActiveSubTab('match')} style={{ cursor: 'pointer', color: activeSubTab==='match' ? '#0ea5e9' : undefined, borderBottom: activeSubTab==='match' ? '2px solid #0ea5e9' : 'none' }}>Match Profile</span>
                  <span onClick={() => setActiveSubTab('social')} style={{ cursor: 'pointer', color: activeSubTab==='social' ? '#0ea5e9' : undefined, borderBottom: activeSubTab==='social' ? '2px solid #0ea5e9' : 'none' }}>Social Profiles</span>
                  <span>Reviews</span>
                  <span>Portfolio</span>
                </div>
              </Card.Body>
            </Card>
            {activeSubTab === 'account' && (
            <>
            <div className="ugc-sections-flex">
              <div className="section-left">
                {/* Section 1: Title + Description */}
                <Card className="Personal-info" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <h5 className="fw-bold mb-1">Personal Information</h5>
                    <div className="text-muted" style={{ fontSize: '0.95rem' }}>
                      We'll share this information with brands to help with the matchmaking process and ensure a seamless experience.
                    </div>
                  </Card.Body>
                </Card>
              </div>
              <div className="section-right">
                {/* Section 2: Form + Avatar */}
                <Card className="border-0 shadow-sm ugc-section-card" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <Row className="align-items-start">
                      <Col md={4} className="mb-3 d-flex justify-content-start">
                        <div className="ugc-avatar-card p-3 text-center" style={{ width: '200px' }}>
                          <div className="mx-auto mb-2" style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden' }}>
                            <img src="https://i.pravatar.cc/100?img=12" alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <Button variant="light" size="sm">Change avatar</Button>
                        </div>
                      </Col>
                      <Col md={8} className="mb-3"></Col>
                    </Row>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>First Name</Form.Label>
                          <Form.Control defaultValue="ALMA" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Email Address</Form.Label>
                          <Form.Control type="email" defaultValue="almashan72000@gmail.com" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Ethnicity</Form.Label>
                          <Form.Select defaultValue="White">
                            <option>White</option>
                            <option>Black</option>
                            <option>Asian</option>
                            <option>Hispanic</option>
                            <option>Other</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Last Name</Form.Label>
                          <Form.Control defaultValue="KHAN" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Birthday</Form.Label>
                          <div className="input-group">
                            <Form.Control defaultValue="08/08/21" />
                            <span className="input-group-text"><i className="bi bi-calendar"></i></span>
                          </div>
                        </Form.Group>
                        <Row className="g-3">
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Gender</Form.Label>
                              <Form.Select defaultValue="Female">
                                <option>Female</option>
                                <option>Male</option>
                                <option>Other</option>
                                <option>Prefer not to say</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Pet owner</Form.Label>
                              <Form.Select defaultValue="I have a cat">
                                <option>I have a cat</option>
                                <option>I have a dog</option>
                                <option>No pets</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                    <div className="d-flex justify-content-end mt-3 ugc-action-bar">
                      <Button className="ugc-save-btn">Save</Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
            <div className="ugc-sections-flex">
              <div className="section-left">
                <Card className="Personal-info" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <h5 className="fw-bold mb-1">Address <Badge bg="success" className="ms-2">+5%</Badge></h5>
                    <div className="text-muted" style={{ fontSize: '0.95rem' }}>
                      After a successful match, we'll share your address with the brand to ensure a seamless product delivery experience
                    </div>
                  </Card.Body>
                </Card>
              </div>
              <div className="section-right">
                <Card className="border-0 shadow-sm ugc-section-card" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Address Line 1</Form.Label>
                          <Form.Control />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Address Line 2</Form.Label>
                          <Form.Control />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>City</Form.Label>
                          <Form.Control />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>State / Region</Form.Label>
                          <Form.Control />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Postcode</Form.Label>
                          <Form.Control />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Country</Form.Label>
                          <Form.Select>
                            <option value="">Select...</option>
                            <option>United States</option>
                            <option>United Kingdom</option>
                            <option>Canada</option>
                            <option>Australia</option>
                            <option>Other</option>
                          </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone Number</Form.Label>
                          <Form.Control type="tel" />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="d-flex justify-content-end mt-3 ugc-action-bar">
                      <Button className="ugc-save-btn">Save</Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
            <div className="ugc-sections-flex">
              <div className="section-left">
                <Card className="Personal-info" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <h5 className="fw-bold mb-1">Notifications</h5>
                    <div className="text-muted" style={{ fontSize: '0.95rem' }}>
                      We'll always let you know about important changes, but you pick what else you want to hear about.
                    </div>
                  </Card.Body>
                </Card>
              </div>
              <div className="section-right">
                <Card className="border-0 shadow-sm ugc-section-card" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <div className="mb-3 fw-semibold">By Email</div>
                    <div className="mb-3 d-flex align-items-start gap-3">
                      <Form.Check type="switch" defaultChecked className="mt-1" />
                      <div>
                        <div className="fw-semibold">Daily digest</div>
                        <div className="text-muted">You can disable your daily digest if you are getting too many emails and prefer just using the dashboard.</div>
                      </div>
                    </div>
                    <div className="mb-3 d-flex align-items-start gap-3">
                      <Form.Check type="switch" defaultChecked className="mt-1" />
                      <div>
                        <div className="fw-semibold">Marketing</div>
                        <div className="text-muted">General marketing emails like newsletter and other info.</div>
                      </div>
                    </div>
                    <div className="mb-3 d-flex align-items-start gap-3">
                      <Form.Check type="switch" defaultChecked className="mt-1" />
                      <div>
                        <div className="fw-semibold">Unread messages reminder</div>
                        <div className="text-muted">You can disable receiving emails about unread messages.</div>
                      </div>
                    </div>
                    <div className="mb-3 d-flex align-items-start gap-3">
                      <Form.Check type="switch" defaultChecked className="mt-1" />
                      <div>
                        <div className="fw-semibold">Contract agreements</div>
                        <div className="text-muted">You can disable receiving emails about contract agreements.</div>
                      </div>
                    </div>
                    <div className="mb-3 d-flex align-items-start gap-3">
                      <Form.Check type="switch" defaultChecked className="mt-1" />
                      <div>
                        <div className="fw-semibold">Automatic Followups</div>
                        <div className="text-muted">You can disable receiving emails for replying to creators.</div>
                      </div>
                    </div>
                    <div className="d-flex justify-content-end mt-3 ugc-action-bar">
                      <Button className="ugc-save-btn">Save</Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
            <div className="ugc-sections-flex">
              <div className="section-left">
                <Card className="Personal-info" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <h5 className="fw-bold mb-1">Update password</h5>
                    <div className="text-muted" style={{ fontSize: '0.95rem' }}>
                      Make sure you choose a secure password. Please have minimum 6 characters.
                    </div>
                  </Card.Body>
                </Card>
              </div>
              <div className="section-right">
                <Card className="border-0 shadow-sm ugc-section-card" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <Row className="g-3">
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Old password</Form.Label>
                          <Form.Control type="password" />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>New password</Form.Label>
                          <Form.Control type="password" />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Repeat new password</Form.Label>
                          <Form.Control type="password" />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="d-flex justify-content-end mt-3 ugc-action-bar">
                      <Button className="ugc-save-btn">Save</Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
            </>
            )}

            {activeSubTab === 'match' && (
            <>
            <div className="ugc-sections-flex">
              <div className="section-left">
                <Card className="Personal-info" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <h5 className="fw-bold mb-1">Campaign Active</h5>
                    <div className="text-muted" style={{ fontSize: '0.95rem' }}>
                      If you would like to take a break from working with brands you can pause your account using the toggle below.
                    </div>
                  </Card.Body>
                </Card>
              </div>
              <div className="section-right">
                <Card className="border-0 shadow-sm ugc-section-card" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <div className="d-flex align-items-center gap-3">
                      <Form.Check type="switch" defaultChecked className="ugc-toggle-lg" />
                      <span className="fw-semibold">Active</span>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>

            <div className="ugc-sections-flex">
              <div className="section-left">
                <Card className="Personal-info" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <h5 className="fw-bold mb-1">Invitations Active</h5>
                    <div className="text-muted" style={{ fontSize: '0.95rem' }}>
                      If you want to opt out of receiving invitations for work opportunities from brands.
                    </div>
                  </Card.Body>
                </Card>
              </div>
              <div className="section-right">
                <Card className="border-0 shadow-sm ugc-section-card" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <div className="d-flex align-items-center gap-3">
                      <Form.Check type="switch" defaultChecked className="ugc-toggle-lg" />
                      <span className="fw-semibold">Active</span>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>

            

            <div className="ugc-sections-flex">
              <div className="section-left">
                <Card className="Personal-info" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <h5 className="fw-bold mb-1">Collaboration</h5>
                    <div className="text-muted" style={{ fontSize: '0.95rem' }}>
                      How would you like to review products for brands?
                    </div>
                  </Card.Body>
                </Card>
              </div>
              <div className="section-right">
                <Card className="border-0 shadow-sm ugc-section-card" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <div
                      className="d-flex justify-content-between align-items-center p-3 mb-3"
                      style={{ border: collabOptions.reels ? '2px solid #1f2b3a' : '1px solid #e5e7eb', borderRadius: '12px', background: collabOptions.reels ? 'transparent' : '#f8f9fa' }}
                      onClick={() => setCollabOptions({ ...collabOptions, reels: !collabOptions.reels })}
                    >
                      <span>Instagram Reels</span>
                      {collabOptions.reels ? <i className="bi bi-check2"></i> : null}
                    </div>
                    <div
                      className="d-flex justify-content-between align-items-center p-3 mb-3"
                      style={{ border: collabOptions.stories ? '2px solid #1f2b3a' : '1px solid #e5e7eb', borderRadius: '12px', background: collabOptions.stories ? 'transparent' : '#f8f9fa' }}
                      onClick={() => setCollabOptions({ ...collabOptions, stories: !collabOptions.stories })}
                    >
                      <span>Instagram Stories</span>
                      {collabOptions.stories ? <i className="bi bi-check2"></i> : null}
                    </div>
                    <div
                      className="d-flex justify-content-between align-items-center p-3"
                      style={{ border: collabOptions.post ? '2px solid #1f2b3a' : '1px solid #e5e7eb', borderRadius: '12px', background: collabOptions.post ? 'transparent' : '#f8f9fa' }}
                      onClick={() => setCollabOptions({ ...collabOptions, post: !collabOptions.post })}
                    >
                      <span>Instagram Post</span>
                      {collabOptions.post ? <i className="bi bi-check2"></i> : null}
                    </div>
                    <div className="d-flex justify-content-end mt-3 ugc-action-bar">
                      <Button className="ugc-save-btn">Save</Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>

            <div className="ugc-sections-flex">
              <div className="section-left">
                <Card className="Personal-info" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <h5 className="fw-bold mb-1">Payment</h5>
                    <div className="text-muted" style={{ fontSize: '0.95rem' }}>
                      How would you like to be compensated for collaborations?
                    </div>
                  </Card.Body>
                </Card>
              </div>
              <div className="section-right">
                <Card className="border-0 shadow-sm ugc-section-card" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <div
                      className="d-flex justify-content-between align-items-center p-3 mb-3"
                      style={{ border: paymentOptions.gifted ? '2px solid #1f2b3a' : '1px solid #e5e7eb', borderRadius: '12px', background: paymentOptions.gifted ? 'transparent' : '#f8f9fa' }}
                      onClick={() => setPaymentOptions({ ...paymentOptions, gifted: !paymentOptions.gifted })}
                    >
                      <div>
                        <div className="fw-semibold">Gifted</div>
                        <div className="text-muted">You'll work with brands on just a gifted product and no payments. Social Cat is mainly a gifted influencer platform and we've only recently started testing paid and affiliate options.</div>
                      </div>
                      {paymentOptions.gifted ? <i className="bi bi-check2"></i> : null}
                    </div>
                    <div
                      className="d-flex justify-content-between align-items-center p-3 mb-3"
                      style={{ border: paymentOptions.paid ? '2px solid #1f2b3a' : '1px solid #e5e7eb', borderRadius: '12px', background: paymentOptions.paid ? 'transparent' : '#f8f9fa' }}
                      onClick={() => setPaymentOptions({ ...paymentOptions, paid: !paymentOptions.paid })}
                    >
                      <div>
                        <div className="fw-semibold">Paid</div>
                        <div className="text-muted">The brand will pay a fixed fee per post, story or reels. You'll be able to choose your fees on the next step.</div>
                      </div>
                      {paymentOptions.paid ? <i className="bi bi-check2"></i> : null}
                    </div>
                    <div
                      className="d-flex justify-content-between align-items-center p-3 mb-3"
                      style={{ border: paymentOptions.affiliate ? '2px solid #1f2b3a' : '1px solid #e5e7eb', borderRadius: '12px', background: paymentOptions.affiliate ? 'transparent' : '#f8f9fa' }}
                      onClick={() => setPaymentOptions({ ...paymentOptions, affiliate: !paymentOptions.affiliate })}
                    >
                      <div>
                        <div className="fw-semibold">Affiliate</div>
                        <div className="text-muted">On top of the free product, you'll also get a commission for every sale the brand receives through your discount code.</div>
                      </div>
                      {paymentOptions.affiliate ? <i className="bi bi-check2"></i> : null}
                    </div>
                    {paymentOptions.paid && (
                      <Row className="g-3 mt-2">
                        <Col md={6}>
                          <div className="text-muted mb-1">Minimum asking price</div>
                          <div className="input-group">
                            <span className="input-group-text">$</span>
                            <Form.Control value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                            <span className="input-group-text">USD</span>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="text-muted mb-1">Maximum asking price</div>
                          <div className="input-group">
                            <span className="input-group-text">$</span>
                            <Form.Control value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                            <span className="input-group-text">USD</span>
                          </div>
                        </Col>
                      </Row>
                    )}
                    <div className="d-flex justify-content-end mt-3 ugc-action-bar">
                      <Button className="ugc-save-btn">Save</Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>

            <div className="ugc-sections-flex">
              <div className="section-left">
                <Card className="Personal-info" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <h5 className="fw-bold mb-1">Tell us about yourself <Badge bg="success" className="ms-1">+5%</Badge></h5>
                    <div className="text-muted" style={{ fontSize: '0.95rem' }}>
                      The more interesting and relevant information you provide, the higher the chances of being approved by the brands.
                    </div>
                  </Card.Body>
                </Card>
              </div>
              <div className="section-right">
                <Card className="border-0 shadow-sm ugc-section-card" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Control
                        as="textarea"
                        rows={6}
                        placeholder="What makes you special? Make this detailed."
                        value={aboutText}
                        onChange={(e) => setAboutText(e.target.value)}
                      />
                    </Form.Group>
                    <div className="d-flex justify-content-end mt-3 ugc-action-bar">
                      <Button className="ugc-save-btn">Save</Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>

            <div className="ugc-sections-flex">
              <div className="section-left">
                <Card className="Personal-info" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <h5 className="fw-bold mb-1">Highlight your passions <Badge bg="success" className="ms-1">+5%</Badge></h5>
                    <div className="text-muted" style={{ fontSize: '0.95rem' }}>
                      Share more about your unique interests, hobbies, and experiences. The more detailed and captivating your story is, the greater your chances of resonating with brands. They are always on the lookout for creators who can authentically align with their values and audiences. Your uniqueness could be the key to unlocking exciting partnerships.
                    </div>
                  </Card.Body>
                </Card>
              </div>
              <div className="section-right">
                <Card className="border-0 shadow-sm ugc-section-card" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Control
                        as="textarea"
                        rows={6}
                        placeholder="What are you really into? Make this detailed."
                        value={passionsText}
                        onChange={(e) => setPassionsText(e.target.value)}
                      />
                    </Form.Group>
                    <div className="d-flex justify-content-end mt-3 ugc-action-bar">
                      <Button className="ugc-save-btn">Save</Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>

            <div className="ugc-sections-flex">
              <div className="section-left">
                <Card className="Personal-info" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <h5 className="fw-bold mb-1">Your creator account</h5>
                    <div className="text-muted" style={{ fontSize: '0.95rem' }}>
                      Select the keywords that best describe you and your creator account.
                    </div>
                  </Card.Body>
                </Card>
              </div>
              <div className="section-right">
                <Card className="border-0 shadow-sm ugc-section-card" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <Row className="g-4">
                      <Col md={8}>
                        <MultiSelect
                          label="Topics"
                          options={categoryOptions}
                          value={nicheValues}
                          onChange={setNicheValues}
                          placeholder="Select topics"
                        />
                      </Col>
                      <Col md={8}>
                        <MultiSelect
                          label="Account niche"
                          options={categoryOptions}
                          value={nicheValues}
                          onChange={setNicheValues}
                          placeholder="Select niches"
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Face / Faceless</Form.Label>
                          <Form.Select value={faceOrFaceless} onChange={(e) => setFaceOrFaceless(e.target.value)}>
                            <option value="">Select...</option>
                            <option value="face">Face</option>
                            <option value="faceless">Faceless</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <MultiSelect
                          label="Content Style"
                          options={contentTypeOptions}
                          value={contentStyleValues}
                          onChange={setContentStyleValues}
                          placeholder="Select content styles"
                        />
                      </Col>
                    </Row>
                    <div className="d-flex justify-content-end mt-3 ugc-action-bar">
                      <Button className="ugc-save-btn" disabled={savingCreatorAccount} onClick={saveCreatorAccount}>{savingCreatorAccount ? 'Saving...' : 'Save'}</Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>

            <div className="ugc-sections-flex">
              <div className="section-left">
                <Card className="Personal-info" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <h5 className="fw-bold mb-1">Brands that you like</h5>
                    <div className="text-muted" style={{ fontSize: '0.95rem' }}>
                      Let us know what kind of brands are interesting to you, so that we give you more accurate recommendations.
                    </div>
                  </Card.Body>
                </Card>
              </div>
              <div className="section-right">
                <Card className="border-0 shadow-sm ugc-section-card" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <Row className="g-4">
                      <Col md={12}>
                        <MultiSelect
                          label="Preferred companies"
                          options={preferredCompanyOptions}
                          value={preferredCompanies}
                          onChange={setPreferredCompanies}
                          placeholder="Select companies"
                        />
                      </Col>
                      <Col md={12}>
                        <MultiSelect
                          label="What brands are you interested in working with?"
                          options={brandInterestOptions}
                          value={preferredBrandInterests}
                          onChange={setPreferredBrandInterests}
                          placeholder="Select brand categories"
                        />
                      </Col>
                    </Row>
                    <div className="d-flex justify-content-end mt-3 ugc-action-bar">
                      <Button className="ugc-save-btn" disabled={savingCreatorAccount} onClick={saveCreatorAccount}>{savingCreatorAccount ? 'Saving...' : 'Save'}</Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
            </>
            )}

            {activeSubTab === 'social' && (
            <>
            <div className="ugc-sections-flex">
              <div className="section-right">
                <Card className="border-0 shadow-sm ugc-section-card" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <div className="mb-3">
                      <h5 className="fw-bold mb-1">Instagram Account <span className="text-success">+5%</span> <i className="bi bi-info-circle ms-1"></i></h5>
                      <div className="text-muted" style={{ fontSize: '0.95rem' }}>
                        Manage your Instagram connection. Your account is currently {creator?.instagramVerified ? (<span className="text-success">verified</span>) : (<span className="text-danger">not verified</span>)}.
                      </div>
                    </div>
                    <div className="d-flex flex-column align-items-center">
                      <div className="mb-2" style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: '#f3f4f6' }}>
                        {instagramProfileAvatar || creator?.instagramAvatarUrl || creator?.avatarUrl || creator?.instagramUsername ? (
                          <img src={
                            instagramProfileAvatar ||
                            creator?.instagramAvatarUrl ||
                            creator?.avatarUrl ||
                            (creator?.instagramUsername ? `https://unavatar.io/instagram/${creator.instagramUsername.replace('@','')}` : '')
                          } alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                          <div className="d-flex align-items-center justify-content-center h-100 w-100 text-muted">
                            <i className="bi bi-person" style={{ fontSize: '1.5rem' }}></i>
                          </div>
                        )}
                      </div>
                      <div className="mb-3 d-flex align-items-center gap-2">
                        {editingInstagram ? (
                          <div className="d-flex gap-2">
                            <Form.Control placeholder="@username" value={instagramUsernameInput} onChange={(e) => setInstagramUsernameInput(e.target.value)} style={{ maxWidth: 280 }} />
                            <Button variant="primary" size="sm" className="ugc-btn-gradient" disabled={savingSocialProfiles} onClick={saveSocialProfiles}>{savingSocialProfiles ? 'Saving…' : 'Save'}</Button>
                            <Button variant="outline-secondary" size="sm" onClick={() => { setEditingInstagram(false); setInstagramUsernameInput(creator?.instagramUsername || ''); }}>Cancel</Button>
                          </div>
                        ) : (
                          <>
                            <a href={creator?.instagramUsername ? `https://instagram.com/${creator.instagramUsername.replace('@','')}` : undefined} target="_blank" rel="noreferrer" className="fw-semibold ugc-ig-handle" style={{ textDecoration: 'none' }}>
                              {creator?.instagramUsername ? `@${creator.instagramUsername.replace('@','')}` : 'Not connected'}
                            </a>
                            <span className="ugc-ig-badge"><i className="bi bi-instagram"></i></span>
                          </>
                        )}
                      </div>
                      <div className="d-flex gap-4 text-center mb-3">
                        <div>
                          <div className="fw-semibold">{formatNumber(creator?.postsCount || 0)}</div>
                          <div className="text-muted" style={{ fontSize: '0.85rem' }}>posts</div>
                        </div>
                        <div>
                          <div className="fw-semibold">{formatNumber(creator?.followers || 0)}</div>
                          <div className="text-muted" style={{ fontSize: '0.85rem' }}>followers</div>
                        </div>
                        <div>
                          <div className="fw-semibold">{formatNumber(creator?.following || 0)}</div>
                          <div className="text-muted" style={{ fontSize: '0.85rem' }}>following</div>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <Button variant="primary" className="d-flex align-items-center gap-2 ugc-btn-gradient" size="sm" onClick={handleVerifyInstagram} disabled={verifyingInstagram || (!instagramUsernameInput && !creator?.instagramUsername)}>
                          <i className="bi bi-instagram"></i>
                          {verifyingInstagram ? 'Verifying…' : 'Verify Instagram'}
                        </Button>
                        <Button variant="light" className="ugc-btn-outline-lilac" size="sm" onClick={() => setEditingInstagram(true)}>Change Instagram</Button>
                        <Button variant="light" className="ugc-btn-danger-soft" size="sm" onClick={() => { setInstagramUsernameInput(''); saveSocialProfiles(); }}>Delete</Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>

            <div className="ugc-sections-flex">
              <div className="section-right">
                <Card className="border-0 shadow-sm ugc-section-card" style={{ borderRadius: '16px' }}>
                  <Card.Body>
                    <div className="mb-3">
                      <h5 className="fw-bold mb-1">YouTube Account <span className="text-success">+5%</span> <i className="bi bi-info-circle ms-1"></i></h5>
                      <div className="text-muted" style={{ fontSize: '0.95rem' }}>
                        Manage your YouTube connection. Your channel is currently {creator?.youtubeChannelId ? (<span className="text-success">connected</span>) : (<span className="text-danger">not connected</span>)}.
                      </div>
                    </div>
                    <div className="d-flex flex-column align-items-center">
                      <div className="mb-2" style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: '#f3f4f6' }}>
                        {creator?.youtubeAvatarUrl || creator?.youtubeThumbnails || youtubeDetailed?.channelInfo?.thumbnails || creator?.youtubeChannelTitle ? (
                          <img src={
                            creator?.youtubeAvatarUrl ||
                            creator?.youtubeThumbnails?.high?.url ||
                            creator?.youtubeThumbnails?.default?.url ||
                            creator?.youtubeThumbnails?.medium?.url ||
                            youtubeDetailed?.channelInfo?.thumbnails?.high?.url ||
                            youtubeDetailed?.channelInfo?.thumbnails?.default?.url ||
                            youtubeDetailed?.channelInfo?.thumbnails?.medium?.url ||
                            (creator?.youtubeChannelTitle ? `https://unavatar.io/youtube/${encodeURIComponent(creator.youtubeChannelTitle)}` : '')
                          } alt="youtube avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                          <div className="d-flex align-items-center justify-content-center h-100 w-100 text-muted">
                            <i className="bi bi-youtube" style={{ fontSize: '1.5rem' }}></i>
                          </div>
                        )}
                      </div>
                      <div className="mb-3 d-flex align-items-center gap-2">
                        {editingYouTube ? (
                          <div className="d-flex gap-2">
                            <Form.Control placeholder="Channel URL, ID or @handle" value={youtubeChannelQuery} onChange={(e) => setYoutubeChannelQuery(e.target.value)} style={{ maxWidth: 320 }} />
                            <Button variant="danger" size="sm" className="ugc-btn-gradient-red" disabled={connectingYouTube || !youtubeChannelQuery} onClick={connectYouTubeChannel}>{connectingYouTube ? 'Connecting…' : 'Connect'}</Button>
                            <Button variant="outline-secondary" size="sm" onClick={() => { setEditingYouTube(false); setYoutubeChannelQuery(''); }}>Cancel</Button>
                          </div>
                        ) : (
                          <>
                            <a href={creator?.youtubeChannelUrl ? creator.youtubeChannelUrl : (creator?.youtubeChannelId ? `https://youtube.com/channel/${creator.youtubeChannelId}` : undefined)} target="_blank" rel="noreferrer" className="fw-semibold ugc-yt-handle" style={{ textDecoration: 'none' }}>
                              {creator?.youtubeChannelTitle || 'Not connected'}
                            </a>
                            <span className="ugc-yt-badge"><i className="bi bi-youtube"></i></span>
                          </>
                        )}
                      </div>
                      <div className="d-flex gap-4 text-center mb-3">
                        <div>
                          <div className="fw-semibold">{formatNumber(creator?.youtubeVideos || creator?.youtubeVideoCount || 0)}</div>
                          <div className="text-muted" style={{ fontSize: '0.85rem' }}>videos</div>
                        </div>
                        <div>
                          <div className="fw-semibold">{formatNumber(creator?.youtubeSubscribers || creator?.youtubeSubscriberCount || 0)}</div>
                          <div className="text-muted" style={{ fontSize: '0.85rem' }}>subscribers</div>
                        </div>
                        <div>
                          <div className="fw-semibold">{formatNumber(creator?.youtubeViews || creator?.youtubeViewCount || 0)}</div>
                          <div className="text-muted" style={{ fontSize: '0.85rem' }}>views</div>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <Button variant="danger" className="d-flex align-items-center gap-2 ugc-btn-gradient-red" size="sm" onClick={async () => {
                          try {
                            setConnectingYouTube(true);
                            const targetId = id || user?.uid;
                            await ugcCreatorAPI.refreshYouTubeData(targetId);
                            const refreshed = await ugcCreatorAPI.getProfile(targetId);
                            setCreator(refreshed.profile);
                            setSuccess('YouTube data refreshed');
                          } catch (e) {
                            setError(typeof e === 'string' ? e : e?.message || 'Failed to refresh YouTube');
                          } finally {
                            setConnectingYouTube(false);
                          }
                        }} disabled={connectingYouTube || !creator?.youtubeChannelId}>
                          <i className="bi bi-youtube"></i>
                          {connectingYouTube ? 'Refreshing…' : 'Verify YouTube'}
                        </Button>
                        <Button variant="light" className="ugc-btn-outline-lilac" size="sm" onClick={() => setEditingYouTube(true)}>Change YouTube</Button>
                        <Button variant="light" className="ugc-btn-danger-soft" size="sm" onClick={deleteYouTubeConnection}>Delete</Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
            </>
            )}
          </Col>
        </Row>
      ) : (
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
                  <Card className="border-0 shadow-sm bg-transparent">
                    <Card.Header className="bg-gradient" style={{background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)', color: 'white'}}>
                      <div className="d-flex align-items-center">
                        <i className="fas fa-user me-2"></i>
                        <h6 className="mb-0">Profile Information</h6>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-4 bg-transparent">
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

              {/* UGC Analytics + Top Recent Videos (same as dashboard) */}
              <Row>
                <Col md={12} className="mb-4">
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">UGC Analytics</h5>
                      <div className="d-flex align-items-center gap-3">
                        <Form.Select size="sm" value={analyticsRange} onChange={(e) => setAnalyticsRange(e.target.value)} style={{ width: '160px' }}>
                          <option value="7">Last 7 Days</option>
                          <option value="30">Last 30 Days</option>
                        </Form.Select>
                        <Button variant="link" className="p-0" style={{ color: '#0d6efd' }} onClick={() => setAnalyticsRange('30')}>Last 30 Days</Button>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      {youtubeLoading ? (
                        <div className="text-center py-4">
                          <Spinner animation="border" role="status" variant="primary">
                            <span className="visually-hidden">Loading analytics...</span>
                          </Spinner>
                          <p className="mt-2 text-muted">Loading analytics...</p>
                        </div>
                      ) : (
                        <div>
                          <ResponsiveContainer width="100%" height={280}>
                            <ComposedChart data={buildChartData()} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                              <XAxis dataKey="name" tick={{ fill: '#7b8aa8' }} />
                              <YAxis domain={[0, 10000]} width={60} tick={{ fill: '#7b8aa8' }} tickMargin={8} />
                              <Tooltip />
                              <defs>
                                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#5a9cff" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#5a9cff" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="views" fill="url(#gradBlue)" stroke="#5a9cff" strokeWidth={3} />
                            </ComposedChart>
                          </ResponsiveContainer>

                          {/* Performance Cards below graph */}
                          {youtubeDetailed?.recentVideos?.length ? (
                            <Row className="g-3 mt-3">
                              {youtubeDetailed.recentVideos.slice(0, 5).map((video, index) => {
                                const views = Number(video.viewCount || 0);
                                const likes = Number(video.likeCount || 0);
                                const comments = Number(video.commentCount || 0);
                                const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;
                                const statusLabel = engagement >= 5 ? 'Positive' : engagement >= 3 ? 'Neutral' : 'Pending';
                                const statusVariant = engagement >= 5 ? 'success' : engagement >= 3 ? 'secondary' : 'warning';
                                const thumb = video.thumbnail || video.thumbnailUrl;
                                return (
                                  <Col md={4} sm={6} xs={12} key={index}>
                                    <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                      <div className="position-relative">
                                        {thumb ? (
                                          <Card.Img variant="top" src={thumb} style={{ height: '140px', objectFit: 'cover' }} />
                                        ) : (
                                          <div style={{ height: '140px', background: '#f8f9fa' }} />
                                        )}
                                      </div>
                                      <Card.Body className="p-3">
                                        <div className="d-flex justify-content-between align-items-start mb-1">
                                          <div className="fw-bold" style={{ fontSize: '1rem' }}>
                                            {engagement.toFixed(1)}%
                                          </div>
                                          <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                                            {formatNumber(views)}
                                          </div>
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>Engagement Rate</div>
                                        <Badge bg={statusVariant} className="mt-2">{statusLabel}</Badge>
                                      </Card.Body>
                                    </Card>
                                  </Col>
                                );
                              })}
                            </Row>
                          ) : null}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {youtubeDetailed?.recentVideos?.length ? (
                <Card className="mb-4 border-0 shadow-sm">
                  <Card.Header className="d-flex align-items-center justify-content-between">
                    <h5 className="mb-0">Top Recent Videos</h5>
                    <small className="text-muted">Latest {Math.min(6, youtubeDetailed.recentVideos.length)} items</small>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-3">
                      {youtubeDetailed.recentVideos.slice(0, 6).map((video, index) => {
                        const views = Number(video.viewCount || 0);
                        const likes = Number(video.likeCount || 0);
                        const comments = Number(video.commentCount || 0);
                        const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;
                        const statusLabel = engagement >= 5 ? 'Positive' : engagement >= 3 ? 'Neutral' : 'Pending';
                        const statusVariant = engagement >= 5 ? 'success' : engagement >= 3 ? 'secondary' : 'warning';
                        const thumb = video.thumbnail || video.thumbnailUrl;
                        return (
                          <Col md={4} sm={6} key={index}>
                            <Card className="h-100 border-0 shadow-sm">
                              <div className="position-relative">
                                {thumb ? (
                                  <Card.Img 
                                    variant="top" 
                                    src={thumb} 
                                    style={{ height: '120px', objectFit: 'cover' }} 
                                  />
                                ) : (
                                  <div style={{ height: '120px', background: '#f8f9fa' }} />
                                )}
                                <Badge bg={statusVariant} className="position-absolute top-0 start-0 m-2">{statusLabel}</Badge>
                              </div>
                              <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <div className="fw-bold" style={{ fontSize: '1rem' }}>
                                    {engagement.toFixed(1)}%
                                  </div>
                                  <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                                    {formatNumber(views)}
                                  </div>
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.85rem' }}>Engagement Rate</div>
                              </Card.Body>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  </Card.Body>
                </Card>
              ) : null}

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
      )}
    </Container>
  );
};

export default UGCCreatorProfile;
