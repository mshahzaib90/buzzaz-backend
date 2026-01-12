const { fetchInstagramUserData } = require('./services/instagramService');

async function testInstagramValidation() {
  console.log('=== Testing Instagram Validation ===');
  
  // Test with known working username
  console.log('\n1. Testing with known working username: natgeo');
  try {
    const result1 = await fetchInstagramUserData('natgeo', 5);
    console.log('Result for natgeo:', {
      success: result1?.success,
      username: result1?.username,
      totalReels: result1?.totalReels,
      reelsCount: result1?.reels?.length
    });
  } catch (error) {
    console.error('Error with natgeo:', error.message);
  }
  
  // Test with problematic username
  console.log('\n2. Testing with problematic username: kainat_tahirr');
  try {
    const result2 = await fetchInstagramUserData('kainat_tahirr', 5);
    console.log('Result for kainat_tahirr:', {
      success: result2?.success,
      username: result2?.username,
      totalReels: result2?.totalReels,
      reelsCount: result2?.reels?.length
    });
  } catch (error) {
    console.error('Error with kainat_tahirr:', error.message);
  }
  
  console.log('\n=== Test Complete ===');
}

testInstagramValidation().catch(console.error);