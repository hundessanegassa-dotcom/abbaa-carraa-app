import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([formData]);

      if (error) throw error;

      toast.success('Message sent! We will respond within 24 hours.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">Contact Us</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">📧 Email</h3>
              <p className="text-gray-600">support@abbaacarraa.com</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">📞 Phone</h3>
              <p className="text-gray-600">+251 9X XXX XXXX</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">📍 Address</h3>
              <p className="text-gray-600">Addis Ababa, Ethiopia</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">⏰ Hours</h3>
              <p className="text-gray-600">Monday - Friday: 9AM - 6PM</p>
              <p className="text-gray-600">Saturday: 10AM - 2PM</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Subject *</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Message *</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
