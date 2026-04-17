import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AgentDashboard() {
  const router = useRouter();
  const [agent, setAgent] = useState(null);
  const [listings, setListings] = useState([]);
  const [pools, setPools] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    prize_type: 'physical',
    cash_value: '',
    discount_percentage: '',
    location_city: '',
    estimated_value: '',
    image_url: ''
  });

  useEffect(() => {
    checkAgent();
  }, []);

  async function checkAgent() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login?redirect=/agent/dashboard');
        return;
      }

      // Get agent profile
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (agentError || !agentData) {
        toast.error('You are not registered as an agent');
        router.push('/agent/register');
        return;
      }

      setAgent(agentData);
      await loadListings(agentData.id);
      await loadPools(agentData.id);
      await loadCommissions(agentData.id);
      await loadParticipants(agentData.id);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function loadListings(agentId) {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (!error) setListings(data || []);
  }

  async function loadPools(agentId) {
    const { data, error } = await supabase
      .from('pools')
      .select('*, profiles!winner_id(full_name)')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (!error) setPools(data || []);
  }

  async function loadCommissions(agentId) {
    const { data, error } = await supabase
      .from('commissions')
      .select('*, pools(prize_name, target_amount)')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (!error) setCommissions(data || []);
  }

  async function loadParticipants(agentId) {
    // Get all pools by this agent, then get participants
    const { data: agentPools, error } = await supabase
      .from('pools')
      .select('id, prize_name')
      .eq('agent_id', agentId);

    if (error || !agentPools?.length) return;

    const poolIds = agentPools.map(p => p.id);
    const { data: contributions, error: contribError } = await supabase
      .from('contributions')
      .select('*, profiles(full_name, email, phone), pools(prize_name)')
      .in('pool_id', poolIds)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (!contribError) setParticipants(contributions || []);
  }

  async function handleCreateListing(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('listings')
        .insert([{
          agent_id: agent.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          prize_type: formData.prize_type,
          cash_value: formData.prize_type === 'cash' ? parseFloat(formData.cash_value) : null,
          discount_percentage: formData.prize_type === 'discount' ? parseInt(formData.discount_percentage) : null,
          location_city: formData.location_city,
          estimated_value: parseFloat(formData.estimated_value),
          image_url: formData.image_url || null,
          status: 'active'
        }]);

      if (error) throw error;

      toast.success('Listing created successfully!');
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        category: 'other',
        prize_type: 'physical',
        cash_value: '',
        discount_percentage: '',
        location_city: '',
        estimated_value: '',
        image_url: ''
      });
      await loadListings(agent.id);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function createPoolFromListing(listing) {
    try {
      const targetAmount = listing.estimated_value;
      const contributionAmount = Math.floor(targetAmount / 500); // Example: 500 participants

      const { error } = await supabase
        .from('pools')
        .insert([{
          name: `${listing.title} Prize Pool`,
          description: listing.description,
          prize_name: listing.title,
          prize_description: listing.description,
          prize_image_url: listing.image_url,
          target_amount: targetAmount,
          contribution_amount: contributionAmount,
          current_amount: 0,
          agent_id: agent.id,
          listing_id: listing.id,
          city: listing.location_city,
          discount_for_participants: listing.discount_percentage || 0,
          status: 'active',
          is_featured: false
        }]);

      if (error) throw error;

      toast.success('Prize pool created! Share it with your community.');
      await loadPools(agent.id);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function updatePoolDiscount(poolId, discountPercent) {
    try {
      const { error } = await supabase
        .from('pools')
        .update({ discount_for_participants: discountPercent })
        .eq('id', poolId);

      if (error) throw error;
      toast.success('Discount updated!');
      await loadPools(agent.id);
    } catch (error) {
      toast.error(error.message);
    }
  }

  const totalCommissions = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.amount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-green-600">
              Abbaa Carraa
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {agent?.business_name}</span>
              <Link href="/" className="text-gray-600 hover:text-green-600">View Site</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold mb-2">Agent Dashboard</h1>
          <p className="opacity-90">Manage your listings, track commissions, and engage with participants</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <p className="text-sm">Total Listings</p>
              <p className="text-2xl font-bold">{listings.length}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <p className="text-sm">Total Commissions</p>
              <p className="text-2xl font-bold">ETB {totalCommissions.toLocaleString()}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <p className="text-sm">Pending Payout</p>
              <p className="text-2xl font-bold">ETB {pendingCommissions.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('listings')}
              className={`pb-4 px-1 font-medium transition ${
                activeTab === 'listings' 
                  ? 'border-b-2 border-green-600 text-green-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📦 My Listings
            </button>
            <button
              onClick={() => setActiveTab('pools')}
              className={`pb-4 px-1 font-medium transition ${
                activeTab === 'pools' 
                  ? 'border-b-2 border-green-600 text-green-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🎯 Prize Pools
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`pb-4 px-1 font-medium transition ${
                activeTab === 'participants' 
                  ? 'border-b-2 border-green-600 text-green-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              👥 Participants
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`pb-4 px-1 font-medium transition ${
                activeTab === 'commissions' 
                  ? 'border-b-2 border-green-600 text-green-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              💰 Commissions
            </button>
          </nav>
        </div>

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Your Product Listings</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                + New Listing
              </button>
            </div>

            {listings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500 mb-4">You haven't created any listings yet.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-green-600 hover:text-green-700"
                >
                  Create your first listing →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listings.map((listing) => (
                  <div key={listing.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    {listing.image_url && (
                      <img src={listing.image_url} alt={listing.title} className="w-full h-48 object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-green-600">{listing.title}</h3>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{listing.category}</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{listing.description}</p>
                      <div className="space-y-1 text-sm mb-4">
                        <p><strong>📍 Location:</strong> {listing.location_city}</p>
                        {listing.prize_type === 'cash' && (
                          <p><strong>💰 Cash Prize:</strong> ETB {listing.cash_value?.toLocaleString()}</p>
                        )}
                        {listing.prize_type === 'discount' && (
                          <p><strong>🎉 Discount:</strong> {listing.discount_percentage}% OFF</p>
                        )}
                        <p><strong>💎 Value:</strong> ETB {listing.estimated_value?.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => createPoolFromListing(listing)}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                      >
                        Create Prize Pool
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pools Tab */}
        {activeTab === 'pools' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Prize Pools</h2>
            {pools.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No prize pools created yet.</p>
                <p className="text-sm text-gray-400 mt-2">Create a listing first, then convert it to a prize pool.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pools.map((pool) => {
                  const progress = (pool.current_amount / pool.target_amount) * 100;
                  return (
                    <div key={pool.id} className="bg-white rounded-lg shadow p-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-green-600">{pool.prize_name}</h3>
                          <p className="text-sm text-gray-500">Created: {new Date(pool.created_at).toLocaleDateString()}</p>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{progress.toFixed(1)}%</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2 w-full md:w-64">
                              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              ETB {pool.current_amount.toLocaleString()} / {pool.target_amount.toLocaleString()}
                            </p>
                          </div>
                          {pool.discount_for_participants > 0 && (
                            <p className="text-sm text-blue-600 mt-2">🎁 {pool.discount_for_participants}% discount for participants</p>
                          )}
                        </div>
                        <div className="mt-4 md:mt-0 flex space-x-2">
                          <input
                            type="number"
                            placeholder="Discount %"
                            className="w-24 p-1 border rounded text-sm"
                            onBlur={(e) => updatePoolDiscount(pool.id, parseInt(e.target.value) || 0)}
                          />
                          <span className="text-sm text-gray-500 self-center">
                            {pool.status === 'completed' ? '✓ Completed' : `${pool.current_participants || 0} participants`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Pool Participants</h2>
            {participants.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No participants yet.</p>
                <p className="text-sm text-gray-400 mt-2">Share your prize pools to attract contributors.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pool</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {participants.map((participant) => (
                      <tr key={participant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium">{participant.profiles?.full_name || 'Anonymous'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">{participant.profiles?.email}</div>
                          <div className="text-xs text-gray-500">{participant.profiles?.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm">{participant.pools?.prize_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-green-600">ETB {participant.amount?.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(participant.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Commissions Tab */}
        {activeTab === 'commissions' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Commission History</h2>
            {commissions.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No commissions yet.</p>
                <p className="text-sm text-gray-400 mt-2">Commissions are earned when prize pools complete.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pool</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {commissions.map((commission) => (
                      <tr key={commission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium">{commission.pools?.prize_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-green-600">ETB {commission.amount?.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">{commission.rate}%</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            commission.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {commission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(commission.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create New Listing</h2>
            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g., Toyota Vitz 2018"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Describe your product/prize"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="car">Car</option>
                    <option value="realestate">Real Estate</option>
                    <option value="house">House</option>
                    <option value="electronics">Electronics</option>
                    <option value="furniture">Furniture</option>
                    <option value="machinery">Machinery</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Prize Type *</label>
                  <select
                    required
                    value={formData.prize_type}
                    onChange={(e) => setFormData({...formData, prize_type: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="physical">Physical Product</option>
                    <option value="cash">Cash Prize</option>
                    <option value="discount">Discount Offer</option>
                  </select>
                </div>
              </div>
              {formData.prize_type === 'cash' && (
                <div>
                  <label className="block text-gray-700 mb-2">Cash Value (ETB) *</label>
                  <input
                    type="number"
                    required
                    value={formData.cash_value}
                    onChange={(e) => setFormData({...formData, cash_value: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              )}
              {formData.prize_type === 'discount' && (
                <div>
                  <label className="block text-gray-700 mb-2">Discount Percentage (%) *</label>
                  <input
                    type="number"
                    required
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({...formData, discount_percentage: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="e.g., 10 for 10% off"
                  />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.location_city}
                    onChange={(e) => setFormData({...formData, location_city: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Addis Ababa"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Estimated Value (ETB) *</label>
                  <input
                    type="number"
                    required
                    value={formData.estimated_value}
                    onChange={(e) => setFormData({...formData, estimated_value: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Image URL (optional)</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  Create Listing
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
