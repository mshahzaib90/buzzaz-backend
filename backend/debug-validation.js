const { validateInstagramUsername } = require('./services/apifyService');

async function testValidation() {
  try {
    console.log('Testing Instagram validation...');
    const result = await validateInstagramUsername('kainat_tahirr');
    console.log('SUCCESS:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('ERROR:', error.message);
    console.log('Full error:', error);
  }
}

testValidation();