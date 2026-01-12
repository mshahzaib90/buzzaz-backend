const axios = require('axios');

async function testInstagramDetailedAPI() {
  try {
    const userId = 'sx8gqxfSNZQvlHXq7BQI';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJzeDhncXhmU05aUXZsSFhxN0JRSSIsImVtYWlsIjoibWRzaGFoemFpYkBnbWFpbC5jb20iLCJyb2xlIjoiaW5mbHVlbmNlciIsImlhdCI6MTc2MTY0MjAwOCwiZXhwIjoxNzYxNzI4NDA4fQ.k903kodcNmjgr7kNZgpO9zcsudWnmQlD1EA';
    
    console.log('Testing Instagram detailed API endpoint...');
    console.log('User ID:', userId);
    console.log('API URL:', `http://localhost:5000/api/influencer/${userId}/instagram/detailed`);
    
    const response = await axios.get(`http://localhost:5000/api/influencer/${userId}/instagram/detailed`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:');
    console.log('- Success:', response.data.success);
    console.log('- From Database:', response.data.fromDatabase);
    console.log('- Profile Username:', response.data.profile?.username);
    console.log('- Profile Followers:', response.data.profile?.followers);
    console.log('- Reels Count:', response.data.reels?.length || 0);
    console.log('- Analytics Total Posts:', response.data.analytics?.totalPosts);
    console.log('- Analytics Engagement Rate:', response.data.analytics?.engagementRate);
    
    if (response.data.reels && response.data.reels.length > 0) {
      console.log('- First Reel ID:', response.data.reels[0].id);
      console.log('- First Reel Likes:', response.data.reels[0].likesCount);
    }
    
  } catch (error) {
    console.error('API Error:', error.response?.status, error.response?.statusText);
    console.error('Error Message:', error.response?.data?.message || error.message);
    console.error('Full Error Data:', error.response?.data);
  }
}

testInstagramDetailedAPI();