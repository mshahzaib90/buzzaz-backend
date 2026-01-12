require('dotenv').config();
const { admin } = require('./config/firebase');

const debugCurrentUser = async () => {
  try {
    console.log('=== Current User Debug ===');
    
    // Check if we have the user we've been testing with
    const userId = 'sx8gqxfSNZQvlHXq7BQI';
    console.log('Looking for user:', userId);
    
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log('❌ User not found in database');
      
      // Let's see what users exist
      console.log('\n=== Available Users ===');
      const usersSnapshot = await admin.firestore().collection('users').limit(10).get();
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`User ID: ${doc.id}`);
        console.log(`  Email: ${data.email}`);
        console.log(`  Role: ${data.role}`);
        console.log(`  Instagram Username: ${data.instagramUsername || 'Not set'}`);
        console.log('---');
      });
      return;
    }
    
    const userData = userDoc.data();
    console.log('✅ User found:');
    console.log('  Email:', userData.email);
    console.log('  Role:', userData.role);
    console.log('  Instagram Username:', userData.instagramUsername || 'Not set');
    console.log('  Created At:', userData.createdAt);
    console.log('  Is Active:', userData.isActive);
    
    // Check if this user has Instagram data
    console.log('\n=== Instagram Data Check ===');
    const instagramDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('instagram')
      .doc('reels')
      .get();
    
    if (instagramDoc.exists) {
      const instagramData = instagramDoc.data();
      console.log('✅ Instagram data found:');
      console.log('  Username:', instagramData.username);
      console.log('  Total Reels:', instagramData.totalReels);
      console.log('  Reels Count:', instagramData.reels ? instagramData.reels.length : 0);
      console.log('  Last Updated:', instagramData.lastUpdated);
    } else {
      console.log('❌ No Instagram data found for this user');
    }
    
    // Check profile data
    console.log('\n=== Profile Data Check ===');
    const profileDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('instagram')
      .doc('profile')
      .get();
    
    if (profileDoc.exists) {
      const profileData = profileDoc.data();
      console.log('✅ Profile data found:');
      console.log('  Username:', profileData.username);
      console.log('  Followers:', profileData.followers);
      console.log('  Following:', profileData.following);
      console.log('  Posts Count:', profileData.postsCount);
    } else {
      console.log('❌ No profile data found for this user');
    }
    
  } catch (error) {
    console.error('Error in debug:', error);
  }
};

debugCurrentUser();