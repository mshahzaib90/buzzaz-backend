const { validateInstagramUsername } = require('./services/apifyService');

async function testValidationDirect() {
  try {
    console.log('Testing Instagram validation directly...');
    
    const result = await validateInstagramUsername('testuser');
    
    console.log('SUCCESS:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.log('Validation Error:');
    console.log('Message:', error.message);
    console.log('Full error:', error);
  }
}

testValidationDirect();