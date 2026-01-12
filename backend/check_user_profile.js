const { db } = require('./config/firebase');

async function checkCurrentUser() {
  try {
    // Check the current logged-in user's profile
    const userEmail = 'mdshahzaib@gmail.com';
    
    // First check users collection
    const usersSnapshot = await db.collection('users').where('email', '==', userEmail).get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No user found with email:', userEmail);
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;
    
    console.log('=== USER DATA ===');
    console.log('User ID:', userId);
    console.log('Email:', userData.email);
    console.log('Role:', userData.role);
    console.log('Full Name:', userData.fullName);
    console.log('Created At:', userData.createdAt);
    
    // Check if influencer profile exists
    const influencerDoc = await db.collection('influencers').doc(userId).get();
    
    console.log('\n=== INFLUENCER PROFILE STATUS ===');
    if (influencerDoc.exists) {
      const profileData = influencerDoc.data();
      console.log('✅ Influencer profile EXISTS');
      console.log('Profile Full Name:', profileData.fullName);
      console.log('Instagram Username:', profileData.instagramUsername);
      console.log('Bio:', profileData.bio);
      console.log('Location:', profileData.location);
      console.log('Categories:', profileData.categories);
      console.log('Content Types:', profileData.contentTypes);
      console.log('Phone Number:', profileData.phoneNumber);
      console.log('City:', profileData.city);
      console.log('Country:', profileData.country);
      console.log('Niche:', profileData.niche);
      console.log('Languages:', profileData.languages);
      console.log('Content Style:', profileData.contentStyle);
      console.log('Pricing fields:', {
        reelPrice: profileData.reelPrice,
        storyPrice: profileData.storyPrice,
        eventPrice: profileData.eventPrice,
        multiplePlatformsPrice: profileData.multiplePlatformsPrice
      });
    } else {
      console.log('❌ Influencer profile does NOT exist');
      console.log('This is why the onboarding message appears');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCurrentUser().then(() => process.exit(0)).catch(err => { 
  console.error(err); 
  process.exit(1); 
});