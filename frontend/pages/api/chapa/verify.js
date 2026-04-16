import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tx_ref } = req.body;

  if (!tx_ref) {
    return res.status(400).json({ error: 'Transaction reference required' });
  }

  try {
    const response = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`
        }
      }
    );

    if (response.data.data.status === 'success') {
      // Here you would update your database
      // Mark contribution as completed, update pool progress, etc.
      
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: response.data.data
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
}
