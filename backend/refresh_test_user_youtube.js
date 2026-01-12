const admin = require('firebase-admin');
const youtubeService = require('./services/youtubeService');

// Initialize Firebase Admin
const serviceAccount = require('./config/serviceAccount.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function refreshTestUserYouTubeData() {
  try {
    console.log('=== REFRESHING TEST USER YOUTUBE DATA ===');
    
    // Find test user
    const usersSnapshot = await db.collection('users').where('email', '==', 'test@example.com').get();
    if (usersSnapshot.empty) {
      console.log('Test user not found');
      return;
    }
    
    const testUserId = usersSnapshot.docs[0].id;
    console.log('Test user ID:', testUserId);
    
    // Get influencer profile
    const influencerDoc = await db.collection('influencers').doc(testUserId).get();
    if (!influencerDoc.exists) {
      console.log('Influencer profile not found');
      return;
    }
    
    const influencerData = influencerDoc.data();
    console.log('YouTube Channel ID:', influencerData.youtubeChannelId);
    
    // Fetch comprehensive YouTube data
    const youtubeData = await youtubeService.getComprehensiveChannelData(influencerData.youtubeChannelId);
    console.log('Fetched YouTube data with', youtubeData.videos.length, 'videos');
    
    // Save to youtubeAnalytics collection
    const analyticsData = {
      userId: testUserId,
      channelId: influencerData.youtubeChannelId,
      channelTitle: youtubeData.channelTitle,
      
      // Basic metrics
      subscriberCount: youtubeData.subscriberCount,
      viewCount: youtubeData.viewCount,
      videoCount: youtubeData.videoCount,
      
      // Detailed analytics
      views: youtubeData.analytics.views,
      likes: youtubeData.aggregatedMetrics.totalLikes,
      comments: youtubeData.aggregatedMetrics.totalComments,
      estimatedMinutesWatched: youtubeData.analytics.estimatedMinutesWatched,
      averageViewDuration: youtubeData.analytics.averageViewDuration,
      subscribersGained: youtubeData.analytics.subscribersGained,
      subscribersLost: youtubeData.analytics.subscribersLost,
      
      // Traffic sources
      trafficSourceType: youtubeData.analytics.trafficSourceType,
      
      // Device breakdown
      deviceType: youtubeData.analytics.deviceType,
      
      // Geographic data
      country: youtubeData.analytics.country,
      
      // Demographics
      gender: youtubeData.analytics.gender,
      ageGroup: youtubeData.analytics.ageGroup,
      
      // Engagement metrics
      engagementRate: parseFloat(youtubeData.aggregatedMetrics.engagementRate),
      
      // Video data - Store top 10 recent videos
      recentVideos: youtubeData.videos.slice(0, 10),
      
      // Metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: youtubeData.lastUpdated
    };
    
    // Save analytics data
    await db.collection('youtubeAnalytics').add(analyticsData);
    console.log('✅ YouTube analytics data saved successfully');
    
    // Show recent videos
    console.log('\n=== RECENT VIDEOS ===');
    youtubeData.videos.slice(0, 10).forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   Video ID: ${video.videoId}`);
      console.log(`   URL: ${video.videoUrl}`);
      console.log(`   Views: ${video.viewCount}`);
      console.log(`   Published: ${video.publishedAt}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

refreshTestUserYouTubeData();