import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function NewsletterSubscribe() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubscribe(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email, name, city }]);

      if (error) throw error;

      toast.success(t('newsletter.success'));
      setEmail('');
      setName('');
      setCity('');
    } catch (error) {
      toast.error(error.message || t('newsletter.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-12">
      <div className="container mx-auto px-4 text-center">
        <h3 className="text-2xl font-bold mb-2">{t('newsletter.title')}</h3>
        <p className="mb-6">{t('newsletter.description')}</p>
        
        <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" placeholder={t('newsletter.name_placeholder')} value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-4 py-2 rounded-lg text-gray-900" />
            <input type="email" placeholder={t('newsletter.email_placeholder')} value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 px-4 py-2 rounded-lg text-gray-900" required />
            <input type="text" placeholder={t('newsletter.city_placeholder')} value={city} onChange={(e) => setCity(e.target.value)} className="flex-1 px-4 py-2 rounded-lg text-gray-900" />
            <button type="submit" disabled={loading} className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50"> {loading ? t('newsletter.subscribing') : t('newsletter.subscribe')} </button>
          </div>
        </form>
      </div>
    </div>
  );
}
