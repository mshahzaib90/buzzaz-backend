const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccount.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkUserMismatch() {
  try {
    console.log('=== INVESTIGATING USER ID MISMATCH ===');
    
    const frontendUserId = 'Lwb2si8ZmHLPSZoCpcMM'; // From console logs
    const expectedUserId = 'ikGacihCCEDUvZt93wbD'; // Where our data exists
    
    console.log(`\n=== CHECKING FRONTEND USER: ${frontendUserId} ===`);
    
    // Check if frontend user exists in users collection
    const frontendUserDoc = await db.collection('users').doc(frontendUserId).get();
    if (frontendUserDoc.exists) {
      const userData = frontendUserDoc.data();
      console.log('✅ Frontend user exists in users collection');
      console.log('Email:', userData.email);
      console.log('Role:', userData.role);
      console.log('Created At:', userData.createdAt);
      console.log('Display Name:', userData.displayName);
    } else {
      console.log('❌ Frontend user does NOT exist in users collection');
    }
    
    // Check if frontend user has influencer profile
    const frontendInfluencerDoc = await db.collection('influencers').doc(frontendUserId).get();
    if (frontendInfluencerDoc.exists) {
      const profileData = frontendInfluencerDoc.data();
      console.log('✅ Frontend user has influencer profile');
      console.log('Full Name:', profileData.fullName);
      console.log('Instagram Username:', profileData.instagramUsername);
      console.log('Followers:', profileData.followers);
    } else {
      console.log('❌ Frontend user has NO influencer profile');
    }
    
    console.log(`\n=== CHECKING EXPECTED USER: ${expectedUserId} ===`);
    
    // Check if expected user exists in users collection
    const expectedUserDoc = await db.collection('users').doc(expectedUserId).get();
    if (expectedUserDoc.exists) {
      const userData = expectedUserDoc.data();
      console.log('✅ Expected user exists in users collection');
      console.log('Email:', userData.email);
      console.log('Role:', userData.role);
      console.log('Created At:', userData.createdAt);
      console.log('Display Name:', userData.displayName);
    } else {
      console.log('❌ Expected user does NOT exist in users collection');
    }
    
    // Check if expected user has influencer profile
    const expectedInfluencerDoc = await db.collection('influencers').doc(expectedUserId).get();
    if (expectedInfluencerDoc.exists) {
      const profileData = expectedInfluencerDoc.data();
      console.log('✅ Expected user has influencer profile');
      console.log('Full Name:', profileData.fullName);
      console.log('Instagram Username:', profileData.instagramUsername);
      console.log('Followers:', profileData.followers);
      console.log('YouTube Channel ID:', profileData.youtubeChannelId);
    } else {
      console.log('❌ Expected user has NO influencer profile');
    }
    
    // Check all users to see who might be the correct one
    console.log('\n=== CHECKING ALL USERS WITH INFLUENCER PROFILES ===');
    const allInfluencers = await db.collection('influencers').get();
    
    allInfluencers.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n${index + 1}. User ID: ${doc.id}`);
      console.log(`   Full Name: ${data.fullName || 'N/A'}`);
      console.log(`   Email: ${data.email || 'N/A'}`);
      console.log(`   Instagram: ${data.instagramUsername || 'N/A'}`);
      console.log(`   Followers: ${data.followers || 0}`);
      console.log(`   YouTube: ${data.youtubeChannelId || 'N/A'}`);
      console.log(`   Created: ${data.createdAt}`);
    });
    
    // Check authentication tokens or sessions
    console.log('\n=== AUTHENTICATION ANALYSIS ===');
    console.log('The frontend is authenticated as user:', frontendUserId);
    console.log('But the data exists for user:', expectedUserId);
    console.log('');
    console.log('Possible causes:');
    console.log('1. User logged in with different account than expected');
    console.log('2. Authentication token is for wrong user');
    console.log('3. Data was created under wrong user ID');
    console.log('4. Multiple test accounts exist');
    
    // Recommendations
    console.log('\n=== RECOMMENDATIONS ===');
    if (frontendUserDoc.exists && !frontendInfluencerDoc.exists) {
      console.log('🔧 SOLUTION 1: Create influencer profile for current user');
      console.log('   - Copy data from expected user to current user');
      console.log('   - Or redirect to influencer wizard to create new profile');
    }
    
    if (expectedInfluencerDoc.exists && !frontendUserDoc.exists) {
      console.log('🔧 SOLUTION 2: Fix authentication');
      console.log('   - Login with the correct account that has the data');
      console.log('   - Or update authentication to use correct user ID');
    }
    
    console.log('🔧 SOLUTION 3: Data migration');
    console.log('   - Move influencer profile from expected user to current user');
    console.log('   - Update all references and stats');
    
  } catch (error) {
    console.error('❌ Error checking user mismatch:', error);
  }
}

// Run the function
checkUserMismatch()
  .then(() => {
    console.log('\n✅ User mismatch investigation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ User mismatch investigation failed:', error);
    process.exit(1);
  });