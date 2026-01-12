const { admin, db } = require('./config/firebase');

async function simpleFirebaseTest() {
  console.log('=== SIMPLE FIREBASE TEST ===');
  
  const userId = 'sx8gqxfSNZQvlHXq7BQI';
  
  try {
    // Test 1: Check if we can connect to Firebase
    console.log('1. Testing Firebase connection...');
    const testRef = db.collection('test').doc('connection');
    await testRef.set({ timestamp: new Date(), test: 'connection' });
    console.log('✅ Firebase connection successful');
    
    // Test 2: Check if user exists
    console.log('\n2. Checking user document...');
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      console.log('✅ User exists:', userDoc.data());
    } else {
      console.log('❌ User does not exist');
    }
    
    // Test 3: Try to create Instagram subcollection
    console.log('\n3. Testing Instagram subcollection creation...');
    const instagramRef = db.collection('users').doc(userId).collection('instagram').doc('test');
    await instagramRef.set({
      testData: 'This is a test',
      timestamp: new Date()
    });
    console.log('✅ Instagram subcollection created successfully');
    
    // Test 4: Read back the data
    console.log('\n4. Reading back Instagram test data...');
    const instagramDoc = await instagramRef.get();
    if (instagramDoc.exists) {
      console.log('✅ Instagram test data found:', instagramDoc.data());
    } else {
      console.log('❌ Instagram test data not found');
    }
    
    // Test 5: List all documents in Instagram subcollection
    console.log('\n5. Listing all Instagram subcollection documents...');
    const instagramCollection = db.collection('users').doc(userId).collection('instagram');
    const instagramDocs = await instagramCollection.get();
    
    console.log(`Found ${instagramDocs.size} documents in Instagram subcollection:`);
    instagramDocs.forEach(doc => {
      console.log(`- ${doc.id}: ${JSON.stringify(doc.data())}`);
    });
    
    // Clean up test data
    await testRef.delete();
    await instagramRef.delete();
    console.log('\n✅ Test data cleaned up');
    
    console.log('\n=== FIREBASE TEST COMPLETED SUCCESSFULLY ===');
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
    console.error('Error details:', error);
  }
}

simpleFirebaseTest();