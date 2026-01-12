const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccount.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkWizardConnections() {
  try {
    console.log('=== CHECKING WIZARD CONNECTIONS ===');
    
    const currentUserId = 'Lwb2si8ZmHLPSZoCpcMM'; // Current logged-in user
    
    console.log(`\n=== CHECKING USER: ${currentUserId} ===`);
    
    // Check current profile data
    const profileDoc = await db.collection('influencers').doc(currentUserId).get();
    
    if (profileDoc.exists) {
      const profileData = profileDoc.data();
      console.log('✅ Current profile data:');
      console.log('Full Name:', profileData.fullName);
      console.log('Instagram Username:', profileData.instagramUsername);
      console.log('Followers:', profileData.followers);
      console.log('Following:', profileData.following);
      console.log('Posts Count:', profileData.postsCount);
      console.log('YouTube Channel ID:', profileData.youtubeChannelId);
      console.log('YouTube Channel Title:', profileData.youtubeChannelTitle);
      console.log('TikTok Username:', profileData.tiktokUsername);
      console.log('Created At:', profileData.createdAt);
      console.log('Updated At:', profileData.updatedAt);
      
      // Check if this looks like hardcoded data
      console.log('\n=== ANALYZING DATA SOURCE ===');
      if (profileData.instagramUsername === 'signupuser' && profileData.followers === 2000) {
        console.log('⚠️ This appears to be HARDCODED TEST DATA');
        console.log('   - Instagram username "signupuser" is generic');
        console.log('   - Followers count of exactly 2000 is suspicious');
        console.log('   - This is likely copied from test data, not wizard connections');
      } else {
        console.log('✅ This appears to be real user data');
      }
      
    } else {
      console.log('❌ No profile found for current user');
    }
    
    // Check for any wizard connection logs or history
    console.log('\n=== CHECKING FOR WIZARD CONNECTION HISTORY ===');
    
    // Look for any connection attempts in stats history
    const statsSnapshot = await db.collection('influencers')
      .doc(currentUserId)
      .collection('stats')
      .orderBy('timestamp', 'desc')
      .get();
    
    if (!statsSnapshot.empty) {
      console.log(`Found ${statsSnapshot.docs.length} stats entries:`);
      statsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. Timestamp: ${data.timestamp}`);
        console.log(`   Source: ${data.source || 'N/A'}`);
        console.log(`   Instagram: ${data.instagramUsername || 'N/A'}`);
        console.log(`   Followers: ${data.followers || 0}`);
      });
    } else {
      console.log('No stats history found');
    }
    
    // Check all users to see if there are any with real connections
    console.log('\n=== CHECKING ALL USERS FOR REAL CONNECTIONS ===');
    const allInfluencers = await db.collection('influencers').get();
    
    let realConnections = [];
    allInfluencers.docs.forEach(doc => {
      const data = doc.data();
      // Look for profiles that don't have test/hardcoded data
      if (data.instagramUsername && 
          data.instagramUsername !== 'signupuser' && 
          data.instagramUsername !== 'sample_influencer' &&
          data.instagramUsername !== 'test_user' &&
          !data.instagramUsername.includes('test')) {
        realConnections.push({
          userId: doc.id,
          fullName: data.fullName,
          instagram: data.instagramUsername,
          followers: data.followers,
          youtube: data.youtubeChannelId,
          tiktok: data.tiktokUsername,
          createdAt: data.createdAt
        });
      }
    });
    
    if (realConnections.length > 0) {
      console.log(`\n✅ Found ${realConnections.length} users with real social media connections:`);
      realConnections.forEach((conn, index) => {
        console.log(`\n${index + 1}. User ID: ${conn.userId}`);
        console.log(`   Name: ${conn.fullName || 'N/A'}`);
        console.log(`   Instagram: @${conn.instagram}`);
        console.log(`   Followers: ${conn.followers || 0}`);
        console.log(`   YouTube: ${conn.youtube || 'N/A'}`);
        console.log(`   TikTok: ${conn.tiktok || 'N/A'}`);
        console.log(`   Created: ${conn.createdAt}`);
      });
    } else {
      console.log('❌ No users found with real social media connections');
    }
    
    // Recommendations
    console.log('\n=== RECOMMENDATIONS ===');
    console.log('🔧 ISSUE: Dashboard shows hardcoded test data instead of wizard connections');
    console.log('');
    console.log('POSSIBLE CAUSES:');
    console.log('1. User never completed the wizard process');
    console.log('2. Wizard connections were not saved properly');
    console.log('3. Test data was copied over real connections');
    console.log('4. User needs to reconnect social media accounts');
    console.log('');
    console.log('SOLUTIONS:');
    console.log('1. Clear current hardcoded data');
    console.log('2. Guide user through wizard again to make real connections');
    console.log('3. Or manually update with real social media data');
    
  } catch (error) {
    console.error('❌ Error checking wizard connections:', error);
  }
}

// Run the function
checkWizardConnections()
  .then(() => {
    console.log('\n✅ Wizard connections check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Wizard connections check failed:', error);
    process.exit(1);
  });