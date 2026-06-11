// components/NewsletterSubscribe.js - CORRECTED VERSION
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function NewsletterSubscribe() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return re.test(email);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    
    try {
      // Check if already subscribed
      const { data: existing, error: checkError } = await supabase
        .from('newsletter_subscribers')
        .select('email, is_active')
        .eq('email', email)
        .maybeSingle();
      
      if (existing) {
        if (existing.is_active) {
          toast.success('You are already subscribed! 🎉');
          setSubscribed(true);
          setLoading(false);
          return;
        } else {
          // Reactivate subscription
          const { error: updateError } = await supabase
            .from('newsletter_subscribers')
            .update({ 
              is_active: true, 
              subscribed_at: new Date().toISOString()
            })
            .eq('email', email);
          
          if (updateError) throw updateError;
          toast.success('Welcome back! You have been resubscribed 🎉');
          setSubscribed(true);
          setLoading(false);
          return;
        }
      }
      
      // Insert new subscriber - using 'subscribed_from' instead of 'source'
      const { error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: email,
          name: name || null,
          subscribed_from: 'newsletter_widget',
          subscribed_at: new Date().toISOString(),
          is_active: true,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 500) : null
        });
      
      if (insertError) throw insertError;
      
      toast.success('Successfully subscribed to our newsletter! 🎉');
      setEmail('');
      setName('');
      setSubscribed(true);
      
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error(error.message || 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="bg-gradient-to-r from-green-600 to-teal-600 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <span className="text-3xl">📧</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Thank You for Subscribing!</h3>
          <p className="text-green-100">You'll receive our latest updates and exclusive offers.</p>
          <button 
            onClick={() => setSubscribed(false)}
            className="mt-4 text-white underline hover:no-underline"
          >
            Subscribe another email →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-600/20 px-4 py-1.5 rounded-full mb-4">
            <span className="text-green-400 text-lg">📧</span>
            <span className="text-green-300 text-sm font-semibold">Stay Updated</span>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-3">
            Subscribe to Our Newsletter
          </h2>
          <p className="text-gray-300 mb-6">
            Get the latest updates on new pools, winners, and exclusive offers delivered to your inbox.
          </p>
          
          <form onSubmit={handleSubscribe} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <input
                type="email"
                placeholder="Your email address *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Subscribing...
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </form>
          
          <p className="text-xs text-gray-500 mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-gray-500">
            <span>✓ No spam</span>
            <span>✓ Weekly updates</span>
            <span>✓ Exclusive offers</span>
            <span>✓ Winner announcements</span>
          </div>
        </div>
      </div>
    </div>
  );
}
