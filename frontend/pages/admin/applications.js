// pages/admin/applications.js - FIXED with AdminLayout
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout'; // ✅ ADDED

export default function AdminApplications() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('agents');
  const [agents, setAgents] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(profile);

      const { data: adminRecord } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (profile?.role !== 'admin' && !adminRecord) {
        toast.error('Admin access required');
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      await loadApplications();
    } catch (error) {
      console.error('Admin check error:', error);
      toast.error('Failed to verify admin access');
      router.push('/dashboard');
    }
  }

  async function loadApplications() {
    setLoading(true);
    try {
      const [agentsRes, vendorsRes, orgsRes] = await Promise.all([
        supabase.from('agent_applications').select('*, profiles!user_id(full_name, email)').eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('vendor_applications').select('*, profiles!user_id(full_name, email)').eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('organization_applications').select('*, profiles!user_id(full_name, email)').eq('status', 'pending').order('created_at', { ascending: false })
      ]);
      
      setAgents(agentsRes.data || []);
      setVendors(vendorsRes.data || []);
      setOrganizations(orgsRes.data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }

  async function approveApplication(type, id, userId) {
    let table = '';
    let role = '';
    
    if (type === 'agent') { table = 'agent_applications'; role = 'agent'; }
    else if (type === 'vendor') { table = 'vendor_applications'; role = 'vendor'; }
    else { table = 'organization_applications'; role = 'organization'; }
    
    try {
      const { error: updateError } = await supabase
        .from(table)
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Update user profile
      await supabase
        .from('profiles')
        .update({ role: role, user_type: role, status: 'active' })
        .eq('id', userId);
      
      toast.success('Application approved!');
      await loadApplications();
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve');
    }
  }

  async function rejectApplication(type, id) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    let table = '';
    if (type === 'agent') table = 'agent_applications';
    else if (type === 'vendor') table = 'vendor_applications';
    else table = 'organization_applications';
    
    try {
      const { error } = await supabase
        .from(table)
        .update({ status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Application rejected');
      await loadApplications();
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject');
    }
  }

  if (!isAdmin) return null;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const totalPending = agents.length + vendors.length + organizations.length;

  return (
    <AdminLayout
      title="Pending Applications"
      subtitle={`${totalPending} applications awaiting review`}
      icon="📝"
      user={user}
      profile={profile}
      activeTab="applications"
    >
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button 
          onClick={() => setActiveTab('agents')} 
          className={`pb-2 px-4 font-semibold transition ${
            activeTab === 'agents' 
              ? 'border-b-2 border-red-600 text-red-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🤝 Agents ({agents.length})
        </button>
        <button 
          onClick={() => setActiveTab('vendors')} 
          className={`pb-2 px-4 font-semibold transition ${
            activeTab === 'vendors' 
              ? 'border-b-2 border-red-600 text-red-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏪 Vendors ({vendors.length})
        </button>
        <button 
          onClick={() => setActiveTab('organizations')} 
          className={`pb-2 px-4 font-semibold transition ${
            activeTab === 'organizations' 
              ? 'border-b-2 border-red-600 text-red-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏢 Organizations ({organizations.length})
        </button>
      </div>

      {/* Agent Applications */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          {agents.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <p className="text-gray-500">✅ No pending agent applications</p>
            </div>
          ) : (
            agents.map(app => (
              <div key={app.id} className="bg-white rounded-xl shadow p-6 hover:shadow-md transition">
                <div className="flex flex-wrap justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🤝</span>
                      <h3 className="font-bold text-lg">{app.profiles?.full_name}</h3>
                    </div>
                    <p className="text-gray-500 text-sm">{app.profiles?.email}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <p><span className="text-gray-500">📞 Phone:</span> {app.phone || 'N/A'}</p>
                      <p><span className="text-gray-500">📍 City:</span> {app.city || 'N/A'}</p>
                      <p><span className="text-gray-500">🆔 Digital ID:</span> {app.digital_id_number || 'N/A'}</p>
                      <p><span className="text-gray-500">📅 Applied:</span> {new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                    {app.experience && (
                      <p className="text-sm"><strong>Experience:</strong> {app.experience}</p>
                    )}
                    {app.motivation && (
                      <p className="text-sm"><strong>Motivation:</strong> {app.motivation}</p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {app.digital_id_image && (
                        <a href={app.digital_id_image} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm underline hover:text-blue-800">📄 View ID Image</a>
                      )}
                      {app.business_license_image && (
                        <a href={app.business_license_image} target="_blank" rel="noopener noreferrer" className="text-purple-600 text-sm underline hover:text-purple-800">📜 View License</a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 self-start">
                    <button 
                      onClick={() => approveApplication('agent', app.id, app.user_id)} 
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      ✅ Approve
                    </button>
                    <button 
                      onClick={() => rejectApplication('agent', app.id)} 
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Vendor Applications */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          {vendors.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <p className="text-gray-500">✅ No pending vendor applications</p>
            </div>
          ) : (
            vendors.map(app => (
              <div key={app.id} className="bg-white rounded-xl shadow p-6 hover:shadow-md transition">
                <div className="flex flex-wrap justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏪</span>
                      <h3 className="font-bold text-lg">{app.business_name}</h3>
                    </div>
                    <p className="text-gray-500 text-sm">Owner: {app.profiles?.full_name} ({app.profiles?.email})</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <p><span className="text-gray-500">📞 Phone:</span> {app.phone || 'N/A'}</p>
                      <p><span className="text-gray-500">📍 City:</span> {app.city || 'N/A'}</p>
                      <p><span className="text-gray-500">📄 License #:</span> {app.business_license_number || 'N/A'}</p>
                      <p><span className="text-gray-500">🏷️ TIN:</span> {app.tin_number || 'N/A'}</p>
                      <p><span className="text-gray-500">🏢 Address:</span> {app.business_address || 'N/A'}</p>
                      <p><span className="text-gray-500">📅 Applied:</span> {new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                    {app.business_license_image && (
                      <a href={app.business_license_image} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm underline hover:text-blue-800">📜 View License</a>
                    )}
                  </div>
                  <div className="flex gap-2 self-start">
                    <button 
                      onClick={() => approveApplication('vendor', app.id, app.user_id)} 
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      ✅ Approve
                    </button>
                    <button 
                      onClick={() => rejectApplication('vendor', app.id)} 
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Organization Applications */}
      {activeTab === 'organizations' && (
        <div className="space-y-4">
          {organizations.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <p className="text-gray-500">✅ No pending organization applications</p>
            </div>
          ) : (
            organizations.map(app => (
              <div key={app.id} className="bg-white rounded-xl shadow p-6 hover:shadow-md transition">
                <div className="flex flex-wrap justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏢</span>
                      <h3 className="font-bold text-lg">{app.organization_name}</h3>
                    </div>
                    <p className="text-gray-500 text-sm">Representative: {app.profiles?.full_name} ({app.profiles?.email})</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <p><span className="text-gray-500">📞 Phone:</span> {app.phone || 'N/A'}</p>
                      <p><span className="text-gray-500">📍 City:</span> {app.city || 'N/A'}</p>
                      <p><span className="text-gray-500">📄 Reg #:</span> {app.registration_number || 'N/A'}</p>
                      <p><span className="text-gray-500">🏷️ TIN:</span> {app.tin_number || 'N/A'}</p>
                      <p><span className="text-gray-500">🏢 Address:</span> {app.address || 'N/A'}</p>
                      <p><span className="text-gray-500">📋 Type:</span> {app.organization_type || 'N/A'}</p>
                      <p><span className="text-gray-500">📅 Applied:</span> {new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {app.organization_id_image && (
                        <a href={app.organization_id_image} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm underline hover:text-blue-800">📄 View ID</a>
                      )}
                      {app.letter_of_authorization && (
                        <a href={app.letter_of_authorization} target="_blank" rel="noopener noreferrer" className="text-purple-600 text-sm underline hover:text-purple-800">📜 View Authorization Letter</a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 self-start">
                    <button 
                      onClick={() => approveApplication('organization', app.id, app.user_id)} 
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      ✅ Approve
                    </button>
                    <button 
                      onClick={() => rejectApplication('organization', app.id)} 
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={loadApplications}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          🔄 Refresh Applications
        </button>
      </div>
    </AdminLayout>
  );
}
