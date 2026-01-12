const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./config/firebase.js');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function debugCurrentUserReels() {
  try {
    console.log('🔍 Debugging current user reel data for dashboard...\n');

    // First, let's check all users to see who has Instagram data
    console.log('📋 Checking all users with Instagram data:');
    const usersSnapshot = await db.collection('users').get();
    
    let usersWithInstagram = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.instagram || userData.instagramUsername) {
        usersWithInstagram.push({
          id: userDoc.id,
          email: userData.email,
          instagramUsername: userData.instagramUsername,
          hasInstagramData: !!userData.instagram
        });
      }
    }

    console.log(`Found ${usersWithInstagram.length} users with Instagram data:`);
    usersWithInstagram.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (@${user.instagramUsername}) - Has data: ${user.hasInstagramData}`);
    });

    // Check the most recent user (likely the current dashboard user)
    if (usersWithInstagram.length > 0) {
      const currentUser = usersWithInstagram[usersWithInstagram.length - 1]; // Get last user
      console.log(`\n🎯 Examining user: ${currentUser.email} (@${currentUser.instagramUsername})`);
      
      const userDoc = await db.collection('users').doc(currentUser.id).get();
      const userData = userDoc.data();
      
      console.log('\n📊 User Instagram Data Structure:');
      if (userData.instagram) {
        console.log('✅ Instagram object exists');
        
        // Check profile data
        if (userData.instagram.profile) {
          console.log('✅ Profile data exists');
          console.log(`   - Followers: ${userData.instagram.profile.followersCount}`);
          console.log(`   - Following: ${userData.instagram.profile.followingCount}`);
          console.log(`   - Posts: ${userData.instagram.profile.postsCount}`);
        }
        
        // Check reels data
        if (userData.instagram.reels) {
          console.log('✅ Reels data exists');
          console.log(`   - Reels array length: ${userData.instagram.reels.length}`);
          console.log(`   - First reel URL: ${userData.instagram.reels[0]?.reelUrl || 'N/A'}`);
          console.log(`   - Last updated: ${userData.instagram.reels.lastUpdated || 'N/A'}`);
          
          // Show first few reels
          console.log('\n🎬 First 3 reels:');
          userData.instagram.reels.slice(0, 3).forEach((reel, index) => {
            console.log(`   ${index + 1}. ${reel.reelUrl}`);
            console.log(`      - Likes: ${reel.likesCount}`);
            console.log(`      - Comments: ${reel.commentsCount}`);
            console.log(`      - Caption: ${reel.caption?.substring(0, 50)}...`);
          });
        } else {
          console.log('❌ No reels data found');
        }
        
        // Check posts data
        if (userData.instagram.posts) {
          console.log('✅ Posts data exists');
          if (userData.instagram.posts.reels) {
            console.log(`   - Posts.reels array length: ${userData.instagram.posts.reels.length}`);
          }
        }
        
        // Check analytics
        if (userData.instagram.analytics) {
          console.log('✅ Analytics data exists');
          console.log(`   - Total posts: ${userData.instagram.analytics.totalPosts}`);
          console.log(`   - Average likes: ${userData.instagram.analytics.averageLikes}`);
          console.log(`   - Total engagement: ${userData.instagram.analytics.totalEngagement}`);
        }
        
      } else {
        console.log('❌ No Instagram data found for this user');
      }
      
      // Check if this is the laibybaby user we worked on
      if (currentUser.instagramUsername === 'laibybaby') {
        console.log('\n🎯 This is the laibybaby user we just fixed!');
        console.log('The reels should be showing in the dashboard...');
      }
    }

    console.log('\n🔍 Checking for any users with "laibybaby" username specifically:');
    const laibybaby = usersWithInstagram.find(user => user.instagramUsername === 'laibybaby');
    if (laibybaby) {
      console.log(`✅ Found laibybaby user: ${laibybaby.email} (ID: ${laibybaby.id})`);
      
      // Get detailed data for laibybaby
      const laibybabyDoc = await db.collection('users').doc(laibybaby.id).get();
      const laibybabyData = laibybabyDoc.data();
      
      console.log('\n📱 Laibybaby Instagram Data:');
      console.log(`- Has instagram object: ${!!laibybabyData.instagram}`);
      console.log(`- Has reels: ${!!laibybabyData.instagram?.reels}`);
      console.log(`- Reels count: ${laibybabyData.instagram?.reels?.length || 0}`);
      
      if (laibybabyData.instagram?.reels?.length > 0) {
        console.log('\n✅ Reels data exists! The issue might be in the API endpoint or frontend.');
        console.log('Sample reel data:');
        console.log(JSON.stringify(laibybabyData.instagram.reels[0], null, 2));
      }
    } else {
      console.log('❌ No laibybaby user found');
    }

  } catch (error) {
    console.error('❌ Error debugging user reels:', error);
  }
}

debugCurrentUserReels();