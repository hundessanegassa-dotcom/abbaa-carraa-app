import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

const FALLBACK_PRODUCTS = [
  { id: 1, prize_name: '4-Axis CNC Machine', description: 'Professional 4-axis CNC machine for furniture and 3D carving', target_amount: 1250000, contribution_amount: 2500, image_url: null },
  { id: 2, prize_name: 'Sino Truck', description: 'Sinotruk Howo Homan T5 cargo truck - perfect for logistics business', target_amount: 5500000, contribution_amount: 11000, image_url: null },
  { id: 3, prize_name: 'Excavator', description: 'Medium excavator for construction', target_amount: 5500000, contribution_amount: 11000, image_url: null },
  { id: 4, prize_name: 'Wheel Loader', description: 'Heavy-duty wheel loader with attachments', target_amount: 8000000, contribution_amount: 16000, image_url: null },
  { id: 5, prize_name: 'Modern House', description: 'Brand new house in Addis Ababa prime location', target_amount: 25000000, contribution_amount: 50000, image_url: null },
  { id: 6, prize_name: 'V8 Car', description: 'Luxury V8 performance car', target_amount: 5000000, contribution_amount: 10000, image_url: null },
  { id: 7, prize_name: 'Block Making Machine', description: 'Semi-automatic block making machine', target_amount: 2000000, contribution_amount: 4000, image_url: null }
];

export default function AdvertisingBanner() {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      // Simple query without .in() filter
      let { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('status', 'active')
        .limit(7);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setProducts(data);
      } else {
        setProducts(FALLBACK_PRODUCTS);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts(FALLBACK_PRODUCTS);
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

  const formatPrice = (price) => price?.toLocaleString() || '0';

  const getProductStyle = (name) => {
    const styles = {
      '4-Axis CNC Machine': { icon: '🛠️', bgColor: 'from-gray-700 to-gray-900' },
      'Sino Truck': { icon: '🚛', bgColor: 'from-blue-600 to-indigo-600' },
      'Excavator': { icon: '🏗️', bgColor: 'from-yellow-600 to-orange-600' },
      'Wheel Loader': { icon: '🚜', bgColor: 'from-green-600 to-teal-600' },
      'Modern House': { icon: '🏠', bgColor: 'from-red-600 to-pink-600' },
      'V8 Car': { icon: '🏎️', bgColor: 'from-purple-600 to-purple-800' },
      'Block Making Machine': { icon: '🏭', bgColor: 'from-gray-700 to-gray-900' }
    };
    return styles[name] || { icon: '🎁', bgColor: 'from-green-600 to-blue-600' };
  };

  if (loading || products.length === 0) return null;

  const currentProduct = products[currentIndex];
  const style = getProductStyle(currentProduct.prize_name);

  return (
    <div className="my-4">
      <div className={`bg-gradient-to-r ${style.bgColor} text-white rounded-xl overflow-hidden shadow-xl`}>
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 h-48 md:h-auto bg-black/20 flex items-center justify-center">
            <span className="text-7xl">{style.icon}</span>
          </div>
          <div className="md:w-2/3 p-6">
            <h3 className="text-2xl font-bold">{currentProduct.prize_name}</h3>
            <p className="text-sm opacity-90 mb-3">{currentProduct.description}</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-xs">Target</p>
                <p className="font-bold">ETB {formatPrice(currentProduct.target_amount)}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-xs">Entry Fee</p>
                <p className="font-bold">ETB {formatPrice(currentProduct.contribution_amount)}</p>
              </div>
            </div>
            <Link href={`/pools/${currentProduct.id}`}>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-full font-semibold">
                {t('pools.join_now') || 'Join Now'} →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
