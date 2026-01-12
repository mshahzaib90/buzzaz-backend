const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./config/serviceAccount.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkSpecificUser() {
  try {
    console.log('=== CHECKING SPECIFIC USER PROFILE ===');
    
    // Get all influencer profiles to find the current user
    const profilesSnapshot = await db.collection('influencers').get();
    
    console.log(`Found ${profilesSnapshot.size} total profiles`);
    
    profilesSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('\n--- Profile ID:', doc.id, '---');
      console.log('Email:', data.email);
      console.log('Full Name:', data.fullName);
      console.log('Created At:', data.createdAt?.toDate?.() || data.createdAt);
      
      // Instagram data
      console.log('\n=== INSTAGRAM DATA ===');
      console.log('Instagram Username:', data.instagramUsername);
      console.log('Instagram Followers:', data.followers);
      console.log('Instagram Posts Count:', data.postsCount);
      console.log('Instagram Following:', data.following);
      console.log('Instagram Engagement Rate:', data.engagementRate);
      
      // YouTube data
      console.log('\n=== YOUTUBE DATA ===');
      console.log('YouTube Channel ID:', data.youtubeChannelId);
      console.log('YouTube Channel Title:', data.youtubeChannelTitle);
      console.log('YouTube Channel URL:', data.youtubeChannelUrl);
      
      // TikTok data
      console.log('\n=== TIKTOK DATA ===');
      console.log('TikTok Username:', data.tiktokUsername);
      console.log('TikTok Videos Count:', data.tiktokVideosCount);
      console.log('TikTok Total Likes:', data.tiktokTotalLikes);
      console.log('TikTok Total Views:', data.tiktokTotalViews);
      
      // Check what would display
      console.log('\n=== DISPLAY CONDITIONS ===');
      console.log('Has Instagram Username?', !!data.instagramUsername);
      console.log('Has YouTube Channel ID?', !!data.youtubeChannelId);
      console.log('Has TikTok Username?', !!data.tiktokUsername);
      
      console.log('Instagram would show:', !!data.instagramUsername);
      console.log('YouTube would show:', !!data.youtubeChannelId);
      console.log('TikTok would show:', !!data.tiktokUsername);
    });
    
    // Also check stats collection
    console.log('\n=== CHECKING STATS COLLECTION ===');
    const statsSnapshot = await db.collection('stats').get();
    console.log(`Found ${statsSnapshot.size} stats records`);
    
    statsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('\n--- Stats ID:', doc.id, '---');
      console.log('Influencer ID:', data.influencerId);
      console.log('Platform:', data.platform);
      console.log('Followers:', data.followers);
      console.log('Timestamp:', data.timestamp?.toDate?.() || data.timestamp);
    });
    
    console.log('\n=== END CHECK ===');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSpecificUser();