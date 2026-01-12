const axios = require('axios');
const { admin, db } = require('./config/firebase');

async function testValidationWithLogs() {
  try {
    console.log('=== Testing Instagram Validation with Detailed Logs ===\n');
    
    // First, find the user by email to get their auth token
    const usersSnapshot = await db.collection('users')
      .where('email', '==', 'mdshahzaib@gmail.com')
      .get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No user found with email: mdshahzaib@gmail.com');
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    console.log('✅ User found:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Role: ${userData.role}\n`);
    
    // Create a custom token for this user
    console.log('🔑 Creating custom token for authentication...');
    const customToken = await admin.auth().createCustomToken(userId);
    console.log('✅ Custom token created\n');
    
    // Test the validation endpoint
    console.log('🧪 Testing validation endpoint...');
    const testUsername = 'laibybaby'; // The username shown in the UI
    
    try {
      const response = await axios.post('http://localhost:5000/api/influencer/validate-apify', {
        instagramUsername: testUsername
      }, {
        headers: {
          'Authorization': `Bearer ${customToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });
      
      console.log('✅ Validation API Response:');
      console.log('   Status:', response.status);
      console.log('   Success:', response.data.success);
      console.log('   Message:', response.data.message);
      
      if (response.data.data) {
        console.log('\n📊 Profile Data:');
        console.log('   Username:', response.data.data.username);
        console.log('   Full Name:', response.data.data.profile?.fullName);
        console.log('   Followers:', response.data.data.profile?.followers);
        console.log('   Following:', response.data.data.profile?.following);
        console.log('   Posts:', response.data.data.profile?.postsCount);
        console.log('   Verified:', response.data.data.profile?.isVerified);
        
        console.log('\n🎬 Reels Data:');
        console.log('   Total Reels:', response.data.data.reels?.totalReels);
        console.log('   Reels Preview Count:', response.data.data.reels?.reelsPreview?.length);
      }
      
      if (response.data.errors && response.data.errors.length > 0) {
        console.log('\n⚠️ Errors:', response.data.errors);
      }
      
      if (response.data.warning) {
        console.log('\n⚠️ Warning:', response.data.warning);
      }
      
    } catch (apiError) {
      console.log('❌ Validation API Error:');
      console.log('   Status:', apiError.response?.status);
      console.log('   Message:', apiError.response?.data?.message || apiError.message);
      console.log('   Error Details:', apiError.response?.data?.error);
      
      if (apiError.response?.data?.errors) {
        console.log('   Errors:', apiError.response.data.errors);
      }
    }
    
    // Check database again after validation attempt
    console.log('\n🔍 Checking database after validation attempt...');
    
    // Check Instagram profile data
    try {
      const profileRef = db.collection('users').doc(userId).collection('instagram').doc('profile');
      const profileDoc = await profileRef.get();
      
      if (profileDoc.exists) {
        const profileData = profileDoc.data();
        console.log('✅ Instagram Profile Data Found:');
        console.log(`   Username: ${profileData.username}`);
        console.log(`   Followers: ${profileData.followers}`);
        console.log(`   Last Updated: ${profileData.lastUpdated}`);
      } else {
        console.log('❌ No Instagram profile data found in database');
      }
    } catch (error) {
      console.log(`❌ Error checking profile data: ${error.message}`);
    }
    
    // Check Instagram reels data
    try {
      const reelsRef = db.collection('users').doc(userId).collection('instagram').doc('reels');
      const reelsDoc = await reelsRef.get();
      
      if (reelsDoc.exists) {
        const reelsData = reelsDoc.data();
        console.log('✅ Instagram Reels Data Found:');
        console.log(`   Username: ${reelsData.username}`);
        console.log(`   Total Reels: ${reelsData.totalReels}`);
        console.log(`   Last Updated: ${reelsData.lastUpdated}`);
      } else {
        console.log('❌ No Instagram reels data found in database');
      }
    } catch (error) {
      console.log(`❌ Error checking reels data: ${error.message}`);
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    process.exit(0);
  }
}

testValidationWithLogs();