// Test script to fetch MotoGP YouTube channel data
const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;
if (!YOUTUBE_API_KEY) {
  throw new Error('Missing YouTube API key in environment (set REACT_APP_YOUTUBE_API_KEY or YOUTUBE_API_KEY)');
}

async function testMotoGPYouTube() {
  try {
    console.log('=== TESTING MOTOGP YOUTUBE API ===');
    
    // Search for MotoGP channel
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=motogp&maxResults=1&key=${YOUTUBE_API_KEY}`;
    console.log('Search URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    console.log('Search Response:', searchData);
    
    if (searchData?.items?.length) {
      const channel = searchData.items[0];
      const channelId = channel.id?.channelId;
      
      console.log('Found Channel ID:', channelId);
      console.log('Channel Title:', channel.snippet?.title);
      console.log('Channel Description:', channel.snippet?.description);
      
      // Get detailed channel info
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`;
      console.log('Channel Details URL:', channelUrl);
      
      const channelResponse = await fetch(channelUrl);
      const channelData = await channelResponse.json();
      
      console.log('Channel Details Response:', channelData);
      
      if (channelData?.items?.length) {
        const channelInfo = channelData.items[0];
        console.log('=== FINAL CHANNEL DATA ===');
        console.log('Channel ID:', channelInfo.id);
        console.log('Channel Title:', channelInfo.snippet?.title);
        console.log('Channel URL:', `https://www.youtube.com/channel/${channelInfo.id}`);
        console.log('Subscriber Count:', channelInfo.statistics?.subscriberCount);
        console.log('Video Count:', channelInfo.statistics?.videoCount);
        console.log('View Count:', channelInfo.statistics?.viewCount);
        
        // This is the payload that would be sent to backend
        const payload = {
          youtubeChannelId: channelInfo.id,
          youtubeChannelTitle: channelInfo.snippet?.title,
          youtubeChannelUrl: `https://www.youtube.com/channel/${channelInfo.id}`
        };
        
        console.log('=== PAYLOAD TO BACKEND ===');
        console.log(JSON.stringify(payload, null, 2));
      }
    }
    
  } catch (error) {
    console.error('Error testing YouTube API:', error);
  }
}

// Run the test
testMotoGPYouTube();