import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function NewsletterSubscribe() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error(t('newsletter.enter_email') || 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email, subscribed_at: new Date() });

      if (error) throw error;

      toast.success(t('newsletter.success') || 'Subscribed successfully!');
      setEmail('');
    } catch (error) {
      console.error('Newsletter error:', error);
      toast.error(error.message || t('newsletter.error') || 'Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-green-600 to-teal-600 py-12">
      <div className="container mx-auto px-4 text-center">
        <h3 className="text-2xl font-bold text-white mb-2">
          {t('newsletter.title') || 'Stay Updated'}
        </h3>
        <p className="text-green-100 mb-6">
          {t('newsletter.description') || 'Get notified about new prize pools and winners'}
        </p>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('newsletter.email_placeholder') || 'Your email address'}
            className="flex-1 px-4 py-2 rounded-lg border-0 focus:ring-2 focus:ring-white"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50"
          >
            {loading ? t('common.loading') || 'Loading...' : t('newsletter.subscribe') || 'Subscribe'}
          </button>
        </form>
      </div>
    </div>
  );
}
