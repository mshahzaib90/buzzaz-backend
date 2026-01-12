const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./config/serviceAccount.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

async function checkUserSocialConnections() {
  try {
    const userEmail = 'helloworld@gmail.com';
    console.log(`\n=== Checking Social Media Connections for ${userEmail} ===\n`);

    // Get user document
    const usersSnapshot = await db.collection('users').where('email', '==', userEmail).get();
    
    if (usersSnapshot.empty) {
      console.log('❌ User not found in users collection');
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;
    
    console.log(`✅ User found with ID: ${userId}`);
    console.log(`📧 Email: ${userData.email}`);
    console.log(`👤 Name: ${userData.firstName} ${userData.lastName}`);

    // Get influencer profile
    const influencerSnapshot = await db.collection('influencers').where('userId', '==', userId).get();
    
    if (influencerSnapshot.empty) {
      console.log('❌ No influencer profile found');
      return;
    }

    const influencerDoc = influencerSnapshot.docs[0];
    const profile = influencerDoc.data();
    
    console.log(`\n=== Profile Data ===`);
    console.log(`Profile ID: ${influencerDoc.id}`);
    
    // Check Instagram
    console.log(`\n📸 INSTAGRAM:`);
    console.log(`  Username: ${profile.instagramUsername || 'Not set'}`);
    console.log(`  Followers: ${profile.instagramFollowers || 0}`);
    console.log(`  Following: ${profile.instagramFollowing || 0}`);
    console.log(`  Posts: ${profile.instagramPostsCount || 0}`);
    console.log(`  Engagement Rate: ${profile.instagramEngagementRate || 0}`);
    console.log(`  Verified: ${profile.instagramIsVerified || false}`);
    console.log(`  Private: ${profile.instagramIsPrivate || false}`);
    console.log(`  Avatar URL: ${profile.instagramAvatarUrl || 'Not set'}`);
    
    // Instagram display logic
    const instagramWillDisplay = profile.instagramUsername && 
      (profile.instagramFollowers > 0 || profile.instagramPostsCount > 0 || profile.instagramFollowing > 0);
    console.log(`  🎯 Will Display on Dashboard: ${instagramWillDisplay ? '✅ YES' : '❌ NO'}`);
    
    // Check YouTube
    console.log(`\n🎥 YOUTUBE:`);
    console.log(`  Channel ID: ${profile.youtubeChannelId || 'Not set'}`);
    console.log(`  Channel Title: ${profile.youtubeChannelTitle || 'Not set'}`);
    console.log(`  Channel URL: ${profile.youtubeChannelUrl || 'Not set'}`);
    console.log(`  Subscribers: ${profile.youtubeSubscribers || 0}`);
    console.log(`  Videos: ${profile.youtubeVideos || 0}`);
    console.log(`  Total Likes: ${profile.youtubeTotalLikes || 0}`);
    
    // YouTube display logic
    const youtubeWillDisplay = !!profile.youtubeChannelId;
    console.log(`  🎯 Will Display on Dashboard: ${youtubeWillDisplay ? '✅ YES' : '❌ NO'}`);
    
    // Check TikTok
    console.log(`\n🎵 TIKTOK:`);
    console.log(`  Username: ${profile.tiktokUsername || 'Not set'}`);
    console.log(`  Followers: ${profile.tiktokFollowers || 0}`);
    console.log(`  Following: ${profile.tiktokFollowing || 0}`);
    console.log(`  Videos Count: ${profile.tiktokVideosCount || 0}`);
    console.log(`  Total Likes: ${profile.tiktokTotalLikes || 0}`);
    console.log(`  Total Views: ${profile.tiktokTotalViews || 0}`);
    
    // TikTok display logic
    const tiktokWillDisplay = profile.tiktokUsername && 
      (profile.tiktokVideosCount > 0 || profile.tiktokTotalLikes > 0 || profile.tiktokTotalViews > 0);
    console.log(`  🎯 Will Display on Dashboard: ${tiktokWillDisplay ? '✅ YES' : '❌ NO'}`);
    
    // Summary
    console.log(`\n=== SUMMARY ===`);
    console.log(`Instagram: ${instagramWillDisplay ? '✅ Connected & Will Display' : '❌ Not displaying'}`);
    console.log(`YouTube: ${youtubeWillDisplay ? '✅ Connected & Will Display' : '❌ Not displaying'}`);
    console.log(`TikTok: ${tiktokWillDisplay ? '✅ Connected & Will Display' : '❌ Not displaying'}`);
    
    const totalConnected = [instagramWillDisplay, youtubeWillDisplay, tiktokWillDisplay].filter(Boolean).length;
    console.log(`\n📊 Total Platforms Displaying: ${totalConnected}/3`);
    
    if (!youtubeWillDisplay && profile.youtubeChannelTitle) {
      console.log(`\n⚠️  YouTube Issue: Channel title exists but no Channel ID`);
    }
    
    if (!tiktokWillDisplay && profile.tiktokUsername) {
      console.log(`\n⚠️  TikTok Issue: Username exists but all stats are 0`);
    }

  } catch (error) {
    console.error('Error checking user social connections:', error);
  } finally {
    process.exit(0);
  }
}

checkUserSocialConnections();