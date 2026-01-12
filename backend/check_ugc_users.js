require('dotenv').config();
const { db } = require('./config/firebase');

async function checkUGCUsers() {
  try {
    console.log('🔍 Checking UGC Creator Users');
    console.log('============================');
    
    // Get all users with ugc_creator role
    const ugcUsersSnapshot = await db.collection('users')
      .where('role', '==', 'ugc_creator')
      .get();
    
    console.log(`Found ${ugcUsersSnapshot.size} UGC creator users:`);
    
    if (ugcUsersSnapshot.empty) {
      console.log('❌ No UGC creator users found in the system');
      console.log('\n💡 To test YouTube connection, you need to:');
      console.log('1. Register a new user with ugc_creator role');
      console.log('2. Or change an existing user\'s role to ugc_creator');
      return;
    }
    
    ugcUsersSnapshot.forEach((doc, index) => {
      const userData = doc.data();
      console.log(`\n${index + 1}. User ID: ${doc.id}`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Role: ${userData.role}`);
      console.log(`   Active: ${userData.isActive}`);
      console.log(`   Created: ${userData.createdAt}`);
    });
    
    // Check if any UGC users have profiles
    console.log('\n🔍 Checking UGC profiles...');
    const ugcProfilesSnapshot = await db.collection('ugc_profiles').get();
    
    console.log(`Found ${ugcProfilesSnapshot.size} UGC profiles:`);
    
    ugcProfilesSnapshot.forEach((doc, index) => {
      const profileData = doc.data();
      console.log(`\n${index + 1}. Profile ID: ${doc.id}`);
      console.log(`   User ID: ${profileData.userId}`);
      console.log(`   Name: ${profileData.firstName} ${profileData.lastName}`);
      console.log(`   YouTube Connected: ${!!profileData.youtubeChannelId}`);
      if (profileData.youtubeChannelId) {
        console.log(`   YouTube Channel: ${profileData.youtubeChannelTitle}`);
        console.log(`   YouTube URL: ${profileData.youtubeChannelUrl}`);
      }
    });
    
    console.log('\n✅ User check completed');
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  }
}

checkUGCUsers();