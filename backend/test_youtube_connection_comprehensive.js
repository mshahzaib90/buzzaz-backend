const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = require('./config/serviceAccount.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
    });
  } catch (error) {
    console.log('Firebase service account not found, using environment variables...');
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  }
}

async function testYouTubeConnectionComprehensive() {
  try {
    console.log('🔍 Testing YouTube connection comprehensively...\n');

    // Step 1: Check if we have any existing UGC users
    console.log('1. Checking for existing UGC users...');
    const db = admin.firestore();
    const ugcUsersSnapshot = await db.collection('ugc_creators').limit(5).get();
    
    if (ugcUsersSnapshot.empty) {
      console.log('❌ No UGC users found. Creating a test user...');
      
      // Create a test user
      const testUserId = 'test-youtube-user-' + Date.now();
      await db.collection('ugc_creators').doc(testUserId).set({
        email: 'test@youtube.com',
        name: 'Test YouTube User',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: 'ugc_creator'
      });
      
      console.log('✅ Test user created:', testUserId);
      
      // Test the connection with this user
      await testConnectionForUser(testUserId);
      
    } else {
      console.log(`✅ Found ${ugcUsersSnapshot.size} UGC users`);
      
      // Test with the first user
      const firstUser = ugcUsersSnapshot.docs[0];
      console.log('Testing with user:', firstUser.id);
      await testConnectionForUser(firstUser.id);
    }

  } catch (error) {
    console.error('❌ Error in comprehensive test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

async function testConnectionForUser(userId) {
  try {
    console.log(`\n2. Testing YouTube connection for user: ${userId}`);
    
    // Step 2: Test the YouTube connection endpoint
    const testChannelUrl = 'https://www.youtube.com/@MrBeast';
    console.log('Testing with channel URL:', testChannelUrl);
    
    // Extract channel query like the frontend does
    let channelQuery = testChannelUrl;
    if (channelQuery.includes('youtube.com/@')) {
      channelQuery = channelQuery.split('youtube.com/@')[1].split('/')[0];
    }
    
    console.log('Extracted channel query:', channelQuery);
    
    // Make the API call
    const response = await axios.post(`http://localhost:5000/api/ugc/${userId}/youtube/connect`, {
      channelQuery: channelQuery
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Response status:', response.status);
    console.log('✅ Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n🎉 YouTube connection successful!');
      console.log('Channel ID:', response.data.data.youtubeChannelId);
      console.log('Channel Title:', response.data.data.youtubeChannelTitle);
      console.log('Subscriber Count:', response.data.data.youtubeSubscriberCount);
      console.log('Video Count:', response.data.data.youtubeVideoCount);
    } else {
      console.log('❌ YouTube connection failed:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing connection for user:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('\n🔍 Authentication issue detected. This might be the problem!');
        console.log('The frontend might not be sending proper authentication tokens.');
      }
    }
  }
}

testYouTubeConnectionComprehensive();