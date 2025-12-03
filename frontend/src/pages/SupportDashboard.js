import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Spinner, Alert, Form, InputGroup, Pagination, Modal } from 'react-bootstrap';
import api from '../services/api';

const SupportDashboard = () => {
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  
  // Removed unused auth import and value to satisfy no-unused-vars without changing behavior

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to fetch statistics');
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...filters
      });

      const response = await api.get(`/admin/users?${params}`);
      
      setUsers(response.data.users || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [fetchStats, fetchUsers]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleViewUser = (userData) => {
    setSelectedUser(userData);
    setShowUserModal(true);
  };

  const handlePasswordChange = (userData) => {
    setSelectedUser(userData);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  const submitPasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      await api.put(
        `/admin/users/${selectedUser.uid}/password`,
        { newPassword: passwordData.newPassword }
      );
      
      setSuccess('Password updated successfully');
      setShowPasswordModal(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error updating password:', error);
      setError(error.response?.data?.message || 'Failed to update password');
    }
  };

  const handleSuspendToggle = async (user) => {
    try {
      const newStatus = !user.isActive;
      await api.put(`/admin/users/${user.uid}/status`, { isActive: newStatus });
      setSuccess(`User ${newStatus ? 'activated' : 'suspended'} successfully`);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Error updating user status:', error);
      setError(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleSponsoredToggle = async (user) => {
    try {
      const newSponsoredStatus = !user.isSponsored;
      await api.put(`/admin/users/${user.uid}/sponsor`, { isSponsored: newSponsoredStatus });
      setSuccess(`User ${newSponsoredStatus ? 'added to' : 'removed from'} sponsored list successfully`);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Error updating sponsor status:', error);
      setError(error.response?.data?.message || 'Failed to update sponsor status');
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'support': return 'warning';
      case 'brand': return 'primary';
      case 'influencer': return 'success';
      case 'ugc_creator': return 'info';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
          <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
          {items}
          <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === pagination.totalPages} />
          <Pagination.Last onClick={() => setCurrentPage(pagination.totalPages)} disabled={currentPage === pagination.totalPages} />
        </Pagination>
      </div>
    );
  };

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
              <h1 className="h3 mb-1">Support Dashboard</h1>
              <p className="text-muted mb-0">User support and assistance</p>
            </div>
            <Badge bg="warning" className="px-3 py-2">
              <i className="bi bi-headset me-1"></i>
              Support
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

          {/* Overview Cards */}
          <Row className="mb-4">
            <Col md={3} className="mb-3">
              <Card className="text-center h-100">
                <Card.Body>
                  <h2 className="text-primary mb-2">{stats.totalUsers || 0}</h2>
                  <p className="mb-0">Total Users</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center h-100">
                <Card.Body>
                  <h2 className="text-success mb-2">{stats.activeUsers || 0}</h2>
                  <p className="mb-0">Active Users</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center h-100">
                <Card.Body>
                  <h2 className="text-info mb-2">{stats.sponsoredUsers || 0}</h2>
                  <p className="mb-0">Sponsored Users</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center h-100">
                <Card.Body>
                  <h2 className="text-warning mb-2">{stats.recentSignups || 0}</h2>
                  <p className="mb-0">Recent Signups (30d)</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* User Management */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">User Management</h5>
            </Card.Header>
            <Card.Body>
              {/* Filters */}
              <Row className="mb-3">
                <Col md={3}>
                  <Form.Select
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="influencer">Influencer</option>
                    <option value="ugc_creator">UGC Creator</option>
                    <option value="brand">Brand</option>
                    <option value="admin">Admin</option>
                    <option value="support">Support</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Col>
                <Col md={6}>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Search by name or email..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                    <Button variant="outline-secondary">
                      <i className="bi bi-search"></i>
                    </Button>
                  </InputGroup>
                </Col>
              </Row>

              {/* Users Table */}
              {isLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status" variant="primary" />
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
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
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => handleViewUser(user)}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-warning"
                              onClick={() => handlePasswordChange(user)}
                            >
                              Reset Password
                            </Button>
                            <Button
                              size="sm"
                              variant={user.isActive ? "outline-danger" : "outline-success"}
                              onClick={() => handleSuspendToggle(user)}
                            >
                              {user.isActive ? 'Suspend' : 'Activate'}
                            </Button>
                            {['influencer', 'ugc_creator'].includes(user.role) && (
                              <Button
                                size="sm"
                                variant={user.isSponsored ? "outline-secondary" : "outline-info"}
                                onClick={() => handleSponsoredToggle(user)}
                              >
                                {user.isSponsored ? 'Remove Sponsor' : 'Add Sponsor'}
                              </Button>
                            )}
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

      {/* Password Change Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <p>Reset password for: <strong>{selectedUser.email}</strong></p>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitPasswordChange}>
            Update Password
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SupportDashboard;
