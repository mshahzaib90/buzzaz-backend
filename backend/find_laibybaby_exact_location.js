const { admin, db } = require('./config/firebase');

async function findLaibybabyExactLocation() {
  try {
    console.log('=== FINDING LAIBYBABY DATA EXACT LOCATION ===');
    
    // Search in all possible collections and subcollections
    const collections = ['users', 'influencers', 'instagramDetailedData'];
    
    for (const collectionName of collections) {
      console.log(`\n🔍 Searching in ${collectionName} collection...`);
      
      const snapshot = await db.collection(collectionName).get();
      console.log(`Found ${snapshot.size} documents in ${collectionName}`);
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const docId = doc.id;
        
        // Check if this document contains laibybaby data
        const hasLaibybabyData = (
          data.username === 'laibybaby' ||
          data.instagramUsername === 'laibybaby' ||
          JSON.stringify(data).toLowerCase().includes('laibybaby')
        );
        
        if (hasLaibybabyData) {
          console.log(`\n✅ FOUND LAIBYBABY DATA in ${collectionName}/${docId}`);
          console.log('Document data keys:', Object.keys(data));
          
          if (data.username) console.log('Username:', data.username);
          if (data.instagramUsername) console.log('Instagram Username:', data.instagramUsername);
          if (data.reels) console.log('Reels count:', data.reels.length);
          if (data.totalReels) console.log('Total Reels:', data.totalReels);
          if (data.analytics) console.log('Analytics keys:', Object.keys(data.analytics));
          
          // If this is in users collection, check subcollections
          if (collectionName === 'users') {
            console.log(`\n🔍 Checking subcollections for ${docId}...`);
            
            // Check instagram subcollection
            const instagramSubcollections = ['instagram'];
            for (const subCollection of instagramSubcollections) {
              try {
                const subSnapshot = await db.collection('users').doc(docId).collection(subCollection).get();
                if (!subSnapshot.empty) {
                  console.log(`Found ${subSnapshot.size} documents in ${subCollection} subcollection`);
                  
                  subSnapshot.forEach(subDoc => {
                    const subData = subDoc.data();
                    console.log(`  - ${subDoc.id}:`, Object.keys(subData));
                    if (subData.username === 'laibybaby' || subData.reels) {
                      console.log(`    ✅ LAIBYBABY DATA in ${subCollection}/${subDoc.id}`);
                      if (subData.reels) console.log(`    Reels: ${subData.reels.length}`);
                    }
                  });
                }
              } catch (error) {
                console.log(`    No ${subCollection} subcollection or error:`, error.message);
              }
            }
          }
        }
      }
    }
    
    // Also search for any document that might contain reel data with laibybaby
    console.log('\n🔍 Searching for any reel data containing laibybaby...');
    
    // Search in instagramDetailedData collection specifically
    const instagramDetailedSnapshot = await db.collection('instagramDetailedData').get();
    instagramDetailedSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.reels && Array.isArray(data.reels)) {
        const hasLaibybabyReels = data.reels.some(reel => 
          reel.url && reel.url.includes('laibybaby')
        );
        
        if (hasLaibybabyReels) {
          console.log(`\n✅ FOUND LAIBYBABY REELS in instagramDetailedData/${doc.id}`);
          console.log('Reels count:', data.reels.length);
          console.log('Profile username:', data.profile?.username);
        }
      }
    });
    
    // Search in users collection with instagram subcollection
    console.log('\n🔍 Deep search in users/*/instagram/reels...');
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      try {
        const reelsRef = db.collection('users').doc(userId).collection('instagram').doc('reels');
        const reelsDoc = await reelsRef.get();
        
        if (reelsDoc.exists) {
          const reelsData = reelsDoc.data();
          if (reelsData.username === 'laibybaby' || 
              (reelsData.reels && reelsData.reels.some(reel => reel.url && reel.url.includes('laibybaby')))) {
            console.log(`\n✅ FOUND LAIBYBABY in users/${userId}/instagram/reels`);
            console.log('Username:', reelsData.username);
            console.log('Total Reels:', reelsData.totalReels);
            console.log('Reels array length:', reelsData.reels?.length || 0);
            console.log('User email:', userDoc.data().email);
          }
        }
      } catch (error) {
        // Skip users without instagram subcollection
      }
    }
    
    console.log('\n=== SEARCH COMPLETED ===');
    
  } catch (error) {
    console.error('❌ Error finding laibybaby data:', error);
  }
  
  process.exit(0);
}

findLaibybabyExactLocation();