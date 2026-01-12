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

async function findLaibybabyData() {
  try {
    console.log('🔍 Searching for laibybaby data across all collections...\n');

    // Check users collection for any mention of laibybaby
    console.log('📋 Checking users collection:');
    const usersSnapshot = await db.collection('users').get();
    
    let foundLaibybaby = false;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userDataStr = JSON.stringify(userData).toLowerCase();
      
      if (userDataStr.includes('laibybaby')) {
        foundLaibybaby = true;
        console.log(`✅ Found laibybaby reference in user: ${userDoc.id}`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Instagram Username: ${userData.instagramUsername}`);
        
        // Check Instagram data structure
        if (userData.instagram) {
          console.log('   📱 Instagram data structure:');
          console.log(`      - Has profile: ${!!userData.instagram.profile}`);
          console.log(`      - Has reels: ${!!userData.instagram.reels}`);
          console.log(`      - Has posts: ${!!userData.instagram.posts}`);
          
          if (userData.instagram.reels) {
            console.log(`      - Reels count: ${userData.instagram.reels.length}`);
            if (userData.instagram.reels.length > 0) {
              console.log(`      - First reel: ${userData.instagram.reels[0].reelUrl}`);
              console.log(`      - Last updated: ${userData.instagram.reels.lastUpdated}`);
            }
          }
        }
        
        console.log('\n   📄 Full user document:');
        console.log(JSON.stringify(userData, null, 2));
      }
    }
    
    if (!foundLaibybaby) {
      console.log('❌ No laibybaby references found in users collection');
    }

    // Check influencers collection
    console.log('\n📋 Checking influencers collection:');
    try {
      const influencersSnapshot = await db.collection('influencers').get();
      
      let foundInInfluencers = false;
      for (const influencerDoc of influencersSnapshot.docs) {
        const influencerData = influencerDoc.data();
        const influencerDataStr = JSON.stringify(influencerData).toLowerCase();
        
        if (influencerDataStr.includes('laibybaby')) {
          foundInInfluencers = true;
          console.log(`✅ Found laibybaby reference in influencer: ${influencerDoc.id}`);
          console.log(JSON.stringify(influencerData, null, 2));
        }
      }
      
      if (!foundInInfluencers) {
        console.log('❌ No laibybaby references found in influencers collection');
      }
    } catch (error) {
      console.log('❌ Influencers collection might not exist or is empty');
    }

    // Check if there's a specific user document we created
    console.log('\n📋 Checking for specific user document ID from our previous work:');
    
    // Let's check the user ID we used before: sx8gqxfSNZQvlHXq7BQI
    try {
      const specificUserDoc = await db.collection('users').doc('sx8gqxfSNZQvlHXq7BQI').get();
      if (specificUserDoc.exists) {
        const specificUserData = specificUserDoc.data();
        console.log('✅ Found user sx8gqxfSNZQvlHXq7BQI:');
        console.log(`   Email: ${specificUserData.email}`);
        console.log(`   Instagram Username: ${specificUserData.instagramUsername}`);
        
        if (specificUserData.instagram) {
          console.log('   📱 Instagram data:');
          console.log(`      - Has reels: ${!!specificUserData.instagram.reels}`);
          if (specificUserData.instagram.reels) {
            console.log(`      - Reels count: ${specificUserData.instagram.reels.length}`);
            console.log(`      - Analytics: ${JSON.stringify(specificUserData.instagram.analytics, null, 2)}`);
          }
        }
        
        console.log('\n   📄 Full document:');
        console.log(JSON.stringify(specificUserData, null, 2));
      } else {
        console.log('❌ User sx8gqxfSNZQvlHXq7BQI not found');
      }
    } catch (error) {
      console.log('❌ Error checking specific user:', error.message);
    }

    // List all user IDs for reference
    console.log('\n📋 All user IDs in database:');
    usersSnapshot.docs.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.id} - ${doc.data().email || 'No email'}`);
    });

  } catch (error) {
    console.error('❌ Error searching for laibybaby data:', error);
  }
}

findLaibybabyData();