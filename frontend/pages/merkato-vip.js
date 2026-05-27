import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function MerkatoVip() {
  const router = useRouter();
  const isMounted = useRef(true);
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedPool, setSelectedPool] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pools, setPools] = useState([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    checkUser();
    fetchActivePools();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (isMounted.current) setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const fetchActivePools = async () => {
    try {
      const { data, error } = await supabase
        .from('merkato_vip_pools')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (!error && data && isMounted.current) {
        setPools(data);
      }
    } catch (error) {
      console.error('Error fetching pools:', error);
    }
  };

  // VIP Pool Data with GREY THEME
  const vipPools = {
    daily: {
      name: "ዕለታዊ ሚሊየነር | Daily Millionaire",
      tier: "መርካቶ ለሁሉም | Merkato for All",
      frequency: "Daily",
      contribution: "500 ETB",
      prize: "1,000,000 ETB",
      prizeNumber: 1000000,
      winnerCount: 1,
      totalSeats: 2400,
      time: "Every Day at 8:00 PM",
      color: "from-gray-600 to-gray-800",
      icon: "⭐",
      slogan: "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው | Let's make one participant a millionaire today, this week and this month",
      description: "Start your day with a chance to become an instant millionaire! Perfect for daily savers who want immediate results."
    },
    weekly: {
      name: "ሳምንታዊ ግዙፍ አሸናፊ | Weekly Mega Winner",
      tier: "VIP 2",
      frequency: "Weekly",
      contribution: "2,500 ETB",
      prize: "10,000,000 ETB",
      prizeNumber: 10000000,
      winnerCount: 1,
      totalSeats: 4800,
      time: "Every Sunday at 6:00 PM",
      color: "from-gray-600 to-gray-800",
      icon: "🏆",
      slogan: "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው | Let's make one participant a millionaire today, this week and this month",
      description: "Ten MILLION Birr changes everything. This is the pool that creates market LEGENDS!"
    },
    monthly: {
      name: "ወርሃዊ አሸናፊ | Monthly Winner",
      tier: "VIP 1",
      frequency: "Monthly",
      contribution: "5,000 ETB",
      prize: "40,000,000 ETB",
      prizeNumber: 40000000,
      winnerCount: 1,
      totalSeats: 9600,
      time: "Last Day of Month at 8:00 PM",
      color: "from-gray-600 to-gray-800",
      icon: "👑",
      slogan: "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው | Let's make one participant a millionaire today, this week and this month",
      description: "The ULTIMATE Merkato prize pool. FORTY MILLION Birr. Become a legend that the market will talk about for generations!"
    }
  };

  const handleJoinPool = async (poolType) => {
    if (!user) {
      sessionStorage.setItem('pendingRole', 'individual');
      sessionStorage.setItem('pendingPoolType', poolType);
      sessionStorage.setItem('pendingPoolSource', 'merkato-vip');
      sessionStorage.setItem('redirectAfterLogin', `/merkato-vip?join=${poolType}`);
      toast.loading('እባክዎ ይግቡ | Please login to join...');
      router.push('/login');
      return;
    }
    
    // Store selected pool and redirect to seat selection
    sessionStorage.setItem('merkatoPoolType', poolType);
    router.push(`/merkato-seat?type=${poolType}`);
  };

  const PoolCard = ({ type, pool }) => (
    <div className="group relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
      <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-gray-700 to-gray-900 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
        🏆 {pool.prize}
      </div>
      
      <div className={`bg-gradient-to-r ${pool.color} p-6 text-white relative`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{pool.tier}</p>
            <h3 className="text-2xl font-bold mt-1">{pool.name}</h3>
          </div>
          <div className="text-5xl">{pool.icon}</div>
        </div>
        
        <div className="mt-3 bg-white/20 backdrop-blur rounded-lg p-2 text-center">
          <p className="text-sm font-bold">{pool.slogan}</p>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div>
            <p className="text-sm opacity-80">የመግቢያ ክፍያ | Entry Fee</p>
            <p className="text-3xl font-bold">{pool.contribution}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">የተረጋገጠ ሽልማት | Prize</p>
            <p className="text-3xl font-bold">{pool.prize}</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-gray-600">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{pool.time}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{pool.winnerCount} አሸናፊ | Winner Every {pool.frequency}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>💺 Total Seats: {pool.totalSeats.toLocaleString()}</span>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-6">{pool.description}</p>
        
        <button
          onClick={() => handleJoinPool(type)}
          className={`w-full bg-gradient-to-r ${pool.color} text-white py-3 rounded-xl font-semibold hover:shadow-lg transition transform hover:scale-105`}
        >
          🎯 Select Seat & Join {pool.frequency} Pool →
        </button>
      </div>
    </div>
  );

  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <>
      <Head>
        <title>Merkato VIP - ዕለታዊ 1ሚሊዮን፣ ሳምንታዊ 10ሚሊዮን፣ ወርሃዊ 40ሚሊዮን ብር | Abbaa Carraa</title>
        <meta name="description" content="ልዩ የመርካቶ ነጋዴዎች የሽልማት ፕሮግራም፦ በየቀኑ 1ሚሊዮን ብር፣ በየሳምንቱ 10ሚሊዮን ብር፣ በየወሩ 40ሚሊዮን ብር ያሸንፉ! Merkato's #1 Prize Program: Win 1M Daily, 10M Weekly, 40M Monthly!" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section - Grey Theme */}
        <div className="relative bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 text-9xl animate-bounce">🏪</div>
            <div className="absolute bottom-10 right-10 text-9xl animate-pulse">🛺</div>
            <div className="absolute top-1/3 left-1/4 text-8xl">📦</div>
            <div className="absolute bottom-1/3 right-1/4 text-8xl">💰</div>
          </div>
          
          <div className="relative container mx-auto px-4 py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-6">
              <span>🏆</span> ልዩ የመርካቶ ፕሮግራም | Merkato Special Program
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              <span className="block">መርካቶ</span>
              <span className="bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">VIP</span>
            </h1>
            
            <div className="max-w-4xl mx-auto space-y-4 my-8">
              <div className="bg-gray-700/50 backdrop-blur rounded-xl p-4">
                <p className="text-xl md:text-2xl font-bold text-gray-200">
                  "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው"
                </p>
                <p className="text-lg text-gray-300">
                  "Let's make one participant a millionaire today, this week and this month"
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
              <div className="bg-gray-700/50 backdrop-blur rounded-xl p-3 text-center">
                <p className="text-xs opacity-80">ዕለታዊ ሽልማት | Daily Prize</p>
                <p className="text-2xl font-bold text-gray-200">1,000,000 ብር</p>
              </div>
              <div className="bg-gray-700/50 backdrop-blur rounded-xl p-3 text-center">
                <p className="text-xs opacity-80">ሳምንታዊ ሽልማት | Weekly Prize</p>
                <p className="text-2xl font-bold text-gray-200">10,000,000 ብር</p>
              </div>
              <div className="bg-gray-700/50 backdrop-blur rounded-xl p-3 text-center">
                <p className="text-xs opacity-80">ወርሃዊ ሽልማት | Monthly Prize</p>
                <p className="text-2xl font-bold text-gray-200">40,000,000 ብር</p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="bg-gray-700/50 backdrop-blur rounded-lg px-6 py-3">
                <div className="text-3xl font-bold">7,100+</div>
                <div className="text-sm">ባለቤቶች | Businesses</div>
              </div>
              <div className="bg-gray-700/50 backdrop-blur rounded-lg px-6 py-3">
                <div className="text-3xl font-bold">13,000+</div>
                <div className="text-sm">ሠራተኞች | Workers</div>
              </div>
              <div className="bg-gray-700/50 backdrop-blur rounded-lg px-6 py-3">
                <div className="text-3xl font-bold">ሁሉም ኢትዮጵያዊያን</div>
                <div className="text-sm">All Ethiopians</div>
              </div>
            </div>
          </div>
        </div>

        {/* About Merkato Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">🌟 ስለ መርካቶ | About Merkato</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  መርካቶ የአፍሪካ ትልቁ ክፍት ገበያ ሲሆን በየቀኑ በሚሊዮን የሚቆጠር ብር የሚዘዋወርበት የንግድ ልብ ነው። እዚህ ገበያ ውስጥ 7,100 ንግዶች እና 13,000 ሰራተኞች ይገኛሉ።
                </p>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Merkato</strong> is Africa's largest open-air market, handling millions of Birr in daily transactions. 
                  It's home to over 7,100 businesses and 13,000 workers coming together for commerce and community.
                </p>
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="border-l-4 border-gray-500 pl-3">
                    <p className="text-xs text-gray-500">የእምነት አካባቢ | Trust-Based</p>
                    <p className="font-semibold">በቃል ንግድ | Word-of-Mouth Commerce</p>
                  </div>
                  <div className="border-l-4 border-gray-500 pl-3">
                    <p className="text-xs text-gray-500">ባህላዊ ቁጠባ | Traditional Saving</p>
                    <p className="font-semibold">የእኩብ ሥርዓት | Equb System</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">💎 መርካቶ ለሁሉም | Merkato for All</h3>
                <p className="text-gray-700 text-sm mb-4">
                  ይህ ፕሮግራም ለሁሉም ነጋዴዎች እና ተሳታፊዎች ክፍት ነው! 
                  This program is OPEN to ALL Merkato traders and participants!
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span>በየቀኑ አንድ ሚሊየነር | One Millionaire Every Day</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span>በየሳምንቱ አንድ ሚሊየነር | One Millionaire Every Week</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span>በየወሩ አንድ ሚሊየነር | One Millionaire Every Month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VIP Tabs */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'daily' ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg' : 'bg-gray-200 text-gray-600'}`}
            >
              ⭐ ዕለታዊ | Daily (1M)
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'weekly' ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg' : 'bg-gray-200 text-gray-600'}`}
            >
              🏆 ሳምንታዊ | Weekly (10M)
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'monthly' ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg' : 'bg-gray-200 text-gray-600'}`}
            >
              👑 ወርሃዊ | Monthly (40M)
            </button>
          </div>

          <div className="max-w-4xl mx-auto">
            <PoolCard type={activeTab} pool={vipPools[activeTab]} />
          </div>
        </div>

        {/* Comparison Table */}
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-center mb-8">🎯 የሽልማት ንጽጽር | Prize Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-lg overflow-hidden">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">ፕሮግራም | Program</th>
                  <th className="px-6 py-4 text-left">ደረጃ | Tier</th>
                  <th className="px-6 py-4 text-left">ክፍያ | Entry</th>
                  <th className="px-6 py-4 text-left">ሽልማት | Prize</th>
                  <th className="px-6 py-4 text-left">ጊዜ | When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold">⭐ Daily Millionaire</td>
                  <td className="px-6 py-4"><span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">መርካቶ ለሁሉም | Merkato for All</span></td>
                  <td className="px-6 py-4 font-bold">500 ብር</td>
                  <td className="px-6 py-4 font-bold text-green-600">1,000,000 ብር</td>
                  <td className="px-6 py-4">Every Day at 8 PM</td>
                </tr>
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold">🏆 Weekly Mega Winner</td>
                  <td className="px-6 py-4"><span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">VIP 2</span></td>
                  <td className="px-6 py-4 font-bold">2,500 ብር</td>
                  <td className="px-6 py-4 font-bold text-purple-600">10,000,000 ብር</td>
                  <td className="px-6 py-4">Every Sunday at 6 PM</td>
                </tr>
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold">👑 Monthly Winner</td>
                  <td className="px-6 py-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">VIP 1</span></td>
                  <td className="px-6 py-4 font-bold">5,000 ብር</td>
                  <td className="px-6 py-4 font-bold text-green-600">40,000,000 ብር</td>
                  <td className="px-6 py-4">Last Day of Month at 8 PM</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-100 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">እንዴት እንሳተፋለን? | How It Works</h2>
            <p className="text-center text-gray-600 mb-12">Like traditional Equb, but BIGGER and BETTER!</p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg text-white">1️⃣</div>
                <h3 className="font-bold text-xl mb-2">ምረጥ | Choose</h3>
                <p className="text-gray-600">በየቀኑ፣ በየሳምንቱ ወይም በየወሩ የሚካሄደውን ፑል ምረጥ</p>
                <p className="text-green-600 font-semibold text-sm mt-1">Choose Daily, Weekly, or Monthly Millionaire pool</p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg text-white">2️⃣</div>
                <h3 className="font-bold text-xl mb-2">ክፈል | Pay</h3>
                <p className="text-gray-600">በቴሌብር ወይም በንግድ ባንክ መጠነኛ ክፍያ ክፈል</p>
                <p className="text-green-600 font-semibold text-sm mt-1">Pay via TeleBirr or CBE Bank Transfer</p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg text-white">3️⃣</div>
                <h3 className="font-bold text-xl mb-2">ሽለም | WIN!</h3>
                <p className="text-gray-600">እጣው ሲነሳ ሚሊየነር ትሆናለህ!</p>
                <p className="text-green-600 font-semibold text-sm mt-1">When the lottery is drawn - YOU become a MILLIONAIRE!</p>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 bg-green-100 px-6 py-3 rounded-full">
                <span className="text-green-600">💚</span>
                <span className="text-green-800">2% of every contribution supports kidney & heart disease patients</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Banner - Grey Theme */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">ዛሬውኑ ይቀላቀሉ!</h2>
            <p className="text-xl mb-6">Join Today and Become Merkato's Next Millionaire!</p>
            <button
              onClick={() => handleJoinPool('daily')}
              className="bg-gray-600 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-700 transition transform hover:scale-105"
            >
              🎯 Start Winning Now →
            </button>
            <p className="text-sm opacity-80 mt-4">በቴሌብር እና በንግድ ባንክ መክፈል ይቻላል | Pay via TeleBirr or CBE</p>
          </div>
        </div>
      </div>
    </>
  );
}
