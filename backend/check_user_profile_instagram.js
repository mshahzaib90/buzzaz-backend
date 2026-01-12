const { admin, db } = require('./config/firebase');

async function checkUserProfileInstagram() {
  try {
    console.log('=== CHECKING USER PROFILE INSTAGRAM SETUP ===');
    
    const userId = 'sx8gqxfSNZQvlHXq7BQI';
    console.log(`Checking user: ${userId}`);
    
    // Check users collection
    console.log('\n1. Checking users collection...');
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('✅ User found in users collection');
      console.log('Email:', userData.email);
      console.log('Instagram Username:', userData.instagramUsername || 'NOT SET');
      console.log('Full Name:', userData.fullName);
    } else {
      console.log('❌ User not found in users collection');
    }
    
    // Check influencers collection
    console.log('\n2. Checking influencers collection...');
    const influencerRef = db.collection('influencers').doc(userId);
    const influencerDoc = await influencerRef.get();
    
    if (influencerDoc.exists) {
      const influencerData = influencerDoc.data();
      console.log('✅ User found in influencers collection');
      console.log('Email:', influencerData.email);
      console.log('Instagram Username:', influencerData.instagramUsername || 'NOT SET');
      console.log('Followers:', influencerData.followers || 0);
      console.log('Posts Count:', influencerData.postsCount || 0);
    } else {
      console.log('❌ User not found in influencers collection');
    }
    
    // Check Instagram reels data
    console.log('\n3. Checking Instagram reels data...');
    const reelsRef = db.collection('users').doc(userId).collection('instagram').doc('reels');
    const reelsDoc = await reelsRef.get();
    
    if (reelsDoc.exists) {
      const reelsData = reelsDoc.data();
      console.log('✅ Instagram reels data found');
      console.log('Username:', reelsData.username);
      console.log('Total Reels:', reelsData.totalReels);
      console.log('Reels Array Length:', reelsData.reels?.length || 0);
      console.log('Last Updated:', reelsData.lastUpdated);
    } else {
      console.log('❌ No Instagram reels data found');
    }
    
    // Test the API endpoint logic
    console.log('\n4. Testing API endpoint logic...');
    
    // Simulate what the API endpoint checks
    const hasInstagramUsername = !!(userDoc.exists && userDoc.data().instagramUsername) || 
                                 !!(influencerDoc.exists && influencerDoc.data().instagramUsername);
    
    console.log('Has Instagram username in profile?', hasInstagramUsername);
    
    if (!hasInstagramUsername) {
      console.log('\n🎯 FOUND THE ISSUE!');
      console.log('The API endpoint requires instagramUsername to be set in the user/influencer profile.');
      console.log('Even though the Instagram data exists, the API returns 400 without the username.');
      
      // Fix the issue by setting the Instagram username
      console.log('\n5. Fixing the Instagram username...');
      
      if (userDoc.exists) {
        await userRef.update({
          instagramUsername: 'laibybaby',
          lastUpdated: new Date().toISOString()
        });
        console.log('✅ Updated users collection with Instagram username');
      }
      
      if (influencerDoc.exists) {
        await influencerRef.update({
          instagramUsername: 'laibybaby',
          lastUpdated: new Date().toISOString()
        });
        console.log('✅ Updated influencers collection with Instagram username');
      } else {
        // Create influencer document
        const userData = userDoc.data();
        await influencerRef.set({
          email: userData.email,
          fullName: userData.fullName || 'Unknown',
          instagramUsername: 'laibybaby',
          followers: 0,
          postsCount: 20, // Set to reel count
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        });
        console.log('✅ Created influencer document with Instagram username');
      }
      
      console.log('\n🎉 ISSUE FIXED!');
      console.log('The dashboard should now show the laibybaby reels data.');
    } else {
      console.log('Instagram username is properly set. Issue might be elsewhere.');
    }
    
  } catch (error) {
    console.error('❌ Error checking user profile:', error);
  }
  
  process.exit(0);
}

checkUserProfileInstagram();