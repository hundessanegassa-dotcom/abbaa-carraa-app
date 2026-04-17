import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCities();
    fetchListings();
  }, []);

  async function fetchCities() {
    const { data } = await supabase
      .from('listings')
      .select('location_city')
      .eq('status', 'active');
    
    const uniqueCities = [...new Set(data?.map(l => l.location_city) || [])];
    setCities(uniqueCities);
  }

  async function fetchListings() {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select('*, agents(business_name, city)')
      .eq('status', 'active');

    if (selectedCity !== 'all') {
      query = query.eq('location_city', selectedCity);
    }
    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query;
    if (!error) setListings(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchListings();
  }, [selectedCity, selectedCategory]);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'car', label: '🚗 Cars' },
    { value: 'realestate', label: '🏠 Real Estate' },
    { value: 'house', label: '🏡 Houses' },
    { value: 'electronics', label: '💻 Electronics' },
    { value: 'furniture', label: '🛋️ Furniture' },
    { value: 'machinery', label: '🏭 Machinery' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Available Prizes & Listings</h1>
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Filter by City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="all">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Filter by Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No listings found in this category.</p>
            <Link href="/agent/register" className="text-green-600 mt-4 inline-block">
              Become an agent to list prizes →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                {listing.image_url && (
                  <img src={listing.image_url} alt={listing.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-green-600">{listing.title}</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {listing.category}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{listing.description}</p>
                  <div className="space-y-1 text-sm">
                    <p><strong>📍 Location:</strong> {listing.location_city}</p>
                    <p><strong>🏢 Agent:</strong> {listing.agents?.business_name}</p>
                    {listing.prize_type === 'cash' && (
                      <p><strong>💰 Cash Prize:</strong> ETB {listing.cash_value?.toLocaleString()}</p>
                    )}
                    {listing.prize_type === 'discount' && (
                      <p><strong>🎉 Discount:</strong> {listing.discount_percentage}% OFF</p>
                    )}
                    <p><strong>💎 Estimated Value:</strong> ETB {listing.estimated_value?.toLocaleString()}</p>
                  </div>
                  <Link href={`/listings/${listing.id}`}>
                    <button className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                      View Pool
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
