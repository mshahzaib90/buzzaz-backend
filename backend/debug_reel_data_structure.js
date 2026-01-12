const { admin } = require('./config/firebase');

async function debugReelDataStructure() {
  try {
    const userId = 'sx8gqxfSNZQvlHXq7BQI';
    
    console.log('Debugging reel data structure for user:', userId);
    
    // Check the exact path structure
    const reelsDocRef = admin.firestore().collection('users').doc(userId).collection('instagram').doc('reels');
    const reelsDoc = await reelsDocRef.get();
    
    console.log('\n--- Checking reels document ---');
    console.log('Document exists:', reelsDoc.exists);
    
    if (reelsDoc.exists) {
      const data = reelsDoc.data();
      console.log('Document data keys:', Object.keys(data || {}));
      console.log('Document data type:', typeof data);
      console.log('Is array?', Array.isArray(data));
      
      if (data) {
        console.log('First few keys:', Object.keys(data).slice(0, 5));
        
        // Check if data has a reels property or if the data itself is the reels
        if (data.reels) {
          console.log('Found reels property, type:', typeof data.reels);
          console.log('Reels is array?', Array.isArray(data.reels));
          console.log('Reels length:', data.reels?.length);
        } else {
          console.log('No reels property found');
          console.log('Sample data structure:', JSON.stringify(data, null, 2).substring(0, 500));
        }
      }
    }
    
    // Also check if there's a collection instead of a document
    console.log('\n--- Checking reels collection ---');
    const reelsCollectionRef = admin.firestore().collection('users').doc(userId).collection('instagram').collection('reels');
    const reelsSnapshot = await reelsCollectionRef.get();
    
    console.log('Collection size:', reelsSnapshot.size);
    
    if (!reelsSnapshot.empty) {
      console.log('Found documents in reels collection:');
      reelsSnapshot.forEach((doc, index) => {
        if (index < 3) { // Show first 3 documents
          console.log(`Document ${index + 1}:`, doc.id, Object.keys(doc.data()));
        }
      });
    }
    
  } catch (error) {
    console.error('Error debugging reel data structure:', error);
  }
}

debugReelDataStructure();