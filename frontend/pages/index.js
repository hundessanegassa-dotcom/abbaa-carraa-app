import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Abbaa Carraa Ethio</title>
        <meta name="description" content="Win amazing prizes through community savings" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Simple Navbar test */}
        <div className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🎁</span>
            </div>
            <span className="font-bold text-green-600">Abbaa Carraa Ethio</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="text-gray-600 hover:text-green-600">Login</Link>
            <Link href="/register" className="bg-green-600 text-white px-4 py-1 rounded-full text-sm">Register</Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-block w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <span className="text-5xl">🎁</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome to <span className="text-yellow-300">Abbaa Carraa Ethio</span>
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Win amazing prizes while supporting health initiatives in Ethiopia
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-white text-green-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition">
                Get Started
              </Link>
              <Link href="/listings" className="bg-white/20 hover:bg-white/30 px-8 py-3 rounded-full font-semibold transition">
                Browse Prizes
              </Link>
            </div>
          </div>
        </div>

        {/* Simple Stats */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 text-center shadow-md">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-2xl font-bold text-green-600">50+</div>
              <p className="text-gray-500">Active Pools</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-md">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-2xl font-bold text-green-600">100+</div>
              <p className="text-gray-500">Happy Winners</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-md">
              <div className="text-3xl mb-2">🤝</div>
              <div className="text-2xl font-bold text-green-600">20+</div>
              <p className="text-gray-500">Agents</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-md">
              <div className="text-3xl mb-2">💚</div>
              <div className="text-2xl font-bold text-green-600">2%</div>
              <p className="text-gray-500">For Health</p>
            </div>
          </div>
        </div>

        {/* Charity Section */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-12">
          <div className="container mx-auto px-4 text-center">
            <div className="text-5xl mb-4">💚</div>
            <h2 className="text-2xl font-bold mb-2">2% for Health</h2>
            <p className="max-w-2xl mx-auto">
              Every contribution helps Ethiopians fighting kidney disease and heart disease
            </p>
          </div>
        </div>

        {/* Simple Footer */}
        <div className="bg-gray-900 text-white py-6 text-center text-sm">
          <p>© 2026 Abbaa Carraa Ethio. All rights reserved.</p>
        </div>
      </div>
    </>
  );
}
