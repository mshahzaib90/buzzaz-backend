require('dotenv').config();
const admin = require('firebase-admin');
const youtubeService = require('./services/youtubeService');
const serviceAccount = require('./config/serviceAccount.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'buzzaz-app'
  });
}

const db = admin.firestore();

async function refreshYouTubeData() {
  try {
    console.log('🔄 Starting YouTube data refresh...');
    
    const userId = 'X0IqcgoiqNm6OgOKKKT1';
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const channelId = userData.platforms?.youtube?.channelId;
    
    console.log('📺 Channel ID:', channelId);
    
    if (!channelId) {
      console.log('❌ No YouTube channel connected');
      return;
    }
    
    console.log('📡 Fetching comprehensive YouTube data...');
    const youtubeData = await youtubeService.getComprehensiveChannelData(channelId);
    
    console.log('✅ Data fetched successfully!');
    console.log('📊 Channel:', youtubeData.channelTitle);
    console.log('👥 Subscribers:', youtubeData.subscriberCount);
    console.log('👀 Views:', youtubeData.viewCount);
    console.log('🎥 Videos:', youtubeData.videoCount);
    console.log('📈 Recent Videos:', youtubeData.videos?.length || 0);
    console.log('🚦 Traffic Sources:', youtubeData.analytics?.trafficSources?.length || 0);
    console.log('📱 Device Types:', youtubeData.analytics?.deviceTypes?.length || 0);
    console.log('🌍 Countries:', youtubeData.analytics?.countries?.length || 0);
    
    // Prepare analytics data
    const analyticsData = {
      userId: userId,
      channelId: channelId,
      channelTitle: youtubeData.channelTitle,
      subscriberCount: youtubeData.subscriberCount,
      viewCount: youtubeData.viewCount,
      videoCount: youtubeData.videoCount,
      detailedAnalytics: youtubeData.analytics,
      recentVideos: youtubeData.videos,
      lastUpdated: admin.firestore.Timestamp.now(),
      dataFreshness: 'fresh',
      createdAt: admin.firestore.Timestamp.now()
    };
    
    console.log('💾 Saving analytics data to database...');
    await db.collection('youtubeAnalytics').add(analyticsData);
    
    // Update user profile with latest stats
    await db.collection('users').doc(userId).update({
      'platforms.youtube.subscriberCount': youtubeData.subscriberCount,
      'platforms.youtube.viewCount': youtubeData.viewCount,
      'platforms.youtube.videoCount': youtubeData.videoCount,
      'platforms.youtube.lastUpdated': admin.firestore.Timestamp.now()
    });
    
    console.log('🎉 YouTube data refresh completed successfully!');
    console.log('🔍 You should now see real data in the dashboard');
    
  } catch (error) {
    console.log('❌ Refresh failed:', error.message);
    console.log('📋 Stack trace:', error.stack);
  }
}

refreshYouTubeData();