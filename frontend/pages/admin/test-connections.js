// pages/admin/test-connections.js - Connection Test Tool
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function TestConnections() {
  const router = useRouter();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [runningTests, setRunningTests] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(profile);

      const { data: adminRecord } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (profile?.role !== 'admin' && !adminRecord) {
        toast.error('Admin access required');
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      await runTests();
    } catch (error) {
      console.error('Error checking user:', error);
      toast.error('Failed to verify user');
      setLoading(false);
    }
  };

  const runTests = async () => {
    setRunningTests(true);
    setLoading(true);
    const tests = [];

    // 1. Test Supabase Connection
    try {
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Supabase Connection',
        status: error ? '❌ Failed' : '✅ Connected',
        details: error ? error.message : 'Database reachable',
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'Supabase Connection', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 2. Test Auth
    tests.push({
      name: 'Authentication',
      status: user ? '✅ Active' : '⚠️ No user',
      details: user ? `Logged in as ${user.email}` : 'Please login to test auth',
      type: 'auth'
    });

    // 3. Test Pools Table
    try {
      const { data, error } = await supabase.from('pools').select('*', { count: 'exact', head: true });
      tests.push({
        name: 'Pools Table',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} pools found`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'Pools Table', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 4. Test Regular Pool Participants
    try {
      const { data, error } = await supabase.from('regular_pool_participants').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Regular Pool Participants',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} participants`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'Regular Pool Participants', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 5. Test Merkato VIP
    try {
      const { data, error } = await supabase.from('merkato_vip_pools').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Merkato VIP Pools',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} pools found`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'Merkato VIP Pools', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 6. Test Merkato VIP Participants
    try {
      const { data, error } = await supabase.from('merkato_vip_participants').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Merkato VIP Participants',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} participants`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'Merkato VIP Participants', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 7. Test City VIP
    try {
      const { data, error } = await supabase.from('city_vip_config').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'City VIP Config',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} cities configured`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'City VIP Config', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 8. Test City VIP Participants
    try {
      const { data, error } = await supabase.from('city_vip_participants').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'City VIP Participants',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} participants`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'City VIP Participants', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 9. Test Merkato VIP Draws
    try {
      const { data, error } = await supabase.from('merkato_vip_draws').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Merkato VIP Draws',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} draws recorded`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'Merkato VIP Draws', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 10. Test Notifications
    try {
      const { data, error } = await supabase.from('notifications').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'User Notifications',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} notifications`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'User Notifications', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 11. Test Admin Notifications
    try {
      const { data, error } = await supabase.from('admin_notifications').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Admin Notifications',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} notifications`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'Admin Notifications', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 12. Test Bank Transfers
    try {
      const { data, error } = await supabase.from('bank_transfers').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Bank Transfers',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} transfers`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'Bank Transfers', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 13. Test Withdrawals
    try {
      const { data, error } = await supabase.from('withdrawals').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Withdrawals',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} withdrawals`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'Withdrawals', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 14. Test Disputes
    try {
      const { data, error } = await supabase.from('disputes').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Disputes',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} disputes`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'Disputes', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 15. Test Commissions
    try {
      const { data, error } = await supabase.from('commissions').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Commissions',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} commissions`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'Commissions', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 16. Test User Settings
    try {
      const { data, error } = await supabase.from('user_settings').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'User Settings',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} settings`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'User Settings', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 17. Test Activity Logs
    try {
      const { data, error } = await supabase.from('activity_logs').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Activity Logs',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} logs`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'Activity Logs', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 18. Test Announcements
    try {
      const { data, error } = await supabase.from('announcements').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Announcements',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} announcements`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'Announcements', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 19. Test Agents
    try {
      const { data, error } = await supabase.from('agents').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Agents',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} agents`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'Agents', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 20. Test Vendors
    try {
      const { data, error } = await supabase.from('vendors').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Vendors',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} vendors`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'Vendors', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 21. Test Organizations
    try {
      const { data, error } = await supabase.from('organizations').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Organizations',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} organizations`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'Organizations', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 22. Test Admins
    try {
      const { data, error } = await supabase.from('admins').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Admins',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} admins`,
        type: 'database'
      });
    } catch (e) {
      tests.push({ name: 'Admins', status: '❌ Failed', details: e.message, type: 'database' });
    }

    // 23. Test Storage Buckets
    try {
      const { data, error } = await supabase.storage.listBuckets();
      const buckets = data?.map(b => b.name).join(', ') || 'none';
      tests.push({
        name: 'Storage Buckets',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `Buckets: ${buckets}`,
        type: 'storage'
      });
    } catch (e) {
      tests.push({ name: 'Storage Buckets', status: '❌ Failed', details: e.message, type: 'storage' });
    }

    // 24. Test Admin Access
    const isAdminUser = profile?.role === 'admin';
    tests.push({
      name: 'Admin Access',
      status: isAdminUser ? '✅ Granted' : '⚠️ Not Admin',
      details: isAdminUser ? 'Full admin permissions' : 'User is not an admin',
      type: 'auth'
    });

    setResults(tests);
    setLoading(false);
    setRunningTests(false);
  };

  const getStatusColor = (status) => {
    if (status.includes('✅')) return 'text-green-600';
    if (status.includes('❌')) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusBgColor = (status) => {
    if (status.includes('✅')) return 'bg-green-50 border-green-200';
    if (status.includes('❌')) return 'bg-red-50 border-red-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'database': return '🗄️';
      case 'auth': return '🔐';
      case 'storage': return '💾';
      default: return '📌';
    }
  };

  if (!isAdmin) return null;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Running connection tests...</p>
        </div>
      </div>
    );
  }

  const passed = results.filter(r => r.status.includes('✅')).length;
  const failed = results.filter(r => r.status.includes('❌')).length;
  const warnings = results.filter(r => r.status.includes('⚠️')).length;
  const total = results.length;
  const allPassed = passed === total;

  return (
    <AdminLayout
      title="Connection Test"
      subtitle={`${passed}/${total} tests passed`}
      icon="🔧"
      user={user}
      profile={profile}
      activeTab="test"
    >
      {/* Overall Status */}
      <div className={`p-5 rounded-xl mb-6 border-2 ${allPassed ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'}`}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-4xl">{allPassed ? '🎉' : '⚠️'}</div>
          <div>
            <p className="font-bold text-lg">
              {allPassed ? 'All Systems Connected!' : 'Some connections need attention'}
            </p>
            <p className="text-sm text-gray-600">
              {passed} passed • {failed} failed • {warnings} warnings • {total} total tests
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={runTests}
              disabled={runningTests}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 flex items-center gap-2"
            >
              {runningTests ? '⏳ Running...' : '🔄 Run Tests'}
            </button>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <div className="px-6 py-3 bg-gray-50 border-b flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Test Results</h3>
          <span className="text-sm text-gray-500">{new Date().toLocaleString()}</span>
        </div>
        <div className="divide-y divide-gray-200">
          {results.map((result, index) => (
            <div key={index} className={`p-4 flex flex-wrap justify-between items-center gap-2 ${getStatusBgColor(result.status)} border-l-4 ${result.status.includes('✅') ? 'border-l-green-500' : result.status.includes('❌') ? 'border-l-red-500' : 'border-l-yellow-500'}`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{getTypeIcon(result.type)}</span>
                <div>
                  <p className="font-medium text-gray-800">{result.name}</p>
                  <p className="text-sm text-gray-500">{result.details}</p>
                </div>
              </div>
              <span className={`font-bold text-sm ${getStatusColor(result.status)} whitespace-nowrap`}>
                {result.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => window.location.href = '/admin/dashboard'}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition text-center"
        >
          ← Dashboard
        </button>
        <button
          onClick={() => window.location.href = '/admin/verify-payments'}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition text-center"
        >
          💰 Verify Payments
        </button>
        <button
          onClick={() => window.location.href = '/admin/draw-winner'}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition text-center"
        >
          🎲 Draw Winner
        </button>
        <button
          onClick={() => window.location.href = '/admin/announcements'}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition text-center"
        >
          📢 Announcements
        </button>
      </div>
    </AdminLayout>
  );
}
