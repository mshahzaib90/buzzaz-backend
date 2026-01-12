const { admin, db } = require('./config/firebase');

async function debugInstagramDataLoad() {
  try {
    console.log('🔍 Debugging Instagram data loading from database...');
    
    // Check all users and their Instagram data
    const usersSnapshot = await db.collection('users').get();
    console.log('\n📊 Total users in database:', usersSnapshot.size);
    
    let usersWithData = 0;
    let usersWithoutData = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      console.log('\n👤 User ID:', userId);
      console.log('📧 Email:', userData.email);
      console.log('📱 Instagram Username:', userData.instagramUsername || 'Not set');
      
      // Check if this user has Instagram detailed data
      const instagramDoc = await db.collection('instagramDetailedData').doc(userId).get();
      
      if (instagramDoc.exists) {
        const instagramData = instagramDoc.data();
        console.log('✅ Has Instagram data:');
        console.log('  - Profile username:', instagramData.profile?.username);
        console.log('  - Followers:', instagramData.profile?.followers);
        console.log('  - Posts count:', instagramData.posts?.length || 0);
        console.log('  - Reels count:', instagramData.reels?.length || 0);
        console.log('  - Last updated:', instagramData.metadata?.lastUpdated?.toDate());
        usersWithData++;
      } else {
        console.log('❌ No Instagram data found');
        usersWithoutData++;
      }
    }
    
    console.log('\n📈 Summary:');
    console.log('Users with Instagram data:', usersWithData);
    console.log('Users without Instagram data:', usersWithoutData);
    
    // Test API endpoint simulation
    console.log('\n🔧 Testing API endpoint simulation...');
    
    if (usersWithData > 0) {
      // Find first user with data
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const instagramDoc = await db.collection('instagramDetailedData').doc(userId).get();
        
        if (instagramDoc.exists) {
          console.log('🧪 Testing API response for user:', userId);
          const data = instagramDoc.data();
          
          const apiResponse = {
            success: true,
            data: {
              profile: data.profile,
              posts: data.posts,
              reels: data.reels,
              analytics: data.analytics,
              metadata: data.metadata
            }
          };
          
          console.log('✅ API would return success:', apiResponse.success);
          console.log('✅ Profile exists:', !!apiResponse.data.profile);
          console.log('✅ Posts count:', apiResponse.data.posts?.length || 0);
          console.log('✅ Reels count:', apiResponse.data.reels?.length || 0);
          break;
        }
      }
    } else {
      console.log('❌ No users have Instagram data - this is why dashboard shows loading');
    }
    
  } catch (error) {
    console.error('❌ Error debugging Instagram data:', error);
  }
  
  process.exit(0);
}

debugInstagramDataLoad();