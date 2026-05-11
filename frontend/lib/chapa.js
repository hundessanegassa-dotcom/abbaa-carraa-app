import axios from 'axios';

const CHAPA_API_URL = 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

/**
 * Initialize a payment transaction
 */
export async function initializePayment({ amount, email, firstName, lastName, tx_ref, callbackUrl, returnUrl, title, description }) {
  try {
    const response = await axios.post(
      `${CHAPA_API_URL}/transaction/initialize`,
      {
        amount: amount.toString(),
        currency: 'ETB',
        email: email,
        first_name: firstName,
        last_name: lastName,
        tx_ref: tx_ref,
        callback_url: callbackUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/api/chapa-callback`,
        return_url: returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success`,
        customization: {
          title: title || 'Digital ETA Contribution',
          description: description || 'Contribute to win amazing prizes'
        }
      },
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      checkoutUrl: response.data.data.checkout_url,
      tx_ref: tx_ref
    };
  } catch (error) {
    console.error('Chapa initialization error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Payment initialization failed'
    };
  }
}

/**
 * Verify a payment transaction
 */
export async function verifyPayment(tx_ref) {
  try {
    const response = await axios.get(
      `${CHAPA_API_URL}/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`
        }
      }
    );
    
    return {
      success: true,
      data: response.data.data,
      status: response.data.data.status
    };
  } catch (error) {
    console.error('Chapa verification error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Verification failed'
    };
  }
}

/**
 * Get bank list for payouts
 */
export async function getBanks() {
  try {
    const response = await axios.get(
      `${CHAPA_API_URL}/banks`,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`
        }
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Get banks error:', error);
    return [];
  }
}

/**
 * Transfer to bank account (for winners)
 */
export async function transferToBank({ amount, bankCode, accountNumber, accountName, reference }) {
  try {
    const response = await axios.post(
      `${CHAPA_API_URL}/transfer`,
      {
        amount: amount.toString(),
        currency: 'ETB',
        bank_code: bankCode,
        account_number: accountNumber,
        account_name: accountName,
        reference: reference,
        description: 'Prize winnings from Digital ETA'
      },
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      transferId: response.data.data.transfer_id
    };
  } catch (error) {
    console.error('Transfer error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Transfer failed'
    };
  }
}
