import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function WhatsAppWinnerNotification({ winner, prize, poolId }) {
  const [sending, setSending] = useState(false);

  const sendWhatsAppMessage = async () => {
    if (!winner?.phone) {
      alert('Winner phone number not available');
      return;
    }

    setSending(true);
    
    const message = `🎉 *Congratulations!* 🎉\n\nYou have won the *${prize}* prize pool on Abbaa Carraa!\n\n🏆 Prize Value: ETB ${prize.toLocaleString()}\n📞 Contact: +251-XXX-XXX-XXX\n\nClick below to claim your prize:`;
    const whatsappUrl = `https://wa.me/${winner.phone}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Log notification
    await supabase.from('notifications').insert({
      user_id: winner.id,
      title: 'Winner WhatsApp Message Sent',
      message: `WhatsApp message sent to ${winner.phone}`,
      type: 'winner_notification',
    });
    
    setSending(false);
  };

  return (
    <button
      onClick={sendWhatsAppMessage}
      disabled={sending}
      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
    >
      <span>📱</span>
      {sending ? 'Sending...' : 'Send WhatsApp'}
    </button>
  );
}
