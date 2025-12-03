import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Badge, Button, Form, Alert, Modal, InputGroup } from 'react-bootstrap';
import { chatAPIService } from '../../api/chatAPI';
import api from '../../services/api';

const ChatList = ({ currentUser, onSelectConversation, selectedConversationId }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  // New states for left-panel UX
  const [chatSearch, setChatSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchConversations();
    // Refresh conversations every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const data = await chatAPIService.getConversations();

      setConversations(data.conversations);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      let endpoint = '';
      
      // Determine which users to fetch based on current user role
      if (currentUser.role === 'brand') {
        endpoint = '/influencers/all'; // Get influencers and UGC creators
      } else if (['influencer', 'ugc_creator'].includes(currentUser.role)) {
        endpoint = '/user/brands'; // Get brands
      }

      if (endpoint) {
        const response = await api.get(endpoint);

        // Filter out users we already have conversations with
        const existingParticipants = conversations.flatMap(conv => conv.participants);
        const filteredUsers = response.data.users?.filter(user => 
          user.id !== currentUser.uid && !existingParticipants.includes(user.id)
        ) || [];

        setAvailableUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
      setError('Failed to load available users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const startNewConversation = async (participantId) => {
    try {
      const data = await chatAPIService.createConversation(participantId);

      // Add new conversation to list or update existing
      const newConversation = data.conversation;
      setConversations(prev => {
        const existing = prev.find(conv => conv.id === newConversation.id);
        if (existing) {
          return prev;
        }
        return [newConversation, ...prev];
      });

      // Select the new conversation
      onSelectConversation(data.conversationId);
      setShowNewChatModal(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError('Failed to start conversation');
    }
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherParticipant = (conversation) => {
    // Add safety checks for undefined values
    if (!conversation || !conversation.participants || !currentUser) {
      return null;
    }
    
    const otherParticipantId = conversation.participants.find(id => id !== currentUser.uid);
    
    // Check if participantDetails exists and has the other participant
    if (!conversation.participantDetails || !otherParticipantId) {
      return null;
    }
    
    return conversation.participantDetails[otherParticipantId];
  };

  const filteredUsers = availableUsers.filter(user =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="h-100">
        <Card.Body className="d-flex align-items-center justify-content-center">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading conversations...</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-100">
        <Card.Header className="messages-left-header">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-chat-dots me-2"></i>
              <h6 className="mb-0">Messages</h6>
            </div>
            <div className="d-flex align-items-center gap-2">
              {/* Optional filter dropdown */}
              <Form.Select
                size="sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-auto"
              >
                <option value="all">All</option>
                <option value="brand">Brands</option>
                <option value="influencer">Influencers</option>
              </Form.Select>
              {/* New Chat chip (not a button) */}
              <div
                className="new-chat-chip"
                role="button"
                tabIndex={0}
                onClick={() => {
                  setShowNewChatModal(true);
                  fetchAvailableUsers();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setShowNewChatModal(true);
                    fetchAvailableUsers();
                  }
                }}
                aria-label="Start a new chat"
                title="Start a new chat"
              >
                <i className="bi bi-plus"></i>
              </div>
            </div>
          </div>

          {/* Search bar in header */}
          <InputGroup className="header-search">
            <InputGroup.Text className="bg-transparent border-0">
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Start a conversation"
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              className="header-search-control"
            />
          </InputGroup>
        </Card.Header>

        <Card.Body className="p-0">
          {error && (
            <Alert variant="danger" className="m-3 mb-0">
              {error}
            </Alert>
          )}

          {/* Removed old search bar block from body */}

          {conversations.length === 0 ? (
            <div className="text-center p-4 text-muted">
              <i className="bi bi-chat-dots display-1 mb-3 text-muted"></i>
              <p>No conversations yet</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowNewChatModal(true);
                  fetchAvailableUsers();
                }}
              >
                Start a conversation
              </Button>
            </div>
          ) : (
            <div className="chat-list-scroll subtle-scrollbar">
              <ListGroup variant="flush">
                {conversations
                  .filter((conversation) => {
                    const other = getOtherParticipant(conversation);
                    const name = (other?.name || '').toLowerCase();
                    const lastMsg = (conversation.lastMessage || '').toLowerCase();
                    const matchesSearch = !chatSearch || name.includes(chatSearch.toLowerCase()) || lastMsg.includes(chatSearch.toLowerCase());
                    const matchesRole = roleFilter === 'all' || (other?.role === roleFilter);
                    return matchesSearch && matchesRole;
                  })
                  .map((conversation) => {
                    const otherParticipant = getOtherParticipant(conversation);
                    const isSelected = selectedConversationId === conversation.id;

                    return (
                      <ListGroup.Item
                        key={conversation.id}
                        action
                        active={isSelected}
                        onClick={() => onSelectConversation(conversation.id)}
                        className={`border-0 border-bottom chat-list-item ${isSelected ? 'chat-item-active' : ''}`}
                      >
                        <div className="d-flex align-items-start gap-3">
                          {/* Avatar */}
                          <div className="chat-avatar position-relative">
                            <div className="avatar-fallback">
                              <i className="bi bi-person-fill"></i>
                            </div>
                            {/* online indicator */}
                            <span className="online-indicator" />
                          </div>

                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <h6 className="mb-0 text-truncate">
                                {otherParticipant?.name || 'Unknown User'}
                              </h6>
                              <small className="text-muted">
                                {formatLastMessageTime(conversation.lastMessageTime)}
                              </small>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <p className="mb-0 text-muted small text-truncate">
                                {conversation.lastMessage || 'No messages yet'}
                              </p>
                              {otherParticipant && (
                                <Badge 
                                  bg={otherParticipant.role === 'brand' ? 'light' : 'light'}
                                  text="dark"
                                  className="ms-2 text-capitalize"
                                >
                                  {otherParticipant.role}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
              </ListGroup>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* New Chat Modal */}
      <Modal show={showNewChatModal} onHide={() => setShowNewChatModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Start New Conversation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingUsers ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading available users...</p>
            </div>
          ) : (
            <>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>

              {filteredUsers.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-search display-1 mb-3 text-muted"></i>
                  <p>
                    {availableUsers.length === 0 
                      ? 'No available users to chat with' 
                      : 'No users found matching your search'
                    }
                  </p>
                </div>
              ) : (
                <ListGroup>
                  {filteredUsers.map((user) => (
                    <ListGroup.Item
                      key={user.id}
                      action
                      onClick={() => startNewConversation(user.id)}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <h6 className="mb-0">{user.fullName || user.email}</h6>
                        <small className="text-muted">{user.email}</small>
                      </div>
                      <Badge bg={user.role === 'brand' ? 'success' : 'info'}>
                        {String(user.role || 'user')}
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ChatList;