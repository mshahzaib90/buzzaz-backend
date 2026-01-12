require('dotenv').config();
const youtubeService = require('./services/youtubeService');

async function testYouTubeAPI() {
  try {
    console.log('Testing YouTube API with real channel ID...');
    
    // Test with a real YouTube channel ID (MrBeast's channel)
    const channelId = 'UCX6OQ3DkcsbYNE6H8uQQuVA';
    
    console.log('API Key:', process.env.YOUTUBE_API_KEY ? 'Present' : 'Missing');
    console.log('Channel ID:', channelId);
    
    const result = await youtubeService.getComprehensiveChannelData(channelId);
    
    console.log('\n=== YouTube API Test Results ===');
    console.log('Channel Title:', result.channelTitle);
    console.log('Subscriber Count:', result.subscriberCount);
    console.log('View Count:', result.viewCount);
    console.log('Video Count:', result.videoCount);
    console.log('Videos Found:', result.videos ? result.videos.length : 0);
    console.log('Last Updated:', result.lastUpdated);
    
    if (result.channelTitle && result.channelTitle !== 'Mock Channel') {
      console.log('\n✅ SUCCESS: Real YouTube data retrieved!');
    } else {
      console.log('\n⚠️  WARNING: Mock data returned (API key might be invalid)');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Full error:', error);
  }
}

testYouTubeAPI();