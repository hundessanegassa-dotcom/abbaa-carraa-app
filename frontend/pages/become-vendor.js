import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import toast from 'react-hot-toast';

export default function BecomeVendor() {
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
    address: '',
    description: ''
  });

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login?redirect=/become-vendor');
      return;
    }
    setUser(user);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    setProfile(profile);
    
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id, verified')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (existingVendor) {
      if (existingVendor.verified) {
        toast.success('You are already a verified vendor!');
        router.push('/vendor/dashboard');
      } else {
        toast('Your vendor application is pending review', { icon: '⏳' });
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
      .from('vendors')
      .insert({
        user_id: user.id,
        business_name: formData.business_name,
        business_type: formData.business_type,
        tin: formData.tin,
        phone: formData.phone,
        address: formData.address,
        description: formData.description,
        verified: false,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      toast.error('Failed to submit application');
    } else {
      toast.success('Application submitted! We will review it soon.');
      router.push('/dashboard');
    }
    setApplying(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Become a Vendor - Abbaa Carraa Ethio</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
              <div className="text-4xl mb-2">🏪</div>
              <h1 className="text-2xl font-bold">Become a Vendor</h1>
              <p className="opacity-90 mt-1">List your products as prizes and earn commission</p>
            </div>

            <div className="p-6 border-b">
              <h2 className="font-bold text-gray-800 mb-3">What you get:</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-purple-50 rounded-xl p-3 text-center"><div className="text-2xl mb-1">💰</div><p className="font-semibold">10% Commission</p></div>
                <div className="bg-purple-50 rounded-xl p-3 text-center"><div className="text-2xl mb-1">🏷️</div><p className="font-semibold">Discount Offers</p><p className="text-xs">5-50% to non-winners</p></div>
                <div className="bg-purple-50 rounded-xl p-3 text-center"><div className="text-2xl mb-1">📈</div><p className="font-semibold">Marketing</p><p className="text-xs">Promoted to all users</p></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label><input type="text" value={formData.business_name} onChange={(e) => setFormData({...formData, business_name: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label><select value={formData.business_type} onChange={(e) => setFormData({...formData, business_type: e.target.value})} className="w-full px-4 py-2 border rounded-lg"><option value="individual">Individual / Sole Proprietor</option><option value="business">Business / Company</option><option value="organization">Organization</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">TIN (Optional)</label><input type="text" value={formData.tin} onChange={(e) => setFormData({...formData, tin: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">About Your Business</label><textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="Tell us about your products..." /></div>
              <button type="submit" disabled={applying} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition">{applying ? 'Submitting...' : 'Submit Application →'}</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
