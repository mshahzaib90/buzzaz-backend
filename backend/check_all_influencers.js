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

async function checkAllInfluencers() {
  try {
    console.log(`\n=== Checking All Influencer Profiles ===\n`);

    // Get all influencer profiles
    const influencersSnapshot = await db.collection('influencers').get();
    
    if (influencersSnapshot.empty) {
      console.log('❌ No influencer profiles found in the database');
      return;
    }

    console.log(`✅ Found ${influencersSnapshot.size} influencer profile(s)\n`);

    for (const doc of influencersSnapshot.docs) {
      const profile = doc.data();
      console.log(`📋 Profile ID: ${doc.id}`);
      console.log(`👤 User ID: ${profile.userId || 'Not set'}`);
      console.log(`📧 Email: ${profile.email || 'Not set'}`);
      console.log(`🏷️  Name: ${profile.firstName || ''} ${profile.lastName || ''}`);
      
      // Check social media connections
      const instagram = profile.instagramUsername && 
        (profile.instagramFollowers > 0 || profile.instagramPostsCount > 0 || profile.instagramFollowing > 0);
      const youtube = !!profile.youtubeChannelId;
      const tiktok = profile.tiktokUsername && 
        (profile.tiktokVideosCount > 0 || profile.tiktokTotalLikes > 0 || profile.tiktokTotalViews > 0);
      
      console.log(`📸 Instagram: ${instagram ? '✅ Connected' : '❌ Not connected'}`);
      if (profile.instagramUsername) {
        console.log(`   - Username: ${profile.instagramUsername}`);
        console.log(`   - Followers: ${profile.instagramFollowers || 0}`);
        console.log(`   - Posts: ${profile.instagramPostsCount || 0}`);
      }
      
      console.log(`🎥 YouTube: ${youtube ? '✅ Connected' : '❌ Not connected'}`);
      if (profile.youtubeChannelId) {
        console.log(`   - Channel ID: ${profile.youtubeChannelId}`);
        console.log(`   - Channel Title: ${profile.youtubeChannelTitle || 'Not set'}`);
        console.log(`   - Subscribers: ${profile.youtubeSubscribers || 0}`);
      }
      
      console.log(`🎵 TikTok: ${tiktok ? '✅ Connected' : '❌ Not connected'}`);
      if (profile.tiktokUsername) {
        console.log(`   - Username: ${profile.tiktokUsername}`);
        console.log(`   - Followers: ${profile.tiktokFollowers || 0}`);
        console.log(`   - Videos: ${profile.tiktokVideosCount || 0}`);
      }
      
      console.log(`\n${'='.repeat(50)}\n`);
    }

    // Also check users collection to see if there are users without profiles
    console.log(`\n=== Checking Users Without Profiles ===\n`);
    
    const usersSnapshot = await db.collection('users').get();
    const userIds = new Set();
    const userEmails = new Map();
    
    usersSnapshot.forEach(doc => {
      userIds.add(doc.id);
      userEmails.set(doc.id, doc.data().email);
    });
    
    const profileUserIds = new Set();
    influencersSnapshot.forEach(doc => {
      if (doc.data().userId) {
        profileUserIds.add(doc.data().userId);
      }
    });
    
    const usersWithoutProfiles = [...userIds].filter(id => !profileUserIds.has(id));
    
    if (usersWithoutProfiles.length > 0) {
      console.log(`Found ${usersWithoutProfiles.length} user(s) without influencer profiles:`);
      usersWithoutProfiles.forEach(userId => {
        console.log(`- User ID: ${userId}, Email: ${userEmails.get(userId)}`);
      });
    } else {
      console.log('All users have influencer profiles');
    }

  } catch (error) {
    console.error('Error checking influencer profiles:', error);
  } finally {
    process.exit(0);
  }
}

checkAllInfluencers();