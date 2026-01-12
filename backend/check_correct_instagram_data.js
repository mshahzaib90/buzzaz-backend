const { admin, db } = require('./config/firebase');

async function checkCorrectInstagramData() {
  try {
    const userId = process.argv[2] || process.env.CHECK_USER_ID || 'sx8gqxfSNZQvlHXq7BQI';
    console.log('Checking Instagram data in correct location for user:', userId);
    
    // Check users/{userId}/instagram/reels collection (where data is actually stored)
    const reelsDocRef = db.collection('users').doc(userId).collection('instagram').doc('reels');
    const reelsDoc = await reelsDocRef.get();
    
    if (reelsDoc.exists) {
      const reelsData = reelsDoc.data();
      console.log('Found Instagram reels data:');
      console.log('- Username:', reelsData.username);
      console.log('- Total Reels:', reelsData.totalReels);
      console.log('- Last Updated:', reelsData.lastUpdated);
      console.log('- Reels count in array:', reelsData.reels?.length || 0);
      if (reelsData.reels && reelsData.reels.length > 0) {
        console.log('- First reel ID:', reelsData.reels[0].id);
        console.log('- First reel likes:', reelsData.reels[0].likesCount);
      }
    } else {
      console.log('No Instagram reels data found in users collection');
    }
    
    // Check users/{userId}/instagram/profile collection
    const profileDocRef = db.collection('users').doc(userId).collection('instagram').doc('profile');
    const profileDoc = await profileDocRef.get();
    
    if (profileDoc.exists) {
      const profileData = profileDoc.data();
      console.log('Found Instagram profile data:');
      console.log('- Username:', profileData.username);
      console.log('- Followers:', profileData.followers);
      console.log('- Following:', profileData.following);
      console.log('- Posts Count:', profileData.postsCount);
    } else {
      console.log('No Instagram profile data found in users collection');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

checkCorrectInstagramData();