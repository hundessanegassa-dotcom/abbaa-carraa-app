import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DebugPage() {
  const [debug, setDebug] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabaseStatus, setSupabaseStatus] = useState('testing');

  const addDebug = (message, type = 'info') => {
    console.log('DEBUG:', message);
    setDebug(prev => [...prev, { time: new Date().toLocaleTimeString(), message, type }]);
  };

  useEffect(() => {
    addDebug('🔍 Debug page mounted');
    
    const runTests = async () => {
      // Test 1: Check environment variables
      addDebug('📋 Test 1: Checking environment variables...');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl) addDebug('⚠️ NEXT_PUBLIC_SUPABASE_URL is missing!', 'error');
      else addDebug('✅ NEXT_PUBLIC_SUPABASE_URL exists: ' + supabaseUrl.substring(0, 30) + '...');
      
      if (!supabaseKey) addDebug('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing!', 'error');
      else addDebug('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY exists');
      
      // Test 2: Try to import supabase
      addDebug('📦 Test 2: Importing supabase client...');
      try {
        const { supabase } = await import('../lib/supabase');
        addDebug('✅ Supabase client loaded successfully');
        setSupabaseStatus('connected');
        
        // Test 3: Simple query to pools table
        addDebug('🔍 Test 3: Querying pools table...');
        const startTime = Date.now();
        
        const { data, error, count } = await supabase
          .from('pools')
          .select('*', { count: 'exact', head: true })
          .limit(1);
        
        const duration = Date.now() - startTime;
        
        if (error) {
          addDebug(`❌ Supabase query error: ${error.message}`, 'error');
          setError(error.message);
        } else {
          addDebug(`✅ Supabase query successful! (${duration}ms)`);
          addDebug(`📊 Total pools count: ${count || 0}`);
          setSupabaseStatus('working');
        }
        
        // Test 4: Test getPoolsPaginated function
        addDebug('🔍 Test 4: Testing getPoolsPaginated function...');
        try {
          const { getPoolsPaginated } = await import('../lib/supabase');
          const result = await getPoolsPaginated(0, 5, { category: 'all', city: 'all' });
          addDebug(`✅ getPoolsPaginated returned ${result.data?.length || 0} pools`);
        } catch (err) {
          addDebug(`❌ getPoolsPaginated error: ${err.message}`, 'error');
        }
        
      } catch (err) {
        addDebug(`❌ Failed to load supabase: ${err.message}`, 'error');
        setError(err.message);
        setSupabaseStatus('failed');
      }
      
      addDebug('🏁 Debug tests completed');
      setLoading(false);
    };
    
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">🔧 Abbaa Carraa Diagnostic Tool</h1>
          <Link href="/" className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700">
            ← Back to Homepage
          </Link>
        </div>
        
        <div className="bg-green-900/30 border border-green-500 rounded-lg p-4 mb-6">
          <p className="text-green-300 text-sm">
            This diagnostic page tests your Supabase connection and API endpoints.
            <strong className="block mt-1">Your beautiful homepage is safe - this is a separate file.</strong>
          </p>
        </div>
        
        {/* Status Card */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">📊 System Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700/50 rounded p-3">
              <p className="text-gray-400 text-sm">Supabase Client</p>
              <p className={`font-bold ${
                supabaseStatus === 'working' ? 'text-green-400' : 
                supabaseStatus === 'connected' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {supabaseStatus === 'working' ? '✅ Working' : 
                 supabaseStatus === 'connected' ? '⚠️ Connected (query pending)' : '❌ Failed'}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded p-3">
              <p className="text-gray-400 text-sm">Environment</p>
              <p className="font-bold text-blue-400">
                {process.env.NODE_ENV || 'unknown'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Debug Log */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">📋 Debug Log</h2>
          <div className="bg-black/50 rounded-lg p-3 font-mono text-xs max-h-96 overflow-y-auto">
            {debug.map((d, i) => (
              <div key={i} className={`mb-1 ${
                d.type === 'error' ? 'text-red-400' : 'text-green-300'
              }`}>
                <span className="text-gray-500">[{d.time}]</span> {d.message}
              </div>
            ))}
            {loading && (
              <div className="text-yellow-400 mt-2">
                <span className="animate-pulse">⏳ Running tests...</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mt-6">
            <h3 className="font-bold text-red-400 mb-2">❌ Error Detected</h3>
            <p className="text-red-300 text-sm">{error}</p>
            <p className="text-red-400/70 text-xs mt-2">
              This error is preventing your homepage from loading. Fix this and your homepage will work again.
            </p>
          </div>
        )}
        
        {/* Instructions */}
        <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4 mt-6">
          <h3 className="font-bold text-blue-400 mb-2">💡 What to do next:</h3>
          <ol className="text-sm text-blue-300 space-y-1 list-decimal list-inside">
            <li>Look at the Debug Log above</li>
            <li>Find where it stops or shows an error</li>
            <li>Copy the entire debug output</li>
            <li>Share it with me so I can fix the exact issue</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
