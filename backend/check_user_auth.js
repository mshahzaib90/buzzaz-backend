const { admin, db } = require('./config/firebase');

async function checkUserAuth() {
  try {
    console.log('=== CHECKING USER AUTHENTICATION ===');
    
    // Get all users from the database
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`Found ${usersSnapshot.size} users in the database:`);
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      console.log(`\nUser ID: ${doc.id}`);
      console.log(`Email: ${userData.email}`);
      console.log(`Role: ${userData.role}`);
      console.log(`Created: ${userData.createdAt}`);
      console.log(`Last Login: ${userData.lastLoginAt || 'Never'}`);
      console.log(`Active: ${userData.isActive}`);
    });
    
    console.log('\n=== CHECKING INFLUENCER PROFILES ===');
    
    // Get all influencer profiles
    const influencersSnapshot = await db.collection('influencers').get();
    
    console.log(`Found ${influencersSnapshot.size} influencer profiles:`);
    
    influencersSnapshot.forEach(doc => {
      const profileData = doc.data();
      console.log(`\nProfile ID: ${doc.id}`);
      console.log(`Full Name: ${profileData.fullName}`);
      console.log(`Email: ${profileData.email}`);
      console.log(`Instagram Username: ${profileData.instagramUsername || 'Not connected'}`);
      console.log(`YouTube Channel ID: ${profileData.youtubeChannelId || 'Not connected'}`);
      console.log(`TikTok Username: ${profileData.tiktokUsername || 'Not connected'}`);
      console.log(`Created: ${profileData.createdAt}`);
    });
    
    console.log('\n=== END CHECK ===');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUserAuth();