const { admin, db } = require('./config/firebase');

async function checkInstagramData() {
  try {
    const userId = 'sx8gqxfSNZQvlHXq7BQI';
    console.log('Checking Instagram data for user:', userId);
    
    // Check influencer document
    const influencerDoc = await db.collection('influencers').doc(userId).get();
    if (influencerDoc.exists) {
      const data = influencerDoc.data();
      console.log('Influencer data:');
      console.log('- Instagram Username:', data.instagramUsername);
      console.log('- Latest Stats:', data.latestStats ? 'Present' : 'Not present');
      if (data.latestStats) {
        console.log('- Latest Stats Keys:', Object.keys(data.latestStats));
      }
    }
    
    // Check instagram_data collection
    const instagramDataDoc = await db.collection('instagram_data').doc(userId).get();
    if (instagramDataDoc.exists) {
      const instagramData = instagramDataDoc.data();
      console.log('Instagram data document exists');
      console.log('- Keys:', Object.keys(instagramData));
      if (instagramData.posts) {
        console.log('- Posts count:', instagramData.posts.length);
        console.log('- First post type:', instagramData.posts[0]?.media_type);
      }
      if (instagramData.reels) {
        console.log('- Reels count:', instagramData.reels.length);
      }
    } else {
      console.log('No Instagram data document found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

checkInstagramData();