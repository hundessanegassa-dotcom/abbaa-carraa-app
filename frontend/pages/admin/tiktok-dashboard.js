// pages/admin/tiktok-dashboard.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';

export default function TikTokDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalConversions: 0,
    totalCommission: 0,
    activeCampaigns: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load campaigns
      const { data: campaignsData } = await supabase
        .from('tiktok_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      // Load referrals
      const { data: referralsData } = await supabase
        .from('tiktok_referrals')
        .select('*, profiles!referrer_id(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(50);

      // Load influencers
      const { data: influencersData } = await supabase
        .from('influencer_performance')
        .select('*, profiles!influencer_id(full_name, email)')
        .order('total_conversions', { ascending: false });

      setCampaigns(campaignsData || []);
      setReferrals(referralsData || []);
      setInfluencers(influencersData || []);

      // Calculate stats
      const totalConversions = referralsData?.filter(r => r.status === 'converted').length || 0;
      setStats({
        totalReferrals: referralsData?.length || 0,
        totalConversions: totalConversions,
        totalCommission: totalConversions * 10,
        activeCampaigns: campaignsData?.filter(c => c.status === 'active').length || 0
      });
    } catch (error) {
      console.error('Error loading TikTok data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="TikTok Marketing" subtitle="Loading..." icon="📱" user={user} profile={profile} activeTab="tiktok">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="TikTok Marketing Dashboard" 
      subtitle="Track campaigns, referrals, and influencer performance" 
      icon="📱" 
      user={user} 
      profile={profile} 
      activeTab="tiktok"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-2xl font-bold text-blue-600">{stats.totalReferrals}</p>
          <p className="text-sm text-gray-500">📊 Total Referrals</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-2xl font-bold text-green-600">{stats.totalConversions}</p>
          <p className="text-sm text-gray-500">✅ Conversions</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-2xl font-bold text-yellow-600">ETB {stats.totalCommission}</p>
          <p className="text-sm text-gray-500">💰 Commission Paid</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-2xl font-bold text-purple-600">{stats.activeCampaigns}</p>
          <p className="text-sm text-gray-500">📢 Active Campaigns</p>
        </div>
      </div>

      {/* Campaigns */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="font-bold text-lg">📢 Campaigns</h2>
          <button className="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm">+ New Campaign</button>
        </div>
        <div className="p-4">
          {campaigns.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No campaigns created yet</p>
          ) : (
            campaigns.map(campaign => (
              <div key={campaign.id} className="border-b last:border-0 py-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{campaign.campaign_name}</p>
                  <p className="text-sm text-gray-500">{campaign.campaign_type} • {campaign.status}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">ETB {campaign.budget?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-400">{new Date(campaign.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Referrals */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="font-bold text-lg">📊 Recent Referrals</h2>
        </div>
        <div className="p-4">
          {referrals.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No referrals yet</p>
          ) : (
            referrals.slice(0, 10).map(ref => (
              <div key={ref.id} className="border-b last:border-0 py-2 flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium">{ref.profiles?.full_name || 'Unknown'}</p>
                  <p className="text-gray-500">@ {ref.tiktok_username}</p>
                </div>
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    ref.status === 'converted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {ref.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Influencers */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="font-bold text-lg">🏆 Top Influencers</h2>
        </div>
        <div className="p-4">
          {influencers.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No influencer data yet</p>
          ) : (
            influencers.slice(0, 5).map((inf, idx) => (
              <div key={inf.id} className="border-b last:border-0 py-2 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${
                    idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : 'text-orange-500'
                  }`}>#{idx + 1}</span>
                  <div>
                    <p className="font-medium">{inf.profiles?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">@{inf.tiktok_username}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{inf.total_conversions} conversions</p>
                  <p className="text-xs text-gray-400">ETB {inf.total_commission?.toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
