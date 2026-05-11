import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import toast from 'react-hot-toast';

export default function BecomeOrganization() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_type: 'association',
    registration_number: '',
    tin: '',
    phone: '',
    email: '',
    address: '',
    description: '',
    website: ''
  });

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login?redirect=/become-organization');
      return;
    }
    setUser(user);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    setProfile(profile);
    
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id, verified')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (existingOrg) {
      if (existingOrg.verified) {
        toast.success('You are already a verified organization!');
        router.push('/organization/dashboard');
      } else {
        toast('Your organization application is pending review', { icon: '⏳' });
        router.push('/dashboard');
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      organization_name: profile?.full_name || '',
      phone: profile?.phone || '',
      email: user.email || ''
    }));
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApplying(true);
    
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('business_name', formData.organization_name)
      .maybeSingle();
    
    if (existing) {
      toast.error('An organization with this name already exists');
      setApplying(false);
      return;
    }
    
    const { error } = await supabase
      .from('organizations')
      .insert({
        user_id: user.id,
        business_name: formData.organization_name,
        organization_type: formData.organization_type,
        registration_number: formData.registration_number,
        tin: formData.tin,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        description: formData.description,
        website: formData.website,
        verified: false,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      toast.error('Failed to submit application');
      console.error(error);
    } else {
      toast.success('Organization application submitted! Admin will review it soon.');
      router.push('/dashboard');
    }
    setApplying(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Become an Organization - Abbaa Carraa Ethio</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
              <div className="text-4xl mb-2">🏢</div>
              <h1 className="text-2xl font-bold">Become an Organization Organizer</h1>
              <p className="opacity-90 mt-1">Create private pools for your members and earn 10% commission</p>
            </div>

            <div className="p-6 bg-blue-50 border-b border-blue-100">
              <h2 className="font-bold text-blue-800 mb-3 flex items-center gap-2"><span>💰</span> How You Earn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm"><p className="font-semibold text-green-600 text-lg">10% Commission</p><p className="text-sm text-gray-600">You earn 10% commission on every private pool you create</p><div className="mt-2 p-2 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Example:</p><p className="text-sm font-semibold">500,000 ETB pool → You earn 50,000 ETB</p></div></div>
                <div className="bg-white rounded-xl p-4 shadow-sm"><p className="font-semibold text-blue-600 text-lg">🏊 Private Pools</p><p className="text-sm text-gray-600">Create pools visible only to your organization members</p><div className="mt-2 p-2 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Perfect for:</p><p className="text-sm">Staff savings, member engagement, team building</p></div></div>
              </div>
            </div>

            <div className="p-6 border-b">
              <h2 className="font-bold text-gray-800 mb-3">Benefits for Organizations:</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center"><div className="text-2xl mb-1">💰</div><p className="font-semibold">10% Commission</p><p className="text-xs text-gray-500">On every pool</p></div>
                <div className="bg-blue-50 rounded-xl p-3 text-center"><div className="text-2xl mb-1">👥</div><p className="font-semibold">Member Management</p><p className="text-xs text-gray-500">Add & approve members</p></div>
                <div className="bg-blue-50 rounded-xl p-3 text-center"><div className="text-2xl mb-1">🔒</div><p className="font-semibold">Private Pools</p><p className="text-xs text-gray-500">Members-only access</p></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label><input type="text" value={formData.organization_name} onChange={(e) => setFormData({...formData, organization_name: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Organization Type *</label><select value={formData.organization_type} onChange={(e) => setFormData({...formData, organization_type: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required><option value="association">Association / Union</option><option value="cooperative">Cooperative</option><option value="ngo">NGO / Non-profit</option><option value="business">Business / Company</option><option value="religious">Religious Organization</option><option value="other">Other</option></select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label><input type="text" value={formData.registration_number} onChange={(e) => setFormData({...formData, registration_number: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="License / Registration No" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">TIN (Tax ID)</label><input type="text" value={formData.tin} onChange={(e) => setFormData({...formData, tin: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="For payouts above 10,000 ETB" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="City, Sub-city, Woreda" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Website (Optional)</label><input type="url" value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="https://..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">About Your Organization</label><textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="Tell us about your organization..." /></div>
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200"><p className="text-sm text-yellow-800 flex items-start gap-2"><span>ℹ️</span><span>Your application will be reviewed within 2-3 business days. Once approved, you can create private pools and start earning 10% commission!</span></p></div>
              <button type="submit" disabled={applying} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition">{applying ? 'Submitting Application...' : 'Submit Application →'}</button>
            </form>

            <div className="p-6 border-t text-center bg-gray-50">
              <p className="text-gray-600 text-sm">Already have an organization account? <Link href="/organization/dashboard" className="text-blue-600 font-semibold ml-1">Go to Dashboard →</Link></p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
