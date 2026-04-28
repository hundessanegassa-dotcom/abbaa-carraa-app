import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function SimpleFilters({ onFilterChange }) {
  const { t } = useTranslation();
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isOpen, setIsOpen] = useState(false);

  const categories = [
    { value: 'all', label: t('filters.all_categories'), icon: '🎯' },
    { value: 'vehicle', label: t('filters.vehicles'), icon: '🚗' },
    { value: 'machinery', label: t('filters.machinery'), icon: '🏭' },
    { value: 'electronics', label: t('filters.electronics'), icon: '💻' },
    { value: 'property', label: t('filters.property'), icon: '🏠' },
    { value: 'furniture', label: t('filters.furniture'), icon: '🛋️' }
  ];

  useEffect(() => {
    fetchCities();
  }, []);

  async function fetchCities() {
    const { data } = await supabase
      .from('pools')
      .select('city')
      .eq('status', 'active');
    const uniqueCities = [...new Set(data?.map(p => p.city).filter(Boolean) || [])];
    setCities(uniqueCities);
  }

  const handleFilterChange = (type, value) => {
    if (type === 'city') setSelectedCity(value);
    if (type === 'category') setSelectedCategory(value);
    
    if (onFilterChange) {
      onFilterChange({
        category: type === 'category' ? value : selectedCategory,
        city: type === 'city' ? value : selectedCity
      });
    }
  };

  const resetFilters = () => {
    setSelectedCity('all');
    setSelectedCategory('all');
    if (onFilterChange) {
      onFilterChange({ category: 'all', city: 'all' });
    }
  };

  const hasActiveFilters = selectedCity !== 'all' || selectedCategory !== 'all';

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Mobile Toggle */}
      <div className="md:hidden mb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-gray-100 text-gray-800 py-2 rounded-xl flex items-center justify-center gap-2 font-medium"
        >
          🔍 {t('filters.title')}
          {hasActiveFilters && <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full ml-1">!</span>}
        </button>
      </div>

      <div className={`${isOpen ? 'block' : 'hidden md:block'} space-y-3 md:space-y-0 md:flex md:flex-wrap md:gap-4 md:items-center`}>
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => handleFilterChange('category', cat.value)}
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
              onClick={() => handleFilterChange('city', 'all')}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition ${
                selectedCity === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🌍 {t('filters.all_cities')}
            </button>
            {cities.map(city => (
              <button
                key={city}
                onClick={() => handleFilterChange('city', city)}
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

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-red-600 text-sm hover:text-red-700 underline"
          >
            {t('common.clear_filters')}
          </button>
        )}
      </div>
    </div>
  );
}
