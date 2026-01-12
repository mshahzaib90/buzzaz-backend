import axios from 'axios';
import { API_BASE_URL } from '../services/api';

// Create axios instance with default config
const ugcAPI = axios.create({
  baseURL: `${API_BASE_URL}/ugc`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
ugcAPI.interceptors.request.use(
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
ugcAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// UGC Creator API methods
export const ugcCreatorAPI = {
  // Create UGC Creator profile
  createProfile: async (profileData) => {
    try {
      // For FormData, let browser set Content-Type automatically
      const config = {};
      if (profileData instanceof FormData) {
        config.headers = {
          'Content-Type': 'multipart/form-data',
        };
      }
      
      const response = await ugcAPI.post('/profile', profileData, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get UGC Creator profile
  getProfile: async (userId) => {
    try {
      const response = await ugcAPI.get(`/profile/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update UGC Creator profile
  updateProfile: async (userId, updateData) => {
    try {
      const response = await ugcAPI.put(`/profile/${userId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get UGC Creator stats history
  getStatsHistory: async (userId) => {
    try {
      const response = await ugcAPI.get(`/stats/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Browse UGC Creators (for brands)
  browseCreators: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          if (Array.isArray(filters[key])) {
            params.append(key, filters[key].join(','));
          } else {
            params.append(key, filters[key]);
          }
        }
      });

      const response = await ugcAPI.get(`/browse?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Validate price range
  validatePriceRange: (minPrice, maxPrice) => {
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    
    if (isNaN(min) || isNaN(max)) {
      return { isValid: false, message: 'Please enter valid price values' };
    }
    
    if (min <= 0 || max <= 0) {
      return { isValid: false, message: 'Prices must be greater than 0' };
    }
    
    if (max <= min) {
      return { isValid: false, message: 'Maximum price must be greater than minimum price' };
    }
    
    return { isValid: true };
  },

  // Format price for display
  formatPrice: (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  },

  // Get price range display string
  getPriceRangeDisplay: (minPrice, maxPrice) => {
    return `${ugcCreatorAPI.formatPrice(minPrice)} - ${ugcCreatorAPI.formatPrice(maxPrice)}`;
  },

  // --- YouTube integration for UGC creators ---
  // Connect YouTube channel using flexible query (ID, @handle, custom URL)
  connectYouTube: async (userId, { channelQuery }) => {
    try {
      const response = await ugcAPI.post(`/${userId}/youtube/connect`, { channelQuery });
      const payload = response.data || {};

      // Normalize shape to what dashboard expects
      if (payload.success && payload.data) {
        const d = payload.data;
        return {
          success: true,
          message: payload.message,
          data: {
            youtubeChannelId: d.channelId,
            youtubeChannelTitle: d.channelTitle,
            youtubeChannelUrl: d.channelUrl,
            subscriberCount: d.subscriberCount,
            viewCount: d.viewCount,
            videoCount: d.videoCount,
          },
        };
      }
      return payload;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Refresh YouTube analytics/data for connected channel
  refreshYouTubeData: async (userId) => {
    try {
      const response = await ugcAPI.post(`/${userId}/youtube/refresh`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get detailed YouTube analytics (normalized to return inner data)
  getYouTubeAnalytics: async (userId) => {
    try {
      const response = await ugcAPI.get(`/${userId}/youtube/detailed`);
      // Return the inner data directly for ease of use in dashboard
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default ugcCreatorAPI;