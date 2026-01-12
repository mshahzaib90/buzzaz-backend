require('dotenv').config({ path: './backend/.env' });
const { admin, db } = require('./config/firebase');
const youtubeService = require('./services/youtubeService');

async function refreshForInfluencer(influencerId, channelId) {
  try {
    console.log(`\n🔄 Refreshing YouTube for ${influencerId} (channel: ${channelId})`);
    const youtubeData = await youtubeService.getComprehensiveChannelData(channelId);

    const analyticsData = {
      userId: influencerId,
      userType: 'influencer',
      channelId: channelId,
      channelTitle: youtubeData.channelTitle,
      subscriberCount: youtubeData.subscriberCount,
      viewCount: youtubeData.viewCount,
      videoCount: youtubeData.videoCount,
      views: youtubeData.analytics.views,
      likes: youtubeData.aggregatedMetrics?.totalLikes || 0,
      comments: youtubeData.aggregatedMetrics?.totalComments || 0,
      estimatedMinutesWatched: youtubeData.analytics.estimatedMinutesWatched,
      averageViewDuration: youtubeData.analytics.averageViewDuration,
      subscribersGained: youtubeData.analytics.subscribersGained,
      subscribersLost: youtubeData.analytics.subscribersLost,
      trafficSourceType: youtubeData.analytics.trafficSourceType,
      deviceType: youtubeData.analytics.deviceType,
      country: youtubeData.analytics.country,
      gender: youtubeData.analytics.gender,
      ageGroup: youtubeData.analytics.ageGroup,
      recentVideos: youtubeData.videos.map(v => ({
        title: v.title,
        videoId: v.videoId,
        videoUrl: v.videoUrl,
        embedUrl: v.embedUrl,
        viewCount: v.viewCount,
        likeCount: v.likeCount,
        commentCount: v.commentCount,
        duration: v.duration,
        publishedAt: v.publishedAt
      })),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('youtubeAnalytics').add(analyticsData);
    console.log(`✅ Stored analytics for ${influencerId} with ${analyticsData.recentVideos.length} videos`);
  } catch (err) {
    console.error(`❌ Failed for ${influencerId}:`, err.message);
  }
}

async function run() {
  try {
    console.log('📡 Starting refresh for all influencers with connected YouTube channels...');
    const snapshot = await db.collection('influencers').get();
    let count = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const channelId = data.youtubeChannelId;
      if (channelId && channelId.startsWith('UC')) {
        count++;
        await refreshForInfluencer(doc.id, channelId);
      }
    }
    console.log(`\n🎉 Completed. Refreshed ${count} influencer(s).`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Script error:', error);
    process.exit(1);
  }
}

run();