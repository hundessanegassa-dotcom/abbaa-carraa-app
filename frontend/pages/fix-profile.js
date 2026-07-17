// pages/fix-profile.js - Fix Telegram Profile
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function FixProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Initializing...');
  const [result, setResult] = useState(null);

  useEffect(() => {
    fixProfile();
  }, []);

  const fixProfile = async () => {
    try {
      // Step 1: Get Telegram user data
      setStatus('📱 Retrieving Telegram user data...');
      const telegramUserStr = sessionStorage.getItem('telegram_user');
      const telegramToken = sessionStorage.getItem('telegram_session_token');
      
      if (!telegramUserStr) {
        setStatus('❌ No Telegram user found. Please login first.');
        setLoading(false);
        return;
      }
      
      const telegramUser = JSON.parse(telegramUserStr);
      const userId = telegramUser.id || telegramUser.userId || telegramUser.telegram_id;
      
      setStatus(`🔍 Found user ID: ${userId}`);
      
      // Step 2: Check if profile exists
      setStatus('🔍 Checking for existing profile...');
      const { data: existing, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (existing) {
        setStatus('✅ Profile already exists!');
        setResult(existing);
        toast.success('Profile found! Redirecting...');
        setTimeout(() => router.push('/dashboard'), 2000);
        setLoading(false);
        return;
      }
      
      // Step 3: Try to create profile
      setStatus('👤 Creating new profile...');
      
      // Try direct insert
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: telegramUser.email || `${userId}@telegram.user`,
          full_name: telegramUser.full_name || 'Telegram User',
          phone: telegramUser.phone_number || '',
          role: 'individual',
          user_type: 'individual',
          agreement_accepted: true,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        setStatus(`❌ Insert failed: ${insertError.message}`);
        console.error('Insert error:', insertError);
        
        // Try upsert
        setStatus('🔄 Trying upsert...');
        const { data: upsertProfile, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: telegramUser.email || `${userId}@telegram.user`,
            full_name: telegramUser.full_name || 'Telegram User',
            phone: telegramUser.phone_number || '',
            role: 'individual',
            user_type: 'individual',
            agreement_accepted: true,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (upsertError) {
          setStatus(`❌ Upsert failed: ${upsertError.message}`);
          console.error('Upsert error:', upsertError);
          toast.error('Failed to create profile. Please contact support.');
          setLoading(false);
          return;
        }
        
        setStatus('✅ Profile created via upsert!');
        setResult(upsertProfile);
        toast.success('Profile created! Redirecting...');
        setTimeout(() => router.push('/dashboard'), 2000);
        setLoading(false);
        return;
      }
      
      setStatus('✅ Profile created successfully!');
      setResult(newProfile);
      toast.success('Profile created! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 2000);
      
    } catch (error) {
      console.error('Fix profile error:', error);
      setStatus(`❌ Error: ${error.message}`);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4">🔧 Fix Profile</h1>
        
        <div className={`p-4 rounded-lg text-center ${
          loading ? 'bg-blue-50' : 
          status.includes('✅') ? 'bg-green-50' : 
          status.includes('❌') ? 'bg-red-50' : 'bg-yellow-50'
        }`}>
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-600 text-sm">{status}</p>
            </div>
          ) : (
            <>
              <p className="font-medium">{status}</p>
              {result && (
                <div className="mt-2 text-left text-xs bg-white p-2 rounded overflow-auto max-h-40">
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
              )}
            </>
          )}
        </div>
        
        {!loading && !status.includes('Redirecting') && (
          <div className="mt-4 flex gap-2">
            <button 
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Go to Dashboard
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Go to Login
            </button>
          </div>
        )}
        
        {!loading && status.includes('Redirecting') && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Redirecting...
          </div>
        )}
      </div>
    </div>
  );
}
