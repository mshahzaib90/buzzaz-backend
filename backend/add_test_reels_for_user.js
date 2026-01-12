const { db } = require('./config/firebase');
const { saveInstagramReelData } = require('./services/firebaseService');

async function addTestReelsForUser() {
  try {
    const userId = process.argv[2];
    let username = process.argv[3];

    if (!userId) {
      console.error('Usage: node add_test_reels_for_user.js <userId> [instagramUsername]');
      process.exit(1);
    }

    if (!username) {
      const infDoc = await db.collection('influencers').doc(userId).get();
      if (!infDoc.exists) {
        console.error('Influencer document not found for user:', userId);
        process.exit(1);
      }
      username = infDoc.data().instagramUsername || 'unknown_user';
    }

    console.log('Adding test reels for user:', userId);
    console.log('Instagram username:', username);

    const now = new Date();
    const testReels = [
      {
        id: `test_${Date.now()}_1`,
        shortCode: 'TESTABC123',
        displayUrl: 'https://picsum.photos/id/1074/640/640',
        caption: 'Sample reel 1: cute dog video 🐶',
        ownerFullName: 'Doggos Doing Things',
        ownerUsername: username,
        url: 'https://www.instagram.com/reel/TESTABC123/',
        commentsCount: 120,
        likesCount: 3580,
        viewsCount: 102345,
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
        videoDuration: 25,
        videoUrl: '',
        hashtags: ['#dogs', '#reels'],
        mentions: [],
        isSponsored: false,
      },
      {
        id: `test_${Date.now()}_2`,
        shortCode: 'TESTDEF456',
        displayUrl: 'https://picsum.photos/id/237/640/640',
        caption: 'Sample reel 2: funny pups compilation 🐕',
        ownerFullName: 'Doggos Doing Things',
        ownerUsername: username,
        url: 'https://www.instagram.com/reel/TESTDEF456/',
        commentsCount: 85,
        likesCount: 2744,
        viewsCount: 80412,
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(),
        videoDuration: 32,
        videoUrl: '',
        hashtags: ['#dogs', '#funny'],
        mentions: [],
        isSponsored: false,
      },
    ];

    const result = await saveInstagramReelData(userId, username, testReels);
    console.log('Save result:', result);

    // Verify
    const docRef = db.collection('users').doc(userId).collection('instagram').doc('reels');
    const doc = await docRef.get();
    const data = doc.data();
    console.log('Verification:');
    console.log('- Total Reels:', data.totalReels);
    console.log('- Array Length:', data.reels?.length || 0);
    if (data.reels && data.reels.length > 0) {
      console.log('- First Reel ShortCode:', data.reels[0].shortCode);
      console.log('- First Reel Likes:', data.reels[0].likesCount);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error adding test reels:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

addTestReelsForUser();