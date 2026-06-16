// components/PoolFilters.js - Advanced Pool Filtering with 3D Effects & Enhanced UI
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function PoolFilters({ 
  onFilterChange, 
  initialFilters = {},
  show3D = true,
  autoRotate = true,
  compact = false,
  showSearch = true,
  showSort = true,
  showReset = true,
  className = ''
}) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([
    { value: 'all', label: 'All Categories', labelAm: 'ሁሉም ምድቦች', icon: '🎯' },
    { value: 'vehicle', label: 'Vehicles', labelAm: 'ተሽከርካሪዎች', icon: '🚗' },
    { value: 'machinery', label: 'Machinery', labelAm: 'ማሽኖች', icon: '🏭' },
    { value: 'electronics', label: 'Electronics', labelAm: 'ኤሌክትሮኒክስ', icon: '💻' },
    { value: 'property', label: 'Property', labelAm: 'ንብረት', icon: '🏠' },
    { value: 'furniture', label: 'Furniture', labelAm: 'ቤት እቃዎች', icon: '🛋️' },
    { value: 'cash', label: 'Cash Prizes', labelAm: 'የገንዘብ ሽልማቶች', icon: '💰' },
    { value: 'other', label: 'Other', labelAm: 'ሌላ', icon: '🎁' }
  ]);
  
  const [cities, setCities] = useState([]);
  const [creators, setCreators] = useState([
    { value: 'all', label: 'All Creators', labelAm: 'ሁሉም ፈጣሪዎች', icon: '👥' },
    { value: 'admin', label: 'Admin', labelAm: 'አስተዳዳሪ', icon: '👑' },
    { value: 'agent', label: 'Agents', labelAm: 'ወኪሎች', icon: '🤝' },
    { value: 'vendor', label: 'Vendors', labelAm: 'አቅራቢዎች', icon: '🏭' },
    { value: 'organization', label: 'Organizations', labelAm: 'ድርጅቶች', icon: '🏢' },
    { value: 'individual', label: 'Individuals', labelAm: 'ግለሰቦች', icon: '👤' }
  ]);

  const [statuses, setStatuses] = useState([
    { value: 'all', label: 'All Status', labelAm: 'ሁሉም ሁኔታ', icon: '📊' },
    { value: 'active', label: 'Active', labelAm: 'ንቁ', icon: '🔴' },
    { value: 'completed', label: 'Completed', labelAm: 'ተጠናቋል', icon: '✅' },
    { value: 'pending', label: 'Pending', labelAm: 'በመጠባበቅ ላይ', icon: '⏳' }
  ]);

  const [sortOptions, setSortOptions] = useState([
    { value: 'newest', label: 'Newest First', labelAm: 'አዲስ በመጀመሪያ', icon: '🆕' },
    { value: 'oldest', label: 'Oldest First', labelAm: 'አሮጌ በመጀመሪያ', icon: '📅' },
    { value: 'prize_high', label: 'Highest Prize', labelAm: 'ከፍተኛ ሽልማት', icon: '🏆' },
    { value: 'prize_low', label: 'Lowest Prize', labelAm: 'ዝቅተኛ ሽልማት', icon: '💎' },
    { value: 'popular', label: 'Most Popular', labelAm: 'በጣም ታዋቂ', icon: '⭐' },
    { value: 'ending_soon', label: 'Ending Soon', labelAm: 'በቅርቡ የሚያልቅ', icon: '⏰' }
  ]);

  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || 'all');
  const [selectedCity, setSelectedCity] = useState(initialFilters.city || 'all');
  const [selectedCreator, setSelectedCreator] = useState(initialFilters.creator || 'all');
  const [selectedStatus, setSelectedStatus] = useState(initialFilters.status || 'all');
  const [selectedSort, setSelectedSort] = useState(initialFilters.sort || 'newest');
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [is3D, setIs3D] = useState(show3D);
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [language, setLanguage] = useState('am');
  const animationRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
  }, []);

  // Auto-rotation for 3D effect
  useEffect(() => {
    if (is3D && autoRotate && !isHovered) {
      const animate = () => {
        setRotation(prev => (prev + 0.15) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [is3D, autoRotate, isHovered]);

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedCity !== 'all') count++;
    if (selectedCreator !== 'all') count++;
    if (selectedStatus !== 'all') count++;
    if (searchQuery.trim()) count++;
    setActiveFilterCount(count);
    
    // Debounce filter changes
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (onFilterChange) {
        onFilterChange({
          category: selectedCategory,
          city: selectedCity,
          creator: selectedCreator,
          status: selectedStatus,
          sort: selectedSort,
          search: searchQuery
        });
      }
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [selectedCategory, selectedCity, selectedCreator, selectedStatus, selectedSort, searchQuery, onFilterChange]);

  async function fetchCities() {
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('city')
        .not('city', 'is', null);
      
      if (error) throw error;
      
      const uniqueCities = [...new Set(data?.map(p => p.city).filter(Boolean) || [])];
      setCities(uniqueCities);
    } catch (error) {
      console.error('Error fetching cities:', error);
      // Fallback cities
      setCities(['Addis Ababa', 'Adama', 'Bahir Dar', 'Dire Dawa', 'Gondar', 'Hawassa', 'Jimma', 'Mekelle']);
    }
  }

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedCity('all');
    setSelectedCreator('all');
    setSelectedStatus('all');
    setSelectedSort('newest');
    setSearchQuery('');
    toast.success(language === 'am' ? 'ማጣሪያዎች ተሰርዘዋል! ✅' : 'Filters cleared! ✅');
  };

  const toggle3D = () => {
    setIs3D(!is3D);
  };

  const get3DTransform = () => {
    if (!is3D) return 'none';
    if (isHovered) {
      return `perspective(800px) rotateY(${rotation}deg) scale(1.01)`;
    }
    return `perspective(800px) rotateY(${rotation}deg)`;
  };

  const getLabel = (item) => {
    return language === 'am' ? (item.labelAm || item.label) : item.label;
  };

  return (
    <div 
      className={`container mx-auto px-4 py-4 ${className}`}
      style={{
        transform: get3DTransform(),
        transformStyle: 'preserve-3d',
        transition: 'transform 0.3s ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with 3D Toggle */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          <h3 className="text-lg font-bold text-gray-800">
            {language === 'am' ? 'ማጣሪያዎች' : 'Filters'}
          </h3>
          {activeFilterCount > 0 && (
            <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggle3D}
            className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
              is3D 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {is3D ? '🔄 3D' : '📐 2D'}
          </button>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="md:hidden bg-gray-100 text-gray-800 px-3 py-1 rounded-lg text-sm font-medium"
          >
            {isFilterOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'am' ? '🔍 ፑሎችን ፈልግ...' : '🔍 Search pools...'}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Options */}
      <div className={`${isFilterOpen ? 'block' : 'hidden md:block'} space-y-4`}>
        {/* Categories */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {language === 'am' ? '📂 ምድብ' : '📂 Category'}
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition flex items-center gap-1 ${
                  selectedCategory === cat.value
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{getLabel(cat)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cities */}
        {cities.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {language === 'am' ? '📍 ከተማ' : '📍 City'}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCity('all')}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition ${
                  selectedCity === 'all'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🌍 {language === 'am' ? 'ሁሉም ከተሞች' : 'All Cities'}
              </button>
              {cities.slice(0, 10).map(city => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition ${
                    selectedCity === city
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📍 {city}
                </button>
              ))}
              {cities.length > 10 && (
                <button
                  onClick={() => setSelectedCity('all')}
                  className="px-3 py-1.5 rounded-full text-xs text-gray-500 hover:text-gray-700"
                >
                  +{cities.length - 10} more
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Creator Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {language === 'am' ? '👤 ፈጣሪ' : '👤 Creator'}
            </label>
            <div className="flex flex-wrap gap-2">
              {creators.map(creator => (
                <button
                  key={creator.value}
                  onClick={() => setSelectedCreator(creator.value)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition flex items-center gap-1 ${
                    selectedCreator === creator.value
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <span>{creator.icon}</span>
                  <span>{getLabel(creator)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {language === 'am' ? '📊 ሁኔታ' : '📊 Status'}
            </label>
            <div className="flex flex-wrap gap-2">
              {statuses.map(status => (
                <button
                  key={status.value}
                  onClick={() => setSelectedStatus(status.value)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition flex items-center gap-1 ${
                    selectedStatus === status.value
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <span>{status.icon}</span>
                  <span>{getLabel(status)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sort Options */}
        {showSort && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {language === 'am' ? '📊 ደርድር' : '📊 Sort By'}
            </label>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setSelectedSort(option.value)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition flex items-center gap-1 ${
                    selectedSort === option.value
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{getLabel(option)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reset & Actions */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200">
          {showReset && activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-red-600 hover:text-red-700 text-sm font-medium transition flex items-center gap-1"
            >
              🗑️ {language === 'am' ? 'ሁሉንም ማጣሪያዎች አጥፋ' : 'Clear All Filters'} ({activeFilterCount})
            </button>
          )}
          
          <button
            onClick={() => {
              setIsFilterOpen(false);
              if (onFilterChange) {
                onFilterChange({
                  category: selectedCategory,
                  city: selectedCity,
                  creator: selectedCreator,
                  status: selectedStatus,
                  sort: selectedSort,
                  search: searchQuery
                });
              }
            }}
            className="ml-auto bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
          >
            {language === 'am' ? '✔ ተግብር' : '✔ Apply'}
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedCategory !== 'all' && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              {categories.find(c => c.value === selectedCategory)?.icon}
              {getLabel(categories.find(c => c.value === selectedCategory))}
              <button onClick={() => setSelectedCategory('all')} className="ml-1 hover:text-red-600">✕</button>
            </span>
          )}
          {selectedCity !== 'all' && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              📍 {selectedCity}
              <button onClick={() => setSelectedCity('all')} className="ml-1 hover:text-red-600">✕</button>
            </span>
          )}
          {selectedCreator !== 'all' && (
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              {creators.find(c => c.value === selectedCreator)?.icon}
              {getLabel(creators.find(c => c.value === selectedCreator))}
              <button onClick={() => setSelectedCreator('all')} className="ml-1 hover:text-red-600">✕</button>
            </span>
          )}
          {selectedStatus !== 'all' && (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              {statuses.find(s => s.value === selectedStatus)?.icon}
              {getLabel(statuses.find(s => s.value === selectedStatus))}
              <button onClick={() => setSelectedStatus('all')} className="ml-1 hover:text-red-600">✕</button>
            </span>
          )}
          {searchQuery && (
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              🔍 "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-red-600">✕</button>
            </span>
          )}
        </div>
      )}

      {/* Results Count */}
      {onFilterChange && (
        <div className="mt-3 text-xs text-gray-400 text-center">
          {language === 'am' ? 'ፑሎችን ለማጣራት ከላይ ያሉትን ማጣሪያዎች ይጠቀሙ' : 'Use filters above to find the perfect pool'}
        </div>
      )}
    </div>
  );
}
