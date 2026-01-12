const { admin, db } = require('./config/firebase');

async function testFirebaseConnection() {
  const userId = 'sx8gqxfSNZQvlHXq7BQI';
  
  console.log('=== TESTING FIREBASE CONNECTION ===');
  console.log(`Testing with User ID: ${userId}`);
  
  try {
    // Test 1: Check if user exists
    console.log('\n1. Checking if user exists...');
    const userDoc = await db.collection('users').doc(userId).get();
    console.log(`User exists: ${userDoc.exists}`);
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`Instagram username: ${userData.instagramUsername || 'Not set'}`);
    }
    
    // Test 2: Check Instagram profile data
    console.log('\n2. Checking Instagram profile data...');
    const profileDoc = await db.collection('users').doc(userId).collection('instagram').doc('profile').get();
    console.log(`Profile data exists: ${profileDoc.exists}`);
    
    if (profileDoc.exists) {
      const profileData = profileDoc.data();
      console.log(`Profile username: ${profileData.username}`);
      console.log(`Followers: ${profileData.followers}`);
    }
    
    // Test 3: Check Instagram reels data
    console.log('\n3. Checking Instagram reels data...');
    const reelsSnapshot = await db.collection('users').doc(userId).collection('instagram').doc('reels').collection('data').get();
    console.log(`Reels count: ${reelsSnapshot.size}`);
    
    if (!reelsSnapshot.empty) {
      const firstReel = reelsSnapshot.docs[0].data();
      console.log(`First reel likes: ${firstReel.likesCount}`);
      console.log(`First reel caption: ${firstReel.caption ? firstReel.caption.substring(0, 50) + '...' : 'N/A'}`);
    }
    
    console.log('\n=== FIREBASE TEST COMPLETED ===');
    
  } catch (error) {
    console.error('Firebase test failed:', error.message);
  }
}

testFirebaseConnection();