import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Image from 'next/image';

export default function AdvertisingBanner() {
  const [products, setProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  async function fetchFeaturedProducts() {
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .in('prize_name', ['Sino Truck', 'Excavator', 'Wheel Loader', 'Modern House', 'V8 Car', 'Block Making Machine'])
        .eq('status', 'active');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (products.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % products.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [products.length]);

  // Calculate remaining days
  const getRemainingDays = (endDate) => {
    if (!endDate) return null;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Format price
  const formatPrice = (price) => {
    return price?.toLocaleString() || '0';
  };

  // Map product names to icons
  const getProductIcon = (name) => {
    const icons = {
      'Sino Truck': '🚛',
      'Excavator': '🏗️',
      'Wheel Loader': '🚜',
      'Modern House': '🏠',
      'V8 Car': '🏎️',
      'Block Making Machine': '🏭'
    };
    return icons[name] || '🎁';
  };

  if (loading || products.length === 0) {
    return null;
  }

  const currentProduct = products[currentIndex];
  const remainingDays = getRemainingDays(currentProduct.end_date);

  return (
    <div className="my-4">
      {/* Rotating Product Banner with Image */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl overflow-hidden shadow-xl transition-all duration-500">
        <div className="flex flex-col md:flex-row">
          {/* Product Image */}
          <div className="md:w-1/3 h-48 md:h-auto relative">
            {currentProduct.image_url ? (
              <img 
                src={currentProduct.image_url}
                alt={currentProduct.prize_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center">
                <span className="text-6xl">{getProductIcon(currentProduct.prize_name)}</span>
              </div>
            )}
          </div>
          
          {/* Product Details */}
          <div className="md:w-2/3 p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{getProductIcon(currentProduct.prize_name)}</span>
              <h3 className="text-2xl font-bold">{currentProduct.prize_name}</h3>
            </div>
            <p className="text-sm opacity-90 mb-3">{currentProduct.description}</p>
            
            {/* Price and Date Info */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-xs opacity-75">Target Amount</p>
                <p className="font-bold text-green-300">ETB {formatPrice(currentProduct.target_amount)}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-xs opacity-75">Entry Fee</p>
                <p className="font-bold text-yellow-300">ETB {formatPrice(currentProduct.contribution_amount)}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-xs opacity-75">Listed Date</p>
                <p className="font-semibold text-sm">{formatDate(currentProduct.start_date)}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-xs opacity-75">Days Remaining</p>
                <p className={`font-bold ${remainingDays < 30 ? 'text-red-400' : 'text-green-300'}`}>
                  {remainingDays > 0 ? `${remainingDays} days` : 'Ending soon!'}
                </p>
              </div>
            </div>
            
            <Link href={`/pools/${currentProduct.id}`}>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-semibold transition shadow-lg">
                Join This Pool →
              </button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Product Dots Indicator */}
      <div className="flex justify-center gap-2 mt-3">
        {products.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentIndex === idx ? 'w-6 bg-green-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Static Promotion Banners */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8 rounded-xl mt-4">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <span className="text-5xl mb-3 block">🎁</span>
              <h3 className="text-2xl font-bold mb-2">Special Promotion!</h3>
              <p className="text-sm opacity-90">Register today and get 10% bonus on your first pool creation</p>
            </div>
            <div className="flex-1">
              <span className="text-5xl mb-3 block">🏆</span>
              <h3 className="text-2xl font-bold mb-2">Winner's Circle</h3>
              <p className="text-sm opacity-90">See our recent winners and their amazing prizes</p>
            </div>
            <div>
              <Link href="/register">
                <button className="bg-white text-purple-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition">
                  Claim Offer →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
