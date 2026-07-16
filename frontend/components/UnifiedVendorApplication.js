// components/UnifiedVendorApplication.js - VENDOR REGISTRATION
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function UnifiedVendorApplication({ onClose }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    business_name: '',
    business_type: '',
    business_address: '',
    tin_number: '',
    agree_terms: false
  });
  const [idFile, setIdFile] = useState(null);
  const [businessLicenseFile, setBusinessLicenseFile] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [previewLicense, setPreviewLicense] = useState(null);
  const [existingApplication, setExistingApplication] = useState(null);

  useEffect(() => {
    checkUserAndApplication();
  }, []);

  const checkUserAndApplication = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please login first');
      router.push('/login');
      return;
    }
    setUser(user);
    setFormData(prev => ({
      ...prev,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
    }));

    // Check if user already applied as vendor
    const { data: existing } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (existing) {
      setExistingApplication(existing);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'id') {
        setIdFile(file);
        setPreviewId(reader.result);
      } else {
        setBusinessLicenseFile(file);
        setPreviewLicense(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadFile = async (file, folder) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('vendor-documents')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('vendor-documents')
      .getPublicUrl(filePath);
    
    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.agree_terms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }
    
    if (!idFile) {
      toast.error('Please upload your ID');
      return;
    }
    
    if (!businessLicenseFile) {
      toast.error('Please upload your business license');
      return;
    }
    
    setLoading(true);
    
    try {
      const idUrl = await uploadFile(idFile, 'vendor-ids');
      const licenseUrl = await uploadFile(businessLicenseFile, 'vendor-licenses');
      
      const { error: insertError } = await supabase
        .from('vendors')
        .insert({
          user_id: user.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          business_name: formData.business_name,
          business_type: formData.business_type,
          business_address: formData.business_address,
          tin_number: formData.tin_number,
          id_url: idUrl,
          business_license_url: licenseUrl,
          is_approved: false,
          created_at: new Date().toISOString()
        });
      
      if (insertError) throw insertError;
      
      toast.success('Vendor application submitted! Admin will review your documents.');
      setTimeout(() => {
        if (onClose) onClose();
        router.push('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (existingApplication) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h3 className="text-xl font-bold mb-2">Application Already Submitted</h3>
          <p className="text-gray-600 mb-4">
            Your vendor application is {existingApplication.is_approved ? 'approved!' : 'pending review.'}
          </p>
          {!existingApplication.is_approved && (
            <p className="text-sm text-gray-500">Admin will review your documents and contact you soon.</p>
          )}
          <button onClick={onClose} className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">🏪 Become a Vendor</h2>
            <p className="text-sm text-gray-500">Create pools with your assets and earn 10% commission!</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        
        <div className="p-6">
          {/* Commission Info Banner */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6 border border-purple-200">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💰</span>
              <div>
                <p className="font-bold text-purple-800">Vendor Commission Structure</p>
                <p className="text-sm text-purple-700">Earn 10% commission from pools you create!</p>
                <p className="text-xs text-purple-600 mt-1">Example: Pool collects 100,000 ETB → You earn 10,000 ETB</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  placeholder="09xxxxxxxx"
                />
              </div>
            </div>
            
            {/* Business Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
              <input
                type="text"
                name="business_name"
                required
                value={formData.business_name}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                placeholder="Your business name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
              <select
                name="business_type"
                required
                value={formData.business_type}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select business type</option>
                <option value="car_dealer">Car Dealer</option>
                <option value="real_estate">Real Estate</option>
                <option value="machinery">Machinery/Equipment</option>
                <option value="electronics">Electronics</option>
                <option value="retail">Retail</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Address *</label>
              <textarea
                name="business_address"
                required
                value={formData.business_address}
                onChange={handleChange}
                rows="2"
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                placeholder="Full business address"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TIN Number *</label>
              <input
                type="text"
                name="tin_number"
                required
                value={formData.tin_number}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                placeholder="Your TIN number"
              />
            </div>
            
            {/* Document Uploads */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 mb-3">Required Documents</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">ID / Kebele ID *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 transition">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'id')}
                    className="hidden"
                    id="vendorId"
                  />
                  <label htmlFor="vendorId" className="cursor-pointer">
                    {previewId ? (
                      <div>
                        <img src={previewId} alt="Preview" className="max-h-32 mx-auto mb-2 rounded" />
                        <p className="text-green-600 text-sm">✓ ID uploaded</p>
                      </div>
                    ) : (
                      <div>
                        <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 mt-2">Click to upload ID</p>
                        <p className="text-xs text-gray-400">JPEG, PNG, PDF (Max 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business License *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 transition">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'license')}
                    className="hidden"
                    id="vendorLicense"
                  />
                  <label htmlFor="vendorLicense" className="cursor-pointer">
                    {previewLicense ? (
                      <div>
                        <img src={previewLicense} alt="Preview" className="max-h-32 mx-auto mb-2 rounded" />
                        <p className="text-green-600 text-sm">✓ License uploaded</p>
                      </div>
                    ) : (
                      <div>
                        <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 mt-2">Click to upload Business License</p>
                        <p className="text-xs text-gray-400">JPEG, PNG, PDF (Max 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
            
            {/* Terms */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="agreeTermsVendor"
                checked={formData.agree_terms}
                onChange={(e) => setFormData({ ...formData, agree_terms: e.target.checked })}
                className="w-4 h-4 text-purple-600"
              />
              <label htmlFor="agreeTermsVendor" className="text-sm text-gray-600">
                I agree to the <a href="/terms-vendor" className="text-purple-600 hover:underline">Vendor Terms and Conditions</a>
              </label>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting Application...
                </span>
              ) : (
                'Submit Vendor Application'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
