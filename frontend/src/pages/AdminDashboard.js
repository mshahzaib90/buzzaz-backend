import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Spinner, Alert, Form, InputGroup, Pagination, Modal, ProgressBar } from 'react-bootstrap';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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
  const [editFormData, setEditFormData] = useState({});
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  
  // Removed unused auth user to satisfy no-unused-vars without changing behavior
  // const { user } = useAuth();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [currentPage, filters]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load statistics');
    }
  };

  const fetchUsers = async () => {
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
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ role: '', status: '', search: '' });
    setCurrentPage(1);
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
      setError('Failed to load user details');
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
      case 'influencer': return 'success';
      case 'ugc_creator': return 'info';
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
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <Row>
                <Col md={3} className="mb-4">
                  <Card className="h-100 shadow-sm text-white" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="text-uppercase small opacity-75">Total Users</div>
                          <div className="display-6 fw-bold">{totalUsers}</div>
                        </div>
                        <i className="bi bi-people-fill fs-3 opacity-75"></i>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-4">
                  <Card className="h-100 shadow-sm text-white" style={{ background: 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)' }}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="text-uppercase small opacity-75">Active Users</div>
                          <div className="display-6 fw-bold">{activeUsers}</div>
                        </div>
                        <i className="bi bi-lightning-charge-fill fs-3 opacity-75"></i>
                      </div>
                      <div className="mt-3">
                        <ProgressBar now={activeRatePct} label={`${activeRatePct}%`} variant="light" style={{ height: 8 }} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-4">
                  <Card className="h-100 shadow-sm text-white" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)' }}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="text-uppercase small opacity-75">Sponsored</div>
                          <div className="display-6 fw-bold">{sponsoredUsers}</div>
                        </div>
                        <i className="bi bi-star-fill fs-3 opacity-75"></i>
                      </div>
                      <div className="mt-3">
                        <ProgressBar now={sponsoredRatePct} label={`${sponsoredRatePct}%`} variant="light" style={{ height: 8 }} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-4">
                  <Card className="h-100 shadow-sm text-white" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' }}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="text-uppercase small opacity-75">Signups (30d)</div>
                          <div className="display-6 fw-bold">{recentSignups}</div>
                        </div>
                        <i className="bi bi-graph-up-arrow fs-3 opacity-75"></i>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row>
                <Col md={7} className="mb-4">
                  <Card className="h-100">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Platform KPIs</h5>
                      <div className="text-muted small">Bar chart</div>
                    </Card.Header>
                    <Card.Body style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={kpiBarData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#6366f1" />
                          <Line type="monotone" dataKey="value" stroke="#3741d9" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={5} className="mb-4">
                  <Card className="h-100">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Users by Role</h5>
                      <div className="text-muted small">Pie chart</div>
                    </Card.Header>
                    <Card.Body style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={rolePieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                            {rolePieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="d-flex flex-wrap justify-content-center mt-2" style={{ gap: 10 }}>
                        {rolePieData.map((r) => (
                          <span
                            key={r.name}
                            className="d-inline-flex align-items-center border rounded"
                            style={{ padding: '4px 8px', gap: 8, lineHeight: 1.2, whiteSpace: 'nowrap', marginTop: 15, marginBottom: 40 }}
                          >
                            <span
                              style={{ width: 12, height: 12, background: r.color, display: 'inline-block', borderRadius: 2, flex: '0 0 12px' }}
                            ></span>
                            <span className="small">{r.name}: <strong>{r.value}</strong></span>
                          </span>
                        ))}
                      </div>
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
                      <Button variant="outline-secondary" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Users Table */}
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Users ({pagination.totalUsers || 0})</h5>
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
                              <div>
                                <div className="fw-bold">{user.fullName || 'N/A'}</div>
                                <small className="text-muted">{user.email}</small>
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
        </Col>
      </Row>

      {/* User Details Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
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
                      <p><strong>Categories:</strong> {selectedUser.profileData.categories.join(', ')}</p>
                    )}
                  </>
                ) : (
                  <p className="text-muted">No profile data available</p>
                )}
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Close
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
    </Container>
  );
};

export default AdminDashboard;