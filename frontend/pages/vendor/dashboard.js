import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function VendorDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ total_products: 0, total_pools: 0, total_sales: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkVendor(); }, []);

  async function checkVendor() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(profile);
    if (profile?.user_type !== 'vendor') { router.push('/dashboard'); return; }
    await loadVendorData(user.id);
  }

  async function loadVendorData(userId) {
    try {
      const { data: vendorData } = await supabase.from('vendors').select('*').eq('user_id', userId).single();
      const { data: productsData } = await supabase.from('listings').select('*').eq('vendor_id', vendorData?.id);
      setProducts(productsData || []);
      setStats({ total_products: productsData?.length || 0, total_pools: 0, total_sales: 0 });
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="container mx-auto px-4"><div className="flex justify-between items-center"><div><h1 className="text-3xl font-bold">Vendor Dashboard</h1><p className="text-purple-100">List products and create prize pools</p></div><Link href="/vendor/listings/create" className="bg-white text-purple-600 px-6 py-2 rounded-full font-semibold">+ Add Product</Link></div></div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-6"><div className="flex justify-between"><div><p className="text-gray-500">Total Products</p><p className="text-3xl font-bold text-purple-600">{stats.total_products}</p></div><div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center"><span className="text-xl">📦</span></div></div></div>
          <div className="bg-white rounded-2xl shadow-md p-6"><div className="flex justify-between"><div><p className="text-gray-500">Prize Pools Created</p><p className="text-3xl font-bold text-green-600">{stats.total_pools}</p></div><div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><span className="text-xl">🎯</span></div></div></div>
          <div className="bg-white rounded-2xl shadow-md p-6"><div className="flex justify-between"><div><p className="text-gray-500">Commission Earned</p><p className="text-3xl font-bold text-yellow-600">ETB {stats.total_sales.toLocaleString()}</p></div><div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center"><span className="text-xl">💰</span></div></div></div>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-md p-6"><h2 className="font-bold text-lg mb-4">📋 Your Products</h2>{products.length === 0 ? <p className="text-gray-400 text-center py-8">No products listed yet.<br/><Link href="/vendor/listings/create" className="text-purple-600 text-sm mt-2 inline-block">Add Your First Product →</Link></p> : products.map(p => (<div key={p.id} className="border-b py-3 flex justify-between"><div><p className="font-semibold">{p.title}</p><p className="text-sm text-gray-500">ETB {p.estimated_value?.toLocaleString()}</p></div><Link href={`/vendor/products/${p.id}`} className="text-purple-600 text-sm">Edit</Link></div>))}</div>
          <div className="space-y-6"><div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white"><h3 className="text-xl font-bold mb-3">🎯 Grow Your Business</h3><ul className="space-y-2 text-sm"><li>✓ List products as prizes</li><li>✓ Create prize pools from listings</li><li>✓ Earn 10% commission</li><li>✓ Offer discounts to participants</li></ul><Link href="/create-pool" className="inline-block mt-4 bg-white text-purple-600 px-4 py-2 rounded-full text-sm font-semibold">Create Prize Pool →</Link></div></div>
        </div>
      </div>
    </div>
  );
}
