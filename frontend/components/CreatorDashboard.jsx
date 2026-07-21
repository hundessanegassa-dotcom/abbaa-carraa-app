// components/CreatorDashboard.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function CreatorDashboard({ userId, language = 'am' }) {
    const router = useRouter();
    const [creator, setCreator] = useState(null);
    const [loading, setLoading] = useState(true);
    const [myPools, setMyPools] = useState([]);
    const [stats, setStats] = useState({
        totalPools: 0,
        totalCollected: 0,
        totalEarnings: 0,
        pendingFees: 0,
        totalParticipants: 0,
        activePools: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [payoutMethod, setPayoutMethod] = useState('telebirr');
    const [payoutDetails, setPayoutDetails] = useState({});
    const [showPaymentSettings, setShowPaymentSettings] = useState(false);
    const [paymentSettings, setPaymentSettings] = useState({
        bank_name: '',
        bank_account_number: '',
        bank_account_name: '',
        telebirr_number: '',
        auto_fee_deduction: true,
        fee_collection_threshold: 10
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (userId) {
            loadCreatorData();
        }
    }, [userId]);

    const loadCreatorData = async () => {
        setLoading(true);
        try {
            // Get creator profile
            const { data: creatorData, error: creatorError } = await supabase
                .from('pool_creators')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (creatorError) throw creatorError;

            if (creatorData) {
                setCreator(creatorData);
                
                // Load payment settings
                setPaymentSettings({
                    bank_name: creatorData.bank_name || '',
                    bank_account_number: creatorData.bank_account_number || '',
                    bank_account_name: creatorData.bank_account_name || '',
                    telebirr_number: creatorData.telebirr_number || '',
                    auto_fee_deduction: creatorData.auto_fee_deduction !== false,
                    fee_collection_threshold: creatorData.fee_collection_threshold || 10
                });

                // Get creator's pools
                const { data: pools, error: poolsError } = await supabase
                    .from('pools')
                    .select('*, contributions:contributions(amount, status)')
                    .eq('creator_id', creatorData.id)
                    .order('created_at', { ascending: false });

                if (!poolsError) {
                    setMyPools(pools || []);
                    
                    // Calculate stats
                    const totalCollected = pools?.reduce((sum, p) => sum + (p.total_collected || 0), 0) || 0;
                    const activePools = pools?.filter(p => p.lifecycle_status === 'active').length || 0;
                    const totalParticipants = pools?.reduce((sum, p) => sum + (p.current_participants || 0), 0) || 0;
                    
                    setStats({
                        totalPools: pools?.length || 0,
                        totalCollected: totalCollected,
                        totalEarnings: creatorData.total_earnings || 0,
                        pendingFees: creatorData.total_earnings ? creatorData.total_earnings * 0.1 : 0,
                        totalParticipants: totalParticipants,
                        activePools: activePools
                    });
                }

                // Get recent activity
                const { data: activity, error: activityError } = await supabase
                    .from('pool_activity_logs')
                    .select('*')
                    .eq('creator_id', creatorData.id)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (!activityError) {
                    setRecentActivity(activity || []);
                }
            }
        } catch (error) {
            console.error('Error loading creator data:', error);
            toast.error(language === 'am' ? 'ውሂብ መጫን አልተቻለም' : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePool = () => {
        router.push('/creator/create-pool');
    };

    const handleSavePaymentSettings = async () => {
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('pool_creators')
                .update({
                    bank_name: paymentSettings.bank_name,
                    bank_account_number: paymentSettings.bank_account_number,
                    bank_account_name: paymentSettings.bank_account_name,
                    telebirr_number: paymentSettings.telebirr_number,
                    auto_fee_deduction: paymentSettings.auto_fee_deduction,
                    fee_collection_threshold: paymentSettings.fee_collection_threshold,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

            if (error) throw error;

            toast.success(language === 'am' ? '✅ የክፍያ መረጃ ተቀመጠ' : '✅ Payment settings saved');
            setShowPaymentSettings(false);
            loadCreatorData();
        } catch (error) {
            console.error('Error saving payment settings:', error);
            toast.error(language === 'am' ? 'መረጃ ማስቀመጥ አልተቻለም' : 'Failed to save settings');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestPayout = async () => {
        if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
            toast.error(language === 'am' ? 'እባክዎ ትክክለኛ ገንዘብ ያስገቡ' : 'Please enter a valid amount');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('creator_payouts')
                .insert({
                    creator_id: creator.id,
                    amount: parseFloat(payoutAmount),
                    payout_type: 'commission',
                    bank_name: creator.bank_name,
                    bank_account_number: creator.bank_account_number,
                    bank_account_name: creator.bank_account_name,
                    telebirr_number: creator.telebirr_number,
                    status: 'pending'
                });

            if (error) throw error;

            toast.success(language === 'am' 
                ? '✅ የገንዘብ መውጫ ጥያቄ ተልኳል' 
                : '✅ Payout request submitted');
            setShowPayoutModal(false);
            setPayoutAmount('');
            loadCreatorData();
        } catch (error) {
            console.error('Error requesting payout:', error);
            toast.error(language === 'am' ? 'ጥያቄ መላክ አልተቻለም' : 'Failed to submit request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'draft': 'bg-gray-100 text-gray-700',
            'pending_approval': 'bg-yellow-100 text-yellow-700',
            'active': 'bg-green-100 text-green-700',
            'funded': 'bg-blue-100 text-blue-700',
            'completed': 'bg-purple-100 text-purple-700',
            'cancelled': 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getStatusLabel = (status) => {
        const labels = {
            'draft': language === 'am' ? 'ረቂቅ' : 'Draft',
            'pending_approval': language === 'am' ? 'በጥቅስ ላይ' : 'Pending Approval',
            'active': language === 'am' ? 'ንቁ' : 'Active',
            'funded': language === 'am' ? 'ተሟልቷል' : 'Funded',
            'completed': language === 'am' ? 'ተጠናቅቋል' : 'Completed',
            'cancelled': language === 'am' ? 'ተሰርዟል' : 'Cancelled'
        };
        return labels[status] || status;
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!creator) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {language === 'am' ? 'የራስዎን የእጣ ፑል ይፍጠሩ' : 'Create Your Own Prize Pool'}
                </h3>
                <p className="text-gray-600 mb-6">
                    {language === 'am' 
                        ? 'ሰዎች እንዲቀላቀሉ የራስዎን ፑል ይፍጠሩ እና 10% ኮሚሽን ያግኙ'
                        : 'Create your own pool and earn 10% commission on every contribution'}
                </p>
                <button
                    onClick={handleCreatePool}
                    className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition"
                >
                    {language === 'am' ? '🚀 አዲስ ፑል ፍጠር' : '🚀 Create New Pool'}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Creator Profile Header */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">
                            {creator.business_name || (language === 'am' ? 'የእኔ የፑል መደብር' : 'My Pool Shop')}
                        </h2>
                        <p className="opacity-80">
                            {language === 'am' ? 'የፈጣሪ ዳሽቦርድ' : 'Creator Dashboard'}
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                creator.verification_status === 'verified' 
                                    ? 'bg-green-500/30 text-green-200' 
                                    : creator.verification_status === 'pending'
                                    ? 'bg-yellow-500/30 text-yellow-200'
                                    : 'bg-red-500/30 text-red-200'
                            }`}>
                                {creator.verification_status === 'verified' ? '✅ Verified' :
                                 creator.verification_status === 'pending' ? '⏳ Pending' : '❌ Rejected'}
                            </span>
                            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                                ⭐ {creator.rating || 0}
                            </span>
                            {creator.payment_details_verified && (
                                <span className="text-xs bg-green-500/30 px-2 py-1 rounded-full">
                                    💳 Payment Verified
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <button
                            onClick={() => setShowPaymentSettings(true)}
                            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-sm border border-white/20"
                        >
                            💳 {language === 'am' ? 'ክፍያ ቅንብሮች' : 'Payment Settings'}
                        </button>
                        <button
                            onClick={handleCreatePool}
                            className="bg-white text-green-700 hover:bg-gray-100 px-4 py-2 rounded-xl text-sm font-semibold"
                        >
                            + {language === 'am' ? 'አዲስ ፑል' : 'New Pool'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-md text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.totalPools}</p>
                    <p className="text-xs text-gray-500">{language === 'am' ? 'ፑሎች' : 'Pools'}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-md text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.activePools}</p>
                    <p className="text-xs text-gray-500">{language === 'am' ? 'ንቁ' : 'Active'}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-md text-center">
                    <p className="text-2xl font-bold text-purple-600">{stats.totalParticipants}</p>
                    <p className="text-xs text-gray-500">{language === 'am' ? 'ተሳታፊዎች' : 'Participants'}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-md text-center">
                    <p className="text-2xl font-bold text-yellow-600">ETB {stats.totalCollected.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{language === 'am' ? 'ጠቅላላ ስብስብ' : 'Total Collected'}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-md text-center">
                    <p className="text-2xl font-bold text-green-600">ETB {stats.totalEarnings.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{language === 'am' ? 'ገቢ' : 'Earnings'}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-md text-center relative">
                    <p className="text-2xl font-bold text-orange-600">ETB {stats.pendingFees.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{language === 'am' ? 'በመጠበቅ ላይ' : 'Pending Fees'}</p>
                    {stats.pendingFees > 0 && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                    onClick={handleCreatePool}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-2xl shadow-md hover:shadow-lg transition text-center"
                >
                    <div className="text-3xl mb-1">📝</div>
                    <p className="font-bold text-sm">{language === 'am' ? 'አዲስ ፑል' : 'New Pool'}</p>
                    <p className="text-xs opacity-80">{language === 'am' ? 'ፑል ይፍጠሩ' : 'Create a pool'}</p>
                </button>
                <button
                    onClick={() => setShowPayoutModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 rounded-2xl shadow-md hover:shadow-lg transition text-center"
                >
                    <div className="text-3xl mb-1">💳</div>
                    <p className="font-bold text-sm">{language === 'am' ? 'ገንዘብ አውጡ' : 'Withdraw'}</p>
                    <p className="text-xs opacity-80">{language === 'am' ? 'ገቢዎን ያውጡ' : 'Withdraw earnings'}</p>
                </button>
                <button
                    onClick={() => router.push('/creator/analytics')}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-2xl shadow-md hover:shadow-lg transition text-center"
                >
                    <div className="text-3xl mb-1">📊</div>
                    <p className="font-bold text-sm">{language === 'am' ? 'ትንታኔ' : 'Analytics'}</p>
                    <p className="text-xs opacity-80">{language === 'am' ? 'አፈጻጸም ይመልከቱ' : 'View performance'}</p>
                </button>
                <button
                    onClick={() => router.push('/creator/pools')}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-2xl shadow-md hover:shadow-lg transition text-center"
                >
                    <div className="text-3xl mb-1">📋</div>
                    <p className="font-bold text-sm">{language === 'am' ? 'ሁሉም ፑሎች' : 'All Pools'}</p>
                    <p className="text-xs opacity-80">{language === 'am' ? 'ይመልከቱ' : 'View all'}</p>
                </button>
            </div>

            {/* My Pools */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">
                        {language === 'am' ? '📋 የእኔ ፑሎች' : '📋 My Pools'}
                    </h3>
                    <span className="text-sm text-gray-500">
                        {myPools.length} {language === 'am' ? 'ፑሎች' : 'pools'}
                    </span>
                </div>

                {myPools.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <div className="text-5xl mb-3">📭</div>
                        <p>{language === 'am' ? 'እስካሁን ምንም ፑል አልፈጠሩም' : 'No pools created yet'}</p>
                        <button
                            onClick={handleCreatePool}
                            className="mt-4 text-green-600 hover:text-green-700 font-semibold"
                        >
                            {language === 'am' ? 'የመጀመሪያ ፑልዎን ይፍጠሩ →' : 'Create your first pool →'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {myPools.map(pool => (
                            <div key={pool.id} className="border rounded-xl p-4 hover:shadow-lg transition">
                                <div className="flex flex-wrap justify-between items-start gap-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h4 className="font-bold text-gray-800">{pool.prize_name}</h4>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(pool.lifecycle_status)}`}>
                                                {getStatusLabel(pool.lifecycle_status)}
                                            </span>
                                            {pool.is_approved ? (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Approved</span>
                                            ) : (
                                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⏳ Pending</span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                                            <span>💰 ETB {pool.target_amount?.toLocaleString()}</span>
                                            <span>🎫 ETB {pool.entry_fee?.toLocaleString()}</span>
                                            <span>👥 {pool.current_participants || 0} {language === 'am' ? 'ተሳታፊዎች' : 'participants'}</span>
                                            <span>📊 {Math.min(Math.round(((pool.total_collected || 0) / (pool.target_amount || 1)) * 100), 100)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 max-w-xs">
                                            <div 
                                                className="bg-green-600 h-1.5 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(Math.round(((pool.total_collected || 0) / (pool.target_amount || 1)) * 100), 100)}%` }}
                                            />
                                        </div>
                                        {pool.platform_fee_collected && (
                                            <p className="text-xs text-green-600 mt-1">
                                                ✅ {language === 'am' ? 'ክፍያ ተሰብስቧል' : 'Fee collected'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Link href={`/pools/${pool.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                            {language === 'am' ? 'አሳይ' : 'View'}
                                        </Link>
                                        <Link href={`/creator/pools/${pool.id}/manage`} className="text-green-600 hover:text-green-700 text-sm font-medium">
                                            ⚙️ {language === 'am' ? 'አስተዳድር' : 'Manage'}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                        {language === 'am' ? '🔄 የቅርብ እንቅስቃሴ' : '🔄 Recent Activity'}
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {recentActivity.map(activity => (
                            <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                                <span className="text-2xl">
                                    {activity.action === 'created' && '📝'}
                                    {activity.action === 'approved' && '✅'}
                                    {activity.action === 'participant_joined' && '👤'}
                                    {activity.action === 'fee_collected' && '💰'}
                                    {activity.action === 'draw_completed' && '🏆'}
                                </span>
                                <div className="flex-1">
                                    <p className="text-sm">
                                        {activity.action === 'created' && (language === 'am' ? 'ፑል ተፈጥሯል' : 'Pool created')}
                                        {activity.action === 'approved' && (language === 'am' ? 'ፑል ጸድቋል' : 'Pool approved')}
                                        {activity.action === 'participant_joined' && (language === 'am' ? 'አዲስ ተሳታፊ ተቀላቅሏል' : 'New participant joined')}
                                        {activity.action === 'fee_collected' && (language === 'am' ? 'ክፍያ ተሰብስቧል' : 'Fee collected')}
                                        {activity.action === 'draw_completed' && (language === 'am' ? 'እጣ ተካሂዷል' : 'Draw completed')}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(activity.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Payment Settings Modal */}
            {showPaymentSettings && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {language === 'am' ? '💳 የክፍያ ቅንብሮች' : '💳 Payment Settings'}
                            </h2>
                            <button onClick={() => setShowPaymentSettings(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={(e) => { e.preventDefault(); handleSavePaymentSettings(); }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === 'am' ? '🏦 የባንክ ስም' : '🏦 Bank Name'}
                                    </label>
                                    <input
                                        type="text"
                                        value={paymentSettings.bank_name}
                                        onChange={(e) => setPaymentSettings({...paymentSettings, bank_name: e.target.value})}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                                        placeholder={language === 'am' ? 'ለምሳሌ: CBE' : 'Example: CBE'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === 'am' ? '🔢 የባንክ ሂሳብ ቁጥር' : '🔢 Bank Account Number'}
                                    </label>
                                    <input
                                        type="text"
                                        value={paymentSettings.bank_account_number}
                                        onChange={(e) => setPaymentSettings({...paymentSettings, bank_account_number: e.target.value})}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                                        placeholder={language === 'am' ? 'ሂሳብ ቁጥር ያስገቡ' : 'Enter account number'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === 'am' ? '👤 የሂሳብ ባለቤት ስም' : '👤 Account Holder Name'}
                                    </label>
                                    <input
                                        type="text"
                                        value={paymentSettings.bank_account_name}
                                        onChange={(e) => setPaymentSettings({...paymentSettings, bank_account_name: e.target.value})}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                                        placeholder={language === 'am' ? 'ሙሉ ስም ያስገቡ' : 'Enter full name'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === 'am' ? '📱 የቴሌብር ቁጥር' : '📱 TeleBirr Number'}
                                    </label>
                                    <input
                                        type="tel"
                                        value={paymentSettings.telebirr_number}
                                        onChange={(e) => setPaymentSettings({...paymentSettings, telebirr_number: e.target.value})}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                                        placeholder={language === 'am' ? '09XXXXXXXX' : '09XXXXXXXX'}
                                    />
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-700">
                                                {language === 'am' ? '🔄 ራስ-ሰር ክፍያ መቀነስ' : '🔄 Auto Fee Deduction'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {language === 'am' 
                                                    ? 'ክፍያውን በራስ-ሰር ከስብስብ ይቀንሱ' 
                                                    : 'Automatically deduct fee from collection'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentSettings({
                                                ...paymentSettings,
                                                auto_fee_deduction: !paymentSettings.auto_fee_deduction
                                            })}
                                            className={`relative w-12 h-6 rounded-full transition ${paymentSettings.auto_fee_deduction ? 'bg-green-600' : 'bg-gray-300'}`}
                                        >
                                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${paymentSettings.auto_fee_deduction ? 'translate-x-6' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === 'am' ? '📊 የክፍያ ማስጀመሪያ መቶኛ' : '📊 Fee Collection Threshold %'}
                                    </label>
                                    <input
                                        type="number"
                                        value={paymentSettings.fee_collection_threshold}
                                        onChange={(e) => setPaymentSettings({...paymentSettings, fee_collection_threshold: parseFloat(e.target.value)})}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                                        min="5"
                                        max="50"
                                        step="5"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        {language === 'am' 
                                            ? `ክፍያ የሚሰበሰበው ከዚህ መቶኛ ላይ በሚደርስ ጊዜ ነው (አሁን: ${paymentSettings.fee_collection_threshold}%)`
                                            : `Fee is collected when this percentage of target is reached (Current: ${paymentSettings.fee_collection_threshold}%)`}
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white py-3 rounded-xl font-bold transition disabled:opacity-50"
                                >
                                    {isSubmitting ? 
                                        (language === 'am' ? 'በሂደት ላይ...' : 'Saving...') : 
                                        (language === 'am' ? '💾 ቅንብሮችን አስቀምጥ' : '💾 Save Settings')}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Payout Modal */}
            {showPayoutModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full">
                        <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {language === 'am' ? '💳 ገንዘብ አውጡ' : '💳 Withdraw Funds'}
                            </h2>
                            <button onClick={() => setShowPayoutModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">
                                {language === 'am' 
                                    ? `በአሁኑ ጊዜ ETB ${stats.totalEarnings.toLocaleString()} ገቢ አለዎት`
                                    : `You have ETB ${stats.totalEarnings.toLocaleString()} in earnings`}
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {language === 'am' ? '💰 መጠን (ETB)' : '💰 Amount (ETB)'}
                                </label>
                                <input
                                    type="number"
                                    value={payoutAmount}
                                    onChange={(e) => setPayoutAmount(e.target.value)}
                                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                                    max={stats.totalEarnings}
                                    min="100"
                                    step="100"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {language === 'am' ? '📱 የመውጫ ዘዴ' : '📱 Withdrawal Method'}
                                </label>
                                <select
                                    value={payoutMethod}
                                    onChange={(e) => setPayoutMethod(e.target.value)}
                                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="telebirr">TeleBirr</option>
                                    <option value="bank">Bank Transfer</option>
                                </select>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                <p className="text-xs text-yellow-800">
                                    ⚠️ {language === 'am' 
                                        ? 'ጥያቄዎ ከተረጋገጠ በኋላ በ24 ሰዓታት ውስጥ ይከናወናል'
                                        : 'Your request will be processed within 24 hours after verification'}
                                </p>
                            </div>
                            <button
                                onClick={handleRequestPayout}
                                disabled={isSubmitting || !payoutAmount}
                                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white py-3 rounded-xl font-bold transition disabled:opacity-50"
                            >
                                {isSubmitting ? 
                                    (language === 'am' ? 'በሂደት ላይ...' : 'Processing...') : 
                                    (language === 'am' ? '📤 ጥያቄ ላክ' : '📤 Submit Request')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
