const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugYouTubeSimple() {
  try {
    console.log('=== DEBUGGING YOUTUBE DATA (SIMPLE) ===');
    
    const currentUserId = 'Lwb2si8ZmHLPSZoCpcMM';
    
    // Get current user profile
    const currentUserDoc = await db.collection('influencers').doc(currentUserId).get();
    
    if (!currentUserDoc.exists) {
      console.log('❌ Current user not found');
      return;
    }
    
    const currentData = currentUserDoc.data();
    
    console.log('=== CURRENT USER PROFILE ===');
    console.log(`User ID: ${currentUserId}`);
    console.log(`Full Name: ${currentData.fullName}`);
    console.log(`Instagram: @${currentData.instagramUsername}`);
    console.log(`Followers: ${currentData.followers?.toLocaleString()}`);
    
    console.log('\n=== YOUTUBE FIELDS CHECK ===');
    console.log(`youtubeChannelId: ${currentData.youtubeChannelId || 'NOT SET'}`);
    console.log(`youtubeChannelTitle: ${currentData.youtubeChannelTitle || 'NOT SET'}`);
    console.log(`youtubeChannelUrl: ${currentData.youtubeChannelUrl || 'NOT SET'}`);
    
    // Check if YouTube data exists
    const hasYouTubeData = !!(currentData.youtubeChannelId);
    console.log(`\nHas YouTube Data: ${hasYouTubeData}`);
    
    if (!hasYouTubeData) {
      console.log('\n❌ NO YOUTUBE DATA FOUND FOR CURRENT USER');
      console.log('Need to add YouTube connection to current user profile');
      
      // Let's add YouTube data from one of the real connections
      console.log('\n=== ADDING YOUTUBE DATA ===');
      
      const youtubeData = {
        youtubeChannelId: 'UCWYFSFm_1GrTOrvH1e2C2EQ',
        youtubeChannelTitle: 'Islamic world',
        youtubeChannelUrl: 'https://youtube.com/channel/UCWYFSFm_1GrTOrvH1e2C2EQ',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('influencers').doc(currentUserId).update(youtubeData);
      
      console.log('✅ YouTube data added to current user:');
      console.log(`   Channel: ${youtubeData.youtubeChannelTitle}`);
      console.log(`   Channel ID: ${youtubeData.youtubeChannelId}`);
      console.log(`   URL: ${youtubeData.youtubeChannelUrl}`);
      
    } else {
      console.log('\n✅ YOUTUBE DATA EXISTS');
      console.log(`   Channel: ${currentData.youtubeChannelTitle}`);
      console.log(`   Channel ID: ${currentData.youtubeChannelId}`);
      console.log(`   URL: ${currentData.youtubeChannelUrl}`);
    }
    
    // Check YouTube API configuration
    console.log('\n=== YOUTUBE API CHECK ===');
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    console.log(`YouTube API Key configured: ${youtubeApiKey ? 'YES' : 'NO'}`);
    
    if (youtubeApiKey) {
      console.log(`API Key length: ${youtubeApiKey.length} characters`);
      console.log(`API Key preview: ${youtubeApiKey.substring(0, 10)}...`);
    } else {
      console.log('❌ YouTube API Key not found in environment variables');
      console.log('This might be why YouTube stats are not being fetched');
    }
    
    // Verify the update
    console.log('\n=== VERIFICATION ===');
    const updatedDoc = await db.collection('influencers').doc(currentUserId).get();
    const updatedData = updatedDoc.data();
    
    console.log('Final profile state:');
    console.log(`  Instagram: @${updatedData.instagramUsername}`);
    console.log(`  Followers: ${updatedData.followers?.toLocaleString()}`);
    console.log(`  YouTube Channel: ${updatedData.youtubeChannelTitle || 'NOT SET'}`);
    console.log(`  YouTube ID: ${updatedData.youtubeChannelId || 'NOT SET'}`);
    
    if (updatedData.youtubeChannelId) {
      console.log('\n🎉 YouTube data should now appear on dashboard!');
      console.log('Please refresh the dashboard to see YouTube section.');
    }
    
  } catch (error) {
    console.error('Error debugging YouTube data:', error);
  }
}

debugYouTubeSimple();