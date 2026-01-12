const axios = require('axios');
const admin = require('./config/firebase');

async function testRefresh() {
  try {
    // Get a user with Instagram connection
    const db = admin.firestore();
    const snapshot = await db.collection('influencers').where('instagramUsername', '!=', '').limit(1).get();
    
    if (snapshot.empty) {
      console.log('No users with Instagram found');
      return;
    }
    
    const doc = snapshot.docs[0];
    const userData = doc.data();
    console.log('Testing with user:', doc.id, 'Instagram:', userData.instagramUsername);
    
    // Test the refresh endpoint
    const response = await axios.post(`http://localhost:5000/api/influencer/${doc.id}/instagram/refresh`, {}, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });
    
    console.log('Refresh response:', response.data);
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testRefresh();