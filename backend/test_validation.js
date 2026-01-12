const axios = require('axios');

async function testValidation() {
  try {
    console.log('Testing Instagram validation endpoint...');
    
    // Test with a sample Instagram username
    const testData = {
      instagramUsername: 'instagram'  // Using Instagram's official account for testing
    };
    
    console.log('Sending request to validation endpoint...');
    console.log('Test data:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post('http://localhost:5000/api/influencer/validate-apify', testData, {
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail due to missing auth token, but we can see the specific error
      },
      timeout: 30000
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('=== ERROR DETAILS ===');
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
      console.log('Response headers:', error.response.headers);
    } else if (error.request) {
      console.log('No response received');
      console.log('Request details:', error.request);
    } else {
      console.log('Request setup error:', error.message);
    }
    
    console.log('=== END ERROR DETAILS ===');
  }
}

// Test the Apify API directly
async function testApifyAPI() {
  try {
    console.log('\n=== Testing Apify API directly ===');
    
    const { ApifyClient } = require('apify-client');
    require('dotenv').config();
    const token = process.env.APIFY_TOKEN;
    if (!token) {
      throw new Error('Missing APIFY_TOKEN');
    }
    const client = new ApifyClient({
      token,
      timeoutSecs: 30,
    });
    
    const input = {
      "username": ["instagram"],
      "resultsLimit": 5,
      "includeSharesCount": false
    };
    
    console.log('Calling Apify Instagram Reel Scraper...');
    console.log('Input:', JSON.stringify(input, null, 2));
    
    const run = await client.actor("xMc5Ga1oCONPmWJIa").call(input);
    console.log('Actor run completed, run ID:', run.id);
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`Dataset items fetched: ${items ? items.length : 0}`);
    
    if (items && items.length > 0) {
      console.log('Sample reel data:', JSON.stringify(items[0], null, 2));
    }
    
  } catch (error) {
    console.log('=== APIFY API ERROR ===');
    console.log('Error message:', error.message);
    console.log('Error details:', error);
    console.log('=== END APIFY ERROR ===');
  }
}

async function runTests() {
  console.log('Starting validation tests...\n');
  
  // Test 1: Direct Apify API
  await testApifyAPI();
  
  // Test 2: Validation endpoint
  await testValidation();
  
  console.log('\nTests completed.');
}

runTests().catch(console.error);
