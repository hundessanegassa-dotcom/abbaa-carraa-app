// pages/contact.js - UPDATED WITH ALL THREE PROGRAMS & YOUR CONTACT INFO
import BackButton from '../components/BackButton';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';

export async function getServerSideProps() {
  return { props: {} };
}

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    program: '',
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
        .insert([{ ...formData, created_at: new Date() }]);

      if (error) throw error;

      toast.success('Message sent! We will respond within 24 hours.');
      setFormData({ name: '', email: '', phone: '', program: '', subject: '', message: '' });
    } catch (error) {
      toast.error(error.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-4"><BackButton /></div>
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">Contact Us</h1>
        <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
          Need help with Merkato VIP, City VIP, or Regular Pools? We're here to help!
        </p>
        
        {/* Program Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg p-3 text-white text-center">
            <div className="text-2xl">🏪</div>
            <p className="font-semibold text-sm">Merkato VIP</p>
            <p className="text-xs opacity-90">Daily 1M | Weekly 10M | Monthly 40M</p>
          </div>
          <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-lg p-3 text-white text-center">
            <div className="text-2xl">🏙️</div>
            <p className="font-semibold text-sm">City VIP</p>
            <p className="text-xs opacity-90">94+ Cities | Nationwide</p>
          </div>
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-3 text-white text-center">
            <div className="text-2xl">🏊</div>
            <p className="font-semibold text-sm">Regular Pools</p>
            <p className="text-xs opacity-90">Cars | Houses | Electronics</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Info Cards - UPDATED WITH YOUR INFO ONLY */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow p-5 hover:shadow-md transition">
              <div className="text-3xl mb-2">📧</div>
              <h3 className="font-bold text-lg mb-1">Email Support</h3>
              <p className="text-gray-600 text-sm break-all">hundessanegassa@gmail.com</p>
              <p className="text-xs text-gray-400 mt-2">Response within 24 hours</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-5 hover:shadow-md transition">
              <div className="text-3xl mb-2">📞</div>
              <h3 className="font-bold text-lg mb-1">Phone Support</h3>
              <p className="text-gray-600 text-sm">0930330323</p>
              <p className="text-gray-600 text-sm">0913277922</p>
              <p className="text-xs text-gray-400 mt-2">Mon-Sat: 9AM - 6PM</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-5 hover:shadow-md transition">
              <div className="text-3xl mb-2">📍</div>
              <h3 className="font-bold text-lg mb-1">Address</h3>
              <p className="text-gray-600 text-sm">Addis Ababa, Ethiopia</p>
              <p className="text-xs text-gray-400 mt-2">Head Office</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-5 border border-green-200">
              <div className="text-3xl mb-2">💚</div>
              <h3 className="font-bold text-lg mb-1">2% for Health</h3>
              <p className="text-sm text-gray-600">Supporting kidney & heart disease patients in Ethiopia</p>
              <p className="text-xs text-green-600 mt-2">Every contribution helps save lives</p>
            </div>
          </div>

          {/* Contact Form - UPDATED WITH PROGRAM SELECTION */}
          <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-2">Send Us a Message</h2>
            <p className="text-gray-500 text-sm mb-6">Fill out the form below and we'll get back to you within 24 hours.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., John Doe"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., john@example.com"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 0912345678"
                />
                <p className="text-xs text-gray-400 mt-1">Required for prize-related inquiries</p>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Program *</label>
                <select
                  required
                  value={formData.program}
                  onChange={(e) => setFormData({...formData, program: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">-- Select a program --</option>
                  <option value="Merkato VIP">🏪 Merkato VIP</option>
                  <option value="City VIP">🏙️ City VIP</option>
                  <option value="Regular Pool">🏊 Regular Pool</option>
                  <option value="General">❓ General Question</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Subject *</label>
                <select
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">-- Select a topic --</option>
                  <option value="Payment Issue">💰 Payment Issue</option>
                  <option value="Prize Claim">🏆 Prize Claim</option>
                  <option value="Technical Support">🔧 Technical Support</option>
                  <option value="Agent Application">🤝 Agent Application</option>
                  <option value="Vendor Registration">🏪 Vendor Registration</option>
                  <option value="Report Issue">📢 Report an Issue</option>
                  <option value="Partnership">🤝 Partnership Inquiry</option>
                  <option value="General Question">❓ General Question</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Message *</label>
                <textarea
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Please describe your question or issue in detail..."
                ></textarea>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">📌 Response time: Within 24 hours (Monday-Saturday)</p>
                <p className="text-xs text-gray-500 mt-1">🔒 Your information is kept confidential per our Privacy Policy</p>
                <p className="text-xs text-green-600 mt-1">💚 2% of all contributions support kidney & heart disease patients</p>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Sending...' : 'Send Message →'}
              </button>
            </form>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Before contacting us, check our{" "}
            <Link href="/faq" className="text-green-600 font-semibold hover:underline">
              Frequently Asked Questions
            </Link>
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <Link href="/terms" className="text-sm text-gray-500 hover:text-green-600">
              Terms & Conditions
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-green-600">
              Privacy Policy
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/about" className="text-sm text-gray-500 hover:text-green-600">
              About Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
