const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./config/serviceAccount.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function debugProfileData() {
  try {
    console.log('=== DEBUGGING PROFILE DATA ===');
    
    // Get all influencer profiles
    const profilesSnapshot = await db.collection('influencers').get();
    
    console.log(`Found ${profilesSnapshot.size} profiles`);
    
    profilesSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('\n--- Profile:', doc.id, '---');
      console.log('Email:', data.email);
      console.log('Full Name:', data.fullName);
      
      // Instagram data
      console.log('Instagram Username:', data.instagramUsername);
      console.log('Instagram Followers:', data.followers);
      console.log('Instagram Posts Count:', data.postsCount);
      console.log('Instagram Following:', data.following);
      console.log('Instagram Engagement Rate:', data.engagementRate);
      
      // YouTube data
      console.log('YouTube Channel ID:', data.youtubeChannelId);
      console.log('YouTube Channel Title:', data.youtubeChannelTitle);
      console.log('YouTube Channel URL:', data.youtubeChannelUrl);
      
      // TikTok data
      console.log('TikTok Username:', data.tiktokUsername);
      console.log('TikTok Videos Count:', data.tiktokVideosCount);
      console.log('TikTok Total Likes:', data.tiktokTotalLikes);
      console.log('TikTok Total Views:', data.tiktokTotalViews);
      
      // Check display conditions
      const instagramCondition = data.instagramUsername && (data.followers > 0 || data.postsCount > 0 || data.following > 0);
      const youtubeCondition = !!data.youtubeChannelId;
      const tiktokCondition = data.tiktokUsername && (data.tiktokVideosCount > 0 || data.tiktokTotalLikes > 0 || data.tiktokTotalViews > 0);
      
      console.log('--- Display Conditions ---');
      console.log('Instagram should show:', instagramCondition);
      console.log('YouTube should show:', youtubeCondition);
      console.log('TikTok should show:', tiktokCondition);
    });
    
    console.log('\n=== END DEBUG ===');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugProfileData();