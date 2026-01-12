const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin
const serviceAccount = require('./config/serviceAccount.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function testYouTubeRefreshEndpoint() {
  try {
    console.log('Testing YouTube refresh endpoint...');
    
    // Get a valid user from Firestore
    const db = admin.firestore();
    const influencersSnapshot = await db.collection('influencers').limit(1).get();
    
    if (influencersSnapshot.empty) {
      console.log('No influencers found in database');
      return;
    }
    
    const influencer = influencersSnapshot.docs[0];
    const influencerId = influencer.id;
    const influencerData = influencer.data();
    
    console.log('Testing with influencer:', influencerId);
    console.log('Influencer data:', {
      fullName: influencerData.fullName,
      youtubeChannelId: influencerData.youtubeChannelId,
      youtubeChannelTitle: influencerData.youtubeChannelTitle
    });
    
    // For testing, we'll bypass authentication by directly calling the service
    console.log('Testing YouTube service directly...');
    
    const youtubeService = require('./services/youtubeService');
    
    // Test with a mock channel ID
    const testChannelId = 'UCWYFSFm_1GrTOrvH1e2C2EQ';
    const result = await youtubeService.getComprehensiveChannelData(testChannelId);
    
    console.log('✅ YouTube service test successful!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ YouTube refresh endpoint test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    process.exit(0);
  }
}

testYouTubeRefreshEndpoint();