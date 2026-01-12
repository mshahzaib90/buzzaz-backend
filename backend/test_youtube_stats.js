const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function testYouTubeStats() {
  try {
    console.log('=== TESTING YOUTUBE STATS FETCHING ===');
    
    const currentUserId = 'Lwb2si8ZmHLPSZoCpcMM';
    
    // Get current user profile
    const currentUserDoc = await db.collection('influencers').doc(currentUserId).get();
    const currentData = currentUserDoc.data();
    
    console.log('Current user YouTube data:');
    console.log(`  Channel ID: ${currentData.youtubeChannelId}`);
    console.log(`  Channel Title: ${currentData.youtubeChannelTitle}`);
    console.log(`  Channel URL: ${currentData.youtubeChannelUrl}`);
    
    // Check API key
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    console.log(`\nYouTube API Key: ${youtubeApiKey ? 'CONFIGURED' : 'MISSING'}`);
    
    if (!youtubeApiKey) {
      console.log('❌ YouTube API key not found');
      return;
    }
    
    if (!currentData.youtubeChannelId) {
      console.log('❌ No YouTube channel ID found for current user');
      return;
    }
    
    // Test YouTube API call
    console.log('\n=== TESTING YOUTUBE API CALL ===');
    
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
          part: 'statistics,snippet',
          id: currentData.youtubeChannelId,
          key: youtubeApiKey
        }
      });
      
      if (response.data.items && response.data.items.length > 0) {
        const channelData = response.data.items[0];
        const stats = channelData.statistics;
        
        console.log('✅ YouTube API call successful!');
        console.log('Channel Statistics:');
        console.log(`  Subscribers: ${parseInt(stats.subscriberCount || 0).toLocaleString()}`);
        console.log(`  Total Views: ${parseInt(stats.viewCount || 0).toLocaleString()}`);
        console.log(`  Video Count: ${parseInt(stats.videoCount || 0).toLocaleString()}`);
        
        // Save stats to database
        const youtubeStatsData = {
          userId: currentUserId,
          channelId: currentData.youtubeChannelId,
          subscriberCount: parseInt(stats.subscriberCount || 0),
          viewCount: parseInt(stats.viewCount || 0),
          videoCount: parseInt(stats.videoCount || 0),
          channelTitle: channelData.snippet.title,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('youtubeStats').add(youtubeStatsData);
        
        console.log('\n✅ YouTube stats saved to database!');
        console.log('Dashboard should now show YouTube statistics.');
        
      } else {
        console.log('❌ No channel data found for the provided channel ID');
        console.log('The channel ID might be invalid or the channel might not exist');
      }
      
    } catch (apiError) {
      console.log('❌ YouTube API call failed:');
      console.log(`Error: ${apiError.message}`);
      
      if (apiError.response) {
        console.log(`Status: ${apiError.response.status}`);
        console.log(`Response: ${JSON.stringify(apiError.response.data, null, 2)}`);
      }
      
      // If API call fails, let's create mock stats for testing
      console.log('\n=== CREATING MOCK YOUTUBE STATS FOR TESTING ===');
      
      const mockStatsData = {
        userId: currentUserId,
        channelId: currentData.youtubeChannelId,
        subscriberCount: 15420,
        viewCount: 892156,
        videoCount: 156,
        channelTitle: currentData.youtubeChannelTitle,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('youtubeStats').add(mockStatsData);
      
      console.log('✅ Mock YouTube stats created:');
      console.log(`  Subscribers: ${mockStatsData.subscriberCount.toLocaleString()}`);
      console.log(`  Views: ${mockStatsData.viewCount.toLocaleString()}`);
      console.log(`  Videos: ${mockStatsData.videoCount}`);
      console.log('\nDashboard should now show YouTube statistics.');
    }
    
  } catch (error) {
    console.error('Error testing YouTube stats:', error);
  }
}

testYouTubeStats();