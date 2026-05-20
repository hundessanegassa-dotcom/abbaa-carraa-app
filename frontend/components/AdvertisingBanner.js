import Link from 'next/link';
import { useState, useEffect } from 'react';

const FALLBACK_PRODUCTS = [
  { id: 1, prize_name: '4-Axis CNC Machine', target_amount: 1250000, contribution_amount: 2500, icon: '🛠️' },
  { id: 2, prize_name: 'Sino Truck', target_amount: 5500000, contribution_amount: 11000, icon: '🚛' },
  { id: 3, prize_name: 'Excavator', target_amount: 5500000, contribution_amount: 11000, icon: '🏗️' },
  { id: 4, prize_name: 'Wheel Loader', target_amount: 8000000, contribution_amount: 16000, icon: '🚜' },
  { id: 5, prize_name: 'Modern House', target_amount: 25000000, contribution_amount: 50000, icon: '🏠' },
];

export default function AdvertisingBanner() {
  const [products, setProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Use static data only - NO Supabase calls
    setProducts(FALLBACK_PRODUCTS);
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % products.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [products.length]);

  if (products.length === 0) return null;

  const product = products[currentIndex];

  return (
    <div className="my-4 px-4">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 bg-black/20 flex items-center justify-center p-6">
            <span className="text-7xl">{product.icon}</span>
          </div>
          <div className="md:w-2/3 p-6">
            <h3 className="text-2xl font-bold">{product.prize_name}</h3>
            <div className="grid grid-cols-2 gap-3 my-3">
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-xs">Winner Gets</p>
                <p className="font-bold">ETB {product.target_amount.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-xs">Entry Fee</p>
                <p className="font-bold">ETB {product.contribution_amount.toLocaleString()}</p>
              </div>
            </div>
            <Link href="/register">
              <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-full font-semibold transition">
                Join Now →
              </button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Dot Indicators */}
      <div className="flex justify-center gap-2 mt-3">
        {products.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentIndex === idx ? 'w-6 bg-green-600' : 'w-2 bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
