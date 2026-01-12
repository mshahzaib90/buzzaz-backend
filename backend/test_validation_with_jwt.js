require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { admin, db } = require('./config/firebase');

async function testValidationWithJWT() {
  try {
    console.log('=== Testing Instagram Validation with JWT Token ===\n');
    
    // First, find the user by email
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
    
    // Create a proper JWT token like the login endpoint does
    console.log('🔑 Creating JWT token for authentication...');
    const jwtToken = jwt.sign(
      { uid: userId, email: userData.email, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('✅ JWT token created\n');
    
    // Test the validation endpoint
    console.log('🧪 Testing validation endpoint...');
    const testUsername = 'laibybaby'; // The username shown in the UI
    
    try {
      const response = await axios.post('http://localhost:5000/api/influencer/validate-apify', {
        instagramUsername: testUsername
      }, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout for Instagram scraping
      });
      
      console.log('✅ Validation API Response:');
      console.log('   Status:', response.status);
      console.log('   Success:', response.data.success);
      console.log('   Message:', response.data.message);
      
      // Log the full response data structure for debugging
      console.log('\n🔍 Full API Response Data:');
      console.log(JSON.stringify(response.data, null, 2));
      
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
        
        if (response.data.data.reels?.reelsPreview?.length > 0) {
          console.log('\n   📹 Sample Reel:');
          const firstReel = response.data.data.reels.reelsPreview[0];
          console.log(`      ID: ${firstReel.id}`);
          console.log(`      Short Code: ${firstReel.shortCode}`);
          console.log(`      Likes: ${firstReel.likesCount}`);
          console.log(`      Comments: ${firstReel.commentsCount}`);
          console.log(`      Caption: ${firstReel.caption?.substring(0, 100)}...`);
        }
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
      
      if (apiError.code === 'ECONNABORTED') {
        console.log('   Note: Request timed out - Instagram scraping can take time');
      }
    }
    
    // Wait a moment for any async operations to complete
    console.log('\n⏳ Waiting for database operations to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check database after validation attempt
    console.log('\n🔍 Checking database after validation attempt...');
    
    // Check Instagram profile data
    try {
      const profileRef = db.collection('users').doc(userId).collection('instagram').doc('profile');
      const profileDoc = await profileRef.get();
      
      if (profileDoc.exists) {
        const profileData = profileDoc.data();
        console.log('✅ Instagram Profile Data Found:');
        console.log(`   Username: ${profileData.username}`);
        console.log(`   Full Name: ${profileData.fullName}`);
        console.log(`   Followers: ${profileData.followers}`);
        console.log(`   Following: ${profileData.following}`);
        console.log(`   Posts: ${profileData.postsCount}`);
        console.log(`   Verified: ${profileData.isVerified}`);
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
        console.log(`   Reels Array Length: ${reelsData.reels?.length}`);
        console.log(`   Last Updated: ${reelsData.lastUpdated}`);
        
        if (reelsData.reels && reelsData.reels.length > 0) {
          console.log('\n   📹 Sample Saved Reel:');
          const firstReel = reelsData.reels[0];
          console.log(`      ID: ${firstReel.id}`);
          console.log(`      Short Code: ${firstReel.shortCode}`);
          console.log(`      Likes: ${firstReel.likesCount}`);
          console.log(`      Comments: ${firstReel.commentsCount}`);
        }
      } else {
        console.log('❌ No Instagram reels data found in database');
      }
    } catch (error) {
      console.log(`❌ Error checking reels data: ${error.message}`);
    }
    
    // Check influencers collection
    try {
      const influencerRef = db.collection('influencers').doc(userId);
      const influencerDoc = await influencerRef.get();
      
      if (influencerDoc.exists) {
        const influencerData = influencerDoc.data();
        console.log('✅ Influencer Data Found:');
        console.log(`   Instagram Username: ${influencerData.instagramUsername || 'Not set'}`);
        console.log(`   Full Name: ${influencerData.fullName || 'Not set'}`);
        console.log(`   Followers: ${influencerData.followers || 0}`);
      } else {
        console.log('❌ No data found in influencers collection');
      }
    } catch (error) {
      console.log(`❌ Error checking influencers collection: ${error.message}`);
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    process.exit(0);
  }
}

testValidationWithJWT();