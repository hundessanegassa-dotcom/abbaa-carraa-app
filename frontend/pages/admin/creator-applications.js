// pages/admin/creator-applications.js - COMPLETE ADMIN PANEL FOR CREATOR APPLICATIONS
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminCreatorApplications() {
  const router = useRouter();
  const isMounted = useRef(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Applications state
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  // Cleanup
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  // Check admin on mount
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
      if (!isMounted.current) return;
      setUser(user);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!isMounted.current) return;
      setProfile(profile);
      
      // Check if user is admin
      const { data: adminRecord } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (profile?.role !== 'admin' && !adminRecord) {
        router.push('/dashboard');
        return;
      }
      
      setIsAdmin(true);
      await loadApplications();
      setLoading(false);
    } catch (error) {
      console.error('Admin check error:', error);
      setLoading(false);
    }
  }

  async function loadApplications() {
    try {
      let query = supabase
        .from('pool_creators')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            email,
            phone,
            location,
            city
          )
        `)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('verification_status', 'pending');
      } else if (filter === 'approved') {
        query = query.eq('verification_status', 'approved');
      } else if (filter === 'rejected') {
        query = query.eq('verification_status', 'rejected');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading applications:', error);
        toast.error('Failed to load applications');
        return;
      }

      // Calculate stats
      const allApps = data || [];
      const pending = allApps.filter(a => a.verification_status === 'pending').length;
      const approved = allApps.filter(a => a.verification_status === 'approved').length;
      const rejected = allApps.filter(a => a.verification_status === 'rejected').length;

      if (isMounted.current) {
        setApplications(allApps);
        setStats({ pending, approved, rejected, total: allApps.length });
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('Failed to load applications');
    }
  }

  const filteredApplications = applications.filter(app => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      app.business_name?.toLowerCase().includes(search) ||
      app.full_name?.toLowerCase().includes(search) ||
      app.email?.toLowerCase().includes(search) ||
      app.phone?.includes(search) ||
      app.city?.toLowerCase().includes(search) ||
      app.location?.toLowerCase().includes(search)
    );
  });

  const handleApprove = async (applicationId) => {
    if (!confirm('Approve this creator application?')) return;
    
    setProcessing(true);
    const toastId = toast.loading('Approving application...');
    
    try {
      const { error } = await supabase
        .from('pool_creators')
        .update({
          verification_status: 'approved',
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Get creator info for notification
      const { data: creator } = await supabase
        .from('pool_creators')
        .select('user_id, business_name, full_name')
        .eq('id', applicationId)
        .single();

      // Send notification to creator
      if (creator) {
        await supabase
          .from('notifications')
          .insert({
            user_id: creator.user_id,
            title: '🎉 Your Creator Application is Approved!',
            message: `Congratulations ${creator.full_name || 'Creator'}! Your application to become a pool creator has been approved. You can now create your own prize pools and earn commission!`,
            type: 'creator_approval',
            link_url: '/creator/dashboard',
            created_at: new Date().toISOString()
          });

        // Also send admin notification
        await supabase
          .from('admin_notifications')
          .insert({
            title: `✅ Creator Approved: ${creator.business_name || creator.full_name}`,
            message: `Creator application has been approved by ${user?.email}`,
            type: 'creator_approved'
          });
      }

      toast.success('✅ Application approved successfully!', { id: toastId });
      await loadApplications();
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve application', { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (applicationId) => {
    const reason = prompt('Please enter the reason for rejection:');
    if (reason === null) return; // User cancelled
    
    setProcessing(true);
    const toastId = toast.loading('Rejecting application...');
    
    try {
      const { error } = await supabase
        .from('pool_creators')
        .update({
          verification_status: 'rejected',
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Get creator info for notification
      const { data: creator } = await supabase
        .from('pool_creators')
        .select('user_id, business_name, full_name')
        .eq('id', applicationId)
        .single();

      // Send notification to creator
      if (creator) {
        await supabase
          .from('notifications')
          .insert({
            user_id: creator.user_id,
            title: '📝 Creator Application Update',
            message: `Dear ${creator.full_name || 'Creator'}, your application to become a pool creator has been reviewed. ${reason ? `Reason: ${reason}` : 'Please contact support for more details.'}`,
            type: 'creator_rejection',
            link_url: '/become-creator',
            created_at: new Date().toISOString()
          });
      }

      toast.success('❌ Application rejected', { id: toastId });
      await loadApplications();
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject application', { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    const labels = {
      pending: '⏳ Pending',
      approved: '✅ Approved',
      rejected: '❌ Rejected'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTierBadge = (tier) => {
    const colors = {
      silver: 'bg-gray-200 text-gray-700',
      gold: 'bg-yellow-200 text-yellow-800',
      platinum: 'bg-blue-200 text-blue-800',
      diamond: 'bg-cyan-200 text-cyan-800',
      royal: 'bg-purple-200 text-purple-800'
    };
    const labels = {
      silver: '🥈 Silver',
      gold: '🥇 Gold',
      platinum: '💎 Platinum',
      diamond: '💠 Diamond',
      royal: '👑 Royal'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[tier] || 'bg-gray-200 text-gray-700'}`}>
        {labels[tier] || tier}
      </span>
    );
  };

  const openDocument = (url) => {
    setViewingDocument(url);
    setShowDocumentModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout
      title="👑 Creator Applications"
      subtitle={`${stats.pending} applications pending review`}
      icon="👑"
      user={user}
      profile={profile}
      activeTab="creator-applications"
      show3D={false}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-sm text-gray-500">📋 Total Applications</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-yellow-600">⏳ Pending Review</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-200">
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          <p className="text-sm text-green-600">✅ Approved</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 shadow-sm border border-red-200">
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          <p className="text-sm text-red-600">❌ Rejected</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ⏳ Pending ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ✅ Approved ({stats.approved})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ❌ Rejected ({stats.rejected})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📋 All ({stats.total})
            </button>
          </div>
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="🔍 Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-red-500"
            />
          </div>
          <button
            onClick={loadApplications}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-3">📭</div>
            <p className="text-gray-500 text-lg">No applications found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm ? 'Try adjusting your search terms' : 'Applications will appear here when users apply'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pool Settings</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-gray-800">{app.full_name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{app.email || app.profiles?.email}</p>
                        <p className="text-xs text-gray-400">{app.phone || app.profiles?.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-700">{app.business_name || 'N/A'}</p>
                        <p className="text-xs text-gray-400">{app.city || app.location || 'No location'}</p>
                        <p className="text-xs text-gray-400 capitalize">{app.business_type || 'individual'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p><span className="text-gray-500">Prize:</span> <span className="font-medium">ETB {app.default_prize_amount?.toLocaleString() || 'N/A'}</span></p>
                        <p><span className="text-gray-500">Entry Fee:</span> <span className="font-medium">ETB {app.default_entry_fee?.toLocaleString() || 'N/A'}</span></p>
                        <p><span className="text-gray-500">Seats:</span> <span className="font-medium">{app.default_total_seats?.toLocaleString() || 'N/A'}</span></p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(app.verification_status)}
                      {app.rejection_reason && (
                        <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={app.rejection_reason}>
                          Reason: {app.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(app.created_at).toLocaleDateString()}
                      <br />
                      <span className="text-xs text-gray-400">{new Date(app.created_at).toLocaleTimeString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setShowDetailModal(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition"
                        >
                          👁️ View Details
                        </button>
                        {app.verification_status === 'pending' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleApprove(app.id)}
                              disabled={processing}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium transition disabled:opacity-50"
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => handleReject(app.id)}
                              disabled={processing}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium transition disabled:opacity-50"
                            >
                              ❌ Reject
                            </button>
                          </div>
                        )}
                        {app.shop_banner_url && (
                          <button
                            onClick={() => openDocument(app.shop_banner_url)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium transition"
                          >
                            🏪 View Banner
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filteredApplications.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-500">
            Showing {filteredApplications.length} of {applications.length} applications
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">📋 Application Details</h2>
                <p className="text-sm text-gray-500">{selectedApp.business_name}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-6">
              {/* Banner */}
              {selectedApp.shop_banner_url && (
                <div className="mb-4 rounded-lg overflow-hidden border">
                  <img 
                    src={selectedApp.shop_banner_url} 
                    alt={selectedApp.business_name}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Personal Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-700 mb-2">👤 Personal Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Full Name:</span> <span className="font-medium">{selectedApp.full_name || 'N/A'}</span></p>
                    <p><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedApp.email || selectedApp.profiles?.email}</span></p>
                    <p><span className="text-gray-500">Phone:</span> <span className="font-medium">{selectedApp.phone || selectedApp.profiles?.phone}</span></p>
                    <p><span className="text-gray-500">Location:</span> <span className="font-medium">{selectedApp.location || 'N/A'}</span></p>
                    <p><span className="text-gray-500">City:</span> <span className="font-medium">{selectedApp.city || 'N/A'}</span></p>
                  </div>
                </div>

                {/* Business Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-700 mb-2">🏪 Business Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Business Name:</span> <span className="font-medium">{selectedApp.business_name}</span></p>
                    <p><span className="text-gray-500">Business Type:</span> <span className="font-medium capitalize">{selectedApp.business_type || 'Individual'}</span></p>
                    <p><span className="text-gray-500">Status:</span> {getStatusBadge(selectedApp.verification_status)}</p>
                    {selectedApp.rejection_reason && (
                      <p><span className="text-gray-500">Rejection Reason:</span> <span className="text-red-600">{selectedApp.rejection_reason}</span></p>
                    )}
                    <p><span className="text-gray-500">Applied:</span> <span className="font-medium">{new Date(selectedApp.created_at).toLocaleString()}</span></p>
                  </div>
                </div>

                {/* Pool Settings */}
                <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                  <h3 className="font-bold text-gray-700 mb-2">🎯 Pool Settings</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-500">Prize Amount</p>
                      <p className="font-bold text-green-600">ETB {selectedApp.default_prize_amount?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-500">Entry Fee</p>
                      <p className="font-bold text-blue-600">ETB {selectedApp.default_entry_fee?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-500">Total Seats</p>
                      <p className="font-bold text-purple-600">{selectedApp.default_total_seats?.toLocaleString() || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                  <h3 className="font-bold text-gray-700 mb-2">💳 Payment Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Bank Name</p>
                      <p className="font-medium">{selectedApp.bank_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Bank Account Number</p>
                      <p className="font-medium">{selectedApp.bank_account_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Account Holder</p>
                      <p className="font-medium">{selectedApp.bank_account_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">TeleBirr Number</p>
                      <p className="font-medium">{selectedApp.telebirr_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                  <h3 className="font-bold text-gray-700 mb-2">📄 Documents</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedApp.digital_id_url && (
                      <button
                        onClick={() => openDocument(selectedApp.digital_id_url)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        🪪 View Digital ID
                      </button>
                    )}
                    {selectedApp.business_license_url && (
                      <button
                        onClick={() => openDocument(selectedApp.business_license_url)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        📜 View Business License
                      </button>
                    )}
                    {selectedApp.shop_banner_url && (
                      <button
                        onClick={() => openDocument(selectedApp.shop_banner_url)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        🏪 View Shop Banner
                      </button>
                    )}
                    {!selectedApp.digital_id_url && !selectedApp.business_license_url && !selectedApp.shop_banner_url && (
                      <p className="text-gray-400 text-sm">No documents uploaded</p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {selectedApp.bio && (
                  <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                    <h3 className="font-bold text-gray-700 mb-2">📝 About</h3>
                    <p className="text-sm text-gray-600">{selectedApp.bio}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedApp.verification_status === 'pending' && (
                <div className="mt-6 pt-6 border-t flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedApp.id)}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
                  >
                    ✅ Approve Application
                  </button>
                  <button
                    onClick={() => handleReject(selectedApp.id)}
                    disabled={processing}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
                  >
                    ❌ Reject Application
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocumentModal && viewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">📄 Document Viewer</h3>
              <button onClick={() => { setShowDocumentModal(false); setViewingDocument(null); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-4 flex items-center justify-center min-h-[400px]">
              {viewingDocument.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={viewingDocument} alt="Document" className="max-w-full max-h-[70vh] rounded-lg" />
              ) : viewingDocument.match(/\.(pdf)$/i) ? (
                <iframe src={viewingDocument} className="w-full h-[70vh]" title="Document" />
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-gray-500">Document preview not available</p>
                  <a href={viewingDocument} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold">
                    Open in new tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
