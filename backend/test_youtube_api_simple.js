require('dotenv').config();
const axios = require('axios');

async function testYouTubeAPI() {
  console.log('Testing YouTube API configuration...\n');
  
  // Check if API key is configured
  const apiKey = process.env.YOUTUBE_API_KEY;
  console.log('YouTube API Key configured:', apiKey ? 'Yes' : 'No');
  
  if (!apiKey) {
    console.log('❌ YouTube API Key is missing from environment variables');
    console.log('Please add YOUTUBE_API_KEY to your .env file');
    return;
  }
  
  console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
  
  try {
    console.log('\nTesting YouTube API with a simple channel search...');
    
    // Test with a well-known channel
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        type: 'channel',
        q: 'MrBeast',
        maxResults: 1,
        key: apiKey
      }
    });
    
    if (response.data.items && response.data.items.length > 0) {
      const channel = response.data.items[0];
      console.log('✅ YouTube API is working!');
      console.log('Found channel:', channel.snippet.title);
      console.log('Channel ID:', channel.id.channelId);
      
      // Test channel stats
      console.log('\nTesting channel statistics...');
      const statsResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
          part: 'statistics,snippet',
          id: channel.id.channelId,
          key: apiKey
        }
      });
      
      if (statsResponse.data.items && statsResponse.data.items.length > 0) {
        const stats = statsResponse.data.items[0].statistics;
        console.log('✅ Channel statistics retrieved!');
        console.log('Subscribers:', stats.subscriberCount);
        console.log('Views:', stats.viewCount);
        console.log('Videos:', stats.videoCount);
      }
      
    } else {
      console.log('❌ No channels found in search results');
    }
    
  } catch (error) {
    console.log('❌ YouTube API Error:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.error?.message || error.message);
    
    if (error.response?.status === 403) {
      console.log('\n🔑 This is likely an API key issue:');
      console.log('- Check if the API key is valid');
      console.log('- Ensure YouTube Data API v3 is enabled');
      console.log('- Check API quotas and billing');
    } else if (error.response?.status === 400) {
      console.log('\n📝 Bad request - check API parameters');
    }
  }
}

testYouTubeAPI();