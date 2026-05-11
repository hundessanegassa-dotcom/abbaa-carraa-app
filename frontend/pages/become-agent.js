import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import toast from 'react-hot-toast';

export default function BecomeAgent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: 'individual',
    tin: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login?redirect=/become-agent');
      return;
    }
    setUser(user);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    setProfile(profile);
    
    // Check if already an agent
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id, verified')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (existingAgent) {
      if (existingAgent.verified) {
        toast.success('You are already a verified agent!');
        router.push('/agent/dashboard');
      } else {
        toast('Your agent application is pending review', { icon: '⏳' });
        router.push('/dashboard');
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      business_name: profile?.full_name || '',
      phone: profile?.phone || ''
    }));
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApplying(true);
    
    const { error } = await supabase
      .from('agents')
      .insert({
        user_id: user.id,
        business_name: formData.business_name,
        business_type: formData.business_type,
        tin: formData.tin,
        phone: formData.phone,
        address: formData.address,
        verified: false,
        commission_rate: 10,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      toast.error('Failed to submit application');
      console.error(error);
    } else {
      toast.success('Application submitted! Admin will review it soon.');
      router.push('/dashboard');
    }
    setApplying(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Become an Agent - Abbaa Carraa Ethio</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white">
              <div className="text-4xl mb-2">🤝</div>
              <h1 className="text-2xl font-bold">Become an Agent</h1>
              <p className="opacity-90 mt-1">Create prize pools and earn 10% commission</p>
            </div>

            {/* Benefits */}
            <div className="p-6 border-b">
              <h2 className="font-bold text-gray-800 mb-3">What you get:</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-yellow-50 rounded-xl p-3 text-center"><div className="text-2xl mb-1">💰</div><p className="font-semibold">10% Commission</p><p className="text-xs text-gray-500">On every pool you create</p></div>
                <div className="bg-yellow-50 rounded-xl p-3 text-center"><div className="text-2xl mb-1">📦</div><p className="font-semibold">No Fees</p><p className="text-xs text-gray-500">No listing or upfront costs</p></div>
                <div className="bg-yellow-50 rounded-xl p-3 text-center"><div className="text-2xl mb-1">🏆</div><p className="font-semibold">Support</p><p className="text-xs text-gray-500">Priority assistance</p></div>
              </div>
            </div>

            {/* Application Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                <input type="text" value={formData.business_name} onChange={(e) => setFormData({...formData, business_name: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                <select value={formData.business_type} onChange={(e) => setFormData({...formData, business_type: e.target.value})} className="w-full px-4 py-2 border rounded-lg">
                  <option value="individual">Individual / Sole Proprietor</option>
                  <option value="business">Business / Company</option>
                  <option value="organization">Organization / NGO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TIN (Optional)</label>
                <input type="text" value={formData.tin} onChange={(e) => setFormData({...formData, tin: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="For commission above 10,000 ETB" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="City, Sub-city, Woreda" />
              </div>
              <button type="submit" disabled={applying} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition">
                {applying ? 'Submitting...' : 'Submit Application →'}
              </button>
            </form>

            <div className="p-6 border-t text-center bg-gray-50">
              <p className="text-gray-600 text-sm">
                Already an agent? 
                <Link href="/agent/dashboard" className="text-yellow-600 font-semibold ml-1">Go to Dashboard →</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
