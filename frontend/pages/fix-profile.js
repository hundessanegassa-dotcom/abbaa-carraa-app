// pages/fix-profile.js - Fix profile for Telegram users
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function FixProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Checking...');

  useEffect(() => {
    const fixProfile = async () => {
      try {
        // Get Telegram user data
        const telegramUserStr = sessionStorage.getItem('telegram_user');
        const telegramToken = sessionStorage.getItem('telegram_session_token');
        
        if (!telegramUserStr || !telegramToken) {
          setStatus('❌ No Telegram session found. Please login first.');
          setLoading(false);
          return;
        }
        
        const telegramUser = JSON.parse(telegramUserStr);
        const userId = telegramUser.id || telegramUser.userId || telegramUser.telegram_id;
        
        setStatus(`🔍 Looking for user: ${userId}`);
        
        // Check if profile exists
        const { data: existing, error: findError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (existing) {
          setStatus('✅ Profile already exists!');
          toast.success('Profile found! Redirecting to dashboard...');
          setTimeout(() => router.push('/dashboard'), 2000);
          setLoading(false);
          return;
        }
        
        setStatus('👤 Creating profile...');
        
        // Create profile
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            telegram_id: userId,
            telegram_username: telegramUser.username || null,
            full_name: telegramUser.full_name || 'Telegram User',
            email: telegramUser.email || `${userId}@telegram.user`,
            phone: telegramUser.phone_number || '',
            language: 'en',
            role: 'individual',
            user_type: 'individual',
            agreement_accepted: true,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createError) {
          setStatus(`❌ Failed to create profile: ${createError.message}`);
          toast.error('Failed to create profile. Please try again.');
          setLoading(false);
          return;
        }
        
        setStatus('✅ Profile created successfully!');
        toast.success('Profile created! Redirecting to dashboard...');
        setTimeout(() => router.push('/dashboard'), 2000);
        
      } catch (error) {
        console.error('Error:', error);
        setStatus(`❌ Error: ${error.message}`);
        toast.error('An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fixProfile();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">🔧 Fix Profile</h1>
        <div className={`p-4 rounded-lg ${loading ? 'bg-blue-50' : status.includes('✅') ? 'bg-green-50' : 'bg-yellow-50'}`}>
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-600">{status}</p>
            </div>
          ) : (
            <p className="font-medium">{status}</p>
          )}
        </div>
        {!loading && !status.includes('Redirecting') && (
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
}
