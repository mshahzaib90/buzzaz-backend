const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function traceDetailedEndpoint() {
  try {
    console.log('🔍 TRACING DETAILED ENDPOINT REQUEST FLOW');
    
    const userId = '0ZPlyBVkHGHUEPRcxB2I';
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    // Create a valid JWT token
    const token = jwt.sign(
      { uid: userId, email: 'test@example.com', role: 'user' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('✅ Generated JWT token for user:', userId);
    
    // Test the detailed endpoint with detailed logging
    const url = `http://localhost:5000/api/influencer/${userId}/instagram/detailed`;
    console.log('🌐 Request URL:', url);
    
    // Add request interceptor to log outgoing request
    const axiosInstance = axios.create();
    
    axiosInstance.interceptors.request.use(
      (config) => {
        console.log('\n📤 OUTGOING REQUEST:');
        console.log('Method:', config.method?.toUpperCase());
        console.log('URL:', config.url);
        console.log('Headers:', JSON.stringify(config.headers, null, 2));
        console.log('Data:', config.data || 'No data');
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );
    
    axiosInstance.interceptors.response.use(
      (response) => {
        console.log('\n📥 INCOMING RESPONSE:');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', JSON.stringify(response.headers, null, 2));
        console.log('Data Keys:', Object.keys(response.data || {}));
        return response;
      },
      (error) => {
        console.log('\n❌ RESPONSE ERROR:');
        console.log('Status:', error.response?.status);
        console.log('Status Text:', error.response?.statusText);
        console.log('Headers:', JSON.stringify(error.response?.headers || {}, null, 2));
        console.log('Error Data:', JSON.stringify(error.response?.data || {}, null, 2));
        return Promise.reject(error);
      }
    );
    
    // Make the request
    const response = await axiosInstance.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('\n✅ SUCCESS - Response received');
    console.log('Response data structure:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ REQUEST FAILED');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
      
      // Check if the error message contains our target strings
      const errorData = JSON.stringify(error.response.data);
      if (errorData.includes('Failed to fetch Instagram data and no cache available')) {
        console.log('🎯 FOUND TARGET ERROR MESSAGE in response');
      }
      if (errorData.includes('Monthly usage hard limit exceeded')) {
        console.log('🎯 FOUND MONTHLY LIMIT ERROR MESSAGE in response');
      }
    } else if (error.request) {
      console.log('No response received');
      console.log('Request details:', error.request);
    } else {
      console.log('Request setup error:', error.message);
    }
  }
}

traceDetailedEndpoint();