import axios from 'axios';
import { API_BASE_URL } from '../services/api';

// Create axios instance with default config
const chatAPI = axios.create({
  baseURL: `${API_BASE_URL}/chat`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
chatAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
chatAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Chat API methods
export const chatAPIService = {
  // Create or get conversation with a user
  createConversation: async (participantId) => {
    try {
      const response = await chatAPI.post('/conversations', { participantId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user's conversations
  getConversations: async () => {
    try {
      const response = await chatAPI.get('/conversations');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get conversation details
  getConversation: async (conversationId) => {
    try {
      const response = await chatAPI.get(`/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get messages in a conversation
  getMessages: async (conversationId, page = 1, limit = 50) => {
    try {
      const response = await chatAPI.get(`/conversations/${conversationId}/messages`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Send a message in a conversation
  sendMessage: async (conversationId, message) => {
    try {
      const response = await chatAPI.post(`/conversations/${conversationId}/messages`, { message });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Export default for backward compatibility
export default chatAPIService;