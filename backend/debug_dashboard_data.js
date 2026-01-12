const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugDashboardData() {
  try {
    console.log('=== DEBUGGING DASHBOARD DATA DISPLAY ===');
    
    // Get current user ID (the one that's logged in)
    const currentUserId = 'Lwb2si8ZmHLPSZoCpcMM';
    console.log('Current User ID:', currentUserId);
    
    // Fetch the profile data exactly like the API does
    console.log('\n=== FETCHING PROFILE DATA ===');
    const profileDoc = await db.collection('influencers').doc(currentUserId).get();
    
    if (profileDoc.exists) {
      const profileData = profileDoc.data();
      console.log('Profile exists:', true);
      console.log('Full profile data:', JSON.stringify(profileData, null, 2));
      
      // Check specific Instagram fields
      console.log('\n=== INSTAGRAM FIELDS CHECK ===');
      console.log('instagramUsername:', profileData.instagramUsername);
      console.log('followers:', profileData.followers);
      console.log('following:', profileData.following);
      console.log('postsCount:', profileData.postsCount);
      console.log('instagramTotalLikes:', profileData.instagramTotalLikes);
      
      // Check the dashboard display conditions
      console.log('\n=== DASHBOARD DISPLAY CONDITIONS ===');
      console.log('Has instagramUsername?', !!profileData.instagramUsername);
      console.log('Has followers > 0?', (profileData.followers || 0) > 0);
      console.log('Has postsCount > 0?', (profileData.postsCount || 0) > 0);
      console.log('Has following > 0?', (profileData.following || 0) > 0);
      
      const hasInstagramData = profileData.instagramUsername && 
        (profileData.followers > 0 || profileData.postsCount > 0 || profileData.following > 0);
      
      console.log('Should show Instagram data?', hasInstagramData);
      
      if (!hasInstagramData) {
        console.log('\n❌ PROBLEM IDENTIFIED:');
        if (!profileData.instagramUsername) {
          console.log('- Missing Instagram username');
        }
        if (!(profileData.followers > 0)) {
          console.log('- Followers count is 0 or missing');
        }
        if (!(profileData.postsCount > 0)) {
          console.log('- Posts count is 0 or missing');
        }
        if (!(profileData.following > 0)) {
          console.log('- Following count is 0 or missing');
        }
        console.log('This is why the dashboard shows "Instagram Not Connected" fallback');
      }
      
      // Check YouTube fields
      console.log('\n=== YOUTUBE FIELDS CHECK ===');
      console.log('youtubeChannelId:', profileData.youtubeChannelId);
      console.log('youtubeChannelTitle:', profileData.youtubeChannelTitle);
      console.log('youtubeChannelUrl:', profileData.youtubeChannelUrl);
      console.log('Should show YouTube data?', !!profileData.youtubeChannelId);
      
      // Check latest stats
      console.log('\n=== CHECKING LATEST STATS ===');
      const statsSnapshot = await db.collection('influencers')
        .doc(currentUserId)
        .collection('stats')
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();
      
      if (!statsSnapshot.empty) {
        const latestStats = statsSnapshot.docs[0].data();
        console.log('Latest stats found:', JSON.stringify(latestStats, null, 2));
        
        // Check if stats have the missing data
        console.log('\n=== STATS VS PROFILE COMPARISON ===');
        console.log('Stats followers:', latestStats.followers);
        console.log('Profile followers:', profileData.followers);
        console.log('Stats following:', latestStats.following);
        console.log('Profile following:', profileData.following);
        console.log('Stats postsCount:', latestStats.postsCount);
        console.log('Profile postsCount:', profileData.postsCount);
      } else {
        console.log('No stats found');
      }
      
    } else {
      console.log('❌ Profile does not exist for current user');
    }
    
    console.log('\n=== RECOMMENDATIONS ===');
    console.log('1. The dashboard condition requires BOTH:');
    console.log('   - instagramUsername to exist');
    console.log('   - At least one of: followers > 0, postsCount > 0, following > 0');
    console.log('2. If any of these conditions fail, it shows "Instagram Not Connected"');
    console.log('3. Check if the profile update from fix_user_profile.js actually saved the data correctly');
    
  } catch (error) {
    console.error('Error debugging dashboard data:', error);
  }
}

debugDashboardData();