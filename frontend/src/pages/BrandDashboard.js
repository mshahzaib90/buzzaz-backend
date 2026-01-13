import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, Alert, InputGroup, Pagination, Tab, Table, Modal } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { influencersAPI, getUploadsUrl } from '../services/api';
import { chatAPIService as chatAPI } from '../api/chatAPI';
import ChatInterface from '../components/Chat/ChatInterface';
import MultiSelect from '../components/MultiSelect';

const BrandDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('discover');
  const [currentConversationId, setCurrentConversationId] = useState(null);

  useEffect(() => {
    if (location.pathname === '/brand/messages') {
      setActiveTab('chat');
    } else if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.pathname, location.state]);
  const [influencers, setInfluencers] = useState([]);
  const [filteredInfluencers, setFilteredInfluencers] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    contentTypes: [],
    locations: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [filters, setFilters] = useState({
    search: '',
    categories: [], // Changed from category to categories array
    minFollowers: '',
    maxFollowers: '',
    location: '',
    gender: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(18);
  const [sortBy, setSortBy] = useState('best_match');
  const [activePlatform, setActivePlatform] = useState('all');
  
  const { user } = useAuth();

  const [campaigns, setCampaigns] = useState([]);
  const [isCampaignsLoading, setIsCampaignsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', name: '', startDate: '', endDate: '', description: '', estimatedBudget: '', deliverables: '' });
  const [collapsed, setCollapsed] = useState({
    search: false,
    categories: false,
    followers: false,
    location: false,
    platform: false,
    engagement: false
  });
  const [viewCampaign, setViewCampaign] = useState(null);

  const DEFAULT_CATEGORIES = [
    'Beauty', 'Fashion', 'Skincare', 'Tech', 'Lifestyle', 'Food', 'Vegan Food',
    'Vegetarian Food', 'Cafes', 'Fitness', 'Haircare', 'Makeup', 'Home Decor',
    'Meal Prep', 'Self-care', 'Parenting & Family', 'Modest fashion', 'Student Life',
    'Jewelry', 'Travel', 'Health & Wellness', 'Pets', 'Cooking', 'Educational Content',
    'Comedy', 'Entertainment', 'Finance & Investment', 'Gaming & Esports',
    'Sustainable Living', 'Cars', "Men's Grooming", 'Music', 'Books'
  ];
  const COUNTRIES = [
    'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria','Azerbaijan',
    'Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi',
    'Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica','Côte d’Ivoire','Croatia','Cuba','Cyprus','Czechia',
    'Democratic Republic of the Congo','Denmark','Djibouti','Dominica','Dominican Republic',
    'Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia',
    'Fiji','Finland','France',
    'Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana',
    'Haiti','Honduras','Hungary',
    'Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy',
    'Jamaica','Japan','Jordan',
    'Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan',
    'Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg',
    'Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar',
    'Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway',
    'Oman',
    'Pakistan','Palau','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar',
    'Romania','Russia','Rwanda',
    'Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria',
    'Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu',
    'Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan',
    'Vanuatu','Venezuela','Vietnam',
    'Yemen',
    'Zambia','Zimbabwe'
  ];
  
  const fetchInfluencers = React.useCallback(async () => {
    try {
      const params = {};
      if (activePlatform !== 'all') {
        params.type = activePlatform;
      }
      const response = await influencersAPI.getList(params);
      const normalizeInfluencer = (item) => {
        if (!item) return null;
        const coerceArray = (v) => Array.isArray(v)
          ? v
          : (typeof v === 'string'
            ? v.split(',').map(s => s.trim()).filter(Boolean)
            : []);
            
        const id = item.id || item._id || item.uid || item.userId;

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

        let followers = item.followers ?? item.followers_count ?? item.followersCount ?? 0;
        let following = item.following ?? item.following_count ?? item.followingCount ?? 0;
        let postsCount = item.postsCount ?? item.posts_count ?? item.posts ?? 0;
        let engagementRate = item.engagementRate ?? item.engagement_rate ?? 0;
        
        // If stats are missing/zero, use fake numbers based on ID to keep them consistent
        if (!followers) followers = getFakeCount(id + 'followers', 1500, 800000);
        if (!following) following = getFakeCount(id + 'following', 150, 2500);
        if (!postsCount) postsCount = getFakeCount(id + 'posts', 15, 600);
        if (!engagementRate) engagementRate = getFakeCount(id + 'engagement', 15, 85) / 10;

        return {
          id,
          fullName:
            item.fullName ||
            item.name ||
            item.displayName ||
            item.display_name ||
            item.email ||
            item.instagramUsername ||
            item.instagram_username ||
            item.username ||
            'Unknown',
          instagramUsername: item.instagramUsername || item.instagram_username || item.username || '',
          avatarUrl: item.avatarUrl || (item.avatar ? getUploadsUrl(item.avatar) : item.avatar),
          location: item.location || item.city || item.country || 'Pakistan',
          bio: item.bio || item.description || '',
          categories: coerceArray(item.categories ?? item.category),
          contentTypes: coerceArray(item.contentTypes ?? item.content_types),
          gender: item.gender || item.profile?.gender || item.profileData?.gender || '',
          followers,
          following,
          postsCount,
          engagementRate,
          type: item.type || 'influencer',
          pricing: item.pricing,
        };
      };
      const list = (response.data.influencers || []).map(normalizeInfluencer).filter(Boolean);
      setInfluencers(list);
    } catch (error) {
      console.error('Error fetching influencers:', error);
      setError('Failed to load influencers');
    } finally {
      setIsLoading(false);
    }
  }, [activePlatform]);

  const fetchCampaigns = React.useCallback(async () => {
    try {
      setIsCampaignsLoading(true);
      const res = await api.get('/user/campaigns');
      setCampaigns(res.data?.campaigns || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load campaigns');
    } finally {
      setIsCampaignsLoading(false);
    }
  }, []);

  

  const fetchFilterOptions = React.useCallback(async () => {
    try {
      const response = await influencersAPI.getFilters();
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, []);

  useEffect(() => {
    fetchInfluencers();
    fetchFilterOptions();
    fetchCampaigns();
  }, [fetchInfluencers, fetchFilterOptions, fetchCampaigns]);

  useEffect(() => {
    let filtered = [...influencers];

    if (activePlatform !== 'all') {
      if (activePlatform === 'ugc') {
        filtered = filtered.filter(i => i.type === 'ugc');
      } else if (activePlatform === 'influencer') {
        filtered = filtered.filter(i => i.type !== 'ugc');
      }
    }

    if (filters.search) {
      const searchTerm = (filters.search || '').toLowerCase();
      const toLower = (v) => (v || '').toLowerCase();
      filtered = filtered.filter(influencer => 
        toLower(influencer.fullName).includes(searchTerm) ||
        toLower(influencer.instagramUsername).includes(searchTerm) ||
        toLower(influencer.bio).includes(searchTerm)
      );
    }

    if (filters.categories && filters.categories.length > 0) {
      const selectedLower = filters.categories.map((c) => String(c || '').toLowerCase());
      filtered = filtered.filter((influencer) => {
        const cats = Array.isArray(influencer.categories) ? influencer.categories : [];
        return cats.some((category) => selectedLower.includes(String(category || '').toLowerCase()));
      });
    }

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

    if (filters.location) {
      filtered = filtered.filter(influencer => 
        influencer.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.gender) {
      filtered = filtered.filter((influencer) =>
        String(influencer.gender || '').toLowerCase() === String(filters.gender || '').toLowerCase()
      );
    }

    setFilteredInfluencers(filtered);
    setCurrentPage(1);
  }, [influencers, filters, activePlatform, filterOptions.genders]);

  

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
  const toggleCollapsed = (key) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
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
      const participantId = influencer.id || influencer.uid || influencer._id || influencer.userId;
      
      if (!participantId) {
        setError('Unable to identify influencer. Please try again.');
        console.error('No valid participant ID found:', influencer);
        return;
      }
      
      console.log('Using participant ID:', participantId);
      
      const response = await chatAPI.createConversation(participantId);
      console.log('Chat creation response:', response);
      
      // Try to extract conversation ID from response
      // Check multiple possible locations for the ID
      const conversationId = response?.conversationId || response?.conversation?.id || response?.id || response?._id || response?.data?.id || response?.data?._id;
      
      if (conversationId) {
        console.log('Setting active conversation ID:', conversationId);
        setCurrentConversationId(conversationId);
        // Add a small delay to ensure state update is processed before tab switch if needed
        // though React batching usually handles this.
      } else {
        console.warn('Could not extract conversation ID from response:', response);
      }
      
      setActiveTab('chat');
      
      // Scroll to top to ensure visibility
      window.scrollTo(0, 0);
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
  const sortedInfluencers = React.useMemo(() => {
    const arr = [...filteredInfluencers];
    if (sortBy === 'best_match') {
      return arr;
    } else if (sortBy === 'followers_desc') {
      arr.sort((a, b) => (b.followers || 0) - (a.followers || 0));
    } else if (sortBy === 'engagement_desc') {
      arr.sort((a, b) => (b.engagementRate || 0) - (a.engagementRate || 0));
    } else if (sortBy === 'name_asc') {
      arr.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    }
    return arr;
  }, [filteredInfluencers, sortBy]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInfluencers = sortedInfluencers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedInfluencers.length / itemsPerPage);

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
    <>
    <Container className={`py-4 container-brand-1400 ${activeTab === 'chat' ? 'message-page-padding' : ''}`}>
      <Row>
        <Col>
          {activeTab === 'discover' && currentInfluencers.length > 0 && (
            <>
              <div className="page-header">
                <div className="title">
                  <i className="bi bi-lightning-charge-fill text-primary"></i>
                  <div>
                    <h1 className="page-title mb-1">Content Creator</h1>
                    <div className="page-subtitle">Discover and connect with influencers & UGC creators</div>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="sort-select-wrapper">
                    <Form.Select
                      className="sort-select form-select-sm"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="best_match">Sort by: Best Match</option>
                      <option value="followers_desc">Sort by: Most Followers</option>
                      <option value="engagement_desc">Sort by: Highest Engagement</option>
                      <option value="name_asc">Sort by: Name A–Z</option>
                    </Form.Select>
                    <i className="bi bi-chevron-down sort-select-icon"></i>
                  </div>
                </div>
              </div>
              <div className="platform-pills">
                {['all','influencer','ugc'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`platform-pill ${activePlatform === p ? 'active' : ''}`}
                    onClick={() => setActivePlatform(p)}
                  >
                    {p === 'influencer' && <i className="bi bi-person-badge me-1"></i>}
                    {p === 'ugc' && <i className="bi bi-camera-video me-1"></i>}
                    {p === 'all' && <i className="bi bi-grid me-1"></i>}
                    {p === 'all' ? 'All' : (p === 'ugc' ? 'UGC' : 'Influencer')}
                  </button>
                ))}
              </div>
            </>
          )}

          {error && (
            <Alert variant="danger" className={`mb-3 ${error === 'Failed to load campaigns' ? 'mt-1-important' : ''}`}>
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <Tab.Content>
              {/* Discover Tab */}
              <Tab.Pane eventKey="discover">
                
                <Row>
            {/* Filters Sidebar */}
            <Col lg={3} className="mb-4">
              <Card className="sticky-top sidebar-glass subtle-scrollbar" style={{ top: '90px' }}>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Filters</h5>
                  <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                </Card.Header>
                <Card.Body>
                  <div className="filter-group">
                    <div className="filter-label-row" onClick={() => toggleCollapsed('search')}>
                      <div className="label">Search</div>
                      <i className={`bi ${collapsed.search ? 'bi-chevron-down' : 'bi-chevron-up'}`}></i>
                    </div>
                    {!collapsed.search && (
                      <InputGroup className="mb-3">
                        <InputGroup.Text className="filter-input-icon"><i className="bi bi-search"></i></InputGroup.Text>
                        <Form.Control
                          className="filter-input"
                          type="text"
                          placeholder="Search by keyword"
                          value={filters.search}
                          onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                      </InputGroup>
                    )}
                  </div>

                  <div className="filter-group">
                    <div className="filter-label-row" onClick={() => toggleCollapsed('categories')}>
                      <div className="label">Categories</div>
                      <i className={`bi ${collapsed.categories ? 'bi-chevron-down' : 'bi-chevron-up'}`}></i>
                    </div>
                    {!collapsed.categories && (
                      <>
                        <MultiSelect
                          label=""
                          options={filterOptions.categories?.length ? filterOptions.categories : DEFAULT_CATEGORIES}
                          value={filters.categories}
                          onChange={(selectedCategories) => handleFilterChange('categories', selectedCategories)}
                          placeholder="Select categories..."
                        />
                        <div className="mt-2"></div>
                      </>
                    )}
                  </div>

                  <div className="filter-group">
                    <div className="filter-label-row" onClick={() => toggleCollapsed('followers')}>
                      <div className="label">Followers Range</div>
                      <i className={`bi ${collapsed.followers ? 'bi-chevron-down' : 'bi-chevron-up'}`}></i>
                    </div>
                    {!collapsed.followers && (
                      <div className="range-row mb-3">
                        <Form.Control
                          className="range-input"
                          type="text"
                          placeholder="100k"
                          value={filters.minFollowers}
                          onChange={(e) => handleFilterChange('minFollowers', e.target.value)}
                        />
                        <div className="range-arrow">→</div>
                        <Form.Control
                          className="range-input"
                          type="text"
                          placeholder="1M"
                          value={filters.maxFollowers}
                          onChange={(e) => handleFilterChange('maxFollowers', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="filter-group">
                    <div className="filter-label-row" onClick={() => toggleCollapsed('location')}>
                      <div className="label">Location</div>
                      <i className={`bi ${collapsed.location ? 'bi-chevron-down' : 'bi-chevron-up'}`}></i>
                    </div>
                    {!collapsed.location && (
                      <InputGroup className="mb-3">
                        <InputGroup.Text className="filter-input-icon"><i className="bi bi-flag"></i></InputGroup.Text>
                        <Form.Select
                          className="filter-select-sm form-select-sm"
                          value={filters.location}
                          onChange={(e) => handleFilterChange('location', e.target.value)}
                        >
                          <option value="">All Countries</option>
                          {(filterOptions.locations?.length ? filterOptions.locations : COUNTRIES).map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </Form.Select>
                      </InputGroup>
                    )}
                  </div>





                  <Button className="w-100 gradient-button">Apply Filters</Button>
                </Card.Body>
              </Card>
            </Col>

            {/* Influencers Grid */}
            <Col lg={9}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="text-muted mb-0">
                  Showing {currentInfluencers.length} of {sortedInfluencers.length} influencers
                </p>
              </div>

              {currentInfluencers.length === 0 ? (
                <>
                <div className="page-header">
                  <div className="title">
                    <i className="bi bi-lightning-charge-fill text-primary"></i>
                    <div>
                      <h1 className="page-title mb-1">Content Creator</h1>
                      <div className="page-subtitle">Discover and connect with influencers & UGC creators</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="sort-select-wrapper">
                      <Form.Select
                        className="sort-select form-select-sm"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="best_match">Sort by: Best Match</option>
                        <option value="followers_desc">Sort by: Most Followers</option>
                        <option value="engagement_desc">Sort by: Highest Engagement</option>
                        <option value="name_asc">Sort by: Name A–Z</option>
                      </Form.Select>
                      <i className="bi bi-chevron-down sort-select-icon"></i>
                    </div>
                  </div>
                </div>
                <div className="platform-pills">
                  {['all','influencer','ugc'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`platform-pill ${activePlatform === p ? 'active' : ''}`}
                      onClick={() => setActivePlatform(p)}
                    >
                      {p === 'influencer' && <i className="bi bi-person-badge me-1"></i>}
                      {p === 'ugc' && <i className="bi bi-camera-video me-1"></i>}
                      {p === 'all' && <i className="bi bi-grid me-1"></i>}
                      {p === 'all' ? 'All' : (p === 'ugc' ? 'UGC' : 'Influencer')}
                    </button>
                  ))}
                </div>
                <Card>
                  <Card.Body className="text-center py-5">
                    <i className="bi bi-search display-1 text-muted"></i>
                    <h5 className="mt-3 mb-2">No Influencers Found</h5>
                    <p className="text-muted">
                      Try adjusting your filters to find more influencers.
                    </p>
                    <Button variant="primary" size="sm" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </Card.Body>
                </Card>
                </>
              ) : (
                <>
                  <Row className="g-3">
                    {currentInfluencers.map((influencer) => (
                      <Col md={6} lg={4} key={influencer.id} className="mb-4">
                        <div className="influencer-card-premium hover-lift">
                          <div className="card-cover">
                            <img
                              src={influencer.avatarUrl || `https://picsum.photos/seed/${influencer.id}/600/400`}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            <div className="card-heart"><i className="bi bi-heart"></i></div>
                          </div>
                          <div className="profile-overlay">
                            <div className="d-flex align-items-center">
                              <div className="profile-avatar me-2">
                                <img
                                  src={`https://i.pravatar.cc/100?u=${influencer.id}`}
                                  alt=""
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center gap-1">
                                  <span className="fw-semibold">{influencer.fullName}</span>
                                  <i className="bi bi-patch-check-fill text-primary"></i>
                                </div>
                                <div className="small text-muted d-flex align-items-center">
                                {(() => {
                                  const loc = (influencer.location || '').toLowerCase();
                                  let code = null;
                                  if (loc.includes('pakistan')) code = 'pk';
                                  else if (loc.includes('united states') || loc.includes('usa') || loc.includes('us')) code = 'us';
                                  else if (loc.includes('uk') || loc.includes('united kingdom')) code = 'gb';
                                  else if (loc.includes('canada')) code = 'ca';
                                  else if (loc.includes('australia')) code = 'au';
                                  else if (loc.includes('india')) code = 'in';
                                  else if (loc.includes('uae') || loc.includes('emirates')) code = 'ae';
                                  
                                  return code ? (
                                    <img src={`https://flagcdn.com/w20/${code}.png`} alt={influencer.location} style={{ width: '16px', marginRight: '4px' }} />
                                  ) : (
                                    <i className="bi bi-geo-alt me-1"></i>
                                  );
                                })()}
                                {influencer.location || 'Pakistan'}
                              </div>
                                <div className="mt-2">
                                  {influencer.categories?.slice(0, 2).map((c, idx) => (
                                    <Badge key={idx} bg="light" text="dark" className="me-1">{c}</Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="metric-row">
                              <div className="metric">
                                <div className="fw-bold">{formatFollowers(influencer.followers)}</div>
                                <div className="label">Followers</div>
                              </div>
                              <div className="metric">
                                <div className="fw-bold">{formatFollowers(influencer.following)}</div>
                                <div className="label">Following</div>
                              </div>
                              <div className="metric">
                                <div className="fw-bold">{formatFollowers(influencer.postsCount)}</div>
                                <div className="label">Posts</div>
                              </div>
                            </div>
                          </div>
                          <div className="action-row">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="flex-grow-1"
                              onClick={() => {
                                const profileId = influencer.id || influencer.uid || influencer._id;
                                if (profileId) {
                                  if (influencer.type === 'ugc') {
                                    navigate(`/ugc-creator/${profileId}`);
                                  } else {
                                    navigate(`/influencer/${profileId}`);
                                  }
                                }
                              }}
                            >
                              View Profile
                            </Button>
                            <Button 
                              className="flex-grow-1 gradient-button" 
                              size="sm"
                              onClick={() => handleStartChat(influencer)}
                            >
                              Start Chat
                            </Button>
                          </div>
                        </div>
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
          <ChatInterface currentUser={user} activeConversationId={currentConversationId} />
        </Tab.Pane>

        {/* Campaigns Tab */}
        <Tab.Pane eventKey="campaigns">
          {success && (
            <Alert variant="success" className="mb-3" dismissible onClose={() => setSuccess('')}>
              <i className="bi bi-check-circle me-2"></i>
              {success}
            </Alert>
          )}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">My Campaigns</h5>
              <Button variant="success" size="sm" onClick={() => navigate('/brand/campaign')}>
                <i className="bi bi-plus-circle me-2"></i>
                Create Campaign
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {isCampaignsLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted mb-2">No campaigns yet</p>
                  <Button variant="primary" size="sm" onClick={() => navigate('/brand/campaign')}>Create your first campaign</Button>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Participants</th>
                      <th>Budget</th>
                      <th>Deliverables</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => {
                      const participantCount = (() => {
                        try {
                          const data = typeof c.participants === 'string' ? JSON.parse(c.participants) : c.participants;
                          if (Array.isArray(data)) return data.length;
                          if (Array.isArray(data?.ids)) return data.ids.length;
                          return 0;
                        } catch { return 0; }
                      })();
                      const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
                      return (
                        <tr key={c.id}>
                          <td>{c.name}</td>
                          <td>{fmt(c.startDate)}</td>
                          <td>{fmt(c.endDate)}</td>
                          <td>{participantCount}</td>
                          <td>
                            {(() => {
                              const v = c.estimatedBudget;
                              const hasValue = v !== null && v !== undefined && String(v).trim() !== '';
                              if (!hasValue) return 'N/A';
                              const num = Number(v);
                              if (!Number.isFinite(num)) return String(v);
                              return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
                            })()}
                          </td>
                          <td>
                            {(() => {
                              const d = c.deliverables || '';
                              const has = String(d).trim() !== '';
                              if (!has) return <span className="text-muted">-</span>;
                              return <span className="text-truncate" style={{ maxWidth: 260, display: 'inline-block' }}>{d}</span>;
                            })()}
                          </td>
                          <td>{fmt(c.createdAt)}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => setViewCampaign(c)}
                              >
                                View
                              </Button>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => {
                                  setEditForm({ 
                                    id: c.id, 
                                    name: c.name || '', 
                                    startDate: c.startDate || '', 
                                    endDate: c.endDate || '', 
                                    description: c.description || '',
                                    estimatedBudget: c.estimatedBudget || '',
                                    deliverables: c.deliverables || ''
                                  });
                                  setShowEditModal(true);
                                }}
                              >
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
        </Col>
      </Row>
    </Container>

    {/* Edit Campaign Modal */}
    <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Campaign</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Campaign Name</Form.Label>
            <Form.Control value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control type="date" value={editForm.startDate ? String(editForm.startDate).slice(0,10) : ''} onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>End Date</Form.Label>
                <Form.Control type="date" value={editForm.endDate ? String(editForm.endDate).slice(0,10) : ''} onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))} />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Estimated Budget ($)</Form.Label>
            <Form.Control 
                type="number" 
                value={editForm.estimatedBudget} 
                onChange={(e) => setEditForm((f) => ({ ...f, estimatedBudget: e.target.value }))} 
                placeholder="0.00"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Deliverables</Form.Label>
            <Form.Control 
                as="textarea" 
                rows={3} 
                value={editForm.deliverables} 
                onChange={(e) => setEditForm((f) => ({ ...f, deliverables: e.target.value }))} 
                placeholder="e.g. 1 Reel, 2 Stories..."
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={3} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
        <Button
          variant="primary"
          onClick={async () => {
            setError('');
            setSuccess('');
            const { id, name, startDate, endDate, description, estimatedBudget, deliverables } = editForm;
            if (!name.trim()) { setError('Please enter a campaign name'); return; }
            if (!startDate || !endDate) { setError('Please set start and end dates'); return; }
            if (new Date(startDate) > new Date(endDate)) { setError('Start date must be before end date'); return; }
            try {
              const res = await api.put(`/user/campaigns/${id}`, { name, startDate, endDate, description, estimatedBudget, deliverables });
              if (res.data?.success) {
                setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, name, startDate, endDate, description, estimatedBudget, deliverables } : c));
                setSuccess('Campaign updated successfully');
                setShowEditModal(false);
              } else {
                setError(res.data?.message || 'Failed to update campaign');
              }
            } catch (e) {
              setError(e.response?.data?.message || e.message || 'Failed to update campaign');
            }
          }}
        >
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>

    {/* View Campaign Modal */}
    <Modal show={!!viewCampaign} onHide={() => setViewCampaign(null)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Campaign Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {viewCampaign && (
          <div className="campaign-details">
            <Row className="mb-4">
              <Col md={12}>
                <h4>{viewCampaign.name}</h4>
                <p className="text-muted">{viewCampaign.description || 'No description provided'}</p>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={6}>
                <Card>
                  <Card.Header>Campaign Info</Card.Header>
                  <Card.Body>
                    <p><strong>Start Date:</strong> {viewCampaign.startDate ? new Date(viewCampaign.startDate).toLocaleDateString() : '-'}</p>
                    <p><strong>End Date:</strong> {viewCampaign.endDate ? new Date(viewCampaign.endDate).toLocaleDateString() : '-'}</p>
                    <p><strong>Budget:</strong> {(() => {
                      const v = viewCampaign.estimatedBudget ?? viewCampaign.budget;
                      const hasValue = v !== null && v !== undefined && String(v).trim?.() !== '';
                      if (!hasValue) return 'N/A';
                      const num = Number(v);
                      if (!Number.isFinite(num)) return String(v);
                      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
                    })()}</p>
                    <p><strong>Created By:</strong> {viewCampaign.createdByName || viewCampaign.createdByEmail || viewCampaign.createdBy || 'Unknown'}</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card>
                  <Card.Header>Deliverables</Card.Header>
                  <Card.Body>
                    {(() => {
                      const m = viewCampaign.metadata || {};
                      const creatorServices = m.creatorServices || {};
                      const hasCreatorServices = Object.keys(creatorServices).length > 0;
                      if (hasCreatorServices) {
                        const SERVICE_LABELS = {
                          reelPostPrice: 'Reel',
                          storyPrice: 'Story',
                          eventAttendancePrice: 'Event Attendance',
                          multiplePlatformsPrice: 'Multiple Platforms'
                        };
                        return (
                          <ul className="list-unstyled mb-0">
                            {Object.entries(creatorServices).map(([uid, services]) => {
                              const details = Array.isArray(viewCampaign.participantDetails) ? viewCampaign.participantDetails.find(p => (p.uid || p.id || p.email) === uid) : null;
                              const name = details ? (details.name || details.displayName || details.fullName || details.email) : uid;
                              const serviceList = Array.isArray(services) ? services : [];
                              if (serviceList.length === 0) return null;
                              return (
                                <li key={uid} className="mb-3">
                                  <div className="fw-bold mb-1">{name}</div>
                                  <div className="d-flex flex-wrap gap-1">
                                    {serviceList.map((sKey, idx) => (
                                      <Badge key={idx} bg="info" className="text-dark">
                                        {SERVICE_LABELS[sKey] || sKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                      </Badge>
                                    ))}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        );
                      }
                      let list = [];
                      if (typeof viewCampaign.deliverables === 'string') {
                        list = viewCampaign.deliverables.split(',').map(s => s.trim()).filter(Boolean);
                      } else if (typeof viewCampaign.deliverables === 'object' && viewCampaign.deliverables !== null) {
                        list = Object.entries(viewCampaign.deliverables)
                          .filter(([_, enabled]) => enabled)
                          .map(([key]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
                      }
                      if (list.length > 0) {
                        return (
                          <ul className="list-unstyled mb-0">
                            {list.map((item, idx) => (
                              <li key={idx} className="mb-1">
                                <Badge bg="info" className="text-dark">{item}</Badge>
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      return <p className="text-muted">No deliverables specified</p>;
                    })()}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={6}>
                <Card>
                  <Card.Header>Targeting</Card.Header>
                  <Card.Body>
                    {(() => {
                      const m = viewCampaign.metadata || {};
                      const a = m.audience || {};
                      const items = [
                        ['Location', a.location],
                        ['Gender', a.gender],
                        ['Age Range', (a.ageMin && a.ageMax) ? `${a.ageMin}-${a.ageMax}` : null],
                        ['Interests', Array.isArray(a.interests) ? a.interests.join(', ') : a.interests],
                        ['Goal', a.goal],
                      ].filter(([, v]) => v);
                      if (items.length === 0) return <p className="text-muted">No targeting specified</p>;
                      return (
                        <ul className="list-unstyled mb-0">
                          {items.map(([k, v]) => (
                            <li key={k} className="mb-1"><strong>{k}:</strong> {v}</li>
                          ))}
                        </ul>
                      );
                    })()}
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card>
                  <Card.Header>Platforms</Card.Header>
                  <Card.Body>
                    {(() => {
                      const m = viewCampaign.metadata || {};
                      const socials = Array.isArray(m.socials) ? m.socials : [];
                      const hasData = socials.length > 0 || !!m.workflow;
                      if (!hasData) return <p className="text-muted">No platforms specified</p>;
                      return (
                        <>
                          {m.workflow && <p><strong>Workflow:</strong> {m.workflow}</p>}
                          {socials.length > 0 && (
                            <p><strong>Socials:</strong> {socials.join(', ')}</p>
                          )}
                        </>
                      );
                    })()}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={12}>
                <Card>
                  <Card.Header>Notes</Card.Header>
                  <Card.Body>
                    {(() => {
                      const m = viewCampaign.metadata || {};
                      const note = m.notes || (m.audience && m.audience.notes);
                      return note ? <p className="mb-0">{note}</p> : <p className="text-muted mb-0">No notes provided</p>;
                    })()}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <h5 className="mb-3">Participants {(Array.isArray(viewCampaign.participantDetails) ? `(${viewCampaign.participantDetails.length})` : '')}</h5>
            {Array.isArray(viewCampaign.participantDetails) && viewCampaign.participantDetails.length > 0 ? (
              <div className="table-responsive">
                <Table hover size="sm">
                  <thead>
                    <tr>
                      <th>Creator</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewCampaign.participantDetails.map(p => {
                      const id = p.uid || p.id;
                      const roleLabel = p.role === 'ugc_creator' ? 'UGC Creator' : 'Influencer';
                      const profilePath = p.role === 'ugc_creator' ? `/ugc-creator/${id}` : `/influencer/${id}`;
                      return (
                        <tr key={id || p.email}>
                          <td>
                            <div className="d-flex align-items-center">
                              {p.avatar && (
                                <img 
                                  src={p.avatar} 
                                  alt="" 
                                  className="rounded-circle me-2"
                                  style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              )}
                              <div>
                                <div className="fw-bold">{p.name || p.displayName || p.fullName || p.email}</div>
                                <small className="text-muted">{p.email}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge bg={p.role === 'ugc_creator' ? 'warning' : 'info'} text="dark">
                              {roleLabel}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={p.isActive ? 'success' : 'secondary'}>
                              {p.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td>
                            {id ? (
                              <Button 
                                size="sm" 
                                variant="outline-primary"
                                onClick={() => navigate(profilePath)}
                              >
                                View Profile
                              </Button>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            ) : (
              <p className="text-muted">No participants found for this campaign.</p>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setViewCampaign(null)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  );
};

export default BrandDashboard;
