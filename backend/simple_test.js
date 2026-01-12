require('dotenv').config();
const { ApifyClient } = require('apify-client');

console.log('Testing Apify connection...');
console.log('APIFY_TOKEN:', process.env.APIFY_TOKEN ? 'Set' : 'Not set');

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
  timeoutSecs: 30,
});

async function testApify() {
  try {
    console.log('Creating test actor run...');
    
    // Test with a simple actor that should work
    const input = {
      "username": ["laibybaby"],
      "resultsLimit": 1,
      "includeSharesCount": false
    };

    console.log('Input:', JSON.stringify(input, null, 2));
    
    const run = await client.actor("xMc5Ga1oCONPmWJIa").call(input);
    console.log('Run created:', run.id);
    console.log('Run status:', run.status);
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log('Items received:', items ? items.length : 0);
    
    if (items && items.length > 0) {
      console.log('First item keys:', Object.keys(items[0]));
      console.log('Sample data:', JSON.stringify(items[0], null, 2).substring(0, 500) + '...');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testApify().then(() => {
  console.log('Test complete');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});