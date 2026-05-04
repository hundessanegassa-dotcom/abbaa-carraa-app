import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function SeasonalCampaign() {
  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    fetchActiveCampaign();
  }, []);

  async function fetchActiveCampaign() {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data) setCampaign(data);
  }

  if (!campaign) return null;

  const getCampaignStyle = () => {
    switch (campaign.type) {
      case 'summer': return 'from-yellow-500 to-orange-500';
      case 'new_year': return 'from-blue-600 to-purple-600';
      case 'meskel': return 'from-red-600 to-yellow-600';
      default: return 'from-green-600 to-teal-600';
    }
  };

  return (
    <div className={`bg-gradient-to-r ${getCampaignStyle()} text-white py-3`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-bold">{campaign.title}</p>
              <p className="text-sm opacity-90">{campaign.description}</p>
            </div>
          </div>
          <Link href="/listings">
            <button className="bg-white text-gray-800 px-4 py-1 rounded-full text-sm font-semibold hover:bg-gray-100">
              Join Now →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
