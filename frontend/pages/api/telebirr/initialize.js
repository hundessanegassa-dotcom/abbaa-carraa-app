import Telebirr from 'telebirr-node';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, phoneNumber, poolId, poolName, userId } = req.body;

  const telebirr = new Telebirr({
    appId: process.env.TELEBIRR_APP_ID,
    appKey: process.env.TELEBIRR_APP_KEY,
    shortCode: process.env.TELEBIRR_SHORT_CODE,
    publicKey: process.env.TELEBIRR_PUBLIC_KEY,
  });

  const { success, response, error } = await telebirr.makePayment({
    paymentMethod: 'web',
    nonce: Math.random().toString(36).substring(2, 15),
    notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/telebirr/callback`,
    totalAmount: amount,
    outTradeNo: `TXN_${Date.now()}_${userId}`,
    receiveName: 'Abbaa Carraa',
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify`,
    subject: `Contribution to ${poolName}`,
    timeoutExpress: '30',
  });

  if (success) {
    return res.status(200).json({
      success: true,
      paymentUrl: response.data.toPayUrl
    });
  } else {
    return res.status(500).json({
      success: false,
      error: error
    });
  }
}
