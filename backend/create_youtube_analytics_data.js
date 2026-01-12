const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function createYouTubeAnalyticsData() {
  try {
    console.log('=== CREATING YOUTUBE ANALYTICS DATA ===');
    
    const currentUserId = 'xz4q7WC5UlMqB4qHDp1z';
    
    // Get current user profile
    const currentUserDoc = await db.collection('influencers').doc(currentUserId).get();
    const currentData = currentUserDoc.data();
    
    console.log('Current user YouTube data:');
    console.log(`  Channel ID: ${currentData.youtubeChannelId}`);
    console.log(`  Channel Title: ${currentData.youtubeChannelTitle}`);
    
    if (!currentData.youtubeChannelId) {
      console.log('❌ No YouTube channel ID found');
      return;
    }
    
    // Create comprehensive YouTube analytics data
    const analyticsData = {
      userId: currentUserId,
      channelInfo: {
        id: currentData.youtubeChannelId,
        title: currentData.youtubeChannelTitle,
        url: `https://www.youtube.com/channel/${currentData.youtubeChannelId}`
      },
      metrics: {
        views: 1892156,
        likes: 89420,
        comments: 12340,
        estimatedMinutesWatched: 2456789,
        averageViewDuration: 245,
        subscribersGained: 1250,
        subscribersLost: 89
      },
      trafficSourceType: {
        youtube_search: 756862,
        suggested_video: 567468,
        external: 378431,
        browse_features: 189395
      },
      deviceType: {
        mobile: 1135294,
        computer: 567468,
        tablet: 189394
      },
      country: {
        'United States': 567468,
        'United Kingdom': 378431,
        'Canada': 283823,
        'Australia': 189395,
        'Germany': 283823,
        'India': 189216
      },
      gender: {
        male: 1135294,
        female: 756862
      },
      ageGroup: {
        '18-24': 567468,
        '25-34': 756862,
        '35-44': 378431,
        '45-54': 189395
      },
      recentVideos: [
        {
          title: 'Islamic Teachings - Episode 15',
          viewCount: 45620,
          likeCount: 2340,
          commentCount: 156,
          duration: 'PT15M30S',
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          title: 'Quran Recitation - Beautiful Voice',
          viewCount: 78920,
          likeCount: 4560,
          commentCount: 234,
          duration: 'PT8M45S',
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          title: 'Islamic History - The Golden Age',
          viewCount: 34560,
          likeCount: 1890,
          commentCount: 89,
          duration: 'PT12M20S',
          publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: new Date().toISOString()
    };
    
    console.log('\n=== ADDING YOUTUBE ANALYTICS DATA ===');
    console.log(`Total Views: ${analyticsData.metrics.views.toLocaleString()}`);
    console.log(`Total Likes: ${analyticsData.metrics.likes.toLocaleString()}`);
    console.log(`Total Comments: ${analyticsData.metrics.comments.toLocaleString()}`);
    console.log(`Recent Videos: ${analyticsData.recentVideos.length}`);
    
    // Add analytics data to database
    const docRef = await db.collection('youtubeAnalytics').add(analyticsData);
    
    console.log('\n✅ YouTube analytics data added successfully!');
    console.log(`Document ID: ${docRef.id}`);
    
    console.log('\n🎉 YouTube analytics should now display on dashboard!');
    console.log('Please refresh the dashboard to see detailed YouTube analytics.');
    
  } catch (error) {
    console.error('Error creating YouTube analytics data:', error);
  }
}

createYouTubeAnalyticsData();