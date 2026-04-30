import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
    await fetchProfile(user.id);
    await fetchContributions(user.id);
    setLoading(false);
  }

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
  }

  async function fetchContributions(userId) {
    const { data } = await supabase
      .from('contributions')
      .select('*, pools(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setContributions(data);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success(t('common.logout_success'));
    router.push('/');
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-green-600">
            Abbaa Carraa
          </Link>
          <button onClick={handleLogout} className="text-red-600 hover:text-red-700">
            {t('common.logout')}
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('common.dashboard')}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm mb-2">{t('common.total_contributions')}</h3>
            <p className="text-3xl font-bold text-green-600">
              ETB {profile?.total_contributions?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm mb-2">{t('common.total_wins')}</h3>
            <p className="text-3xl font-bold text-blue-600">{profile?.total_wins || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm mb-2">{t('common.active_entries')}</h3>
            <p className="text-3xl font-bold text-purple-600">
              {contributions.filter(c => c.status === 'completed').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-xl font-semibold">{t('common.recent_contributions')}</h2>
          </div>
          
          {contributions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>{t('common.no_contributions')}</p>
              <Link href="/" className="text-green-600 mt-2 inline-block">
                {t('common.browse_pools')} →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.pool')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.amount')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contributions.map((contrib) => (
                    <tr key={contrib.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium">{contrib.pools?.prize_name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{contrib.pools?.city || 'Addis Ababa'}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-green-600">
                        ETB {contrib.amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          contrib.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {contrib.status === 'completed' ? t('common.completed') : t('common.pending')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(contrib.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/listings" className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg text-center hover:from-green-600 hover:to-green-700 transition">
            🎁 {t('common.browse_prizes')}
          </Link>
          <Link href="/winners" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg text-center hover:from-blue-600 hover:to-blue-700 transition">
            🏆 {t('common.view_winners')}
          </Link>
        </div>
      </main>
    </div>
  );
}
