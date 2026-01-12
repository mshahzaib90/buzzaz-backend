const fs = require('fs');
const { validateInstagramUsername } = require('./services/apifyService');

async function testValidation() {
  try {
    console.log('Testing validateInstagramUsername with motogp...');
    const result = await validateInstagramUsername('motogp');
    
    const output = {
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('validation-result.json', JSON.stringify(output, null, 2));
    console.log('Result written to validation-result.json');
    
  } catch (error) {
    const output = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('validation-result.json', JSON.stringify(output, null, 2));
    console.log('Error written to validation-result.json');
  }
}

testValidation();