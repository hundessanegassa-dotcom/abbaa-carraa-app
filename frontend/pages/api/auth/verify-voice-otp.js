export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and code are required' });
  }

  const useTestMode = !process.env.TWILIO_ACCOUNT_SID || process.env.NODE_ENV === 'development';

  if (useTestMode) {
    if (code.length === 6 && /^\d+$/.test(code)) {
      return res.status(200).json({
        success: true,
        message: 'Phone verified successfully (test mode)'
      });
    } else {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
  }

  try {
    const twilio = require('twilio');
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    const client = twilio(accountSid, authToken);

    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '251' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('251')) {
      formattedPhone = '251' + formattedPhone;
    }
    formattedPhone = `+${formattedPhone}`;

    const verificationCheck = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: formattedPhone,
        code: code,
      });

    if (verificationCheck.status === 'approved') {
      return res.status(200).json({
        success: true,
        message: 'Phone verified successfully'
      });
    } else {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ error: error.message || 'Failed to verify code' });
  }
}
