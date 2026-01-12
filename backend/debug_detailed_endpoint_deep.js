const axios = require('axios');
const jwt = require('jsonwebtoken');
const { admin, db } = require('./config/firebase');
require('dotenv').config();

async function debugDetailedEndpointDeep() {
  try {
    console.log('🔍 DEEP DEBUGGING DETAILED ENDPOINT');
    
    const userId = '0ZPlyBVkHGHUEPRcxB2I';
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    // First, check what's in the database directly
    console.log('\n📊 CHECKING DATABASE STATE:');
    
    // Check if influencer exists
    const influencerDoc = await db.collection('influencers').doc(userId).get();
    if (!influencerDoc.exists) {
      console.log('❌ Influencer document does not exist');
      return;
    }
    
    const influencerData = influencerDoc.data();
    console.log('✅ Influencer found:', {
      instagramUsername: influencerData.instagramUsername,
      hasInstagramUsername: !!influencerData.instagramUsername
    });
    
    // Check if cached Instagram data exists
    const cachedDoc = await db.collection('instagramDetailedData').doc(userId).get();
    console.log('📦 Cached data exists:', cachedDoc.exists);
    
    if (cachedDoc.exists) {
      const cachedData = cachedDoc.data();
      console.log('📦 Cached data structure:', {
        username: cachedData.username,
        postsCount: cachedData.posts?.length || 0,
        reelsCount: cachedData.reels?.length || 0,
        scrapedAt: cachedData.scrapedAt,
        lastRefresh: cachedData.lastRefresh
      });
    }
    
    // Now test the API endpoint
    console.log('\n🌐 TESTING API ENDPOINT:');
    
    const token = jwt.sign(
      { uid: userId, email: 'test@example.com', role: 'user' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const url = `http://localhost:5000/api/influencer/${userId}/instagram/detailed`;
    console.log('Request URL:', url);
    
    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('✅ SUCCESS - Response received');
      console.log('Response status:', response.status);
      console.log('Response data keys:', Object.keys(response.data));
      
    } catch (error) {
      console.log('❌ API REQUEST FAILED');
      console.log('Error status:', error.response?.status);
      console.log('Error message:', error.message);
      console.log('Error response data:', JSON.stringify(error.response?.data, null, 2));
      
      // Check if this is the mysterious error
      if (error.response?.data?.message === 'Failed to fetch Instagram data and no cache available') {
        console.log('\n🎯 FOUND THE MYSTERIOUS ERROR!');
        console.log('This error is NOT in our current codebase.');
        console.log('Possible causes:');
        console.log('1. Old cached code in memory');
        console.log('2. Different version of the code running');
        console.log('3. External service or proxy');
        console.log('4. Code that was recently changed but server not restarted');
      }
    }
    
    // Check if there are any other routes that might match
    console.log('\n🔍 CHECKING FOR ROUTE CONFLICTS:');
    console.log('Expected route: GET /:id/instagram/detailed');
    console.log('Actual request: GET /' + userId + '/instagram/detailed');
    
  } catch (error) {
    console.error('Deep debugging error:', error);
  }
}

debugDetailedEndpointDeep();