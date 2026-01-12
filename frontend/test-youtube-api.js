// Test YouTube API to debug subscriber count issue
const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;
if (!YOUTUBE_API_KEY) {
  throw new Error('Missing YouTube API key in environment (set REACT_APP_YOUTUBE_API_KEY or YOUTUBE_API_KEY)');
}

async function testYouTubeAPI() {
  try {
    console.log('Testing YouTube API with a known channel...');
    
    // Test with a popular channel (MrBeast)
    const searchQuery = 'MrBeast';
    
    console.log('Step 1: Searching for channel...');
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(searchQuery)}&key=${YOUTUBE_API_KEY}&maxResults=1`
    );
    
    if (!searchResponse.ok) {
      throw new Error(`Search API failed: ${searchResponse.status} ${searchResponse.statusText}`);
    }
    
    const searchData = await searchResponse.json();
    console.log('Search response:', JSON.stringify(searchData, null, 2));
    
    if (searchData.items && searchData.items.length > 0) {
      const channel = searchData.items[0];
      const channelId = channel.id.channelId;
      
      console.log('Step 2: Fetching channel statistics...');
      console.log('Channel ID:', channelId);
      
      const statsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
      );
      
      if (!statsResponse.ok) {
        throw new Error(`Stats API failed: ${statsResponse.status} ${statsResponse.statusText}`);
      }
      
      const statsData = await statsResponse.json();
      console.log('Stats response:', JSON.stringify(statsData, null, 2));
      
      if (statsData.items && statsData.items.length > 0) {
        const stats = statsData.items[0].statistics;
        console.log('Raw subscriber count:', stats.subscriberCount);
        console.log('Parsed subscriber count:', parseInt(stats.subscriberCount || 0));
        
        const result = {
          channelTitle: channel.snippet.title,
          channelId: channelId,
          subscriberCount: parseInt(stats.subscriberCount || 0),
          rawSubscriberCount: stats.subscriberCount,
          videoCount: parseInt(stats.videoCount || 0),
          viewCount: parseInt(stats.viewCount || 0)
        };
        
        console.log('Final result:', result);
        return result;
      } else {
        console.log('No statistics data found');
      }
    } else {
      console.log('No channel found');
    }
  } catch (error) {
    console.error('Error testing YouTube API:', error);
  }
}

// Run the test
testYouTubeAPI();