import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function NewsletterSubscribe() {
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

      toast.success('Subscribed successfully! Check your email for updates.');
      setEmail('');
      setName('');
      setCity('');
    } catch (error) {
      toast.error(error.message || 'Subscription failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-12">
      <div className="container mx-auto px-4 text-center">
        <h3 className="text-2xl font-bold mb-2">Subscribe to Our Newsletter</h3>
        <p className="mb-6">Get updates about new pools, winners, and exclusive offers!</p>
        
        <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg text-gray-900"
              required
            />
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg text-gray-900"
              required
            />
            <input
              type="text"
              placeholder="Your city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg text-gray-900"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
