import axios from 'axios';

// Determine API base URL with production safety and flexible dev config
const IS_PROD = process.env.NODE_ENV === 'production';
const ENV_BASE = process.env.REACT_APP_API_URL;
const RAW_BASE_URL = (() => {
  const val = (ENV_BASE || '').trim();
  if (IS_PROD) {
    // In production, require a proper env var or default to same-origin '/api'
    return val || '/api';
  }
  // Development: Force absolute URL to bypass proxy issues
  return 'http://127.0.0.1:5003/api';
})();
export const API_BASE_URL = (() => {
  // Always use direct backend URL in development
  if (!IS_PROD) return 'http://127.0.0.1:5003/api';

  const url = (RAW_BASE_URL || '').trim();
  if (!url) return '/api';
  // If the provided base already ends with /api or /api/, keep it
  const hasApiSuffix = /\/api\/?$/.test(url);
  if (hasApiSuffix) {
    // Remove trailing slash for consistency
    const finalUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    try { console.debug('[API] Base URL resolved:', finalUrl); } catch (_) {}
    return finalUrl;
  }
  // Otherwise, append /api (avoiding duplicate slashes)
  const finalUrl = url.replace(/\/+$/, '') + '/api';
  try { console.debug('[API] Base URL resolved:', finalUrl); } catch (_) {}
  return finalUrl;
})();

// Derive API origin (protocol + host + optional port) for non-API resources like file uploads
export const API_ORIGIN = (() => {
  const base = RAW_BASE_URL || '';
  if (/^https?:\/\//i.test(base)) {
    return base.replace(/\/+api\/?$/i, '');
  }
  // In production or proxy mode, use window origin
  return window.location.origin;
})();

// Helper to build uploads file URL consistently based on API origin
export const getUploadsUrl = (filename) => {
  const name = (filename || '').replace(/^\/+/, '');
  return `${API_ORIGIN}/uploads/${name}`;
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Reduced timeout to match backend optimization
  timeout: 30000, // 30 seconds to allow for backend processing
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed error info for debugging
    if (error.code === "ERR_NETWORK") {
      console.error("Network Error Details:", {
        message: error.message,
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method
      });
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 403) {
      console.warn('Access Forbidden:', error.response.data?.message);
      // Optional: Redirect to home or show specific UI
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  verify: () => api.post('/auth/verify'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/user/me'),
  updateProfile: (userData) => api.put('/user/me', userData),
  getProfileStatus: () => api.get('/user/profile-status'),
  setRole: (role) => api.put('/user/role', { role }),
};

// Influencer API
export const influencerAPI = {
  validateApify: (username) => api.post('/influencer/validate-apify', { instagramUsername: username }),
  validateTikTok: (username) => api.post('/influencer/validate-tiktok', { tiktokUsername: username }),
  createProfile: (profileData) => api.post('/influencer', profileData),
  // If an id is provided, load that influencer's public profile; otherwise load current user's profile
  getProfile: (id) => (id ? api.get(`/influencer/${id}`) : api.get('/influencer/profile')),
  updateProfile: (id, profileData) => api.put(`/influencer/${id}`, profileData),
  getStats: (id, limit) => api.get(`/influencer/${id}/stats`, { params: { limit } }),
  getInstagramPosts: (id, limit) => api.get(`/influencer/${id}/instagram/posts`, { params: { limit } }),
  // Added YouTube endpoints to avoid direct Google API calls from frontend
  connectYouTubeChannel: (id, channelQuery) => api.post(`/influencer/${id}/youtube/connect`, { channelQuery }),
  refreshYouTubeAnalytics: (id) => api.post(`/influencer/${id}/youtube/refresh`),
  getYouTubeAnalyticsDetailed: (id) => api.get(`/influencer/${id}/youtube/detailed`),
  getInstagramData: (id) => api.get(`/influencer/${id}/instagram/data`),
};

// Influencers API (for brands)
export const influencersAPI = {
  getList: (params) => api.get('/influencers', { params }),
  getFilters: () => api.get('/influencers/filters'),
  search: (query, limit) => api.get('/influencers/search', { params: { q: query, limit } }),
};

// Utility functions
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export default api;
