import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tx_ref, status } = req.body;

  if (status === 'success') {
    try {
      // Verify the payment with Chapa
      const verification = await axios.get(
        `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`
          }
        }
      );

      if (verification.data.data.status === 'success') {
        // Payment is verified - update your database
        // We'll implement this in the next step
        
        console.log(`Payment verified for transaction: ${tx_ref}`);
        return res.status(200).json({ status: 'success' });
      }
    } catch (error) {
      console.error('Verification error:', error);
    }
  }

  return res.status(200).json({ status: 'received' });
}
