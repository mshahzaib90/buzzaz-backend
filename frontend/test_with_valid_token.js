const axios = require('axios');

const testWithValidToken = async () => {
  try {
    console.log('=== Testing API with Valid Token ===');
    
    const baseURL = 'http://localhost:5000/api';
    const userId = 'sx8gqxfSNZQvlHXq7BQI';
    
    // Use the newly generated valid token
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJzeDhncXhmU05aUXZsSFhxN0JRSSIsImVtYWlsIjoibXVoYW1tYWQuc2hhaHphaWJAdGFtYXRvcy5jb20iLCJyb2xlIjoiaW5mbHVlbmNlciIsImlhdCI6MTc2MTY0MDg0NSwiZXhwIjoxNzYyMjQ1NjQ1fQ.Yl9peygFe41s8Iz2VANSlMvGAYF31tAvKz_S6EflzZU';
    
    console.log('User ID:', userId);
    console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
    
    // Test the Instagram detailed endpoint
    console.log('\n=== Testing Instagram Detailed Endpoint ===');
    const response = await axios.get(`${baseURL}/influencer/${userId}/instagram/detailed`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ Success:', response.data.success);
    console.log('✅ From Database:', response.data.fromDatabase);
    
    if (response.data.profile) {
      console.log('\n=== Profile Data ===');
      console.log('Username:', response.data.profile.username);
      console.log('Followers:', response.data.profile.followers?.toLocaleString());
      console.log('Following:', response.data.profile.following);
      console.log('Posts Count:', response.data.profile.postsCount);
    }
    
    if (response.data.reels) {
      console.log('\n=== Reels Data ===');
      console.log('Total Reels:', response.data.reels.length);
      if (response.data.reels.length > 0) {
        const firstReel = response.data.reels[0];
        console.log('First Reel:');
        console.log('  Likes:', firstReel.likes);
        console.log('  Comments:', firstReel.comments);
        console.log('  Views:', firstReel.views);
      }
    }
    
    if (response.data.analytics) {
      console.log('\n=== Analytics ===');
      console.log('Engagement Rate:', response.data.analytics.engagementRate + '%');
      console.log('Average Likes:', response.data.analytics.averageLikes);
      console.log('Average Comments:', response.data.analytics.averageComments);
    }
    
    console.log('\n✅ API is working correctly with valid token!');
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

testWithValidToken();