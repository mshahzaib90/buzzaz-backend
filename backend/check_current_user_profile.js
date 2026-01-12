const { admin, db } = require('./config/firebase');

async function checkCurrentUserProfile() {
  try {
    console.log('=== CHECKING CURRENT USER PROFILE ===');
    
    const currentUserId = 'X0IqcgoiqNm6OgOKKKT1'; // Most recent user from analysis
    
    // Get user data
    const userDoc = await db.collection('users').doc(currentUserId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('=== USER DATA ===');
      console.log('User ID:', currentUserId);
      console.log('Email:', userData.email);
      console.log('Role:', userData.role);
      console.log('Created:', userData.createdAt);
      console.log('Last Login:', userData.lastLoginAt);
    } else {
      console.log('User not found!');
    }
    
    // Get profile data
    const profileDoc = await db.collection('influencers').doc(currentUserId).get();
    if (profileDoc.exists) {
      const profileData = profileDoc.data();
      console.log('\n=== PROFILE DATA ===');
      console.log('Profile ID:', currentUserId);
      console.log('Full Name:', profileData.fullName);
      console.log('Email:', profileData.email);
      console.log('Created:', profileData.createdAt);
      
      console.log('\n=== PLATFORM CONNECTIONS ===');
      console.log('Instagram Username:', profileData.instagramUsername || 'Not connected');
      console.log('Instagram Followers:', profileData.followers || 0);
      console.log('Instagram Posts:', profileData.postsCount || 0);
      console.log('Instagram Following:', profileData.following || 0);
      
      console.log('YouTube Channel ID:', profileData.youtubeChannelId || 'Not connected');
      console.log('YouTube Channel Title:', profileData.youtubeChannelTitle || 'N/A');
      
      console.log('TikTok Username:', profileData.tiktokUsername || 'Not connected');
      console.log('TikTok Followers:', profileData.tiktokFollowers || 0);
      console.log('TikTok Videos:', profileData.tiktokVideosCount || 0);
      
      console.log('\n=== DISPLAY CONDITIONS ===');
      console.log('Instagram Display:', !!profileData.instagramUsername);
      console.log('YouTube Display:', !!profileData.youtubeChannelId);
      console.log('TikTok Display:', !!profileData.tiktokUsername);
      
    } else {
      console.log('Profile not found!');
    }
    
    // Check stats collection
    const statsSnapshot = await db.collection('influencers')
      .doc(currentUserId)
      .collection('stats')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();
      
    console.log(`\n=== STATS DATA (${statsSnapshot.size} records) ===`);
    statsSnapshot.forEach(doc => {
      const statsData = doc.data();
      console.log(`Timestamp: ${statsData.timestamp}`);
      console.log(`Followers: ${statsData.followers}, Posts: ${statsData.postsCount}, Following: ${statsData.following}`);
    });
    
    console.log('\n=== END CHECK ===');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCurrentUserProfile();