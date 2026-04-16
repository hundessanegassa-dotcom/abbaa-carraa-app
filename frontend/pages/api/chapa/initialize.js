import axios from 'axios';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, email, first_name, last_name, phone_number, poolId, poolName } = req.body;

  // Generate unique transaction reference
  const tx_ref = `ABBA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      {
        amount: amount,
        currency: 'ETB',
        email: email,
        first_name: first_name,
        last_name: last_name,
        phone_number: phone_number.replace(/^0+/, ''), // Remove leading 0
        tx_ref: tx_ref,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/chapa/callback`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify?tx_ref=${tx_ref}`,
        customization: {
          title: `Contribute to ${poolName}`,
          description: `Join ${poolName} prize pool`
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Return checkout URL to frontend
    return res.status(200).json({
      success: true,
      checkout_url: response.data.data.checkout_url,
      tx_ref: tx_ref
    });
  } catch (error) {
    console.error('Chapa initialization error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data?.message || 'Payment initialization failed'
    });
  }
}
