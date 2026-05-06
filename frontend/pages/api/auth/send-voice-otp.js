import twilio from 'twilio';

// Twilio credentials (add to your environment variables)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = twilio(accountSid, authToken);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, channel = 'sms' } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    // Format phone number (Ethiopia: +251XXXXXXXXX)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '251' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('251')) {
      formattedPhone = '251' + formattedPhone;
    }
    formattedPhone = `+${formattedPhone}`;

    // Send verification via Twilio Verify API
    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: formattedPhone,
        channel: channel, // 'sms' or 'call'
      });

    return res.status(200).json({
      success: true,
      sid: verification.sid,
      channel: channel,
      message: channel === 'call' 
        ? 'Voice call initiated! Answer to hear your verification code.'
        : 'SMS sent with your verification code!'
    });
  } catch (error) {
    console.error('Twilio error:', error);
    return res.status(500).json({
      error: error.message,
      details: 'Failed to send verification code'
    });
  }
}
