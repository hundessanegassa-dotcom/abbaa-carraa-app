import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function AdminApplications() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('agents');
  const [agents, setAgents] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      router.push('/');
      return;
    }
    
    setIsAdmin(true);
    await loadApplications();
  }

  async function loadApplications() {
    const [agentsRes, vendorsRes, orgsRes] = await Promise.all([
      supabase.from('agent_applications').select('*, profiles!user_id(full_name, email)').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('vendor_applications').select('*, profiles!user_id(full_name, email)').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('organization_applications').select('*, profiles!user_id(full_name, email)').eq('status', 'pending').order('created_at', { ascending: false })
    ]);
    
    setAgents(agentsRes.data || []);
    setVendors(vendorsRes.data || []);
    setOrganizations(orgsRes.data || []);
    setLoading(false);
  }

  async function approveApplication(type, id, userId) {
    let table = '';
    let role = '';
    
    if (type === 'agent') { table = 'agent_applications'; role = 'agent'; }
    else if (type === 'vendor') { table = 'vendor_applications'; role = 'vendor'; }
    else { table = 'organization_applications'; role = 'organization'; }
    
    const { error: updateError } = await supabase
      .from(table)
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', id);
    
    if (updateError) {
      toast.error('Failed to approve');
      return;
    }
    
    // Update user profile
    await supabase
      .from('profiles')
      .update({ role: role, user_type: role, status: 'active' })
      .eq('id', userId);
    
    toast.success('Application approved!');
    await loadApplications();
  }

  async function rejectApplication(type, id) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    let table = '';
    if (type === 'agent') table = 'agent_applications';
    else if (type === 'vendor') table = 'vendor_applications';
    else table = 'organization_applications';
    
    const { error } = await supabase
      .from(table)
      .update({ status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to reject');
    } else {
      toast.success('Application rejected');
      await loadApplications();
    }
  }

  if (!isAdmin) return null;
  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">📝 Pending Applications</h1>
        
        <div className="flex gap-4 mb-6 border-b">
          <button onClick={() => setActiveTab('agents')} className={`pb-2 px-4 font-semibold ${activeTab === 'agents' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>
            🤝 Agents ({agents.length})
          </button>
          <button onClick={() => setActiveTab('vendors')} className={`pb-2 px-4 font-semibold ${activeTab === 'vendors' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>
            🏪 Vendors ({vendors.length})
          </button>
          <button onClick={() => setActiveTab('organizations')} className={`pb-2 px-4 font-semibold ${activeTab === 'organizations' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>
            🏢 Organizations ({organizations.length})
          </button>
        </div>
        
        {activeTab === 'agents' && (
          <div className="space-y-4">
            {agents.length === 0 ? <p className="text-center py-8 text-gray-500">No pending agent applications</p> : agents.map(app => (
              <div key={app.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{app.profiles?.full_name}</h3>
                    <p className="text-gray-500 text-sm">{app.profiles?.email}</p>
                    <p className="text-sm mt-1">📞 {app.phone}</p>
                    <p className="text-sm">📍 {app.city}</p>
                    <p className="text-sm">🆔 Digital ID: {app.digital_id_number}</p>
                    {app.experience && <p className="text-sm mt-2"><strong>Experience:</strong> {app.experience}</p>}
                    {app.motivation && <p className="text-sm"><strong>Motivation:</strong> {app.motivation}</p>}
                    {app.digital_id_image && (
                      <a href={app.digital_id_image} target="_blank" className="text-blue-600 text-sm underline">View ID Image</a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approveApplication('agent', app.id, app.user_id)} className="bg-green-600 text-white px-4 py-2 rounded-lg">Approve</button>
                    <button onClick={() => rejectApplication('agent', app.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg">Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'vendors' && (
          <div className="space-y-4">
            {vendors.length === 0 ? <p className="text-center py-8 text-gray-500">No pending vendor applications</p> : vendors.map(app => (
              <div key={app.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{app.business_name}</h3>
                    <p className="text-gray-500 text-sm">Owner: {app.profiles?.full_name} ({app.profiles?.email})</p>
                    <p className="text-sm mt-1">📞 {app.phone}</p>
                    <p className="text-sm">📍 {app.city}</p>
                    <p className="text-sm">📄 License #: {app.business_license_number}</p>
                    <p className="text-sm">🏷️ TIN: {app.tin_number}</p>
                    <p className="text-sm">🏢 Address: {app.business_address}</p>
                    {app.business_license_image && (
                      <a href={app.business_license_image} target="_blank" className="text-blue-600 text-sm underline">View License</a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approveApplication('vendor', app.id, app.user_id)} className="bg-green-600 text-white px-4 py-2 rounded-lg">Approve</button>
                    <button onClick={() => rejectApplication('vendor', app.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg">Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'organizations' && (
          <div className="space-y-4">
            {organizations.length === 0 ? <p className="text-center py-8 text-gray-500">No pending organization applications</p> : organizations.map(app => (
              <div key={app.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{app.organization_name}</h3>
                    <p className="text-gray-500 text-sm">Representative: {app.profiles?.full_name} ({app.profiles?.email})</p>
                    <p className="text-sm mt-1">📞 {app.phone}</p>
                    <p className="text-sm">📍 {app.city}</p>
                    <p className="text-sm">📄 Reg #: {app.registration_number}</p>
                    <p className="text-sm">🏷️ TIN: {app.tin_number}</p>
                    <p className="text-sm">🏢 Address: {app.address}</p>
                    <p className="text-sm">📋 Type: {app.organization_type}</p>
                    <div className="flex gap-2 mt-2">
                      {app.organization_id_image && <a href={app.organization_id_image} target="_blank" className="text-blue-600 text-sm underline">View ID</a>}
                      {app.letter_of_authorization && <a href={app.letter_of_authorization} target="_blank" className="text-blue-600 text-sm underline">View Authorization Letter</a>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approveApplication('organization', app.id, app.user_id)} className="bg-green-600 text-white px-4 py-2 rounded-lg">Approve</button>
                    <button onClick={() => rejectApplication('organization', app.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg">Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
