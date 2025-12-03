import React, { useState } from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import ChatList from './ChatList'
import ChatWindow from './ChatWindow'

const ChatInterface = ({ currentUser }) => {
  const [selectedConversationId, setSelectedConversationId] = useState(null)

  const handleSelectConversation = (conversationId) => {
    setSelectedConversationId(conversationId)
  }

  const handleCloseChat = () => {
    setSelectedConversationId(null)
  }

  return (
    <Container fluid className="py-4">
      <Row className="h-100">
        <Col md={4} className="mb-3 mb-md-0">
          <ChatList
            currentUser={currentUser}
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversationId}
          />
        </Col>
        
        <Col md={8}>
          {selectedConversationId ? (
            <ChatWindow
              conversationId={selectedConversationId}
              currentUser={currentUser}
              onClose={handleCloseChat}
            />
          ) : (
            <Card className="h-100 chat-window-card">
              <Card.Body className="d-flex align-items-center justify-content-center chat-gradient-bg">
                <div className="text-center text-muted">
                  <div className="mb-3">
                    <i className="bi bi-chat-dots display-4"></i>
                  </div>
                  <h5>Select a conversation to start messaging.</h5>
                  <p className="mb-0">Or start a new chat to connect with a brand.</p>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ChatInterface;