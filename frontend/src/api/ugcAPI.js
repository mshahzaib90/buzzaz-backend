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
      // Check if we have a file upload
      const hasFile = updateData.sampleContentType === 'upload' && 
                     updateData.sampleContent instanceof File;

      let requestData;
      let headers = {};

      if (hasFile) {
        // Create FormData for file upload
        requestData = new FormData();
        
        // Add all fields to FormData
        Object.keys(updateData).forEach(key => {
          if (key === 'sampleContent' && updateData[key] instanceof File) {
            // Add the single file
            requestData.append('sampleContent', updateData[key]);
          } else if (Array.isArray(updateData[key])) {
            // Convert arrays to JSON strings for FormData
            requestData.append(key, JSON.stringify(updateData[key]));
          } else if (updateData[key] !== null && updateData[key] !== undefined) {
            requestData.append(key, updateData[key]);
          }
        });
        
        // Don't set Content-Type header, let browser set it with boundary
      } else {
        // Regular JSON request for non-file updates
        requestData = updateData;
        headers['Content-Type'] = 'application/json';
      }

      const response = await ugcAPI.put(`/profile/${userId}`, requestData, { headers });
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

  // Connect YouTube channel
  connectYouTube: async (userId, data) => {
    try {
      const response = await ugcAPI.post(`/${userId}/youtube/connect`, data);
      return response.data;
    } catch (error) {
      console.error('Error connecting YouTube:', error);
      throw error;
    }
  },

  // Refresh YouTube data
  refreshYouTubeData: async (userId) => {
    try {
      const response = await ugcAPI.post(`/${userId}/youtube/refresh`);
      return response.data;
    } catch (error) {
      console.error('Error refreshing YouTube data:', error);
      throw error;
    }
  },

  // Get detailed YouTube analytics
  getYouTubeAnalytics: async (userId) => {
    try {
      const response = await ugcAPI.get(`/${userId}/youtube/detailed`);
      return response.data;
    } catch (error) {
      console.error('Error getting YouTube analytics:', error);
      throw error;
    }
  },

  // Validate individual pricing fields
  validatePrice: (price, fieldName) => {
    const priceValue = parseFloat(price);
    
    if (isNaN(priceValue)) {
      return { isValid: false, message: `Please enter a valid ${fieldName} price` };
    }
    
    if (priceValue <= 0) {
      return { isValid: false, message: `${fieldName} price must be greater than 0` };
    }
    
    return { isValid: true };
  },

  // Validate all pricing fields
  validatePricingStructure: (pricingData) => {
    const pricingFields = [
      { key: 'reelPostPrice', name: 'Reel Post' },
      { key: 'staticPostPrice', name: 'Static Post' },
      { key: 'reelStaticComboPrice', name: 'Reel + Static Combo' },
      { key: 'storyVideoPrice', name: 'Story Video' },
      { key: 'storyShoutoutPrice', name: 'Story Shoutout' },
      { key: 'storyUnboxingPrice', name: 'Story Unboxing' },
      { key: 'eventAttendancePrice', name: 'Event Attendance' },
      { key: 'outdoorShootPrice', name: 'Outdoor Shoot' },
      { key: 'expressDeliveryCharge', name: 'Express Delivery Charge' }
    ];

    for (const field of pricingFields) {
      if (pricingData[field.key]) {
        const validation = ugcCreatorAPI.validatePrice(pricingData[field.key], field.name);
        if (!validation.isValid) {
          return validation;
        }
      }
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

  // Get price range display from new pricing structure
  getPriceRangeDisplay: (pricingData) => {
    const prices = [];
    const pricingFields = [
      'reelPostPrice', 'staticPostPrice', 'reelStaticComboPrice', 
      'storyVideoPrice', 'storyShoutoutPrice', 'storyUnboxingPrice',
      'eventAttendancePrice', 'outdoorShootPrice'
    ];

    pricingFields.forEach(field => {
      if (pricingData[field] && pricingData[field] > 0) {
        prices.push(parseFloat(pricingData[field]));
      }
    });

    if (prices.length === 0) {
      return 'Price not set';
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return ugcCreatorAPI.formatPrice(minPrice);
    }

    return `${ugcCreatorAPI.formatPrice(minPrice)} - ${ugcCreatorAPI.formatPrice(maxPrice)}`;
  }
};

export default ugcCreatorAPI;