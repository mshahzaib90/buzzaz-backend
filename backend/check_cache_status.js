require('dotenv').config();
const { admin, db } = require('./config/firebase');

async function checkCacheStatus() {
  try {
    console.log('🔍 Checking cache status for Instagram data...');
    
    const userId = '0ZPlyBVkHGHUEPRcxB2I';
    
    // Check if user exists in influencers collection
    const userDoc = await db.collection('influencers').doc(userId).get();
    if (!userDoc.exists) {
      console.log('❌ User not found in influencers collection');
      return;
    }
    
    const userData = userDoc.data();
    console.log('✅ User found:', userData.email);
    console.log('Instagram Username:', userData.instagramUsername);
    
    // Check if cached Instagram data exists
    const cachedDoc = await db.collection('instagramDetailedData').doc(userId).get();
    if (!cachedDoc.exists) {
      console.log('❌ No cached Instagram data found');
      console.log('This explains why the endpoint returns 404');
      
      // Check if there are any cached data entries at all
      const allCachedData = await db.collection('instagramDetailedData').get();
      console.log(`Total cached Instagram data entries: ${allCachedData.size}`);
      
      if (allCachedData.size > 0) {
        console.log('Available cached data for users:');
        allCachedData.forEach(doc => {
          console.log(`- ${doc.id}`);
        });
      }
    } else {
      console.log('✅ Cached Instagram data found');
      const cachedData = cachedDoc.data();
      console.log('Cached data summary:');
      console.log('- Username:', cachedData.username);
      console.log('- Posts count:', cachedData.posts?.length || 0);
      console.log('- Reels count:', cachedData.reels?.length || 0);
      console.log('- Last updated:', cachedData.lastUpdated);
    }
    
  } catch (error) {
    console.error('Error checking cache status:', error);
  }
  
  process.exit(0);
}

checkCacheStatus();