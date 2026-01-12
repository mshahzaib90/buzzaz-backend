import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Spinner, Alert, Form, InputGroup, Pagination, Modal, ProgressBar } from 'react-bootstrap';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, LabelList, Legend } from 'recharts';
// import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import CreateCampaignWizard from '../components/brand/CreateCampaignWizard';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditCampaignModal, setShowEditCampaignModal] = useState(false);
  const [editCampaignForm, setEditCampaignForm] = useState({ id: '', name: '', startDate: '', endDate: '', description: '' });
  const [showDeleteCampaignModal, setShowDeleteCampaignModal] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [isCampaignsLoading, setIsCampaignsLoading] = useState(false);

  
  // View Campaign Modal State
  const [showViewCampaignModal, setShowViewCampaignModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignParticipants, setCampaignParticipants] = useState([]);
  const [isCampaignParticipantsLoading, setIsCampaignParticipantsLoading] = useState(false);
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [createFormData, setCreateFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'influencer',
    profile: {
      // Common
      phoneNumber: '',
      city: '',
      country: '',
      gender: '',
      dateOfBirth: '',
      bio: '',
      // Influencer
      instagramUsername: '',
      categories: '', // comma-separated
      contentTypes: '', // comma-separated
      languages: '', // comma-separated
      pricingTier: '',
      priceRangeMin: '',
      priceRangeMax: '',
      deliverables: '', // comma-separated
      averageDeliveryTime: '',
      // UGC
      maritalStatus: '',
      children: '',
      niche: '', // comma-separated
      contentStyle: '', // comma-separated
      faceOrFaceless: '',
      sampleContentLinks: '', // comma-separated URLs
    }
  });

  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingUser, setPricingUser] = useState(null);
  const [pricingForm, setPricingForm] = useState({});
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState('');
  const [pricingSuccess, setPricingSuccess] = useState('');

  // Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payFormData, setPayFormData] = useState({
    amount: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  // Multi-select options and handler
  const categoryOptions = ['Beauty', 'Fashion', 'Tech', 'Food', 'Travel', 'Fitness', 'Lifestyle', 'Parenting', 'Education', 'Gaming', 'Music'];
  const contentTypeOptions = ['Tutorial', 'Review', 'Unboxing', 'Vlog', 'Skit', 'Live', 'Photo', 'Reel', 'Story', 'Giveaway'];
  const languageOptions = ['English', 'Urdu', 'Hindi', 'Arabic', 'Punjabi', 'Bengali', 'Spanish', 'French', 'German'];
  const nicheOptions = ['Beauty', 'Fashion', 'Tech', 'Food', 'Travel', 'Fitness', 'Lifestyle', 'Parenting', 'Education', 'Gaming', 'Music'];
  const contentStyleOptions = ['Tutorial', 'Review', 'Unboxing', 'Vlog', 'Skit', 'Live', 'Photo', 'Reel', 'Story', 'Giveaway'];

  const handleMultiSelect = (field) => (e) => {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value);
    setCreateFormData((prev) => ({
      ...prev,
      profile: { ...prev.profile, [field]: values.join(', ') }
    }));
  };
  
  // Removed unused auth user to satisfy no-unused-vars without changing behavior
  // const { user } = useAuth();

  const fetchStats = React.useCallback(async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to load statistics';
      setError(msg);
    }
  }, []);

  const fetchUsers = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...filters
      });
      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to load users';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters]);

  const fetchCampaigns = React.useCallback(async () => {
    try {
      setIsCampaignsLoading(true);
      const res = await api.get('/admin/campaigns');
      setCampaigns(res.data?.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to load campaigns';
      setError(msg);
    } finally {
      setIsCampaignsLoading(false);
    }
  }, []);

  const openPricingModal = async (user) => {
    setPricingError('');
    setPricingSuccess('');
    setPricingUser(user);
    setPricingForm({});
    setShowPricingModal(true);
    try {
      setPricingLoading(true);
      const role = user.role;
      const url = role === 'ugc_creator' ? `/admin/pricing/ugc/${user.uid}` : `/admin/pricing/influencer/${user.uid}`;
      const res = await api.get(url);
      const existing = res.data?.pricing || {};
      setPricingForm(existing);
    } catch (e) {
      const data = e.response?.data;
      const msg = data?.error || data?.message || e.message || 'Failed to load pricing';
      setPricingError(msg);
    } finally {
      setPricingLoading(false);
    }
  };

  const setPricingField = (name, value) => {
    setPricingForm((prev) => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  };

  const handleCreateWizardSubmit = async (formData) => {
    try {
      const participants = Array.isArray(formData.selectedCreators) ? formData.selectedCreators : [];
      const serviceKeyLabels = {
        reelPostPrice: 'Reel',
        storyPrice: 'Story',
        eventAttendancePrice: 'Event Attendance',
        multiplePlatformsPrice: 'Multiple Platforms'
      };
      const allServiceKeys = new Set(
        Object.values(formData.creatorServices || {}).flat().filter(Boolean)
      );
      const deliverables = [...allServiceKeys]
        .map((k) => serviceKeyLabels[k] || k)
        .join(', ');

      const estimatedBudgetFromForm = (() => {
        const raw = String(formData.budget || '').trim();
        const num = Number(raw.replace(/[^0-9.]/g, ''));
        return Number.isFinite(num) && num > 0 ? num : undefined;
      })();

      const payload = {
        name: String(formData.name || '').trim(),
        description: String(formData.description || ''),
        startDate: formData.startDate,
        endDate: formData.endDate,
        participants,
        estimatedBudget: estimatedBudgetFromForm,
        deliverables,
        metadata: {
          workflow: formData.workflow,
          socials: formData.socials,
          audience: {
            location: formData.location,
            gender: formData.gender,
            ageMin: formData.ageMin,
            ageMax: formData.ageMax,
            interests: formData.interests,
            goal: formData.goal,
            notes: formData.audienceNotes
          },
          budget: {
            amount: formData.budget,
            currency: formData.currency,
            type: formData.budgetType,
            maxSpendPerCreator: formData.maxSpendPerCreator
          },
          platformDistribution: formData.platformDistribution,
          notes: formData.notes,
          creatorServices: formData.creatorServices
        }
      };

      const res = await api.post('/admin/campaigns', payload);
      if (res.data?.success && res.data?.campaign) {
        setCampaigns((prev) => [res.data.campaign, ...prev]);
        setSuccess(`Campaign "${payload.name}" created successfully`);
        setShowCreateCampaignModal(false);
      } else {
        setError(res.data?.message || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      setError(error.response?.data?.message || error.message || 'Failed to create campaign');
    }
  };

  const savePricing = async () => {
    try {
      setPricingLoading(true);
      setPricingError('');
      setPricingSuccess('');
      const role = pricingUser.role;
      const url = role === 'ugc_creator' ? `/admin/pricing/ugc/${pricingUser.uid}` : `/admin/pricing/influencer/${pricingUser.uid}`;
      const res = await api.put(url, pricingForm);
      if (res.data?.success) {
        setPricingSuccess('Pricing updated');
        setShowPricingModal(false);
      } else {
        setPricingError(res.data?.message || 'Failed to update');
      }
    } catch (e) {
      const data = e.response?.data;
      const msg = data?.error || data?.message || e.message || 'Failed to update';
      setPricingError(msg);
    } finally {
      setPricingLoading(false);
    }
  };

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const isSelected = (uid) => selectedUserIds.includes(uid);
  const toggleSelectUser = (uid) => {
    setSelectedUserIds((prev) => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };
  const toggleSelectAllVisible = () => {
    if (users.length > 0 && selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(u => u.uid));
    }
  };

  const fetchCampaignParticipants = React.useCallback(async () => {
    if (!selectedCampaign) return;
    
    try {
      setIsCampaignParticipantsLoading(true);
      const parts = typeof selectedCampaign.participants === 'string' 
        ? JSON.parse(selectedCampaign.participants) 
        : selectedCampaign.participants;
      
      const ids = Array.isArray(parts) ? parts : (parts?.ids || []);
      
      if (ids.length === 0) {
        setCampaignParticipants([]);
        return;
      }

      const promises = ids.map(id => api.get(`/admin/users/${id}`).catch(() => null));
      const results = await Promise.all(promises);
      
      const participants = results
        .filter(res => res && res.data)
        .map(res => res.data);
        
      setCampaignParticipants(participants);
    } catch (error) {
      console.error('Error fetching campaign participants:', error);
      // Don't show error to user, just show empty list
      setCampaignParticipants([]);
    } finally {
      setIsCampaignParticipantsLoading(false);
    }
  }, [selectedCampaign]);

  useEffect(() => {
    if (showViewCampaignModal && selectedCampaign) {
      fetchCampaignParticipants();
    }
  }, [showViewCampaignModal, selectedCampaign, fetchCampaignParticipants]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchCampaigns();
  }, [fetchStats, fetchUsers, fetchCampaigns]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ role: '', status: '', search: '' });
    setCurrentPage(1);
  };

  const getParticipantCount = (participants) => {
    try {
      const data = typeof participants === 'string' ? JSON.parse(participants) : participants;
      if (Array.isArray(data)) return data.length;
      if (Array.isArray(data?.ids)) return data.ids.length;
      return 0;
    } catch {
      return 0;
    }
  };

  const handleUserAction = async (userId, action, value) => {
    try {
      let endpoint = '';
      let data = {};
      
      if (action === 'status') {
        endpoint = `/admin/users/${userId}/status`;
        data = { isActive: value };
      } else if (action === 'sponsor') {
        endpoint = `/admin/users/${userId}/sponsor`;
        data = { isSponsored: value };
      }
      
      await api.put(endpoint, data);
      
      setSuccess(`User ${action} updated successfully`);
      fetchUsers();
      fetchStats();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error(`Error updating user ${action}:`, error);
      setError(`Failed to update user ${action}`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const viewUserDetails = async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      setSelectedUser(response.data);
      setShowUserModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      const msg = error?.response?.data?.message || error.message || 'Failed to load user details';
      setError(msg);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      role: user.role || '',
      isActive: user.isActive || false
    });
    setShowEditModal(true);
  };

  const handleChangePassword = (user) => {
    setSelectedUser(user);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  const handlePayUser = (user) => {
    setSelectedUser(user);
    setPayFormData({
      amount: '',
      cardNumber: '',
      expiryDate: '',
      cvv: ''
    });
    setShowPayModal(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const submitEditUser = async () => {
    try {
      await api.put(`/admin/users/${selectedUser.uid}`, editFormData);
      
      setSuccess('User updated successfully');
      setShowEditModal(false);
      fetchUsers();
      fetchStats();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
      setTimeout(() => setError(''), 3000);
    }
  };

  const submitChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      await api.put(`/admin/users/${selectedUser.uid}/password`, {
        newPassword: passwordData.newPassword
      });
      
      setSuccess('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Failed to change password');
      setTimeout(() => setError(''), 3000);
    }
  };

  const submitDeleteUser = async () => {
    try {
      await api.delete(`/admin/users/${selectedUser.uid}`);
      
      setSuccess('User deleted successfully');
      setShowDeleteModal(false);
      fetchUsers();
      fetchStats();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
      setTimeout(() => setError(''), 3000);
    }
  };

  const submitBulkDelete = async () => {
    try {
      await api.post('/admin/users/bulk-delete', { userIds: selectedUserIds });
      setSuccess('Selected users deleted successfully');
      setShowBulkDeleteModal(false);
      setSelectedUserIds([]);
      fetchUsers();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      const data = error?.response?.data;
      const message = data?.message || 'Failed to delete selected users';
      setError(message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const submitCreateUser = async () => {
    if (!createFormData.email || !createFormData.password) {
      setError('Email and password are required');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (createFormData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const payload = { ...createFormData };
      // Trim and omit optional fields if empty to satisfy backend validators
      if (!payload.fullName || !String(payload.fullName).trim()) {
        delete payload.fullName;
      } else {
        payload.fullName = String(payload.fullName).trim();
      }
      // Ensure profile is included only for influencer/ugc_creator
      if (['influencer', 'ugc_creator'].includes(createFormData.role)) {
        payload.profile = { ...createFormData.profile };
      } else {
        delete payload.profile;
      }

      await api.post('/admin/users', payload);
      setSuccess('User created successfully');
      setShowCreateModal(false);
      setCreateFormData({
        fullName: '',
        email: '',
        password: '',
        role: 'influencer',
        profile: {
          phoneNumber: '', city: '', country: '', gender: '', dateOfBirth: '', bio: '',
          instagramUsername: '', categories: '', contentTypes: '', languages: '', pricingTier: '', priceRangeMin: '', priceRangeMax: '', deliverables: '', averageDeliveryTime: '',
          maritalStatus: '', children: '', niche: '', contentStyle: '', faceOrFaceless: '', sampleContentLinks: ''
        }
      });
      fetchUsers();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error creating user:', error);
      const data = error?.response?.data;
      const message = data?.message || (Array.isArray(data?.errors) ? data.errors.map(e => e.msg).join(', ') : 'Failed to create user');
      setError(message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const renderPagination = () => {
    if (!pagination.totalPages || pagination.totalPages <= 1) return null;

    const items = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
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
      <div className="d-flex justify-content-center">
        <Pagination>
          <Pagination.First 
            onClick={() => setCurrentPage(1)} 
            disabled={currentPage === 1} 
          />
          <Pagination.Prev 
            onClick={() => setCurrentPage(currentPage - 1)} 
            disabled={currentPage === 1} 
          />
          {items}
          <Pagination.Next 
            onClick={() => setCurrentPage(currentPage + 1)} 
            disabled={currentPage === pagination.totalPages} 
          />
          <Pagination.Last 
            onClick={() => setCurrentPage(pagination.totalPages)} 
            disabled={currentPage === pagination.totalPages} 
          />
        </Pagination>
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'brand': return 'primary';
      case 'influencer': return 'warning';
      case 'ugc_creator': return 'success';
      default: return 'secondary';
    }
  };

  // Derived data for charts and KPIs (safe fallbacks to avoid runtime errors)
  const totalUsers = stats.totalUsers || 0;
  const activeUsers = stats.activeUsers || 0;
  const sponsoredUsers = stats.sponsoredUsers || 0;
  const recentSignups = stats.recentSignups || 0;

  const kpiBarData = [
    { name: 'Total', value: totalUsers },
    { name: 'Active', value: activeUsers },
    { name: 'Sponsored', value: sponsoredUsers },
    { name: '30d', value: recentSignups }
  ];

  const rolePieData = [
    { name: 'Influencers', value: stats.usersByRole?.influencers || 0, color: '#00C49F' },
    { name: 'UGC', value: stats.usersByRole?.ugcCreators || 0, color: '#0088FE' },
    { name: 'Brands', value: stats.usersByRole?.brands || 0, color: '#FFBB28' },
    { name: 'Admins', value: stats.usersByRole?.admins || 0, color: '#FF8042' }
  ];

  // Pie label helpers to avoid overlap and improve readability
  const RADIAN = Math.PI / 180;
  const roleColorMap = Object.fromEntries(rolePieData.map(r => [r.name, r.color]));
  const renderRolePieLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
    // Hide labels for small slices to prevent clutter and overlap
    if (percent < 0.08) return null;
    const radius = outerRadius + 12;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const anchor = x > cx ? 'start' : 'end';
    const fill = roleColorMap[name] || '#111827';
    return (
      <text x={x} y={y} fill={fill} textAnchor={anchor} dominantBaseline="central" style={{ fontWeight: 600 }}>
        {`${Math.round(percent * 100)}%`}
      </text>
    );
  };

  const activeRatePct = totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const sponsoredRatePct = totalUsers ? Math.round((sponsoredUsers / totalUsers) * 100) : 0;

  if (isLoading && users.length === 0) {
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
              <h1 className="h3 mb-1">Admin Dashboard</h1>
              <p className="text-muted mb-0">Manage users and platform statistics</p>
            </div>
            <Badge bg="danger" className="px-3 py-2">
              <i className="bi bi-shield-check me-1"></i>
              Admin
            </Badge>
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

          {/* Navigation Tabs */}
          <div className="mb-4">
            <Button
              variant={activeTab === 'overview' ? 'primary' : 'outline-primary'}
              className="me-2 mb-2"
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </Button>
            <Button
              variant={activeTab === 'users' ? 'primary' : 'outline-primary'}
              className="me-2 mb-2"
              onClick={() => setActiveTab('users')}
            >
              User Management
            </Button>
            <Button
              variant={activeTab === 'campaigns' ? 'primary' : 'outline-primary'}
              className="me-2 mb-2"
              onClick={() => setActiveTab('campaigns')}
            >
              Campaigns
            </Button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <Row>
                <Col md={3} className="mb-4">
                  <Card className="h-100 shadow-sm" style={{ backgroundColor: '#f8f9fa' }}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="text-uppercase small opacity-75">Total Users</div>
                          <div className="display-6 fw-bold">{totalUsers}</div>
                        </div>
                        <i className="bi bi-people-fill fs-3 opacity-75 text-secondary"></i>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-4">
                  <Card className="h-100 shadow-sm" style={{ backgroundColor: '#f8f9fa' }}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="text-uppercase small opacity-75">Active Users</div>
                          <div className="display-6 fw-bold">{activeUsers}</div>
                        </div>
                        <i className="bi bi-lightning-charge-fill fs-3 opacity-75 text-secondary"></i>
                      </div>
                      <div className="mt-3">
                        <ProgressBar now={activeRatePct} label={`${activeRatePct}%`} variant="success" style={{ height: 8 }} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-4">
                  <Card className="h-100 shadow-sm" style={{ backgroundColor: '#f8f9fa' }}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="text-uppercase small opacity-75">Sponsored</div>
                          <div className="display-6 fw-bold">{sponsoredUsers}</div>
                        </div>
                        <i className="bi bi-star-fill fs-3 opacity-75 text-secondary"></i>
                      </div>
                      <div className="mt-3">
                        <ProgressBar now={sponsoredRatePct} label={`${sponsoredRatePct}%`} variant="warning" style={{ height: 8 }} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-4">
                  <Card className="h-100 shadow-sm" style={{ backgroundColor: '#f8f9fa' }}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="text-uppercase small opacity-75">Signups (30d)</div>
                          <div className="display-6 fw-bold">{recentSignups}</div>
                        </div>
                        <i className="bi bi-graph-up-arrow fs-3 opacity-75 text-secondary"></i>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
        </Row>

              <Row>
                <Col md={7} className="mb-4">
                  <Card className="h-100 shadow-sm border-0">
                    <Card.Header 
                      className="d-flex justify-content-between align-items-center"
                      style={{
                        background: 'linear-gradient(90deg, #fce7f3 0%, #e0e7ff 100%)',
                        borderBottom: 'none'
                      }}
                    >
                      <h5 className="mb-0">Platform KPIs</h5>
                      <div className="text-muted small">Bar chart</div>
                    </Card.Header>
                    <Card.Body style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={kpiBarData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
                          <YAxis allowDecimals={false} tick={{ fill: '#6b7280' }} />
                          <Tooltip 
                            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                            formatter={(val) => [val, 'Count']}
                            labelFormatter={(label) => `Metric: ${label}`}
                          />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#6366f1">
                            <LabelList dataKey="value" position="top" style={{ fill: '#374151', fontWeight: 600 }} />
                          </Bar>
                          <Line type="monotone" dataKey="value" stroke="#3741d9" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={5} className="mb-4">
                  <Card className="h-100 shadow-sm border-0">
                    <Card.Header 
                      className="d-flex justify-content-between align-items-center"
                      style={{
                        background: 'linear-gradient(90deg, #d1fae5 0%, #dbeafe 100%)',
                        borderBottom: 'none'
                      }}
                    >
                      <h5 className="mb-0">Users by Role</h5>
                      <div className="text-muted small">Pie chart</div>
                    </Card.Header>
                    <Card.Body style={{ height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 48, right: 16, bottom: 24, left: 16 }}>
                          <Pie 
                            data={rolePieData} 
                            dataKey="value" 
                            nameKey="name" 
                            innerRadius={60} 
                            outerRadius={92} 
                            paddingAngle={2}
                            startAngle={100}
                            endAngle={460}
                            cx="50%"
                            cy="58%"
                            labelLine
                            isAnimationActive={false}
                            label={renderRolePieLabel}
                          >
                            {rolePieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val, name) => [val, name]} />
                          <Legend verticalAlign="bottom" height={24} align="center" wrapperStyle={{ paddingTop: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Legend moved into Recharts Legend for consistency */}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row>
                <Col md={12} className="mb-2">
                  <Card>
                    <Card.Body className="d-flex flex-wrap gap-2">
                      <Button variant="primary" onClick={() => setActiveTab('users')}>
                        <i className="bi bi-people me-2"></i>Manage Users
                      </Button>
                      <Button variant="outline-success" onClick={() => { setActiveTab('users'); setFilters((f) => ({ ...f, status: 'active' })); }}>
                        <i className="bi bi-lightning me-2"></i>View Active
                      </Button>
                      <Button variant="outline-warning" onClick={() => { setActiveTab('users'); setFilters((f) => ({ ...f, role: 'influencer' })); }}>
                        <i className="bi bi-megaphone me-2"></i>Influencers
                      </Button>
                      <Button variant="outline-info" onClick={() => { setActiveTab('users'); setFilters((f) => ({ ...f, role: 'ugc_creator' })); }}>
                        <i className="bi bi-collection-play me-2"></i>UGC Creators
                      </Button>
                      <Button variant="outline-secondary" onClick={() => { setActiveTab('users'); clearFilters(); }}>
                        <i className="bi bi-funnel me-2"></i>Clear Filters
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <>
              {/* Filters */}
              <Card className="mb-4">
                <Card.Body>
                  <Row>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Filter by Role</Form.Label>
                        <Form.Select
                          value={filters.role}
                          onChange={(e) => handleFilterChange('role', e.target.value)}
                        >
                          <option value="">All Roles</option>
                          <option value="influencer">Influencer</option>
                          <option value="ugc_creator">UGC Creator</option>
                          <option value="brand">Brand</option>
                          <option value="seeder">Seeder</option>
                          <option value="admin">Admin</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Filter by Status</Form.Label>
                        <Form.Select
                          value={filters.status}
                          onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                          <option value="">All Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Search Users</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type="text"
                            placeholder="Search by name, email, or ID..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    <Col md={2} className="d-flex align-items-end">
                      <div className="d-flex gap-2">
                        <Button variant="outline-secondary" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                          <i className="bi bi-plus-circle me-2"></i>
                          Create User
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Users Table */}
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Users ({pagination.totalUsers || 0})</h5>
                  {selectedUserIds.length > 1 && (
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small">Selected: {selectedUserIds.length}</span>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => setShowBulkDeleteModal(true)}
                      >
                        Delete Selected
                      </Button>
                    </div>
                  )}
                </Card.Header>
                <Card.Body className="p-0">
                  {isLoading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted mb-0">No users found</p>
                    </div>
                  ) : (
                    <Table responsive hover className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: 42 }}>
                            <Form.Check
                              type="checkbox"
                              checked={users.length > 0 && selectedUserIds.length === users.length}
                              onChange={toggleSelectAllVisible}
                            />
                          </th>
                          <th>User</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Sponsored</th>
                          <th>Joined</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.uid}>
                            <td>
                              <Form.Check
                                type="checkbox"
                                checked={isSelected(user.uid)}
                                onChange={() => toggleSelectUser(user.uid)}
                              />
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e9ecef', flex: '0 0 36px', position: 'relative', overflow: 'hidden' }}>
                                  <img
                                    src={`https://i.pravatar.cc/80?u=${user.uid}`}
                                    alt="avatar"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                </div>
                                <div>
                                  <div className="fw-bold">{user.fullName || 'N/A'}</div>
                                  <small className="text-muted">{user.email}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <Badge bg={getRoleBadgeVariant(user.role)}>
                                {user.role?.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={user.isActive ? 'success' : 'secondary'}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td>
                              {['influencer', 'ugc_creator'].includes(user.role) && (
                                <Badge bg={user.isSponsored ? 'warning' : 'light'} text="dark">
                                  {user.isSponsored ? 'Sponsored' : 'Regular'}
                                </Badge>
                              )}
                            </td>
                            <td>
                              <small>{formatDate(user.createdAt)}</small>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => viewUserDetails(user.uid)}
                                >
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-info"
                                  onClick={() => handleEditUser(user)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={() => handleChangePassword(user)}
                                >
                                  Password
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-info"
                                  onClick={() => handlePayUser(user)}
                                >
                                  Pay
                                </Button>
                                <Button
                                  size="sm"
                                  variant={user.isActive ? 'outline-warning' : 'outline-success'}
                                  onClick={() => handleUserAction(user.uid, 'status', !user.isActive)}
                                >
                                  {user.isActive ? 'Suspend' : 'Activate'}
                                </Button>
                                {['influencer', 'ugc_creator'].includes(user.role) && (
                                  <Button
                                    size="sm"
                                    variant={user.isSponsored ? 'outline-secondary' : 'outline-warning'}
                                    onClick={() => handleUserAction(user.uid, 'sponsor', !user.isSponsored)}
                                  >
                                    {user.isSponsored ? 'Unsponsor' : 'Sponsor'}
                                  </Button>
                                )}
                                {['influencer', 'ugc_creator'].includes(user.role) && (
                                  <Button
                                    size="sm"
                                    variant="outline-success"
                                    onClick={() => openPricingModal(user)}
                                  >
                                    Pricing
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => handleDeleteUser(user)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>

              {/* Pagination */}
              <div className="mt-4">
                {renderPagination()}
              </div>
            </>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <>
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Campaigns ({campaigns.length})</h5>
                  <div>
                    <Button size="sm" variant="primary" onClick={() => setShowCreateCampaignModal(true)}>
                      <i className="bi bi-plus-circle me-2"></i>
                      Create Campaign
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  {isCampaignsLoading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : campaigns.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted mb-0">No campaigns found</p>
                    </div>
                  ) : (
                    <Table responsive hover className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Start</th>
                          <th>End</th>
                          <th>Created By</th>
                      <th>Participants</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c.id}>
                            <td>
                              <Button variant="link" size="sm" className="p-0" onClick={() => viewUserDetails(c.createdBy)}>
                                {c.id}
                              </Button>
                            </td>
                            <td>{c.name}</td>
                            <td>{c.startDate ? formatDate(c.startDate) : '-'}</td>
                            <td>{c.endDate ? formatDate(c.endDate) : '-'}</td>
                            <td>{c.createdByEmail || c.createdByName || c.createdBy}</td>
                        <td>{getParticipantCount(c.participants)}</td>
                        <td>{c.createdAt ? formatDate(c.createdAt) : '-'}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                setSelectedCampaign(c);
                                setShowViewCampaignModal(true);
                              }}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => {
                                setEditCampaignForm({ id: c.id, name: c.name || '', startDate: c.startDate || '', endDate: c.endDate || '', description: c.description || '' });
                                setShowEditCampaignModal(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => { setCampaignToDelete(c); setShowDeleteCampaignModal(true); }}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
                </Card.Body>
              </Card>
            </>
          )}
        </Col>
      </Row>

      {/* User Details Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
            <div className="text-center mb-3">
              <div className="mx-auto" style={{ width: 96, height: 96 }}>
                <div className="rounded-circle overflow-hidden" style={{ width: 96, height: 96, background: '#e9ecef' }}>
                  <img
                    src={`https://i.pravatar.cc/120?u=${selectedUser.uid}`}
                    alt="avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              </div>
            </div>
            <Row>
              <Col md={6}>
                <h6>Basic Information</h6>
                <p><strong>Name:</strong> {selectedUser.fullName || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
                <p><strong>Status:</strong> {selectedUser.isActive ? 'Active' : 'Inactive'}</p>
                <p><strong>Joined:</strong> {formatDate(selectedUser.createdAt)}</p>
              </Col>
              <Col md={6}>
                <h6>Profile Information</h6>
                {selectedUser.profileData ? (
                  <>
                    <p><strong>Bio:</strong> {selectedUser.profileData.bio || 'N/A'}</p>
                    <p><strong>Location:</strong> {selectedUser.profileData.location || 'N/A'}</p>
                    {selectedUser.profileData.categories && (
                      <p><strong>Categories:</strong> {Array.isArray(selectedUser.profileData.categories) ? selectedUser.profileData.categories.join(', ') : selectedUser.profileData.categories}</p>
                    )}
                    {/* Role specific fields */}
                    {['ugc_creator','seeder'].includes(selectedUser.role) && selectedUser.profileData.content_types && (
                      <p><strong>Content Types:</strong> {Array.isArray(selectedUser.profileData.content_types) ? selectedUser.profileData.content_types.join(', ') : selectedUser.profileData.content_types}</p>
                    )}
                    {selectedUser.role === 'influencer' && (
                      <>
                        <p><strong>Username:</strong> {selectedUser.profileData.username || 'N/A'}</p>
                        <p><strong>Engagement Rate:</strong> {selectedUser.profileData.engagement_rate ? `${selectedUser.profileData.engagement_rate}%` : 'N/A'}</p>
                        <p><strong>Verified:</strong> {selectedUser.profileData.is_verified ? 'Yes' : 'No'}</p>
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-muted">No profile data available</p>
                )}
              </Col>
              {selectedUser.role === 'influencer' && (
              <Col md={12} className="mt-3">
                <div className="d-flex justify-content-around text-center">
                  <div>
                    <div className="fw-bold text-primary">{selectedUser.profileData?.followers || 0}</div>
                    <small className="text-muted">Followers</small>
                  </div>
                  <div>
                    <div className="fw-bold text-primary">{selectedUser.profileData?.posts_count || 0}</div>
                    <small className="text-muted">Posts</small>
                  </div>
                  <div>
                    <div className="fw-bold text-primary">{selectedUser.profileData?.following || 0}</div>
                    <small className="text-muted">Following</small>
                  </div>
                </div>
              </Col>
              )}
            </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Campaign Modal */}
      <Modal show={showViewCampaignModal} onHide={() => setShowViewCampaignModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Campaign Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCampaign && (
            <div className="campaign-details">
              <Row className="mb-4">
                <Col md={12}>
                  <h4>{selectedCampaign.name}</h4>
                  <p className="text-muted">{selectedCampaign.description || 'No description provided'}</p>
                </Col>
              </Row>
              
              <Row className="mb-4">
                <Col md={6}>
                  <Card>
                    <Card.Header>Campaign Info</Card.Header>
                    <Card.Body>
                      <p><strong>Start Date:</strong> {new Date(selectedCampaign.startDate).toLocaleDateString()}</p>
                      <p><strong>End Date:</strong> {new Date(selectedCampaign.endDate).toLocaleDateString()}</p>
                      <p><strong>Budget:</strong> {selectedCampaign.estimatedBudget ? `$${selectedCampaign.estimatedBudget}` : 'N/A'}</p>
                      <p><strong>Created By:</strong> {selectedCampaign.createdByName || selectedCampaign.createdByEmail || selectedCampaign.createdBy}</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card>
                    <Card.Header>Deliverables</Card.Header>
                    <Card.Body>
                      {(() => {
                        const m = selectedCampaign.metadata || {};
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
                                const creator = campaignParticipants.find(p => p.uid === uid);
                                const name = creator ? (creator.displayName || creator.fullName || creator.email) : 'Unknown Creator';
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
                        if (typeof selectedCampaign.deliverables === 'string') {
                          list = selectedCampaign.deliverables.split(',').map(s => s.trim()).filter(Boolean);
                        } else if (typeof selectedCampaign.deliverables === 'object' && selectedCampaign.deliverables !== null) {
                          list = Object.entries(selectedCampaign.deliverables)
                            .filter(([_, enabled]) => enabled)
                            .map(([key]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
                        }

                        if (list.length > 0) {
                          return (
                            <ul className="list-unstyled mb-0">
                              {list.map((item, idx) => (
                                <li key={idx} className="mb-1">
                                  <Badge bg="info" className="text-dark">
                                    {item}
                                  </Badge>
                                </li>
                              ))}
                            </ul>
                          );
                        } else {
                          return <p className="text-muted">No deliverables specified</p>;
                        }
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
                        const m = selectedCampaign.metadata || {};
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
                        const m = selectedCampaign.metadata || {};
                        const socials = Array.isArray(m.socials) ? m.socials : [];
                        const dist = m.platformDistribution || {};
                        const hasData = socials.length > 0 || Object.keys(dist).length > 0;
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
                        const m = selectedCampaign.metadata || {};
                        const note = m.notes || (m.audience && m.audience.notes);
                        return note ? <p className="mb-0">{note}</p> : <p className="text-muted mb-0">No notes provided</p>;
                      })()}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <h5 className="mb-3">Participants ({campaignParticipants.length})</h5>
              {isCampaignParticipantsLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Loading participants...</p>
                </div>
              ) : campaignParticipants.length > 0 ? (
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
                      {campaignParticipants.map(p => (
                        <tr key={p.uid}>
                          <td>
                            <div className="d-flex align-items-center">
                              {p.profileData?.avatar_url && (
                                <img 
                                  src={p.profileData.avatar_url} 
                                  alt="" 
                                  className="rounded-circle me-2"
                                  style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                                />
                              )}
                              <div>
                                <div className="fw-bold">{p.fullName || p.email}</div>
                                <small className="text-muted">{p.email}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge bg={p.role === 'influencer' ? 'info' : 'warning'} text="dark">
                              {p.role === 'influencer' ? 'Influencer' : 'UGC Creator'}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={p.isActive ? 'success' : 'secondary'}>
                              {p.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td>
                             <Button 
                               size="sm" 
                               variant="outline-primary"
                               onClick={() => {
                                 setShowViewCampaignModal(false);
                                 viewUserDetails(p.uid);
                               }}
                             >
                               View Profile
                             </Button>
                          </td>
                        </tr>
                      ))}
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
          <Button variant="secondary" onClick={() => setShowViewCampaignModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showPricingModal} onHide={() => setShowPricingModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Set Pricing</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pricingError && (
            <Alert variant="danger" className="mb-2">{pricingError}</Alert>
          )}
          {pricingSuccess && (
            <Alert variant="success" className="mb-2">{pricingSuccess}</Alert>
          )}
          {pricingUser && (
            <Form>
              {pricingUser.role === 'ugc_creator' ? (
                <>
                  <Form.Group className="mb-2">
                    <Form.Label>Reel post</Form.Label>
                    <Form.Control type="number" value={pricingForm.reelPostPrice ?? ''} onChange={(e) => setPricingField('reelPostPrice', e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Static post</Form.Label>
                    <Form.Control type="number" value={pricingForm.staticPostPrice ?? ''} onChange={(e) => setPricingField('staticPostPrice', e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Reel + Static post</Form.Label>
                    <Form.Control type="number" value={pricingForm.reelStaticComboPrice ?? ''} onChange={(e) => setPricingField('reelStaticComboPrice', e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Story video (reel style)</Form.Label>
                    <Form.Control type="number" value={pricingForm.storyVideoPrice ?? ''} onChange={(e) => setPricingField('storyVideoPrice', e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Story shoutout</Form.Label>
                    <Form.Control type="number" value={pricingForm.storyShoutoutPrice ?? ''} onChange={(e) => setPricingField('storyShoutoutPrice', e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Story unboxing</Form.Label>
                    <Form.Control type="number" value={pricingForm.storyUnboxingPrice ?? ''} onChange={(e) => setPricingField('storyUnboxingPrice', e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Event attendance</Form.Label>
                    <Form.Control type="number" value={pricingForm.eventAttendancePrice ?? ''} onChange={(e) => setPricingField('eventAttendancePrice', e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Outdoor shoots</Form.Label>
                    <Form.Control type="number" value={pricingForm.outdoorShootPrice ?? ''} onChange={(e) => setPricingField('outdoorShootPrice', e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Urgent “express delivery” extra charge</Form.Label>
                    <Form.Control type="number" value={pricingForm.expressDeliveryCharge ?? ''} onChange={(e) => setPricingField('expressDeliveryCharge', e.target.value)} />
                  </Form.Group>
                </>
              ) : (
                <>
                  <Form.Group className="mb-2">
                    <Form.Label>Reel post</Form.Label>
                    <Form.Control type="number" value={pricingForm.reelPostPrice ?? ''} onChange={(e) => setPricingField('reelPostPrice', e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Story</Form.Label>
                    <Form.Control type="number" value={pricingForm.storyPrice ?? ''} onChange={(e) => setPricingField('storyPrice', e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Event attendance</Form.Label>
                    <Form.Control type="number" value={pricingForm.eventAttendancePrice ?? ''} onChange={(e) => setPricingField('eventAttendancePrice', e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Multiple Platforms</Form.Label>
                    <Form.Control type="number" value={pricingForm.multiplePlatformsPrice ?? ''} onChange={(e) => setPricingField('multiplePlatformsPrice', e.target.value)} />
                  </Form.Group>
                </>
              )}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPricingModal(false)} disabled={pricingLoading}>Cancel</Button>
          <Button variant="primary" onClick={savePricing} disabled={pricingLoading || !pricingUser}>Save</Button>
        </Modal.Footer>
      </Modal>
      <CreateCampaignWizard
        show={showCreateCampaignModal}
        onHide={() => setShowCreateCampaignModal(false)}
        onSubmit={handleCreateWizardSubmit}
      />

      {/* Prefill Profile Modal */}
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            Prefill Profile {createFormData.role === 'influencer' ? '(Influencer)' : (createFormData.role === 'ugc_creator' || createFormData.role === 'seeder') ? '(UGC Creator)' : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {['influencer', 'ugc_creator', 'seeder'].includes(createFormData.role) ? (
            <>
              {createFormData.role === 'influencer' && (
                <>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Instagram Username</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="@username"
                          value={createFormData.profile.instagramUsername}
                          onChange={(e) => setCreateFormData({
                            ...createFormData,
                            profile: { ...createFormData.profile, instagramUsername: e.target.value }
                          })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                          type="text"
                          value={createFormData.profile.phoneNumber}
                          onChange={(e) => setCreateFormData({
                            ...createFormData,
                            profile: { ...createFormData.profile, phoneNumber: e.target.value }
                          })}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>City</Form.Label>
                        <Form.Control
                          type="text"
                          value={createFormData.profile.city}
                          onChange={(e) => setCreateFormData({
                            ...createFormData,
                            profile: { ...createFormData.profile, city: e.target.value }
                          })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Country</Form.Label>
                        <Form.Control
                          type="text"
                          value={createFormData.profile.country}
                          onChange={(e) => setCreateFormData({
                            ...createFormData,
                            profile: { ...createFormData.profile, country: e.target.value }
                          })}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Gender</Form.Label>
                        <Form.Select
                          value={createFormData.profile.gender}
                          onChange={(e) => setCreateFormData({
                            ...createFormData,
                            profile: { ...createFormData.profile, gender: e.target.value }
                          })}
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Date of Birth</Form.Label>
                        <Form.Control
                          type="date"
                          value={createFormData.profile.dateOfBirth}
                          onChange={(e) => setCreateFormData({
                            ...createFormData,
                            profile: { ...createFormData.profile, dateOfBirth: e.target.value }
                          })}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label>Bio</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={createFormData.profile.bio}
                      onChange={(e) => setCreateFormData({
                        ...createFormData,
                        profile: { ...createFormData.profile, bio: e.target.value }
                      })}
                    />
                  </Form.Group>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Categories</Form.Label>
                        <Form.Select
                          multiple
                          value={createFormData.profile.categories.split(',').map(s => s.trim()).filter(Boolean)}
                          onChange={handleMultiSelect('categories')}
                          size={6}
                        >
                          {categoryOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </Form.Select>
                        <Form.Text>Select multiple. Hold Ctrl/Cmd.</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Content Types</Form.Label>
                        <Form.Select
                          multiple
                          value={createFormData.profile.contentTypes.split(',').map(s => s.trim()).filter(Boolean)}
                          onChange={handleMultiSelect('contentTypes')}
                          size={6}
                        >
                          {contentTypeOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </Form.Select>
                        <Form.Text>Select multiple. Hold Ctrl/Cmd.</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Languages</Form.Label>
                        <Form.Select
                          multiple
                          value={createFormData.profile.languages.split(',').map(s => s.trim()).filter(Boolean)}
                          onChange={handleMultiSelect('languages')}
                          size={6}
                        >
                          {languageOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </Form.Select>
                        <Form.Text>Select multiple. Hold Ctrl/Cmd.</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Price Min</Form.Label>
                        <Form.Control
                          type="number"
                          value={createFormData.profile.priceRangeMin}
                          onChange={(e) => setCreateFormData({
                            ...createFormData,
                            profile: { ...createFormData.profile, priceRangeMin: e.target.value }
                          })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Price Max</Form.Label>
                        <Form.Control
                          type="number"
                          value={createFormData.profile.priceRangeMax}
                          onChange={(e) => setCreateFormData({
                            ...createFormData,
                            profile: { ...createFormData.profile, priceRangeMax: e.target.value }
                          })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Deliverables</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g. Reel post, Story"
                          value={createFormData.profile.deliverables}
                          onChange={(e) => setCreateFormData({
                            ...createFormData,
                            profile: { ...createFormData.profile, deliverables: e.target.value }
                          })}
                        />
                        <Form.Text>Comma-separated</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label>Average Delivery Time</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. 5-7 days"
                      value={createFormData.profile.averageDeliveryTime}
                      onChange={(e) => setCreateFormData({
                        ...createFormData,
                        profile: { ...createFormData.profile, averageDeliveryTime: e.target.value }
                      })}
                    />
                  </Form.Group>
                </>
              )}

              {(createFormData.role === 'ugc_creator' || createFormData.role === 'seeder') && (
                <>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                          type="text"
                          value={createFormData.profile.phoneNumber}
                          onChange={(e) => setCreateFormData({
                            ...createFormData,
                            profile: { ...createFormData.profile, phoneNumber: e.target.value }
                          })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Gender</Form.Label>
                        <Form.Select
                          value={createFormData.profile.gender}
                          onChange={(e) => setCreateFormData({
                            ...createFormData,
                            profile: { ...createFormData.profile, gender: e.target.value }
                          })}
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>City</Form.Label>
                        <Form.Control
                          type="text"
                          value={createFormData.profile.city}
                          onChange={(e) => setCreateFormData({
                            ...createFormData,
                            profile: { ...createFormData.profile, city: e.target.value }
                          })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Country</Form.Label>
                        <Form.Control
                          type="text"
                          value={createFormData.profile.country}
                          onChange={(e) => setCreateFormData({
                            ...createFormData,
                            profile: { ...createFormData.profile, country: e.target.value }
                          })}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Date of Birth</Form.Label>
                        <Form.Control
                          type="date"
                          value={createFormData.profile.dateOfBirth}
                          onChange={(e) => setCreateFormData({
                            ...createFormData,
                            profile: { ...createFormData.profile, dateOfBirth: e.target.value }
                          })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Marital Status</Form.Label>
                        <Form.Select
                          value={createFormData.profile.maritalStatus}
                          onChange={(e) => setCreateFormData({
                            ...createFormData,
                            profile: { ...createFormData.profile, maritalStatus: e.target.value }
                          })}
                        >
                          <option value="">Select</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Children</Form.Label>
                        <Form.Select
                          value={createFormData.profile.children}
                          onChange={(e) => setCreateFormData({
                            ...createFormData,
                            profile: { ...createFormData.profile, children: e.target.value }
                          })}
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Face or Faceless</Form.Label>
                        <Form.Select
                          value={createFormData.profile.faceOrFaceless}
                          onChange={(e) => setCreateFormData({
                            ...createFormData,
                            profile: { ...createFormData.profile, faceOrFaceless: e.target.value }
                          })}
                        >
                          <option value="">Select</option>
                          <option value="Face">Face</option>
                          <option value="Faceless">Faceless</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label>Bio</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={createFormData.profile.bio}
                      onChange={(e) => setCreateFormData({
                        ...createFormData,
                        profile: { ...createFormData.profile, bio: e.target.value }
                      })}
                    />
                  </Form.Group>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Niche</Form.Label>
                        <Form.Select
                          multiple
                          value={createFormData.profile.niche.split(',').map(s => s.trim()).filter(Boolean)}
                          onChange={handleMultiSelect('niche')}
                          size={6}
                        >
                          {nicheOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </Form.Select>
                        <Form.Text>Select multiple. Hold Ctrl/Cmd.</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Content Style</Form.Label>
                        <Form.Select
                          multiple
                          value={createFormData.profile.contentStyle.split(',').map(s => s.trim()).filter(Boolean)}
                          onChange={handleMultiSelect('contentStyle')}
                          size={6}
                        >
                          {contentStyleOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </Form.Select>
                        <Form.Text>Select multiple. Hold Ctrl/Cmd.</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Languages</Form.Label>
                        <Form.Select
                          multiple
                          value={createFormData.profile.languages.split(',').map(s => s.trim()).filter(Boolean)}
                          onChange={handleMultiSelect('languages')}
                          size={6}
                        >
                          {languageOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </Form.Select>
                        <Form.Text>Select multiple. Hold Ctrl/Cmd.</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label>Sample Content Links</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="https://..., https://..."
                      value={createFormData.profile.sampleContentLinks}
                      onChange={(e) => setCreateFormData({
                        ...createFormData,
                        profile: { ...createFormData.profile, sampleContentLinks: e.target.value }
                      })}
                    />
                    <Form.Text>Comma-separated URLs</Form.Text>
                  </Form.Group>
                </>
              )}
            </>
          ) : (
            <Alert variant="info">Select role "Influencer" or "UGC Creator" first.</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProfileModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setShowProfileModal(false)}>
            Save Prefill
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={editFormData.fullName}
                      onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Role</Form.Label>
                    <Form.Select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                    >
                      <option value="influencer">Influencer</option>
                      <option value="ugc_creator">UGC Creator</option>
                      <option value="brand">Brand</option>
                      <option value="admin">Admin</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Active User"
                      checked={editFormData.isActive}
                      onChange={(e) => setEditFormData({...editFormData, isActive: e.target.checked})}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitEditUser}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <Form>
              <p><strong>User:</strong> {selectedUser.fullName} ({selectedUser.email})</p>
              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitChangePassword}>
            Change Password
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete User Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div>
              <Alert variant="danger">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Warning:</strong> This action cannot be undone!
              </Alert>
              <p>Are you sure you want to delete the following user?</p>
              <div className="bg-light p-3 rounded">
                <p><strong>Name:</strong> {selectedUser.fullName}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={submitDeleteUser}>
            Delete User
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showBulkDeleteModal} onHide={() => setShowBulkDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Selected Users</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            This will delete {selectedUserIds.length} selected user(s). This action cannot be undone.
          </Alert>
          <p>Admins are never deleted. Proceed?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={submitBulkDelete} disabled={selectedUserIds.length === 0}>Delete Selected</Button>
        </Modal.Footer>
      </Modal>

      {/* Create User Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Optional"
                    value={createFormData.fullName}
                    onChange={(e) => setCreateFormData({ ...createFormData, fullName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="user@example.com"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="At least 6 characters"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    value={createFormData.role}
                    onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                  >
                    <option value="influencer">Influencer</option>
                    <option value="ugc_creator">UGC Creator</option>
                    <option value="brand">Brand</option>
                    <option value="seeder">Seeder</option>
                  </Form.Select>
                </Form.Group>
                {['influencer', 'ugc_creator', 'seeder'].includes(createFormData.role) && (
                  <div className="mt-1">
                    <Button variant="outline-primary" size="sm" onClick={() => setShowProfileModal(true)}>
                      Prefill Profile
                    </Button>
                    <span className="text-muted small ms-2">Optional; opens detailed fields</span>
                  </div>
                )}
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitCreateUser}>
            Create User
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showEditCampaignModal} onHide={() => setShowEditCampaignModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Campaign</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control value={editCampaignForm.name} onChange={(e) => setEditCampaignForm((f) => ({ ...f, name: e.target.value }))} />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control type="date" value={editCampaignForm.startDate ? String(editCampaignForm.startDate).slice(0,10) : ''} onChange={(e) => setEditCampaignForm((f) => ({ ...f, startDate: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control type="date" value={editCampaignForm.endDate ? String(editCampaignForm.endDate).slice(0,10) : ''} onChange={(e) => setEditCampaignForm((f) => ({ ...f, endDate: e.target.value }))} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-2">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} value={editCampaignForm.description} onChange={(e) => setEditCampaignForm((f) => ({ ...f, description: e.target.value }))} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditCampaignModal(false)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={async () => {
              setError('');
              setSuccess('');
              const { id, name, startDate, endDate, description } = editCampaignForm;
              if (!name.trim()) { setError('Please enter a name'); return; }
              if (!startDate || !endDate) { setError('Please set dates'); return; }
              if (new Date(startDate) > new Date(endDate)) { setError('Start must be before end'); return; }
              try {
                const res = await api.put(`/admin/campaigns/${id}`, { name, startDate, endDate, description });
                if (res.data?.success) {
                  setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, name, startDate, endDate, description } : c));
                  setSuccess('Campaign updated');
                  setShowEditCampaignModal(false);
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
      <Modal show={showDeleteCampaignModal} onHide={() => setShowDeleteCampaignModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Campaign</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">Are you sure you want to delete campaign {campaignToDelete?.id}?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteCampaignModal(false)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={async () => {
              setError('');
              setSuccess('');
              try {
                const res = await api.delete(`/admin/campaigns/${campaignToDelete?.id}`);
                if (res.data?.success) {
                  setCampaigns((prev) => prev.filter((c) => c.id !== campaignToDelete?.id));
                  setSuccess('Campaign deleted');
                  setShowDeleteCampaignModal(false);
                } else {
                  setError(res.data?.message || 'Failed to delete campaign');
                }
              } catch (e) {
                setError(e.response?.data?.message || e.message || 'Failed to delete campaign');
              }
            }}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Pay Modal */}
      <Modal show={showPayModal} onHide={() => setShowPayModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Pay User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div className="mb-3">
              <strong>Pay to:</strong> {selectedUser.fullName || selectedUser.email}
            </div>
          )}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter amount"
                value={payFormData.amount}
                onChange={(e) => setPayFormData({ ...payFormData, amount: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Credit Card Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="XXXX XXXX XXXX XXXX"
                value={payFormData.cardNumber}
                onChange={(e) => setPayFormData({ ...payFormData, cardNumber: e.target.value })}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expiration Date</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="MM/YY"
                    value={payFormData.expiryDate}
                    onChange={(e) => setPayFormData({ ...payFormData, expiryDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>CVV</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="123"
                    value={payFormData.cvv}
                    onChange={(e) => setPayFormData({ ...payFormData, cvv: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPayModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={() => setShowPayModal(false)}>
            Charge Card
          </Button>
        </Modal.Footer>
      </Modal>
      
      </Container>
    );
  };

  export default AdminDashboard;
