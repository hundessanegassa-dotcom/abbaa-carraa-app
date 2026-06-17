// pages/admin/test-connections.js - Connection Test Tool
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';

export default function TestConnections() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(profile);
    }
    await runTests();
  };

  const runTests = async () => {
    setLoading(true);
    const tests = [];

    // 1. Test Supabase Connection
    try {
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Supabase Connection',
        status: error ? '❌ Failed' : '✅ Connected',
        details: error ? error.message : 'Database reachable'
      });
    } catch (e) {
      tests.push({ name: 'Supabase Connection', status: '❌ Failed', details: e.message });
    }

    // 2. Test Auth
    tests.push({
      name: 'Authentication',
      status: user ? '✅ Active' : '⚠️ No user',
      details: user ? `Logged in as ${user.email}` : 'Please login to test auth'
    });

    // 3. Test Pools
    try {
      const { data, error } = await supabase.from('pools').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Pools Table',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} pools found`
      });
    } catch (e) {
      tests.push({ name: 'Pools Table', status: '❌ Failed', details: e.message });
    }

    // 4. Test Merkato VIP
    try {
      const { data, error } = await supabase.from('merkato_vip_pools').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Merkato VIP',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} pools found`
      });
    } catch (e) {
      tests.push({ name: 'Merkato VIP', status: '❌ Failed', details: e.message });
    }

    // 5. Test City VIP
    try {
      const { data, error } = await supabase.from('city_vip_config').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'City VIP',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} cities configured`
      });
    } catch (e) {
      tests.push({ name: 'City VIP', status: '❌ Failed', details: e.message });
    }

    // 6. Test Notifications
    try {
      const { data, error } = await supabase.from('notifications').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Notifications',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} notifications`
      });
    } catch (e) {
      tests.push({ name: 'Notifications', status: '❌ Failed', details: e.message });
    }

    // 7. Test Admin Access
    const isAdmin = profile?.role === 'admin';
    tests.push({
      name: 'Admin Access',
      status: isAdmin ? '✅ Granted' : '⚠️ Not Admin',
      details: isAdmin ? 'Full admin permissions' : 'User is not an admin'
    });

    // 8. Test Activity Logs
    try {
      const { data, error } = await supabase.from('activity_logs').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Activity Logs',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} logs`
      });
    } catch (e) {
      tests.push({ name: 'Activity Logs', status: '❌ Failed', details: e.message });
    }

    // 9. Test Announcements
    try {
      const { data, error } = await supabase.from('announcements').select('count', { count: 'exact', head: true });
      tests.push({
        name: 'Announcements',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `${data?.length || 0} announcements`
      });
    } catch (e) {
      tests.push({ name: 'Announcements', status: '❌ Failed', details: e.message });
    }

    // 10. Test Storage
    try {
      const { data, error } = await supabase.storage.listBuckets();
      const buckets = data?.map(b => b.name).join(', ') || 'none';
      tests.push({
        name: 'Storage Buckets',
        status: error ? '❌ Error' : '✅ Available',
        details: error ? error.message : `Buckets: ${buckets}`
      });
    } catch (e) {
      tests.push({ name: 'Storage Buckets', status: '❌ Failed', details: e.message });
    }

    setResults(tests);
    setLoading(false);
  };

  const getStatusColor = (status) => {
    if (status.includes('✅')) return 'text-green-600';
    if (status.includes('❌')) return 'text-red-600';
    return 'text-yellow-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const passed = results.filter(r => r.status.includes('✅')).length;
  const total = results.length;

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
      <div className={`p-4 rounded-xl mb-6 ${passed === total ? 'bg-green-100 border border-green-300' : 'bg-yellow-100 border border-yellow-300'}`}>
        <p className="font-bold text-lg">
          {passed === total ? '🎉 All Systems Connected!' : '⚠️ Some connections need attention'}
        </p>
        <p className="text-sm text-gray-600">{passed}/{total} tests passed</p>
      </div>

      {/* Test Results */}
      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <div className="divide-y divide-gray-200">
          {results.map((result, index) => (
            <div key={index} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">{result.name}</p>
                <p className="text-sm text-gray-500">{result.details}</p>
              </div>
              <span className={`font-bold ${getStatusColor(result.status)}`}>
                {result.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={runTests}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition"
        >
          🔄 Run Tests Again
        </button>
        <button
          onClick={() => window.location.href = '/admin/dashboard'}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition"
        >
          ← Back to Dashboard
        </button>
      </div>
    </AdminLayout>
  );
}
