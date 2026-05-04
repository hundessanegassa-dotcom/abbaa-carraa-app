import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function CorporateRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    company_type: '',
    tin: '',
    email: '',
    phone: '',
    address: '',
    employee_count: '',
    contact_person: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please login first');
      router.push('/login');
      return;
    }

    const { error } = await supabase.from('corporate_accounts').insert({
      ...formData,
      user_id: user.id,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    if (error) {
      toast.error('Registration failed. Please try again.');
    } else {
      toast.success('Corporate registration submitted! We will contact you within 48 hours.');
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-center mb-2">🏢 Corporate Registration</h1>
          <p className="text-center text-gray-500 mb-6">Create private prize pools for your employees</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">Company Type</label>
                <select
                  value={formData.company_type}
                  onChange={(e) => setFormData({...formData, company_type: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select</option>
                  <option value="bank">Bank</option>
                  <option value="ngo">NGO</option>
                  <option value="school">School</option>
                  <option value="government">Government</option>
                  <option value="private">Private Company</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">TIN Number</label>
                <input
                  type="text"
                  value={formData.tin}
                  onChange={(e) => setFormData({...formData, tin: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">Number of Employees</label>
                <input
                  type="number"
                  value={formData.employee_count}
                  onChange={(e) => setFormData({...formData, employee_count: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            Corporate accounts can create private pools for employees. Admin will review and approve within 48 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
