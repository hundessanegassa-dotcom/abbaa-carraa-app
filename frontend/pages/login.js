import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else {
      toast.success('Logged in!');
      router.push('/dashboard');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" className="w-full p-2 border rounded mb-4" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full p-2 border rounded mb-4" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">{loading ? 'Loading...' : 'Login'}</button>
        </form>
        <p className="text-center mt-4">Don't have an account? <Link href="/register" className="text-green-600">Register</Link></p>
      </div>
    </div>
  );
}
