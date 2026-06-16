// components/BannerManager.js - Complete Banner Management with 3D Effects & CRUD
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function BannerManager({ 
  adminMode = false,
  maxBanners = 10,
  show3D = true,
  autoRotate = true,
  onBannerClick,
  onBannerUpdate
}) {
  const { t } = useTranslation();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newBanner, setNewBanner] = useState({
    title: '',
    title_am: '',
    description: '',
    description_am: '',
    link_url: '',
    button_text: '',
    button_text_am: '',
    bgColor: 'from-emerald-500 to-teal-500',
    icon: '🎫',
    is_active: true,
    display_order: 0,
    image_url: ''
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef(null);
  const fileInputRef = useRef(null);

  // Color options for banners
  const colorOptions = [
    { value: 'from-emerald-500 to-teal-500', label: 'Emerald to Teal' },
    { value: 'from-yellow-500 to-orange-500', label: 'Yellow to Orange' },
    { value: 'from-purple-500 to-pink-500', label: 'Purple to Pink' },
    { value: 'from-blue-500 to-indigo-500', label: 'Blue to Indigo' },
    { value: 'from-red-500 to-pink-500', label: 'Red to Pink' },
    { value: 'from-green-500 to-emerald-500', label: 'Green to Emerald' },
    { value: 'from-indigo-500 to-purple-500', label: 'Indigo to Purple' },
    { value: 'from-pink-500 to-rose-500', label: 'Pink to Rose' },
    { value: 'from-amber-500 to-yellow-500', label: 'Amber to Yellow' },
    { value: 'from-cyan-500 to-blue-500', label: 'Cyan to Blue' },
  ];

  // Icon options
  const iconOptions = [
    '🎫', '🎯', '🏪', '🏙️', '🤝', '🏭', '🏢', '👤', '⭐', '🏆', '👑', '💎', '🔥', '✨', '🚀', '🎉', '💪', '🌟', '🎊', '🏅'
  ];

  useEffect(() => {
    fetchBanners();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Auto-rotation for 3D effect
  useEffect(() => {
    if (show3D && autoRotate) {
      const animate = () => {
        setRotation(prev => (prev + 0.2) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [show3D, autoRotate]);

  async function fetchBanners() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setBanners(data);
      } else {
        // Default banners if none in database
        const defaultBanners = [
          { 
            id: 1, 
            title: t('banners.agent'), 
            title_am: 'ወኪል',
            description: t('banners.agent_desc'), 
            description_am: 'የአባካራ ወኪል ይሁኑ',
            link_url: '/agent/register', 
            button_text: t('common.register'),
            button_text_am: 'ይመዝገቡ',
            bgColor: 'from-yellow-500 to-orange-500', 
            icon: '🤝',
            is_active: true,
            display_order: 0,
            image_url: ''
          },
          { 
            id: 2, 
            title: t('banners.vendor'), 
            title_am: 'አቅራቢ',
            description: t('banners.vendor_desc'), 
            description_am: 'ምርትዎን ያቅርቡ',
            link_url: '/vendor/register', 
            button_text: t('common.join'),
            button_text_am: 'ይቀላቀሉ',
            bgColor: 'from-purple-500 to-pink-500', 
            icon: '🏭',
            is_active: true,
            display_order: 1,
            image_url: ''
          },
          { 
            id: 3, 
            title: t('banners.organization'), 
            title_am: 'ድርጅት',
            description: t('banners.organization_desc'), 
            description_am: 'ድርጅትዎን ያስመዝግቡ',
            link_url: '/organization/register', 
            button_text: t('common.register'),
            button_text_am: 'ይመዝገቡ',
            bgColor: 'from-blue-500 to-indigo-500', 
            icon: '🏢',
            is_active: true,
            display_order: 2,
            image_url: ''
          },
          { 
            id: 4, 
            title: t('banners.individual'), 
            title_am: 'ግለሰብ',
            description: t('banners.individual_desc'), 
            description_am: 'የአባካራ አባል ይሁኑ',
            link_url: '/register', 
            button_text: t('common.join_now'),
            button_text_am: 'አሁን ይቀላቀሉ',
            bgColor: 'from-emerald-500 to-teal-500', 
            icon: '👤',
            is_active: true,
            display_order: 3,
            image_url: ''
          }
        ];
        setBanners(defaultBanners);
        // Optionally insert default banners into database
        // await insertDefaultBanners(defaultBanners);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  }

  async function insertDefaultBanners(defaultBanners) {
    try {
      const { error } = await supabase
        .from('banners')
        .insert(defaultBanners.map(({ id, ...rest }) => rest));
      
      if (error) console.error('Error inserting default banners:', error);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const uploadImage = async (file) => {
    if (!file) return null;

    try {
      const fileName = `banners/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('banner-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('banner-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  const handleAddBanner = async () => {
    if (!newBanner.title) {
      toast.error('Please enter a title');
      return;
    }

    setUploading(true);
    try {
      let imageUrl = newBanner.image_url;
      
      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const bannerData = {
        ...newBanner,
        image_url: imageUrl,
        display_order: banners.length
      };

      const { data, error } = await supabase
        .from('banners')
        .insert([bannerData])
        .select();

      if (error) throw error;

      setBanners([...banners, data[0]]);
      setShowAddModal(false);
      resetNewBanner();
      toast.success('Banner added successfully!');
      
      if (onBannerUpdate) {
        onBannerUpdate(data[0]);
      }
    } catch (error) {
      console.error('Error adding banner:', error);
      toast.error('Failed to add banner');
    } finally {
      setUploading(false);
    }
  };

  const handleEditBanner = async () => {
    if (!editingBanner) return;

    setUploading(true);
    try {
      let imageUrl = editingBanner.image_url;
      
      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const { data, error } = await supabase
        .from('banners')
        .update({ ...editingBanner, image_url: imageUrl })
        .eq('id', editingBanner.id)
        .select();

      if (error) throw error;

      setBanners(banners.map(b => b.id === editingBanner.id ? data[0] : b));
      setShowEditModal(false);
      setEditingBanner(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      toast.success('Banner updated successfully!');
      
      if (onBannerUpdate) {
        onBannerUpdate(data[0]);
      }
    } catch (error) {
      console.error('Error updating banner:', error);
      toast.error('Failed to update banner');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBanners(banners.filter(b => b.id !== id));
      toast.success('Banner deleted successfully!');
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const toggleBannerStatus = async (id) => {
    try {
      const banner = banners.find(b => b.id === id);
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !banner.is_active })
        .eq('id', id);

      if (error) throw error;

      setBanners(banners.map(b => 
        b.id === id ? { ...b, is_active: !b.is_active } : b
      ));
      toast.success(`Banner ${banner.is_active ? 'deactivated' : 'activated'}!`);
    } catch (error) {
      console.error('Error toggling banner:', error);
      toast.error('Failed to update banner status');
    }
  };

  const resetNewBanner = () => {
    setNewBanner({
      title: '',
      title_am: '',
      description: '',
      description_am: '',
      link_url: '',
      button_text: '',
      button_text_am: '',
      bgColor: 'from-emerald-500 to-teal-500',
      icon: '🎫',
      is_active: true,
      display_order: 0,
      image_url: ''
    });
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleBannerClick = (banner) => {
    if (onBannerClick) {
      onBannerClick(banner);
    }
    if (banner.link_url) {
      window.location.href = banner.link_url;
    }
  };

  const get3DTransform = (index) => {
    if (!show3D) return 'none';
    const offset = (index - banners.length / 2) * 10;
    return `perspective(1000px) rotateY(${rotation + offset}deg) scale(0.95)`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Controls */}
      {adminMode && (
        <div className="flex flex-wrap justify-between items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Banner Management</h3>
            <p className="text-sm text-gray-500">Manage your banners ({banners.length} of {maxBanners} max)</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                resetNewBanner();
                setShowAddModal(true);
              }}
              disabled={banners.length >= maxBanners}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
            >
              + Add Banner
            </button>
            <button
              onClick={fetchBanners}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      )}

      {/* Banner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {banners
          .filter(b => adminMode ? true : b.is_active)
          .map((banner, index) => (
            <div
              key={banner.id}
              className={`bg-gradient-to-r ${banner.bgColor} rounded-xl p-5 text-white shadow-lg transition-all duration-300 relative overflow-hidden ${
                !banner.is_active ? 'opacity-50 grayscale' : 'hover:shadow-xl hover:scale-105'
              }`}
              style={{
                transform: show3D ? get3DTransform(index) : 'none',
                transition: 'transform 0.3s ease',
                cursor: banner.link_url ? 'pointer' : 'default',
                minHeight: '180px'
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleBannerClick(banner)}
            >
              {/* 3D Glow Effect */}
              {show3D && hoveredIndex === index && (
                <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
              )}

              {/* Banner Image */}
              {banner.image_url && (
                <div className="absolute inset-0 opacity-20">
                  <img 
                    src={banner.image_url} 
                    alt={banner.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div className="text-4xl mb-2">{banner.icon}</div>
                  {adminMode && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBannerStatus(banner.id);
                        }}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          banner.is_active 
                            ? 'bg-green-500/30 text-white' 
                            : 'bg-red-500/30 text-white'
                        }`}
                      >
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  )}
                </div>
                
                <p className="font-bold text-lg mb-1">{banner.title}</p>
                <p className="text-xs opacity-90 mb-3 line-clamp-2">
                  {banner.description}
                </p>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium bg-white/20 px-3 py-1 rounded-full">
                    {banner.button_text} →
                  </span>
                  {adminMode && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingBanner(banner);
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          setShowEditModal(true);
                        }}
                        className="text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded transition"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBanner(banner.id);
                        }}
                        className="text-xs bg-red-500/30 hover:bg-red-500/50 px-2 py-0.5 rounded transition"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Order indicator */}
                {adminMode && (
                  <div className="absolute bottom-2 right-2 text-xs opacity-50">
                    #{banner.display_order}
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Add Banner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Add New Banner</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetNewBanner();
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <BannerForm
                banner={newBanner}
                setBanner={setNewBanner}
                previewUrl={previewUrl}
                selectedFile={selectedFile}
                fileInputRef={fileInputRef}
                handleFileSelect={handleFileSelect}
                colorOptions={colorOptions}
                iconOptions={iconOptions}
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetNewBanner();
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBanner}
                  disabled={uploading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
                >
                  {uploading ? 'Saving...' : 'Add Banner'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Banner Modal */}
      {showEditModal && editingBanner && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Edit Banner</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingBanner(null);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <BannerForm
                banner={editingBanner}
                setBanner={setEditingBanner}
                previewUrl={previewUrl}
                selectedFile={selectedFile}
                fileInputRef={fileInputRef}
                handleFileSelect={handleFileSelect}
                colorOptions={colorOptions}
                iconOptions={iconOptions}
                isEdit={true}
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingBanner(null);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditBanner}
                  disabled={uploading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
                >
                  {uploading ? 'Saving...' : 'Update Banner'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Banner Form Component
function BannerForm({ 
  banner, 
  setBanner, 
  previewUrl, 
  selectedFile, 
  fileInputRef, 
  handleFileSelect,
  colorOptions,
  iconOptions,
  isEdit = false
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Language Toggle Hint */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <p className="text-sm text-blue-700">📝 Fill in both Amharic and English fields</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title (English)
          </label>
          <input
            type="text"
            value={banner.title}
            onChange={(e) => setBanner({ ...banner, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            placeholder="Enter title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title (Amharic)
          </label>
          <input
            type="text"
            value={banner.title_am || ''}
            onChange={(e) => setBanner({ ...banner, title_am: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            placeholder="ርዕስ ያስገቡ"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (English)
          </label>
          <textarea
            value={banner.description}
            onChange={(e) => setBanner({ ...banner, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            rows="2"
            placeholder="Enter description"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Amharic)
          </label>
          <textarea
            value={banner.description_am || ''}
            onChange={(e) => setBanner({ ...banner, description_am: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            rows="2"
            placeholder="መግለጫ ያስገቡ"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Button Text (English)
          </label>
          <input
            type="text"
            value={banner.button_text}
            onChange={(e) => setBanner({ ...banner, button_text: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g., Register"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Button Text (Amharic)
          </label>
          <input
            type="text"
            value={banner.button_text_am || ''}
            onChange={(e) => setBanner({ ...banner, button_text_am: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g., ይመዝገቡ"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Link URL
        </label>
        <input
          type="text"
          value={banner.link_url}
          onChange={(e) => setBanner({ ...banner, link_url: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          placeholder="/register"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Background Color
          </label>
          <select
            value={banner.bgColor}
            onChange={(e) => setBanner({ ...banner, bgColor: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            {colorOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className={`mt-2 h-8 w-full rounded bg-gradient-to-r ${banner.bgColor}`}></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Icon
          </label>
          <select
            value={banner.icon}
            onChange={(e) => setBanner({ ...banner, icon: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            {iconOptions.map(icon => (
              <option key={icon} value={icon}>
                {icon} {icon}
              </option>
            ))}
          </select>
          <div className="mt-2 text-2xl text-center">{banner.icon}</div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Banner Image
        </label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition"
          >
            📤 Choose Image
          </button>
          {selectedFile && (
            <span className="text-sm text-gray-600">
              {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          )}
          {isEdit && banner.image_url && !selectedFile && (
            <span className="text-sm text-green-600">✓ Current image</span>
          )}
        </div>
        {previewUrl && (
          <div className="mt-2">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-h-32 rounded-lg border border-gray-200"
            />
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WEBP, GIF (Max 5MB)</p>
      </div>
    </div>
  );
}
