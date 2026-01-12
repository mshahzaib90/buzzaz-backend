const { admin, db } = require('./config/firebase');

async function fixLaibybabyAssociation() {
  try {
    console.log('=== FIXING LAIBYBABY DATA ASSOCIATION ===');
    
    // Current dashboard user ID (the one showing 0 reels)
    const currentUserId = 'sx8gqxfSNZQvlHXq7BQI';
    
    // User ID that has the laibybaby data
    const sourceUserId = 'tl09djlz4oUysumQP0pc';
    
    console.log(`Current dashboard user: ${currentUserId}`);
    console.log(`Source user with laibybaby data: ${sourceUserId}`);
    
    // Step 1: Get the laibybaby Instagram data from the source user
    console.log('\n1. Fetching laibybaby Instagram data...');
    const sourceReelsRef = db.collection('users').doc(sourceUserId).collection('instagram').doc('reels');
    const sourceReelsDoc = await sourceReelsRef.get();
    
    if (!sourceReelsDoc.exists) {
      console.log('❌ No Instagram reels data found for source user');
      return;
    }
    
    const laibybabyData = sourceReelsDoc.data();
    console.log(`✅ Found laibybaby data: ${laibybabyData.reels?.length || 0} reels`);
    console.log(`   Username: ${laibybabyData.username}`);
    console.log(`   Total Reels: ${laibybabyData.totalReels}`);
    
    // Step 2: Update the current user's profile to include Instagram username
    console.log('\n2. Updating current user profile...');
    const currentUserRef = db.collection('users').doc(currentUserId);
    const currentUserDoc = await currentUserRef.get();
    
    if (!currentUserDoc.exists) {
      console.log('❌ Current user not found');
      return;
    }
    
    // Update the user document with Instagram username
    await currentUserRef.update({
      instagramUsername: 'laibybaby',
      lastUpdated: new Date().toISOString()
    });
    console.log('✅ Updated current user with Instagram username');
    
    // Step 3: Copy the Instagram data to the current user
    console.log('\n3. Copying Instagram data to current user...');
    const targetReelsRef = db.collection('users').doc(currentUserId).collection('instagram').doc('reels');
    
    // Copy the reels data
    await targetReelsRef.set({
      ...laibybabyData,
      lastUpdated: new Date().toISOString(),
      copiedFrom: sourceUserId,
      copiedAt: new Date().toISOString()
    });
    console.log('✅ Copied Instagram reels data to current user');
    
    // Step 4: Also update the influencers collection if it exists
    console.log('\n4. Checking influencers collection...');
    const influencerRef = db.collection('influencers').doc(currentUserId);
    const influencerDoc = await influencerRef.get();
    
    if (influencerDoc.exists) {
      await influencerRef.update({
        instagramUsername: 'laibybaby',
        followers: laibybabyData.analytics?.totalLikes || 0, // Use total likes as a proxy
        postsCount: laibybabyData.totalReels || 0,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ Updated influencers collection');
    } else {
      // Create influencer document if it doesn't exist
      const currentUserData = currentUserDoc.data();
      await influencerRef.set({
        email: currentUserData.email,
        fullName: currentUserData.fullName || 'Unknown',
        instagramUsername: 'laibybaby',
        followers: laibybabyData.analytics?.totalLikes || 0,
        postsCount: laibybabyData.totalReels || 0,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ Created influencer document');
    }
    
    // Step 5: Verify the association
    console.log('\n5. Verifying the association...');
    const verifyReelsRef = db.collection('users').doc(currentUserId).collection('instagram').doc('reels');
    const verifyReelsDoc = await verifyReelsRef.get();
    
    if (verifyReelsDoc.exists) {
      const verifyData = verifyReelsDoc.data();
      console.log('✅ Verification successful:');
      console.log(`   Username: ${verifyData.username}`);
      console.log(`   Total Reels: ${verifyData.totalReels}`);
      console.log(`   Reels Array Length: ${verifyData.reels?.length || 0}`);
      console.log(`   Last Updated: ${verifyData.lastUpdated}`);
    } else {
      console.log('❌ Verification failed - no data found');
    }
    
    console.log('\n🎉 LAIBYBABY DATA ASSOCIATION COMPLETED!');
    console.log('The dashboard should now show the laibybaby reels data.');
    
  } catch (error) {
    console.error('❌ Error fixing laibybaby association:', error);
  }
  
  process.exit(0);
}

fixLaibybabyAssociation();