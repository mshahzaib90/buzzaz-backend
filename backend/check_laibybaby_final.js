const { admin, db } = require('./config/firebase');

async function checkLaibybabyFinal() {
  console.log('=== FINAL CHECK FOR LAIBYBABY REEL DATA ===');
  
  const userId = 'sx8gqxfSNZQvlHXq7BQI'; // mdshahzaib@gmail.com
  const username = 'laibybaby';
  
  try {
    // Check reels data in users collection
    console.log('1. Checking reels data in users collection...');
    const reelsRef = db.collection('users').doc(userId).collection('instagram').doc('reels');
    const reelsDoc = await reelsRef.get();
    
    if (reelsDoc.exists) {
      const reelsData = reelsDoc.data();
      console.log('✅ Reels document found!');
      console.log(`- Username: ${reelsData.username}`);
      console.log(`- Total Reels: ${reelsData.totalReels || 0}`);
      console.log(`- Reels Array Length: ${reelsData.reels?.length || 0}`);
      console.log(`- Last Updated: ${reelsData.lastUpdated}`);
      console.log(`- Created At: ${reelsData.createdAt}`);
      
      if (reelsData.username === username) {
        console.log('✅ Username is correct!');
        
        if (reelsData.reels && reelsData.reels.length > 0) {
          console.log(`✅ Found ${reelsData.reels.length} reels for ${username}`);
          
          // Show first reel details
          const firstReel = reelsData.reels[0];
          console.log('\nFirst reel details:');
          console.log(`- ID: ${firstReel.id}`);
          console.log(`- Short Code: ${firstReel.shortCode}`);
          console.log(`- Caption: ${firstReel.caption ? firstReel.caption.substring(0, 50) + '...' : 'No caption'}`);
          console.log(`- Likes: ${firstReel.likesCount || 0}`);
          console.log(`- Comments: ${firstReel.commentsCount || 0}`);
          console.log(`- Owner: ${firstReel.ownerUsername}`);
          
          // Calculate totals
          const totalLikes = reelsData.reels.reduce((sum, reel) => sum + (reel.likesCount || 0), 0);
          const totalComments = reelsData.reels.reduce((sum, reel) => sum + (reel.commentsCount || 0), 0);
          
          console.log('\n📊 Summary:');
          console.log(`- Total Reels: ${reelsData.reels.length}`);
          console.log(`- Total Likes: ${totalLikes.toLocaleString()}`);
          console.log(`- Total Comments: ${totalComments.toLocaleString()}`);
          console.log(`- Average Likes per Reel: ${Math.round(totalLikes / reelsData.reels.length).toLocaleString()}`);
          
        } else {
          console.log('❌ No reels found in the array');
        }
      } else {
        console.log(`❌ Username mismatch! Expected: ${username}, Found: ${reelsData.username}`);
      }
    } else {
      console.log('❌ No reels document found');
    }
    
    // Also check profile data
    console.log('\n2. Checking profile data...');
    const profileRef = db.collection('users').doc(userId).collection('instagram').doc('profile');
    const profileDoc = await profileRef.get();
    
    if (profileDoc.exists) {
      const profileData = profileDoc.data();
      console.log('✅ Profile document found!');
      console.log(`- Username: ${profileData.username}`);
      console.log(`- Full Name: ${profileData.fullName}`);
      console.log(`- Followers: ${profileData.followersCount?.toLocaleString() || 'N/A'}`);
      console.log(`- Following: ${profileData.followingCount?.toLocaleString() || 'N/A'}`);
      console.log(`- Posts: ${profileData.postsCount?.toLocaleString() || 'N/A'}`);
    } else {
      console.log('❌ No profile document found');
    }
    
    // Check influencers collection
    console.log('\n3. Checking influencers collection...');
    const influencersRef = db.collection('influencers');
    const influencersQuery = await influencersRef.where('Instagram Username', '==', username).get();
    
    if (!influencersQuery.empty) {
      console.log(`✅ Found ${influencersQuery.size} influencer record(s) for ${username}`);
      influencersQuery.forEach(doc => {
        const data = doc.data();
        console.log(`- Document ID: ${doc.id}`);
        console.log(`- Full Name: ${data['Full Name']}`);
        console.log(`- Followers: ${data['Followers']?.toLocaleString() || 'N/A'}`);
        console.log(`- Posts Count: ${data['Posts Count']?.toLocaleString() || 'N/A'}`);
      });
    } else {
      console.log(`❌ No influencer records found for ${username}`);
    }
    
    console.log('\n=== CHECK COMPLETED ===');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkLaibybabyFinal();