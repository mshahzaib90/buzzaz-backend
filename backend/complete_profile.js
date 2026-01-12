const { db } = require('./config/firebase');

async function completeUserProfile() {
  try {
    const userId = 'tl09djlz4oUysumQP0pc'; // Current user ID
    
    console.log('Updating profile for user:', userId);
    
    // Define the missing required fields
    const updateData = {
      // Fix bio
      bio: 'Lifestyle content creator and influencer sharing daily inspiration and authentic moments.',
      
      // Add niche (required array)
      niche: ['lifestyle', 'fashion', 'beauty'],
      
      // Add contentStyle (required array)
      contentStyle: ['authentic', 'aesthetic', 'storytelling'],
      
      // Add languages (required array)
      languages: ['English', 'Urdu'],
      
      // Add pricing fields based on follower count (1.2M+ followers = tier 4)
      // Tier 4 pricing ranges: Reel: 15000-25000, Story: 8000-12000, Event: 50000-80000, Multiple: 25000-40000
      reelPrice: 20000, // PKR
      storyPrice: 10000, // PKR
      eventPrice: 65000, // PKR
      multiplePlatformsPrice: 32000, // PKR
      
      // Update timestamp
      updatedAt: new Date().toISOString()
    };
    
    // Update the influencer profile
    await db.collection('influencers').doc(userId).update(updateData);
    
    console.log('✅ Profile updated successfully!');
    console.log('Updated fields:');
    console.log('- Bio:', updateData.bio);
    console.log('- Niche:', updateData.niche);
    console.log('- Content Style:', updateData.contentStyle);
    console.log('- Languages:', updateData.languages);
    console.log('- Reel Price:', updateData.reelPrice);
    console.log('- Story Price:', updateData.storyPrice);
    console.log('- Event Price:', updateData.eventPrice);
    console.log('- Multiple Platforms Price:', updateData.multiplePlatformsPrice);
    
    // Verify the update
    console.log('\n=== VERIFYING UPDATE ===');
    const updatedDoc = await db.collection('influencers').doc(userId).get();
    const updatedData = updatedDoc.data();
    
    console.log('Verification:');
    console.log('- Bio filled:', !!updatedData.bio);
    console.log('- Niche filled:', updatedData.niche?.length > 0);
    console.log('- Content Style filled:', updatedData.contentStyle?.length > 0);
    console.log('- Languages filled:', updatedData.languages?.length > 0);
    console.log('- Reel Price filled:', updatedData.reelPrice > 0);
    console.log('- Story Price filled:', updatedData.storyPrice > 0);
    console.log('- Event Price filled:', updatedData.eventPrice > 0);
    console.log('- Multiple Platforms Price filled:', updatedData.multiplePlatformsPrice > 0);
    
    // Calculate completion percentage
    const requiredFields = [
      { field: updatedData.fullName, label: 'Full Name' },
      { field: updatedData.bio, label: 'Bio' },
      { field: updatedData.location, label: 'Location' },
      { field: updatedData.phoneNumber, label: 'Phone Number' },
      { field: updatedData.city, label: 'City' },
      { field: updatedData.country, label: 'Country' },
      { field: updatedData.niche && updatedData.niche.length > 0, label: 'Niche' },
      { field: updatedData.contentStyle && updatedData.contentStyle.length > 0, label: 'Content Style' },
      { field: updatedData.languages && updatedData.languages.length > 0, label: 'Languages' },
      { field: updatedData.reelPrice && updatedData.reelPrice > 0, label: 'Reel Price' },
      { field: updatedData.storyPrice && updatedData.storyPrice > 0, label: 'Story Price' },
      { field: updatedData.eventPrice && updatedData.eventPrice > 0, label: 'Event Price' },
      { field: updatedData.multiplePlatformsPrice && updatedData.multiplePlatformsPrice > 0, label: 'Multiple Platforms Price' }
    ];
    
    const completedFields = requiredFields.filter(item => item.field);
    const completionPercent = Math.round((completedFields.length / requiredFields.length) * 100);
    
    console.log(`\n📊 Profile Completion: ${completionPercent}%`);
    console.log(`Completed fields: ${completedFields.length}/${requiredFields.length}`);
    
    if (completionPercent === 100) {
      console.log('🎉 Profile is now 100% complete! The onboarding message should disappear.');
    } else {
      console.log('❌ Still missing fields:');
      requiredFields.filter(item => !item.field).forEach(item => {
        console.log(`  - ${item.label}`);
      });
    }
    
  } catch (error) {
    console.error('Error updating profile:', error);
  }
}

completeUserProfile().then(() => process.exit(0)).catch(err => { 
  console.error(err); 
  process.exit(1); 
});