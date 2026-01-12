const { admin, db } = require('./config/firebase');

async function checkLaibybabyReels() {
  console.log('=== CHECKING LAIBYBABY REEL DATA ===');
  
  const userId = 'sx8gqxfSNZQvlHXq7BQI'; // mdshahzaib@gmail.com
  const username = 'laibybaby';
  
  try {
    // Check reels data in users/{userId}/instagram/reels
    console.log('1. Checking reels data in users collection...');
    const reelsRef = db.collection('users').doc(userId).collection('instagram').doc('reels');
    const reelsDoc = await reelsRef.get();
    
    if (reelsDoc.exists) {
      const reelsData = reelsDoc.data();
      console.log('✅ Reels document found!');
      console.log(`- Username: ${reelsData.username}`);
      console.log(`- User ID: ${reelsData.userId}`);
      console.log(`- Total Reels: ${reelsData.totalReels}`);
      console.log(`- Reels Array Length: ${reelsData.reels?.length || 0}`);
      console.log(`- Last Updated: ${reelsData.lastUpdated}`);
      console.log(`- Created At: ${reelsData.createdAt}`);
      
      if (reelsData.username === username) {
        console.log('✅ Username matches laibybaby!');
        
        if (reelsData.reels && reelsData.reels.length > 0) {
          console.log(`\n📹 REEL DATA FOUND: ${reelsData.reels.length} reels`);
          
          // Show first 3 reels
          const reelsToShow = Math.min(3, reelsData.reels.length);
          for (let i = 0; i < reelsToShow; i++) {
            const reel = reelsData.reels[i];
            console.log(`\n--- Reel ${i + 1} ---`);
            console.log(`- ID: ${reel.id}`);
            console.log(`- Short Code: ${reel.shortCode}`);
            console.log(`- Caption: ${reel.caption ? reel.caption.substring(0, 100) + '...' : 'No caption'}`);
            console.log(`- Likes: ${reel.likesCount || 0}`);
            console.log(`- Comments: ${reel.commentsCount || 0}`);
            console.log(`- Video URL: ${reel.videoUrl ? 'Available' : 'Not available'}`);
            console.log(`- Display URL: ${reel.displayUrl ? 'Available' : 'Not available'}`);
            console.log(`- Owner Username: ${reel.ownerUsername}`);
            console.log(`- Timestamp: ${reel.timestamp}`);
          }
          
          // Calculate analytics
          const totalLikes = reelsData.reels.reduce((sum, reel) => sum + (reel.likesCount || 0), 0);
          const totalComments = reelsData.reels.reduce((sum, reel) => sum + (reel.commentsCount || 0), 0);
          const avgLikes = Math.round(totalLikes / reelsData.reels.length);
          const avgComments = Math.round(totalComments / reelsData.reels.length);
          
          console.log(`\n📊 ANALYTICS:`);
          console.log(`- Total Likes: ${totalLikes.toLocaleString()}`);
          console.log(`- Total Comments: ${totalComments.toLocaleString()}`);
          console.log(`- Average Likes per Reel: ${avgLikes.toLocaleString()}`);
          console.log(`- Average Comments per Reel: ${avgComments.toLocaleString()}`);
          
        } else {
          console.log('❌ No reels found in the reels array');
        }
      } else {
        console.log(`❌ Username mismatch! Expected: ${username}, Found: ${reelsData.username}`);
      }
    } else {
      console.log('❌ No reels document found');
    }
    
    // Check if there are any other Instagram documents
    console.log('\n2. Checking all Instagram subcollection documents...');
    const instagramCollection = db.collection('users').doc(userId).collection('instagram');
    const instagramDocs = await instagramCollection.get();
    
    console.log(`Found ${instagramDocs.size} documents in Instagram subcollection:`);
    instagramDocs.forEach(doc => {
      const data = doc.data();
      console.log(`\n- Document ID: ${doc.id}`);
      if (doc.id === 'profile') {
        console.log(`  Username: ${data.username}`);
        console.log(`  Full Name: ${data.fullName}`);
        console.log(`  Followers: ${data.followers}`);
      } else if (doc.id === 'reels') {
        console.log(`  Username: ${data.username}`);
        console.log(`  Total Reels: ${data.totalReels}`);
        console.log(`  Reels Count: ${data.reels?.length || 0}`);
      }
    });
    
    // Check influencers collection for laibybaby
    console.log('\n3. Checking influencers collection...');
    const influencersQuery = await db.collection('influencers')
      .where('instagramUsername', '==', username)
      .get();
    
    if (!influencersQuery.empty) {
      console.log(`✅ Found ${influencersQuery.size} influencer record(s) for ${username}`);
      influencersQuery.forEach(doc => {
        const data = doc.data();
        console.log(`- Document ID: ${doc.id}`);
        console.log(`- Full Name: ${data.fullName}`);
        console.log(`- Followers: ${data.followers}`);
        console.log(`- Posts Count: ${data.postsCount}`);
        console.log(`- Last Synced: ${data.lastSynced}`);
      });
    } else {
      console.log(`❌ No influencer records found for ${username}`);
    }
    
    console.log('\n=== CHECK COMPLETED ===');
    
  } catch (error) {
    console.error('❌ Error checking laibybaby reels:', error.message);
    console.error('Error details:', error);
  }
}

checkLaibybabyReels();