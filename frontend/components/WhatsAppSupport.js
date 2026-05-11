import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function WhatsAppSupport() {
  const [phoneNumber, setPhoneNumber] = useState('251930330323'); // Your number
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Get support number from database if available
    const fetchSupportNumber = async () => {
      const { data } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'support_phone')
        .maybeSingle();
      if (data) setPhoneNumber(data.setting_value);
    };
    fetchSupportNumber();
  }, []);

  const defaultMessage = encodeURIComponent(
    `Hello! I need help with Abbaa Carraa Ethio app.\n\n` +
    `My name: \n` +
    `Issue: \n\n` +
    `Thank you!`
  );

  const handleHelp = () => {
    window.open(`https://wa.me/${phoneNumber}?text=${defaultMessage}`, '_blank');
  };

  return (
    <>
      {/* Floating WhatsApp Button */}
      <button
        onClick={handleHelp}
        className="fixed bottom-20 right-4 z-40 bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition hover:scale-110 group"
        aria-label="WhatsApp Support"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
        
        {/* Tooltip on hover */}
        <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
          Need help? Chat with us
        </span>
      </button>
    </>
  );
}
