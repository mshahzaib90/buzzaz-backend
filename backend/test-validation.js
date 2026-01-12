const { validateInstagramUsername } = require('./services/apifyService');

validateInstagramUsername('motogp').then(r => {
  console.log('SUCCESS:');
  console.log(JSON.stringify(r, null, 2));
}).catch(e => {
  console.log('ERROR:');
  console.error(e.message);
});