const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

async function testFinalVerification() {
  try {
    console.log('=== FINAL VERIFICATION TEST ===');
    
    const userId = 'ikGacihCCEDUvZt93wbD'; // new124@gmail.com
    
    console.log('Testing profile for user ID:', userId);
    
    // Get the profile document
    const profileDoc = await db.collection('influencers').doc(userId).get();
    
    if (!profileDoc.exists) {
      console.log('❌ Profile not found');
      return;
    }
    
    const profileData = profileDoc.data();
    
    console.log('\n=== PROFILE DATA VERIFICATION ===');
    console.log('Instagram Username:', profileData.instagramUsername);
    console.log('Instagram Followers:', profileData.followers);
    console.log('Instagram Posts:', profileData.postsCount);
    console.log('Instagram Following:', profileData.following);
    console.log('YouTube Channel ID:', profileData.youtubeChannelId);
    console.log('YouTube Channel Title:', profileData.youtubeChannelTitle);
    console.log('TikTok Username:', profileData.tiktokUsername);
    
    console.log('\n=== FRONTEND DISPLAY CONDITIONS ===');
    
    // Instagram condition: has username AND (followers > 0 OR posts > 0 OR following > 0)
    const hasInstagramUsername = !!profileData.instagramUsername;
    const hasFollowers = (profileData.followers || 0) > 0;
    const hasPosts = (profileData.postsCount || 0) > 0;
    const hasFollowing = (profileData.following || 0) > 0;
    const instagramCondition = hasInstagramUsername && (hasFollowers || hasPosts || hasFollowing);
    
    console.log('Instagram Display Condition:', instagramCondition ? '✅ PASS' : '❌ FAIL');
    console.log('  - Has Instagram Username:', hasInstagramUsername);
    console.log('  - Has Followers > 0:', hasFollowers);
    console.log('  - Has Posts > 0:', hasPosts);
    console.log('  - Has Following > 0:', hasFollowing);
    
    // YouTube condition: has channel ID
    const hasYouTubeChannelId = !!profileData.youtubeChannelId;
    console.log('YouTube Display Condition:', hasYouTubeChannelId ? '✅ PASS' : '❌ FAIL');
    console.log('  - Has YouTube Channel ID:', hasYouTubeChannelId);
    
    // TikTok condition: has username
    const hasTikTokUsername = !!profileData.tiktokUsername;
    console.log('TikTok Display Condition:', hasTikTokUsername ? '✅ PASS' : '❌ FAIL');
    console.log('  - Has TikTok Username:', hasTikTokUsername);
    
    console.log('\n=== OVERALL RESULT ===');
    if (instagramCondition && hasYouTubeChannelId && hasTikTokUsername) {
      console.log('🎉 SUCCESS: All three platforms should display on the dashboard!');
    } else {
      console.log('⚠️  PARTIAL: Some platforms may not display');
      if (!instagramCondition) console.log('   - Instagram will NOT display');
      if (!hasYouTubeChannelId) console.log('   - YouTube will NOT display');
      if (!hasTikTokUsername) console.log('   - TikTok will NOT display');
    }
    
    // Simulate API response structure
    console.log('\n=== API RESPONSE SIMULATION ===');
    const apiResponse = {
      profile: {
        id: userId,
        ...profileData
      },
      latestStats: null // No stats collection for this user
    };
    
    console.log('API Response Structure:');
    console.log('- profile.instagramUsername:', apiResponse.profile.instagramUsername);
    console.log('- profile.followers:', apiResponse.profile.followers);
    console.log('- profile.postsCount:', apiResponse.profile.postsCount);
    console.log('- profile.following:', apiResponse.profile.following);
    console.log('- profile.youtubeChannelId:', apiResponse.profile.youtubeChannelId);
    console.log('- latestStats:', apiResponse.latestStats);
    
    console.log('\n=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFinalVerification();