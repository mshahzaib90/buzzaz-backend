const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function findRealConnections() {
  try {
    console.log('=== FINDING REAL WIZARD CONNECTIONS ===');
    
    // Get all influencer profiles
    const influencersSnapshot = await db.collection('influencers').get();
    
    console.log(`Found ${influencersSnapshot.size} influencer profiles`);
    
    let realConnections = [];
    
    influencersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const userId = doc.id;
      
      // Skip test data profiles
      const isTestData = (
        data.instagramUsername === 'signupuser' ||
        data.instagramUsername === 'testuser' ||
        data.followers === 2000 ||
        data.fullName?.includes('Test') ||
        data.fullName?.includes('test')
      );
      
      if (!isTestData && data.instagramUsername) {
        realConnections.push({
          userId,
          fullName: data.fullName,
          instagramUsername: data.instagramUsername,
          followers: data.followers,
          following: data.following,
          postsCount: data.postsCount,
          youtubeChannelId: data.youtubeChannelId,
          youtubeChannelTitle: data.youtubeChannelTitle,
          tiktokUsername: data.tiktokUsername,
          tiktokFollowers: data.tiktokFollowers,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      }
    });
    
    console.log('\n=== REAL CONNECTIONS FOUND ===');
    if (realConnections.length === 0) {
      console.log('❌ No real connections found - all profiles appear to be test data');
      
      console.log('\n=== ALL PROFILES ANALYSIS ===');
      influencersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`\nUser ID: ${doc.id}`);
        console.log(`  Full Name: ${data.fullName}`);
        console.log(`  Instagram: ${data.instagramUsername}`);
        console.log(`  Followers: ${data.followers}`);
        console.log(`  YouTube: ${data.youtubeChannelTitle}`);
        console.log(`  TikTok: ${data.tiktokUsername}`);
        console.log(`  Created: ${data.createdAt}`);
        
        const isTestData = (
          data.instagramUsername === 'signupuser' ||
          data.instagramUsername === 'testuser' ||
          data.followers === 2000 ||
          data.fullName?.includes('Test') ||
          data.fullName?.includes('test')
        );
        console.log(`  Is Test Data: ${isTestData}`);
      });
      
    } else {
      console.log(`✅ Found ${realConnections.length} real connections:`);
      
      realConnections.forEach((connection, index) => {
        console.log(`\n${index + 1}. User ID: ${connection.userId}`);
        console.log(`   Full Name: ${connection.fullName}`);
        console.log(`   Instagram: @${connection.instagramUsername}`);
        console.log(`   Followers: ${connection.followers?.toLocaleString() || 0}`);
        console.log(`   Following: ${connection.following?.toLocaleString() || 0}`);
        console.log(`   Posts: ${connection.postsCount || 0}`);
        if (connection.youtubeChannelTitle) {
          console.log(`   YouTube: ${connection.youtubeChannelTitle}`);
          console.log(`   YouTube ID: ${connection.youtubeChannelId}`);
        }
        if (connection.tiktokUsername) {
          console.log(`   TikTok: @${connection.tiktokUsername}`);
          console.log(`   TikTok Followers: ${connection.tiktokFollowers?.toLocaleString() || 0}`);
        }
        console.log(`   Created: ${connection.createdAt}`);
      });
    }
    
    // Check current user specifically
    console.log('\n=== CURRENT USER ANALYSIS ===');
    const currentUserId = 'Lwb2si8ZmHLPSZoCpcMM';
    const currentUserDoc = await db.collection('influencers').doc(currentUserId).get();
    
    if (currentUserDoc.exists) {
      const currentUserData = currentUserDoc.data();
      console.log('Current user profile:');
      console.log(`  Instagram: ${currentUserData.instagramUsername}`);
      console.log(`  Followers: ${currentUserData.followers}`);
      console.log(`  This appears to be test data, not real wizard connections`);
      
      if (realConnections.length > 0) {
        console.log('\n=== RECOMMENDATION ===');
        console.log('Copy data from one of the real connections to the current user');
        console.log('Or guide the user through the wizard again to make real connections');
      }
    }
    
  } catch (error) {
    console.error('Error finding real connections:', error);
  }
}

findRealConnections();