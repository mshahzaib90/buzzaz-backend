import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, ListGroup, Badge, Alert, Dropdown } from 'react-bootstrap';
import { chatAPIService } from '../../api/chatAPI';
import EmojiPicker from 'emoji-picker-react';

const ChatWindow = ({ conversationId, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState('');
  const [filterWarning, setFilterWarning] = useState('');
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      // Reduce polling frequency to 5 seconds for better performance
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [conversationId]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMessages = async () => {
    try {
      const data = await chatAPIService.getMessages(conversationId);

      // Only update if messages have actually changed to prevent duplicate display
      const newMessages = data.messages;
      setMessages(prevMessages => {
        // Filter out any optimistic messages before comparing
        const realPrevMessages = prevMessages.filter(msg => !msg.isOptimistic);
        
        // Check if messages are different
        if (JSON.stringify(realPrevMessages) !== JSON.stringify(newMessages)) {
          // Keep optimistic messages and merge with new real messages
          const optimisticMessages = prevMessages.filter(msg => msg.isOptimistic);
          return [...newMessages, ...optimisticMessages];
        }
        return prevMessages;
      });
      
      setConversation(data.conversation);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Create optimistic message for immediate UI update
    const optimisticMessage = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: currentUser.uid,
      senderName: currentUser.fullName || currentUser.email,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isOptimistic: true // Flag to identify temporary message
    };

    // Add optimistic message immediately for smooth UX
    setMessages(prev => [...prev, optimisticMessage]);
    const messageToSend = newMessage.trim();
    setNewMessage(''); // Clear input immediately
    setError('');
    setFilterWarning('');

    try {
      const data = await chatAPIService.sendMessage(conversationId, messageToSend);

      // Replace optimistic message with real message from server
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? data.message : msg
      ));

      // Show warning if message was filtered
      if (data.isFiltered) {
        setFilterWarning('Your message contained sensitive information and was filtered for privacy.');
        setTimeout(() => setFilterWarning(''), 5000);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      
      // Remove optimistic message on error and restore input
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setNewMessage(messageToSend);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherParticipant = () => {
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

  const otherParticipant = getOtherParticipant();

  if (loading) {
    return (
      <Card className="h-100">
        <Card.Body className="d-flex align-items-center justify-content-center">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading conversation...</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="h-100 d-flex flex-column chat-window-card">
      {/* Chat Header */}
      <Card.Header className="chat-window-header d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          {/* Avatar */}
          <div className="chat-avatar position-relative">
            <div className="avatar-fallback">
              <i className="bi bi-person-fill"></i>
            </div>
            <span className="online-indicator online" />
          </div>
          <div>
            <h6 className="mb-0">
              {otherParticipant ? otherParticipant.name : 'Chat'}
            </h6>
            {otherParticipant && (
              <small className="text-muted">
                Online now
              </small>
            )}
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          {onClose && (
            <Button variant="outline-secondary" size="sm" onClick={onClose}>
              <i className="bi bi-x-lg"></i>
            </Button>
          )}
          <Dropdown align="end">
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              <i className="bi bi-three-dots-vertical"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => console.log('View Profile clicked')}>View Profile</Dropdown.Item>
              <Dropdown.Item onClick={() => console.log('Mute Chat clicked')}>Mute Chat</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item className="text-danger" onClick={() => console.log('Delete Chat clicked')}>Delete Chat</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </Card.Header>

      {/* Messages Area */}
      <Card.Body className="flex-grow-1 p-0 chat-gradient-bg" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {error && (
          <Alert variant="danger" className="m-3 mb-0">
            {error}
          </Alert>
        )}
        
        {filterWarning && (
          <Alert variant="warning" className="m-3 mb-0">
            {filterWarning}
          </Alert>
        )}

        {messages.length === 0 ? (
          <div className="text-center p-4 text-muted">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="p-3">
            {messages.map((message, index) => {
              const isCurrentUser = message.senderId === currentUser.uid;
              const showDate = index === 0 || 
                formatDate(messages[index - 1]?.timestamp) !== formatDate(message.timestamp);
              return (
                <div key={message.id} className="fade-in">
                  {showDate && (
                    <div className="text-center my-3">
                      <Badge bg="light" text="dark" className="px-3 py-1">
                        {formatDate(message.timestamp)}
                      </Badge>
                    </div>
                  )}
                  <div className={`d-flex mb-3 ${isCurrentUser ? 'justify-content-end' : 'justify-content-start'}`}>
                    <div className={`max-width-75 ${isCurrentUser ? 'text-end' : 'text-start'}`}>
                      <div className={`bubble ${isCurrentUser ? 'bubble-sent' : 'bubble-received'} ${message.isOptimistic ? 'opacity-75' : ''}`}>
                        {message.message}
                      </div>
                      <small className="text-muted d-block mt-1">
                        {formatTime(message.timestamp)}
                        {isCurrentUser && message.read && (
                          <span className="ms-2 read-receipt">✓✓</span>
                        )}
                        {message.isOptimistic && (
                          <span className="ms-2 text-muted">
                            <i className="fas fa-clock" title="Sending..."></i>
                          </span>
                        )}
                        {message.isFiltered && (
                          <span className="ms-2 text-warning">
                            <i className="fas fa-filter" title="Message was filtered"></i>
                          </span>
                        )}
                      </small>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </Card.Body>

      {/* Message Input */}
      <Card.Footer className="bg-white">
        <Form onSubmit={sendMessage}>
          <div className="d-flex align-items-center gap-2">
            <div className="position-relative flex-grow-1">
              <Form.Control
                type="text"
                placeholder="Type a message…"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                maxLength={1000}
                className="rounded-pill"
              />
            </div>

            <div className="position-relative" ref={emojiPickerRef}>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="me-2 rounded-circle"
              >
                <i className="bi bi-emoji-smile"></i>
              </Button>
              {showEmojiPicker && (
                <div className="position-absolute bottom-100 end-0 mb-2" style={{ zIndex: 1050 }}>
                  <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
                </div>
              )}
            </div>

            <Button variant="outline-secondary" size="sm" className="rounded-circle me-2">
              <i className="bi bi-paperclip"></i>
            </Button>

            <Button 
              type="submit" 
              variant="light"
              disabled={!newMessage.trim()}
              className={`send-button ${newMessage.trim() ? 'glow' : ''}`}
            >
              <i className="bi bi-send"></i>
            </Button>
          </div>
          <div className="d-flex justify-content-between mt-2">
            <small className="text-muted">
              Emails and phone numbers will be automatically filtered
            </small>
            <small className="text-muted">
              {newMessage.length}/1000
            </small>
          </div>
        </Form>
      </Card.Footer>
    </Card>
  );
};

export default ChatWindow;