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
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } }
    });
    if (error) toast.error(error.message);
    else {
      if (data.user) {
        await supabase.from('profiles').insert([{
          id: data.user.id,
          email,
          full_name: fullName,
          phone,
          role: 'user'
        }]);
      }
      toast.success('Registered! Please check your email.');
      router.push('/login');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
        <form onSubmit={handleRegister}>
          <input type="text" placeholder="Full Name" className="w-full p-2 border rounded mb-4" value={fullName} onChange={e => setFullName(e.target.value)} required />
          <input type="email" placeholder="Email" className="w-full p-2 border rounded mb-4" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="tel" placeholder="Phone" className="w-full p-2 border rounded mb-4" value={phone} onChange={e => setPhone(e.target.value)} required />
          <input type="password" placeholder="Password (min 6)" className="w-full p-2 border rounded mb-4" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">{loading ? 'Creating...' : 'Register'}</button>
        </form>
        <p className="text-center mt-4">Already have an account? <Link href="/login" className="text-green-600">Login</Link></p>
      </div>
    </div>
  );
}
