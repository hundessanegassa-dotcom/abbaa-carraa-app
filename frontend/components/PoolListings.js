// components/PoolListings.js - Full Pool Listings with Pagination, Filters & Advanced Features
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import PoolCard from './PoolCard';
import PoolFilters from './PoolFilters';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

export default function PoolListings({
  initialFilters = {},
  itemsPerPage = 12,
  showFilters = true,
  showPagination = true,
  showViewToggle = true,
  showStats = true,
  onPoolClick,
  className = '',
  featuredFirst = true,
  autoLoad = true
}) {
  const [pools, setPools] = useState([]);
  const [filteredPools, setFilteredPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalPools, setTotalPools] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, compact
  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0,
    featured: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [language, setLanguage] = useState('am');
  const observerRef = useRef(null);
  const lastElementRef = useRef(null);

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      fetchPools();
    }
  }, [filters, currentPage, sortBy]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (loadingMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && currentPage < totalPages) {
          loadMorePools();
        }
      },
      { threshold: 0.1 }
    );

    if (lastElementRef.current) {
      observer.observe(lastElementRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [currentPage, totalPages, loadingMore]);

  async function fetchPools(reset = true) {
    if (reset) {
      setLoading(true);
      setPools([]);
    } else {
      setLoadingMore(true);
    }

    try {
      let query = supabase
        .from('pools')
        .select('*', { count: 'exact' });

      // Apply filters
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (selectedCity !== 'all') {
        query = query.eq('city', selectedCity);
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      // Search
      if (searchQuery) {
        query = query.or(`prize_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Featured first
      if (featuredFirst) {
        query = query.order('is_featured', { ascending: false });
      }

      // Sort
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'prize_high':
          query = query.order('target_amount', { ascending: false });
          break;
        case 'prize_low':
          query = query.order('target_amount', { ascending: true });
          break;
        case 'popular':
          query = query.order('participant_count', { ascending: false });
          break;
        case 'ending_soon':
          query = query.order('end_date', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Calculate stats
      if (reset) {
        const { data: allData, error: statsError } = await supabase
          .from('pools')
          .select('status, is_featured');

        if (!statsError && allData) {
          const active = allData.filter(p => p.status === 'active').length;
          const completed = allData.filter(p => p.status === 'completed').length;
          const pending = allData.filter(p => p.status === 'pending').length;
          const featured = allData.filter(p => p.is_featured).length;

          setStats({
            total: allData.length,
            active,
            completed,
            pending,
            featured
          });
        }

        setPools(data || []);
        setTotalPools(count || 0);
        setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      } else {
        setPools(prev => [...prev, ...(data || [])]);
      }

    } catch (error) {
      console.error('Error fetching pools:', error);
      setError(error.message);
      toast.error(language === 'am' ? 'ፑሎችን ማምጣት አልተቻለም' : 'Failed to load pools');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  const loadMorePools = () => {
    if (currentPage < totalPages && !loadingMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setSelectedCategory(newFilters.category || 'all');
    setSelectedCity(newFilters.city || 'all');
    setSelectedStatus(newFilters.status || 'all');
    setSearchQuery(newFilters.search || '');
    setSortBy(newFilters.sort || 'newest');
    setCurrentPage(1);
    fetchPools(true);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setCurrentPage(1);
    fetchPools(true);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPools(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getViewIcon = () => {
    switch (viewMode) {
      case 'grid': return '📐';
      case 'list': return '📋';
      case 'compact': return '📏';
      default: return '📐';
    }
  };

  const getViewLabel = () => {
    switch (viewMode) {
      case 'grid': return language === 'am' ? 'ፍርግርግ' : 'Grid';
      case 'list': return language === 'am' ? 'ዝርዝር' : 'List';
      case 'compact': return language === 'am' ? 'የተጨመቀ' : 'Compact';
      default: return 'Grid';
    }
  };

  const getStatusCount = (status) => {
    switch (status) {
      case 'active': return stats.active;
      case 'completed': return stats.completed;
      case 'pending': return stats.pending;
      default: return 0;
    }
  };

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner fullPage message={language === 'am' ? 'ፑሎችን በማምጣት ላይ...' : 'Loading pools...'} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-gray-700">{language === 'am' ? 'ስህተት ተከስቷል' : 'An error occurred'}</h3>
        <p className="text-gray-500 mt-2">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition"
        >
          {language === 'am' ? 'እንደገና ሞክር' : 'Try Again'}
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Stats Bar */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-xs text-gray-500">{language === 'am' ? 'ጠቅላላ ፑሎች' : 'Total Pools'}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 shadow-sm border border-green-200 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.active}</p>
            <p className="text-xs text-green-600">{language === 'am' ? 'ንቁ' : 'Active'}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 shadow-sm border border-blue-200 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.featured}</p>
            <p className="text-xs text-blue-600">{language === 'am' ? 'የተመረጡ' : 'Featured'}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-3 shadow-sm border border-yellow-200 text-center">
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
            <p className="text-xs text-yellow-600">{language === 'am' ? 'በመጠባበቅ ላይ' : 'Pending'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 shadow-sm border border-gray-200 text-center">
            <p className="text-2xl font-bold text-gray-700">{stats.completed}</p>
            <p className="text-xs text-gray-500">{language === 'am' ? 'ተጠናቋል' : 'Completed'}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 shadow-sm border border-purple-200 text-center">
            <p className="text-2xl font-bold text-purple-700">{totalPools}</p>
            <p className="text-xs text-purple-600">{language === 'am' ? 'በዚህ ገጽ' : 'On This Page'}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <PoolFilters
          onFilterChange={handleFilterChange}
          initialFilters={filters}
          show3D={true}
          autoRotate={true}
          showSearch={true}
          showSort={true}
          showReset={true}
          className="mb-6"
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {language === 'am' 
              ? `እያዩት ያሉት ${pools.length} ፑሎች (ከ${totalPools})` 
              : `Showing ${pools.length} of ${totalPools} pools`}
          </span>
          {isRefreshing && (
            <span className="text-xs text-blue-500 animate-pulse">🔄 {language === 'am' ? 'በማደስ ላይ...' : 'Refreshing...'}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* View Toggle */}
          {showViewToggle && (
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  viewMode === 'grid' ? 'bg-white shadow-md text-gray-800' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📐 Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  viewMode === 'list' ? 'bg-white shadow-md text-gray-800' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 List
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  viewMode === 'compact' ? 'bg-white shadow-md text-gray-800' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📏 Compact
              </button>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 flex items-center gap-1"
          >
            {isRefreshing ? '🔄' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {/* Pool Grid */}
      {pools.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-6xl mb-4">🏊</div>
          <h3 className="text-xl font-bold text-gray-700">
            {language === 'am' ? 'ምንም ፑሎች አልተገኙም' : 'No Pools Found'}
          </h3>
          <p className="text-gray-500 mt-2">
            {language === 'am' 
              ? 'ለተመረጡት ማጣሪያዎች ምንም ፑሎች የሉም። እባክዎ ሌሎች ማጣሪያዎችን ይሞክሩ።'
              : 'No pools match your selected filters. Try adjusting your filters.'}
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedCity('all');
              setSelectedStatus('all');
              setSearchQuery('');
              setCurrentPage(1);
              fetchPools(true);
            }}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition"
          >
            {language === 'am' ? 'ሁሉንም ማጣሪያዎች አጥፋ' : 'Clear All Filters'}
          </button>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : viewMode === 'list'
            ? 'space-y-4'
            : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2'
        }>
          {pools.map((pool, index) => {
            // Attach ref to last element for infinite scroll
            const isLastElement = index === pools.length - 1;
            const cardProps = {
              key: pool.id,
              pool: pool,
              featured: pool.is_featured,
              show3D: viewMode !== 'compact',
              autoRotate: viewMode !== 'compact',
              compact: viewMode === 'compact',
              showShare: true,
              showProgress: viewMode !== 'compact',
              onPoolClick: onPoolClick
            };

            if (isLastElement) {
              return (
                <div key={pool.id} ref={lastElementRef}>
                  <PoolCard {...cardProps} />
                </div>
              );
            }

            return <PoolCard key={pool.id} {...cardProps} />;
          })}
        </div>
      )}

      {/* Loading More */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      )}

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => {
              setCurrentPage(prev => Math.max(1, prev - 1));
              fetchPools(true);
            }}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            ← {language === 'am' ? 'ቀዳሚ' : 'Prev'}
          </button>
          
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (currentPage <= 4) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = currentPage - 3 + i;
            }
            
            if (pageNum < 1 || pageNum > totalPages) return null;
            
            return (
              <button
                key={pageNum}
                onClick={() => {
                  setCurrentPage(pageNum);
                  fetchPools(true);
                }}
                className={`px-4 py-2 rounded-lg transition ${
                  currentPage === pageNum
                    ? 'bg-green-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          {totalPages > 7 && currentPage < totalPages - 3 && (
            <span className="px-2 py-2 text-gray-400">...</span>
          )}
          
          {totalPages > 7 && currentPage < totalPages - 2 && (
            <button
              onClick={() => {
                setCurrentPage(totalPages);
                fetchPools(true);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {totalPages}
            </button>
          )}
          
          <button
            onClick={() => {
              setCurrentPage(prev => Math.min(totalPages, prev + 1));
              fetchPools(true);
            }}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {language === 'am' ? 'ቀጣይ' : 'Next'} →
          </button>
        </div>
      )}

      {/* Results Info */}
      {pools.length > 0 && (
        <div className="text-center text-xs text-gray-400 mt-4">
          {language === 'am'
            ? `ከ${totalPools} ፑሎች ውስጥ ${pools.length} እያዩ ነው`
            : `Showing ${pools.length} of ${totalPools} pools`}
          {searchQuery && ` • ${language === 'am' ? 'ፍለጋ' : 'Search'}: "${searchQuery}"`}
          {selectedCategory !== 'all' && ` • ${language === 'am' ? 'ምድብ' : 'Category'}: ${selectedCategory}`}
          {selectedCity !== 'all' && ` • ${language === 'am' ? 'ከተማ' : 'City'}: ${selectedCity}`}
        </div>
      )}
    </div>
  );
}
