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
  const [stats, setStats] = useState({ total_products: 0, total_pools: 0, total_sales: 0, total_commission: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkVendor(); }, []);

  async function checkVendor() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUser(user);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    setProfile(profile);
    if (profile?.user_type !== 'vendor') { router.push('/dashboard'); return; }
    await loadVendorData(user.id);
  }

  async function loadVendorData(userId) {
    try {
      const { data: vendor } = await supabase.from('vendors').select('*').eq('user_id', userId).maybeSingle();
      const { data: productsData } = await supabase.from('listings').select('*').eq('vendor_id', vendor?.id);
      setProducts(productsData || []);
      const { data: pools } = await supabase.from('pools').select('*').eq('vendor_id', vendor?.id);
      const totalSales = pools?.reduce((sum, p) => sum + (p.current_amount || 0), 0) || 0;
      const { data: commissions } = await supabase.from('commissions').select('amount').eq('vendor_id', vendor?.id);
      const totalCommission = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0;
      setStats({ total_products: productsData?.length || 0, total_pools: pools?.length || 0, total_sales: totalSales, total_commission: totalCommission });
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;

  const charityAmount = stats.total_commission * 0.02;
  const livesImpacted = Math.floor(charityAmount / 100);

  return (
    <DashboardLayout title={`Welcome, Vendor ${profile?.full_name?.split(' ')[0] || ''}! 🏪`} subtitle="List products, create pools, earn 10% commission" icon="🏪" bgGradient="from-purple-600 to-pink-600" user={user} profile={profile}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Total Products</p><p className="text-2xl font-bold text-purple-600">{stats.total_products}</p><Link href="/vendor/listings/create" className="text-xs text-purple-500">+ Add Product</Link></div>
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Prize Pools</p><p className="text-2xl font-bold text-blue-600">{stats.total_pools}</p></div>
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Total Sales</p><p className="text-2xl font-bold text-green-600">ETB {stats.total_sales.toLocaleString()}</p></div>
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Commission Earned</p><p className="text-2xl font-bold text-yellow-600">ETB {stats.total_commission.toLocaleString()}</p></div>
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-5 text-white"><p className="text-sm opacity-90">Charity Impact</p><p className="text-2xl font-bold">💚 {livesImpacted} lives</p><p className="text-xs opacity-80">2% of commissions</p></div>
      </div>

      <div className="mb-8 p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
        <div className="flex items-start gap-4"><div className="text-4xl">🏪</div><div><h3 className="font-bold text-purple-800 text-lg">Your Vendor Dashboard</h3><p className="text-sm text-purple-700 mt-1">As a Vendor, you list products to be used as prizes in pools. You earn <strong>10% commission</strong> when your product is featured in a pool. Offer discounts (5-50%) to non-winners to boost participation!</p><div className="flex flex-wrap gap-3 mt-3"><span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">✓ List products</span><span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">✓ Create prize pools</span><span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">✓ Offer discounts</span><span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">✓ Track sales</span></div></div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Link href="/vendor/listings/create" className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-5 text-white text-center hover:shadow-xl transition"><div className="text-3xl mb-2">📦</div><h3 className="font-bold">List a Product</h3><p className="text-sm opacity-90">Add products as prizes</p></Link>
        <Link href="/create-pool" className="bg-white rounded-2xl p-5 shadow-md border text-center hover:shadow-lg transition"><div className="text-3xl mb-2">🎯</div><h3 className="font-bold text-gray-800">Create Prize Pool</h3><p className="text-sm text-gray-500">Turn products into pools</p></Link>
        <Link href="/vendor/analytics" className="bg-white rounded-2xl p-5 shadow-md border text-center hover:shadow-lg transition"><div className="text-3xl mb-2">📈</div><h3 className="font-bold text-gray-800">Sales Analytics</h3><p className="text-sm text-gray-500">Track performance</p></Link>
      </div>

      <div><h2 className="text-xl font-bold text-gray-800 mb-4">📋 Your Products</h2><div className="bg-white rounded-2xl shadow-md overflow-hidden">{products.length === 0 ? <div className="p-8 text-center"><div className="text-5xl mb-3">📦</div><p className="text-gray-400">No products yet</p><Link href="/vendor/listings/create" className="text-purple-600 text-sm mt-2 inline-block">Add your first product →</Link></div> : <div className="divide-y">{products.map(p => (<div key={p.id} className="p-4 flex justify-between items-center hover:bg-gray-50"><div><h3 className="font-bold">{p.title}</h3><p className="text-sm text-gray-500">ETB {p.estimated_value?.toLocaleString()}</p></div><Link href={`/vendor/products/${p.id}`} className="text-purple-600 text-sm">Edit</Link></div>))}</div>}</div></div>
    </DashboardLayout>
  );
}
