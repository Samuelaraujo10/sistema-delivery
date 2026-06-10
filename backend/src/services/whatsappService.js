const twilio = require('twilio');

// Load credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER; // e.g., 'whatsapp:+5511999999999'

if (!accountSid || !authToken || !fromWhatsApp) {
  console.warn('Twilio credentials are not fully configured. WhatsApp service will not work.');
}

const client = twilio(accountSid, authToken);

/**
 * Sends a WhatsApp message via Twilio.
 * @param {string} toPhone - Destination phone number in E.164 format (digits only, e.g., '+5511999887766').
 * @param {string} body - Text of the message.
 * @returns {Promise<Object>} Twilio message response.
 */
async function sendWhatsAppMessage(toPhone, body) {
  if (!accountSid || accountSid.includes('xxx') || !authToken || authToken.includes('your_auth')) {
    console.warn('Twilio is not properly configured. Skipping WhatsApp message to', toPhone);
    return { sid: 'dummy_sid', status: 'skipped' };
  }
  if (!client) {
    throw new Error('Twilio client not initialized');
  }
  const toWhatsApp = `whatsapp:${toPhone}`;
  try {
    const message = await client.messages.create({
      from: fromWhatsApp,
      to: toWhatsApp,
      body,
    });
    return message;
  } catch (err) {
    console.error('Failed to send WhatsApp message:', err);
    throw err;
  }
}

module.exports = { sendWhatsAppMessage };
