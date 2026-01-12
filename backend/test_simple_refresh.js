const { scrapeInstagramComplete } = require('./services/apifyService');

async function testRefresh() {
  console.log('Starting Instagram refresh test...');
  
  try {
    const result = await scrapeInstagramComplete('@kainat_tahirr');
    console.log('Test completed successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testRefresh();