const { db } = require('./config/firebase');
const { getInstagramReelData } = require('./services/firebaseService');

async function checkReelData() {
  try {
    console.log('🔍 Checking Instagram reel data in Firebase...');
    
    // Get all users to find one with Instagram data
    const usersSnapshot = await db.collection('users').get();
    let foundUser = null;
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      if (userData.instagramUsername) {
        foundUser = { id: doc.id, data: userData };
        break;
      }
    }
    
    if (!foundUser) {
      console.log('❌ No users with Instagram username found');
      return;
    }
    
    console.log('✅ Found user with Instagram:', foundUser.data.instagramUsername);
    console.log('User ID:', foundUser.id);
    
    // Check reel data
    const reelResult = await getInstagramReelData(foundUser.id);
    console.log('Reel data result:', {
      success: reelResult.success,
      hasData: !!reelResult.data,
      totalReels: reelResult.data?.reels?.length || 0
    });
    
    if (reelResult.data?.reels?.length > 0) {
      console.log('Sample reel:', {
        id: reelResult.data.reels[0].id,
        caption: reelResult.data.reels[0].caption?.substring(0, 50) + '...',
        likesCount: reelResult.data.reels[0].likesCount,
        thumbnailUrl: !!reelResult.data.reels[0].thumbnailUrl
      });
    } else {
      console.log('❌ No reel data found for this user');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

checkReelData();