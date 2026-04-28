import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function PoolFilters({ onFilterChange, initialFilters = {} }) {
  const [categories, setCategories] = useState([
    { value: 'all', label: 'All Categories', icon: '🎯' },
    { value: 'vehicle', label: 'Vehicles', icon: '🚗' },
    { value: 'machinery', label: 'Machinery', icon: '🏭' },
    { value: 'electronics', label: 'Electronics', icon: '💻' },
    { value: 'property', label: 'Property', icon: '🏠' },
    { value: 'furniture', label: 'Furniture', icon: '🛋️' },
    { value: 'other', label: 'Other', icon: '🎁' }
  ]);
  
  const [cities, setCities] = useState([]);
  const [creators, setCreators] = useState([
    { value: 'all', label: 'All Creators', icon: '👥' },
    { value: 'admin', label: 'Admin', icon: '👑' },
    { value: 'agent', label: 'Agents', icon: '🤝' },
    { value: 'vendor', label: 'Vendors', icon: '🏭' },
    { value: 'organization', label: 'Organizations', icon: '🏢' },
    { value: 'individual', label: 'Individuals', icon: '👤' }
  ]);
  
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || 'all');
  const [selectedCity, setSelectedCity] = useState(initialFilters.city || 'all');
  const [selectedCreator, setSelectedCreator] = useState(initialFilters.creator || 'all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedCity !== 'all') count++;
    if (selectedCreator !== 'all') count++;
    setActiveFilterCount(count);
    
    // Notify parent component of filter changes
    if (onFilterChange) {
      onFilterChange({
        category: selectedCategory,
        city: selectedCity,
        creator: selectedCreator
      });
    }
  }, [selectedCategory, selectedCity, selectedCreator, onFilterChange]);

  async function fetchCities() {
    const { data } = await supabase
      .from('pools')
      .select('city')
      .eq('status', 'active');
    
    const uniqueCities = [...new Set(data?.map(p => p.city).filter(Boolean) || [])];
    setCities(uniqueCities);
  }

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedCity('all');
    setSelectedCreator('all');
  };

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Mobile Filter Toggle Button */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full bg-gray-100 text-gray-800 py-2.5 rounded-xl flex items-center justify-center gap-2 font-medium"
        >
          <span>🔍</span> Filter Pools
          {activeFilterCount > 0 && (
            <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
          <svg className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filter Options */}
      <div className={`${isFilterOpen ? 'block' : 'hidden md:block'} space-y-4 md:space-y-0 md:flex md:flex-wrap md:gap-4 md:items-center md:justify-between`}>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-semibold text-gray-700 self-center mr-2 hidden md:block">Category:</span>
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition flex items-center gap-1 ${
                selectedCategory === cat.value
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* City Filter */}
        {cities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCity('all')}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition ${
                selectedCity === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🌍 All Cities
            </button>
            {cities.map(city => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition ${
                  selectedCity === city
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📍 {city}
              </button>
            ))}
          </div>
        )}

        {/* Creator Type Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-semibold text-gray-700 self-center mr-2 hidden md:block">Creator:</span>
          {creators.map(creator => (
            <button
              key={creator.value}
              onClick={() => setSelectedCreator(creator.value)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition flex items-center gap-1 ${
                selectedCreator === creator.value
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span>{creator.icon}</span>
              <span>{creator.label}</span>
            </button>
          ))}
        </div>

        {/* Reset Filters Button */}
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="text-red-600 text-sm hover:text-red-700 underline"
          >
            Clear all filters ({activeFilterCount})
          </button>
        )}
      </div>
    </div>
  );
}
