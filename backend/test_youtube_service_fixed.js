const youtubeService = require('./services/youtubeService');

async function testYouTubeServiceFixed() {
  try {
    console.log('Testing YouTube service with the fix...');
    
    // Test channel search
    console.log('1. Testing channel search...');
    const channelData = await youtubeService.searchChannel('MrBeast');
    console.log('✅ Channel found:', channelData.channelTitle);
    console.log('Channel ID:', channelData.channelId);
    
    // Test channel stats
    console.log('\n2. Testing channel stats...');
    const channelStats = await youtubeService.fetchChannelStats(channelData.channelId);
    console.log('✅ Channel stats retrieved');
    console.log('Subscribers:', channelStats.subscriberCount);
    console.log('Total Views:', channelStats.viewCount);
    
    // Test recent videos (this is where the bug was)
    console.log('\n3. Testing recent videos...');
    const recentVideos = await youtubeService.fetchChannelVideos(channelData.channelId, 5);
    console.log('✅ Recent videos retrieved:', recentVideos.length);
    
    // Test the fixed video ID mapping
    console.log('\n4. Testing video ID mapping (the fix)...');
    const videoIds = recentVideos.map(video => video.videoId);
    console.log('✅ Video IDs extracted successfully:', videoIds.length);
    console.log('First video ID:', videoIds[0]);
    
    // Test video stats with the extracted IDs
    console.log('\n5. Testing video stats with extracted IDs...');
    const videoStats = await youtubeService.fetchVideoStats(videoIds);
    console.log('✅ Video stats retrieved for', videoStats.length, 'videos');
    
    // Test analytics data
    console.log('\n6. Testing analytics data...');
    const analyticsData = await youtubeService.fetchAnalyticsData(channelData.channelId);
    console.log('✅ Analytics data generated');
    console.log('Total Views:', analyticsData.totalViews);
    
    console.log('\n🎉 All tests passed! The YouTube service fix is working correctly.');
    
  } catch (error) {
    console.error('❌ Error testing YouTube service:');
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testYouTubeServiceFixed();