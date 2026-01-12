require('dotenv').config();
const { admin, db } = require('./config/firebase');

async function setupInstagramUser() {
  try {
    console.log('🔧 Setting up Instagram username for user...');
    
    const userId = '0ZPlyBVkHGHUEPRcxB2I';
    
    // Update influencer profile with Instagram username
    await db.collection('influencers').doc(userId).update({
      instagramUsername: 'test_user_instagram',
      followers: 1000,
      following: 500,
      postsCount: 25,
      engagementRate: 3.5
    });
    
    console.log('✅ Influencer profile updated with Instagram data');
    
    // Now the user should have Instagram data in the instagramDetailedData collection
    // Let's check if it exists, if not, we'll use the test data we added earlier
    const instagramDataDoc = await db.collection('instagramDetailedData').doc(userId).get();
    
    if (instagramDataDoc.exists) {
      console.log('✅ Instagram detailed data already exists');
    } else {
      console.log('❌ No Instagram detailed data found');
      console.log('The test data script should have added this. Let me check...');
      
      // Check all Instagram detailed data
      const allInstagramData = await db.collection('instagramDetailedData').get();
      console.log('Total Instagram data entries:', allInstagramData.size);
      
      if (allInstagramData.size > 0) {
        // Copy data from first entry to our user
        const firstEntry = allInstagramData.docs[0];
        const firstData = firstEntry.data();
        
        await db.collection('instagramDetailedData').doc(userId).set({
          ...firstData,
          username: 'test_user_instagram',
          profile: {
            ...firstData.profile,
            username: 'test_user_instagram'
          },
          metadata: {
            ...firstData.metadata,
            lastUpdated: new Date()
          }
        });
        
        console.log('✅ Copied Instagram detailed data to user');
      }
    }
    
    console.log('🎉 Instagram setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up Instagram user:', error.message);
  }
  
  process.exit(0);
}

setupInstagramUser();