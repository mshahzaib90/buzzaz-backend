const { validateTikTokUsername, scrapeTikTokProfile } = require('./services/apifyService.js');

async function testTikTok() {
  try {
    console.log('Testing TikTok profile scraping with chanel1cosmetics1...');
    const result = await scrapeTikTokProfile('chanel1cosmetics1');
    console.log('Success! TikTok Result:', JSON.stringify(result, null, 2));
    
    console.log('\n=== EXTRACTED DATA ===');
    console.log('Username:', result?.username || 'N/A');
    console.log('Followers:', result?.followers || 'N/A');
    console.log('Following:', result?.following || 'N/A');
    console.log('Videos Count:', result?.videosCount || 'N/A');
    console.log('Total Likes:', result?.totalLikes || 'N/A');
    console.log('Avatar URL:', result?.avatarUrl || 'N/A');
    console.log('======================');
    
  } catch (error) {
    console.error('Error occurred:', error.message);
    console.error('Full error:', error);
  }
}

async function testValidation() {
  try {
    console.log('\nTesting validateTikTokUsername with chanel1cosmetics1...');
    const result = await validateTikTokUsername('chanel1cosmetics1');
    console.log('Validation Success! Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Validation Error occurred:', error.message);
    console.error('Full validation error:', error);
  }
}

async function runAllTests() {
  await testTikTok();
  await testValidation();
}

runAllTests().then(() => console.log('All tests completed')).catch(err => console.error('Tests failed:', err));