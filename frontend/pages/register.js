import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [userType, setUserType] = useState('individual');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
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
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            email: email,
            full_name: fullName,
            phone: phone,
            city: city,
            user_type: userType,
            role: userType === 'agent' ? 'agent' : (userType === 'admin' ? 'admin' : 'user')
          }]);

        if (profileError) console.error('Profile creation error:', profileError);

        toast.success('Registration successful! Please check your email for verification.');
        
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join as an Organizer (earn 10%) or Participant (win prizes)
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="09XXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Addis Ababa"
              />
            </div>

            {/* User Type Selection with Organizer vs Participant distinction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                I want to join as:
              </label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="individual">👤 Individual</option>
                <option value="agent">🤝 Agent</option>
                <option value="vendor">🏭 Vendor</option>
                <option value="organization">🏢 Organization</option>
              </select>
              
              {/* Clear distinction box */}
              <div className="mt-3 p-3 rounded-lg text-sm">
                {userType === 'individual' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded">
                      <span className="text-lg">💰</span>
                      <span><strong>As Organizer:</strong> Create pools → Earn 10% commission</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-700 bg-blue-50 p-2 rounded">
                      <span className="text-lg">🎯</span>
                      <span><strong>As Participant:</strong> Join pools → Chance to win prizes</span>
                    </div>
                  </div>
                )}
                
                {userType === 'agent' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded">
                      <span className="text-lg">💰</span>
                      <span><strong>As Agent Organizer:</strong> Create pools → Earn 10% commission</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-700 bg-blue-50 p-2 rounded">
                      <span className="text-lg">🏪</span>
                      <span><strong>Benefits:</strong> List products from local businesses, build your community</span>
                    </div>
                  </div>
                )}
                
                {userType === 'vendor' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded">
                      <span className="text-lg">💰</span>
                      <span><strong>As Vendor Organizer:</strong> Create pools → Earn 10% commission</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-700 bg-blue-50 p-2 rounded">
                      <span className="text-lg">🎁</span>
                      <span><strong>Benefits:</strong> Winner gets product FREE, non-winners get discounts</span>
                    </div>
                  </div>
                )}
                
                {userType === 'organization' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded">
                      <span className="text-lg">💰</span>
                      <span><strong>As Organization Organizer:</strong> Create private pools → Earn 10% commission</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-700 bg-blue-50 p-2 rounded">
                      <span className="text-lg">🏢</span>
                      <span><strong>Benefits:</strong> Perfect for banks, NGOs, schools, community groups</span>
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                Note: Anyone can create a pool (Organizer) and earn 10% commission. Anyone can join pools (Participant) for a chance to win prizes.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Minimum 6 characters"
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-green-600 hover:text-green-500">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
