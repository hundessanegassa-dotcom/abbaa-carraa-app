import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
      } else {
        // Fallback default products with real Ethiopian prices
        setProducts([
          { id: 1, prize_name: 'Sino Truck', description: 'Sinotruk Howo Homan T5 cargo truck - perfect for logistics business', target_amount: 5500000, contribution_amount: 11000, image_url: null },
          { id: 2, prize_name: 'Excavator', description: 'Medium excavator for construction - rental value 4,000 ETB/hour', target_amount: 5500000, contribution_amount: 11000, image_url: null },
          { id: 3, prize_name: 'Wheel Loader', description: 'Heavy-duty wheel loader with attachments', target_amount: 8000000, contribution_amount: 16000, image_url: null },
          { id: 4, prize_name: 'Modern House', description: 'Brand new house in Addis Ababa prime location', target_amount: 25000000, contribution_amount: 50000, image_url: null },
          { id: 5, prize_name: 'V8 Car', description: 'Luxury V8 performance car', target_amount: 5000000, contribution_amount: 10000, image_url: null },
          { id: 6, prize_name: 'Block Making Machine', description: 'Semi-automatic block making machine', target_amount: 2000000, contribution_amount: 4000, image_url: null }
        ]);
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
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [products.length]);

  if (loading || products.length === 0) {
    return null;
  }

  const currentProduct = products[currentIndex];

  // Map product names to icons and colors
  const getProductStyle = (name) => {
    const styles = {
      'Sino Truck': { icon: '🚛', bgColor: 'from-blue-600 to-indigo-600' },
      'Excavator': { icon: '🏗️', bgColor: 'from-yellow-600 to-orange-600' },
      'Wheel Loader': { icon: '🚜', bgColor: 'from-green-600 to-teal-600' },
      'Modern House': { icon: '🏠', bgColor: 'from-red-600 to-pink-600' },
      'V8 Car': { icon: '🏎️', bgColor: 'from-purple-600 to-purple-800' },
      'Block Making Machine': { icon: '🏭', bgColor: 'from-gray-700 to-gray-900' }
    };
    return styles[name] || { icon: '🎁', bgColor: 'from-green-600 to-blue-600' };
  };

  const style = getProductStyle(currentProduct.prize_name);

  // Format price in ETB with commas
  const formatPrice = (price) => {
    return price?.toLocaleString() || '0';
  };

  return (
    <div className="my-4">
      {/* Rotating Product Banner from Database */}
      <div className={`bg-gradient-to-r ${style.bgColor} text-white py-6 rounded-xl transition-all duration-500`}>
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="text-6xl mb-2 animate-bounce">{style.icon}</div>
            <h3 className="text-2xl font-bold mb-2">{currentProduct.prize_name}</h3>
            <p className="text-sm opacity-95 max-w-md">{currentProduct.description}</p>
            <div className="flex flex-col sm:flex-row gap-3 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">
                🎯 Target: ETB {formatPrice(currentProduct.target_amount)}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full">
                🎟️ Entry: ETB {formatPrice(currentProduct.contribution_amount)}
              </span>
            </div>
            <Link href={`/pools/${currentProduct.id}`}>
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-2 rounded-full font-semibold transition border border-white/30 mt-2">
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
