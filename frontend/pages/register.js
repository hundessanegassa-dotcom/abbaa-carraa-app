import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function Register() {
  const { t } = useTranslation();
  const router = useRouter();
  const [registerMethod, setRegisterMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [userType, setUserType] = useState('individual');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);

    try {
      let emailToUse = email;
      
      if (registerMethod === 'phone') {
        emailToUse = `${phone}@abbaacarraa.com`;
      }

      const { data, error } = await supabase.auth.signUp({
        email: emailToUse,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            city: city,
            user_type: userType
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            email: emailToUse,
            full_name: fullName,
            phone: phone,
            city: city,
            user_type: userType,
            role: userType === 'agent' ? 'agent' : (userType === 'admin' ? 'admin' : 'user')
          }]);

        toast.success(t('common.register_success'));
        
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || t('common.register_error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialSignUp(provider) {
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('common.create_account')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('common.join_prize_pools')}
          </p>
        </div>

        {/* Social Sign Up Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleSocialSignUp('google')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t('common.signup_google')}
          </button>

          <button
            onClick={() => handleSocialSignUp('github')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
          >
            <svg className="w-5 h-5" fill="#333" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48 0-.24-.01-.88-.01-1.73-2.78.6-3.37-1.2-3.37-1.2-.45-1.15-1.11-1.46-1.11-1.46-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48C19.13 20.17 22 16.42 22 12c0-5.52-4.48-10-10-10z" />
            </svg>
            {t('common.signup_github')}
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">{t('common.or_signup_with')}</span>
          </div>
        </div>

        {/* Registration Method Toggle */}
        <div className="flex rounded-lg shadow-sm">
          <button
            type="button"
            onClick={() => setRegisterMethod('email')}
            className={`w-1/2 py-2 text-center rounded-l-lg transition ${
              registerMethod === 'email'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📧 {t('common.email')}
          </button>
          <button
            type="button"
            onClick={() => setRegisterMethod('phone')}
            className={`w-1/2 py-2 text-center rounded-r-lg transition ${
              registerMethod === 'phone'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📱 {t('common.phone')}
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.full_name')}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder={t('common.full_name_placeholder')}
              />
            </div>

            {registerMethod === 'email' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.email_address')}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder={t('common.email_placeholder')}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.phone_number')}
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder={t('common.phone_placeholder')}
                />
                <p className="text-xs text-gray-500 mt-1">{t('common.sms_notifications')}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.city')}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder={t('common.city_placeholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.i_am_joining_as')}
              </label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="individual">👤 {t('common.individual')}</option>
                <option value="agent">🤝 {t('common.agent')}</option>
                <option value="vendor">🏭 {t('common.vendor')}</option>
                <option value="organization">🏢 {t('common.organization')}</option>
              </select>
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                {userType === 'agent' && `💰 ${t('agent.earn_commission')}`}
                {userType === 'vendor' && `🏆 ${t('vendor.offer_discounts')}`}
                {userType === 'organization' && `🏢 ${t('organization.internal_pools')}`}
                {userType === 'individual' && `🎯 ${t('common.join_pools')}`}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.password')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder={t('common.password_placeholder')}
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">{t('common.password_min_length')}</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-400 transition"
          >
            {loading ? t('common.creating_account') : t('common.sign_up')}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t('common.already_have_account')}{' '}
              <Link href="/login" className="font-medium text-green-600 hover:text-green-500">
                {t('common.sign_in')}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
