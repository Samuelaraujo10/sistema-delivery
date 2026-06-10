const twilio = require('twilio');
const client = twilio('ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'your_auth_token_here');
client.messages.create({
  from: 'whatsapp:+15551234567',
  to: 'whatsapp:+5511999999999',
  body: 'Test'
}).then(console.log).catch(err => console.error(err.message));
