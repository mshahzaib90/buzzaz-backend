const { scrapeInstagramComplete } = require('./services/apifyService');
const { saveInstagramProfileData, saveInstagramReelData, getInstagramProfileData, getInstagramReelData } = require('./services/firebaseService');
const { admin, db } = require('./config/firebase');

async function debugFirebaseSave() {
  // Use the actual user ID from your tests
  const userId = 'sx8gqxfSNZQvlHXq7BQI'; // mdshahzaib@gmail.com
  const username = 'laibybaby';
  
  console.log('=== DEBUGGING FIREBASE SAVE PROCESS ===');
  console.log(`User ID: ${userId}`);
  console.log(`Instagram Username: @${username}`);
  
  try {
    // Step 1: First check if user exists in Firebase
    console.log('\n1. Checking if user exists in Firebase...');
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.log('❌ User does not exist in Firebase, creating user document...');
      await userRef.set({
        email: 'mdshahzaib@gmail.com',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: 'influencer'
      });
      console.log('✅ User document created');
    } else {
      console.log('✅ User exists in Firebase');
      console.log('User data:', userDoc.data());
    }
    
    // Step 2: Scrape Instagram data
    console.log('\n2. Scraping Instagram data...');
    const instagramData = await scrapeInstagramComplete(`@${username}`);
    
    console.log(`Scraping result: ${instagramData.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Profile data: ${instagramData.profile ? 'Available' : 'Not available'}`);
    console.log(`Reels data: ${instagramData.reels ? instagramData.reels.length + ' reels' : 'Not available'}`);
    
    if (!instagramData.success) {
      console.error('❌ Scraping failed, cannot proceed');
      return;
    }
    
    // Step 3: Test saving profile data
    if (instagramData.profile) {
      console.log('\n3. Testing profile data save...');
      console.log('Profile data to save:', JSON.stringify({
        username: instagramData.profile.username,
        fullName: instagramData.profile.fullName,
        followers: instagramData.profile.followers,
        following: instagramData.profile.following,
        postsCount: instagramData.profile.postsCount
      }, null, 2));
      
      try {
        const saveResult = await saveInstagramProfileData(userId, instagramData.profile);
        console.log('✅ Profile save result:', saveResult);
        
        // Verify it was saved
        console.log('Verifying profile was saved...');
        const profileRef = db.collection('users').doc(userId).collection('instagram').doc('profile');
        const profileDoc = await profileRef.get();
        
        if (profileDoc.exists) {
          console.log('✅ Profile data found in Firebase:');
          const savedProfile = profileDoc.data();
          console.log(`- Username: ${savedProfile.username}`);
          console.log(`- Full Name: ${savedProfile.fullName}`);
          console.log(`- Followers: ${savedProfile.followers}`);
          console.log(`- Following: ${savedProfile.following}`);
          console.log(`- Posts: ${savedProfile.postsCount}`);
        } else {
          console.log('❌ Profile data NOT found in Firebase after save');
        }
      } catch (profileError) {
        console.error('❌ Profile save failed:', profileError.message);
        console.error('Profile error stack:', profileError.stack);
      }
    }
    
    // Step 4: Test saving reels data
    if (instagramData.reels && instagramData.reels.length > 0) {
      console.log('\n4. Testing reels data save...');
      console.log(`Reels data to save: ${instagramData.reels.length} reels`);
      console.log('First reel sample:', JSON.stringify({
        id: instagramData.reels[0].id,
        shortCode: instagramData.reels[0].shortCode,
        caption: instagramData.reels[0].caption?.substring(0, 50) + '...',
        likesCount: instagramData.reels[0].likesCount,
        commentsCount: instagramData.reels[0].commentsCount
      }, null, 2));
      
      try {
        const saveResult = await saveInstagramReelData(userId, username, instagramData.reels);
        console.log('✅ Reels save result:', saveResult);
        
        // Verify it was saved
        console.log('Verifying reels were saved...');
        const reelsRef = db.collection('users').doc(userId).collection('instagram').doc('reels');
        const reelsDoc = await reelsRef.get();
        
        if (reelsDoc.exists) {
          console.log('✅ Reels data found in Firebase:');
          const savedReels = reelsDoc.data();
          console.log(`- Username: ${savedReels.username}`);
          console.log(`- Total Reels: ${savedReels.totalReels}`);
          console.log(`- Reels Array Length: ${savedReels.reels?.length || 0}`);
          console.log(`- Last Updated: ${savedReels.lastUpdated}`);
          
          if (savedReels.reels && savedReels.reels.length > 0) {
            console.log('First saved reel:');
            const firstReel = savedReels.reels[0];
            console.log(`  - ID: ${firstReel.id}`);
            console.log(`  - Caption: ${firstReel.caption?.substring(0, 50) || 'No caption'}...`);
            console.log(`  - Likes: ${firstReel.likesCount}`);
            console.log(`  - Comments: ${firstReel.commentsCount}`);
          }
        } else {
          console.log('❌ Reels data NOT found in Firebase after save');
        }
      } catch (reelsError) {
        console.error('❌ Reels save failed:', reelsError.message);
        console.error('Reels error stack:', reelsError.stack);
      }
    }
    
    // Step 5: Check all Instagram collections for this user
    console.log('\n5. Checking all Instagram-related collections...');
    
    // Check users/{userId}/instagram subcollection
    const instagramCollectionRef = db.collection('users').doc(userId).collection('instagram');
    const instagramDocs = await instagramCollectionRef.get();
    
    console.log(`Instagram subcollection documents: ${instagramDocs.size}`);
    instagramDocs.forEach(doc => {
      console.log(`- Document ID: ${doc.id}`);
      console.log(`- Data keys: ${Object.keys(doc.data()).join(', ')}`);
    });
    
    // Check influencers collection
    const influencersRef = db.collection('influencers');
    const influencersQuery = await influencersRef.where('instagramUsername', '==', username).get();
    
    console.log(`\nInfluencers collection matches: ${influencersQuery.size}`);
    influencersQuery.forEach(doc => {
      const data = doc.data();
      console.log(`- Document ID: ${doc.id}`);
      console.log(`- Instagram Username: ${data.instagramUsername}`);
      console.log(`- Full Name: ${data.fullName}`);
      console.log(`- Followers: ${data.followers}`);
    });
    
    console.log('\n=== DEBUG COMPLETED ===');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Error stack:', error.stack);
  }
}

debugFirebaseSave();