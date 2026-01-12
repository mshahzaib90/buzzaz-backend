const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugAPIResponse() {
  try {
    console.log('=== DEBUGGING API RESPONSE ===');
    
    const userId = 'lllGdq8BBRZQQOCIWuWC';
    console.log('User ID:', userId);
    
    // Simulate the exact backend route logic
    const influencerDoc = await db.collection('influencers').doc(userId).get();
    if (!influencerDoc.exists) {
      console.log('❌ Influencer not found for ID:', userId);
      return;
    }

    const influencerData = influencerDoc.data();
    console.log('✅ Found influencer data');
    
    // Get latest stats
    const statsSnapshot = await db.collection('influencers')
      .doc(userId)
      .collection('stats')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    let latestStats = null;
    if (!statsSnapshot.empty) {
      latestStats = statsSnapshot.docs[0].data();
      console.log('✅ Found latest stats');
    } else {
      console.log('⚠️ No stats found for influencer:', userId);
    }

    // This is exactly what the backend returns
    const response = {
      profile: {
        id: userId,
        ...influencerData
      },
      latestStats
    };
    
    console.log('\n=== BACKEND RESPONSE STRUCTURE ===');
    console.log('Response keys:', Object.keys(response));
    console.log('Profile keys:', Object.keys(response.profile));
    
    console.log('\n=== INSTAGRAM DATA IN RESPONSE ===');
    console.log('instagramUsername:', response.profile.instagramUsername);
    console.log('followers:', response.profile.followers);
    console.log('postsCount:', response.profile.postsCount);
    console.log('following:', response.profile.following);
    
    console.log('\n=== FRONTEND CONDITION CHECK ===');
    const hasInstagramUsername = !!response.profile.instagramUsername;
    const hasFollowers = (response.profile.followers || 0) > 0;
    const hasPosts = (response.profile.postsCount || 0) > 0;
    const hasFollowing = (response.profile.following || 0) > 0;
    const shouldShowInstagram = hasInstagramUsername && (hasFollowers || hasPosts || hasFollowing);
    
    console.log('Has Instagram Username:', hasInstagramUsername);
    console.log('Has Followers > 0:', hasFollowers);
    console.log('Has Posts > 0:', hasPosts);
    console.log('Has Following > 0:', hasFollowing);
    console.log('Should Show Instagram:', shouldShowInstagram);
    
    if (shouldShowInstagram) {
      console.log('✅ Instagram SHOULD be displayed');
    } else {
      console.log('❌ Instagram will show as "Not Connected"');
    }
    
    console.log('\n=== COMPLETE RESPONSE ===');
    console.log(JSON.stringify(response, null, 2));
    
  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugAPIResponse();