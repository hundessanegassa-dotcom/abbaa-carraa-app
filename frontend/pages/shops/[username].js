// pages/shops/[username].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import { getShopByUsername, joinShop } from '../../lib/shop';
import toast from 'react-hot-toast';

export default function ShopPage() {
  const router = useRouter();
  const { username } = router.query;
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDrawModal, setShowDrawModal] = useState(false);

  useEffect(() => {
    if (username) {
      loadShop();
      getUser();
    }
  }, [username]);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadShop = async () => {
    setLoading(true);
    const result = await getShopByUsername(username);
    if (result.success) {
      setShop(result.data);
      // Check if user is joined
      if (user) {
        checkJoinStatus(result.data.id);
      }
    } else {
      toast.error('Shop not found');
      router.push('/');
    }
    setLoading(false);
  };

  const checkJoinStatus = async (shopId) => {
    const { data } = await supabase
      .from('shop_participants')
      .select('id')
      .eq('shop_id', shopId)
      .eq('user_id', user.id)
      .maybeSingle();
    setIsJoined(!!data);
  };

  const handleJoinShop = async () => {
    if (!user) {
      localStorage.setItem('redirect_after_login', `/shops/${username}`);
      router.push('/login');
      return;
    }

    const result = await joinShop(shop.id, user.id);
    if (result.success) {
      setIsJoined(true);
      toast.success('Successfully joined the shop!');
    } else {
      toast.error(result.error || 'Failed to join shop');
    }
  };

  const handleBuyTicket = () => {
    if (!user) {
      localStorage.setItem('redirect_after_login', `/shops/${username}`);
      router.push('/login');
      return;
    }
    setShowDrawModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!shop) return null;

  return (
    <>
      <Head>
        <title>{shop.shop_name} - Abbaa Carraa Shop</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Shop Header */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 h-32"></div>
            <div className="relative px-6 pb-6">
              <div className="flex items-end -mt-16 gap-4">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center text-4xl overflow-hidden">
                  {shop.shop_image_url ? (
                    <img src={shop.shop_image_url} alt={shop.shop_name} className="w-full h-full object-cover" />
                  ) : (
                    '🏪'
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-800">{shop.shop_name}</h1>
                  <p className="text-gray-500">@{shop.shop_username}</p>
                </div>
                <button
                  onClick={isJoined ? undefined : handleJoinShop}
                  disabled={isJoined}
                  className={`px-6 py-2 rounded-full font-semibold transition ${
                    isJoined 
                      ? 'bg-gray-200 text-gray-600 cursor-default' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isJoined ? 'Joined ✓' : 'Join Shop'}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{shop.total_participants}</p>
                  <p className="text-xs text-gray-500">Participants</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{shop.total_winners}</p>
                  <p className="text-xs text-gray-500">Winners</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">⭐ {shop.rating || 0}</p>
                  <p className="text-xs text-gray-500">Rating</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{shop.city}</p>
                  <p className="text-xs text-gray-500">Location</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">{shop.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                    🏆 {shop.prize_type} Prize
                  </span>
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                    ETB {shop.prize_value.toLocaleString()}
                  </span>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {shop.category || 'General'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isJoined && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                onClick={handleBuyTicket}
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition"
              >
                🎟️ Buy Ticket
              </button>
              <button
                onClick={() => navigator.share?.({ title: shop.shop_name, url: window.location.href })}
                className="bg-gray-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition"
              >
                📤 Share Shop
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
