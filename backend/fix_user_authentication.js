const { admin, db } = require('./config/firebase');

async function fixUserAuthentication() {
  try {
    console.log('=== FIXING USER AUTHENTICATION FOR INSTAGRAM DATA ===');
    
    // The profile with real Instagram data
    const profileId = 'm89LfvLoQV73zp8pSNcD';
    const correctEmail = 'tamatosdev1@gmail.com';
    
    console.log('1. Checking current profile data...');
    const profileDoc = await db.collection('influencers').doc(profileId).get();
    
    if (profileDoc.exists) {
      const profileData = profileDoc.data();
      console.log('✓ Profile found:');
      console.log('  - Full Name:', profileData.fullName);
      console.log('  - Instagram Username:', profileData.instagramUsername);
      console.log('  - Followers:', profileData.followers);
      console.log('  - Posts Count:', profileData.postsCount);
    }
    
    console.log('\n2. Checking user authentication...');
    const userDoc = await db.collection('users').doc(profileId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('✓ User found:');
      console.log('  - Email:', userData.email);
      console.log('  - Role:', userData.role);
      
      if (userData.email === correctEmail) {
        console.log('✓ User email matches expected email');
        console.log('\n=== AUTHENTICATION IS CORRECT ===');
        console.log('The issue might be in the frontend authentication.');
        console.log('Please check:');
        console.log('1. Browser localStorage for the correct auth token');
        console.log('2. Make sure you\'re logged in with:', correctEmail);
        console.log('3. Clear browser cache and re-login if needed');
      } else {
        console.log('✗ Email mismatch! Expected:', correctEmail, 'Found:', userData.email);
      }
    } else {
      console.log('✗ No user document found for profile ID');
    }
    
    console.log('\n3. Checking all users to find correct authentication...');
    const usersSnapshot = await db.collection('users').get();
    
    let correctUser = null;
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.email === correctEmail) {
        correctUser = { id: doc.id, ...data };
      }
    });
    
    if (correctUser) {
      console.log('✓ Found user with correct email:');
      console.log('  - User ID:', correctUser.id);
      console.log('  - Email:', correctUser.email);
      console.log('  - Role:', correctUser.role);
      
      if (correctUser.id === profileId) {
        console.log('✓ User ID matches profile ID - Authentication is correct!');
      } else {
        console.log('✗ User ID mismatch:');
        console.log('  - Profile ID:', profileId);
        console.log('  - User ID:', correctUser.id);
        console.log('  - This explains why the dashboard shows wrong data!');
      }
    }
    
    console.log('\n=== SOLUTION ===');
    console.log('To fix the dashboard:');
    console.log('1. Log out from the current account');
    console.log('2. Log in with email:', correctEmail);
    console.log('3. This should authenticate with user ID:', profileId);
    console.log('4. The dashboard will then show the correct Instagram data');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixUserAuthentication();