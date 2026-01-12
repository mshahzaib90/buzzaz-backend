const { admin, db } = require('./config/firebase');

async function checkUserDocument() {
  try {
    const userId = 'sx8gqxfSNZQvlHXq7BQI';
    console.log('Checking user document for:', userId);
    
    // Check in users collection
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('User document found in users collection:');
      console.log('- Email:', userData.email);
      console.log('- Role:', userData.role);
      console.log('- Created At:', userData.createdAt);
    } else {
      console.log('No user document found in users collection');
      
      // Check if user exists in influencers collection instead
      const influencerDoc = await db.collection('influencers').doc(userId).get();
      if (influencerDoc.exists) {
        console.log('User found in influencers collection, but not in users collection');
        console.log('This might be the issue - auth middleware expects user in users collection');
        
        const influencerData = influencerDoc.data();
        
        // Create user document in users collection
        const userDocData = {
          email: influencerData.email || 'mdshahzaib@gmail.com',
          role: 'influencer',
          createdAt: new Date().toISOString(),
          uid: userId
        };
        
        await admin.firestore().collection('users').doc(userId).set(userDocData);
        console.log('Created user document in users collection');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

checkUserDocument();