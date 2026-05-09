import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../DashboardLayout';

export default function VendorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ total_products: 0, total_pools: 0, total_sales: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkVendor(); }, []);

  async function checkVendor() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUser(user);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(profile);
    await loadVendorData(user.id);
  }

  async function loadVendorData(userId) {
    try {
      const { data: vendor } = await supabase.from('vendors').select('*').eq('user_id', userId).single();
      const { data: productsData } = await supabase.from('listings').select('*').eq('vendor_id', vendor?.id);
      setProducts(productsData || []);
      setStats({ total_products: productsData?.length || 0, total_pools: 0, total_sales: 0 });
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;

  return (
    <DashboardLayout title={`Welcome, Vendor ${profile?.full_name?.split(' ')[0] || ''}!`} subtitle="List products and earn 10% commission" icon="🏪" bgGradient="from-purple-600 to-pink-600" user={user} profile={profile}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Total Products</p><p className="text-2xl font-bold text-purple-600">{stats.total_products}</p><Link href="/vendor/listings/create" className="text-xs text-purple-500">+ Add Product</Link></div>
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Prize Pools</p><p className="text-2xl font-bold text-blue-600">{stats.total_pools}</p></div>
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Commission Earned</p><p className="text-2xl font-bold text-yellow-600">ETB {stats.total_sales.toLocaleString()}</p></div>
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-5 text-white"><p className="text-sm opacity-90">Charity Impact</p><p className="text-2xl font-bold">💚 {Math.floor(stats.total_sales * 0.02 / 100)} lives</p></div>
      </div>

      <div className="mb-10"><div className="flex items-center gap-3 mb-4"><span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">Phase 1</span><h2 className="text-xl font-bold text-gray-800">What You Can Do Now</h2></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link href="/vendor/listings/create" className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-5 text-white hover:shadow-xl transition"><div className="text-3xl mb-2">📦</div><h3 className="font-bold text-lg">List a Product</h3><p className="text-sm opacity-90 mt-1">Add products to be used as prizes</p><div className="mt-3 text-xs">Start earning →</div></Link>
        <Link href="/create-pool" className="bg-white rounded-2xl p-5 shadow-md border"><div className="text-3xl mb-2">🎯</div><h3 className="font-bold text-gray-800">Create Prize Pool</h3><p className="text-sm text-gray-500 mt-1">Turn your products into prize pools</p></Link>
        <div className="bg-white rounded-2xl p-5 shadow-md border"><div className="text-3xl mb-2">🏷️</div><h3 className="font-bold text-gray-800">Offer Discounts</h3><p className="text-sm text-gray-500 mt-1">Give 5-50% off to non-winners</p></div>
      </div></div>

      <div className="mb-10"><div className="flex items-center gap-3 mb-4"><span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">Phase 2</span><h2 className="text-xl font-bold text-gray-800">Coming Soon</h2></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 opacity-70">
        <div className="bg-gray-50 rounded-2xl p-5 border"><div className="text-3xl mb-2">📊</div><h3 className="font-bold">Sales Analytics</h3><p className="text-sm text-gray-500">Track product performance</p></div>
        <div className="bg-gray-50 rounded-2xl p-5 border"><div className="text-3xl mb-2">🤝</div><h3 className="font-bold">Bulk Listing</h3><p className="text-sm text-gray-500">Upload multiple products</p></div>
        <div className="bg-gray-50 rounded-2xl p-5 border"><div className="text-3xl mb-2">📱</div><h3 className="font-bold">Mobile Store</h3><p className="text-sm text-gray-500">Manage on the go</p></div>
      </div></div>

      <div><h2 className="text-xl font-bold text-gray-800 mb-4">📋 Your Products</h2><div className="bg-white rounded-2xl shadow-md overflow-hidden">{products.length === 0 ? <div className="p-8 text-center"><p className="text-gray-400">No products yet</p><Link href="/vendor/listings/create" className="text-purple-600 text-sm">Add your first product →</Link></div> : <div className="divide-y">{products.map(p => (<div key={p.id} className="p-4 flex justify-between items-center"><div><p className="font-medium">{p.title}</p><p className="text-xs text-gray-400">ETB {p.estimated_value?.toLocaleString()}</p></div><Link href={`/vendor/products/${p.id}`} className="text-purple-600 text-sm">Edit</Link></div>))}</div>}</div></div>
    </DashboardLayout>
  );
}
