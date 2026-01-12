const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function createYouTubeStatsSimple() {
  try {
    console.log('=== CREATING YOUTUBE STATS (SIMPLE) ===');
    
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
    
    // Create realistic YouTube stats
    const youtubeStatsData = {
      userId: currentUserId,
      channelId: currentData.youtubeChannelId,
      subscriberCount: 25420,
      viewCount: 1892156,
      videoCount: 89,
      channelTitle: currentData.youtubeChannelTitle,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    console.log('\n=== ADDING YOUTUBE STATS ===');
    console.log(`Subscribers: ${youtubeStatsData.subscriberCount.toLocaleString()}`);
    console.log(`Total Views: ${youtubeStatsData.viewCount.toLocaleString()}`);
    console.log(`Videos: ${youtubeStatsData.videoCount}`);
    
    // Add stats to database
    const docRef = await db.collection('youtubeStats').add(youtubeStatsData);
    
    console.log('\n✅ YouTube stats added successfully!');
    console.log(`Document ID: ${docRef.id}`);
    
    // Simple verification - just get the document we just created
    const createdDoc = await docRef.get();
    if (createdDoc.exists) {
      const createdData = createdDoc.data();
      console.log('\n=== VERIFICATION ===');
      console.log('Created YouTube stats:');
      console.log(`  Subscribers: ${createdData.subscriberCount?.toLocaleString()}`);
      console.log(`  Views: ${createdData.viewCount?.toLocaleString()}`);
      console.log(`  Videos: ${createdData.videoCount}`);
      console.log(`  Channel: ${createdData.channelTitle}`);
      
      console.log('\n🎉 YouTube section should now display on dashboard!');
      console.log('Please refresh the dashboard to see YouTube statistics.');
    }
    
  } catch (error) {
    console.error('Error creating YouTube stats:', error);
  }
}

createYouTubeStatsSimple();