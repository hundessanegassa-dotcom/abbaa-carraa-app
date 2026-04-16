import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabase';  
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPools() {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('status', 'active')
        .limit(6);
      if (!error && data) setPools(data);
      setLoading(false);
    }
    fetchPools();
  }, []);

  return (
    <>
      <Head>
        <title>Abbaa Carraa - Community Prize Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen">
        <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{t('common.welcome')}</h1>
            <p className="text-xl mb-8">{t('common.tagline')}</p>
            <Link href="/register" className="bg-white text-green-600 px-8 py-3 rounded-full font-semibold hover:shadow-lg">
              Get Started
            </Link>
          </div>
        </section>
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">{t('pools.activePools')}</h2>
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pools.map(pool => (
                <div key={pool.id} className="card p-6">
                  <h3 className="text-xl font-bold">{pool.prize_name}</h3>
                  <p className="text-gray-600 my-2">{pool.description}</p>
                  <p className="font-bold text-green-600">ETB {pool.target_amount?.toLocaleString()}</p>
                  <Link href={`/pools/${pool.id}`}>
                    <button className="btn-primary w-full mt-4">{t('common.join')}</button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
