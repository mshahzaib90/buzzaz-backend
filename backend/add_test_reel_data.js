const { db } = require('./config/firebase');
const { saveInstagramReelData } = require('./services/firebaseService');

async function addTestReelData() {
  try {
    console.log('🔍 Adding test Instagram reel data...');
    
    // Get a user with Instagram username
    const usersSnapshot = await db.collection('users').get();
    let foundUser = null;
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      if (userData.instagramUsername) {
        foundUser = { id: doc.id, data: userData };
        break;
      }
    }
    
    if (!foundUser) {
      console.log('❌ No users with Instagram username found');
      return;
    }
    
    console.log('✅ Found user:', foundUser.data.instagramUsername);
    
    // Create test reel data
    const testReels = [
      {
        id: 'reel_1',
        shortCode: 'ABC123',
        displayUrl: 'https://example.com/reel1.jpg',
        thumbnailUrl: 'https://example.com/reel1.jpg',
        caption: 'Test reel 1 - Amazing content!',
        ownerFullName: foundUser.data.fullName || 'Test User',
        ownerUsername: foundUser.data.instagramUsername,
        url: 'https://www.instagram.com/p/ABC123/',
        commentsCount: 25,
        likesCount: 150,
        videoDuration: 30,
        videoUrl: 'https://example.com/reel1.mp4',
        hashtags: ['#test', '#reel'],
        mentions: [],
        isSponsored: false,
        timestamp: new Date().toISOString()
      },
      {
        id: 'reel_2',
        shortCode: 'DEF456',
        displayUrl: 'https://example.com/reel2.jpg',
        thumbnailUrl: 'https://example.com/reel2.jpg',
        caption: 'Test reel 2 - More amazing content!',
        ownerFullName: foundUser.data.fullName || 'Test User',
        ownerUsername: foundUser.data.instagramUsername,
        url: 'https://www.instagram.com/p/DEF456/',
        commentsCount: 40,
        likesCount: 200,
        videoDuration: 45,
        videoUrl: 'https://example.com/reel2.mp4',
        hashtags: ['#test', '#content'],
        mentions: [],
        isSponsored: false,
        timestamp: new Date().toISOString()
      }
    ];
    
    // Save test data
    await saveInstagramReelData(foundUser.id, foundUser.data.instagramUsername, testReels);
    
    console.log('✅ Test reel data added successfully!');
    console.log('Total reels added:', testReels.length);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

addTestReelData();