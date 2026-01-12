// Debug script to check frontend authentication and profile data
const axios = require('axios');

// Simulate the frontend API call
const debugFrontendAuth = async () => {
  try {
    console.log('=== Frontend Authentication Debug ===');
    
    // First, let's check what the frontend would send
    const baseURL = 'http://localhost:5000/api';
    
    // Get the JWT token that would be used (we'll use the same one from our previous tests)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJzeDhncXhmU05aUXZsSFhxN0JRSSIsImVtYWlsIjoibWRzaGFoemFpYkBnbWFpbC5jb20iLCJpYXQiOjE3MzQ5NzI4MzIsImV4cCI6MTczNDk3NjQzMn0.Ej_5Ey8Ey_Ey8Ey_Ey8Ey_Ey8Ey_Ey8Ey_Ey8Ey_Ey8';
    
    console.log('Using token:', token);
    
    // Decode the token to see what user info it contains
    const tokenParts = token.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    console.log('Token payload:', payload);
    
    // Test the detailed Instagram endpoint that the frontend calls
    console.log('\n=== Testing Frontend API Call ===');
    const response = await axios.get(`${baseURL}/influencer/${payload.uid}/instagram/detailed`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', JSON.stringify(response.data, null, 2));
    
    // Check if the response has the expected structure
    if (response.data && response.data.profile) {
      console.log('\n=== Profile Data Analysis ===');
      console.log('Profile username:', response.data.profile.username);
      console.log('Profile followers:', response.data.profile.followers);
      console.log('Reels count:', response.data.reels ? response.data.reels.length : 0);
      console.log('Analytics available:', !!response.data.analytics);
    }
    
  } catch (error) {
    console.error('Error in frontend auth debug:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

debugFrontendAuth();