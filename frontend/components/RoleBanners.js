import Link from 'next/link';

export default function RoleBanners() {
  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-center mb-4">Join Abbaa Carraa Today</h2>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        Choose how you want to participate. Create pools and earn commission or join pools to win prizes.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Individual Card */}
        <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="p-6 text-white">
            <div className="text-4xl mb-3">👤</div>
            <h3 className="text-xl font-bold mb-1">Individual</h3>
            <p className="text-sm opacity-90 mb-3">Join Pools and Win Prizes</p>
            <p className="text-xs opacity-80 mb-4 leading-relaxed">
              Contribute small amounts for a chance to win big. Fair draws and transparent system.
            </p>
            <div className="space-y-1 mb-4">
              <p className="text-xs opacity-90">• Join any active prize pool</p>
              <p className="text-xs opacity-90">• Buy multiple seats for higher chances</p>
              <p className="text-xs opacity-90">• Get instant notifications</p>
              <p className="text-xs opacity-90">• Track your contributions</p>
            </div>
            <Link href="/register">
              <button className="w-full bg-white text-gray-800 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition shadow-md">
                Join as Individual →
              </button>
            </Link>
          </div>
        </div>
        
        {/* Agent Card */}
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="p-6 text-white">
            <div className="text-4xl mb-3">🤝</div>
            <h3 className="text-xl font-bold mb-1">Agent</h3>
            <p className="text-sm opacity-90 mb-3">Earn 10 Percent Commission</p>
            <p className="text-xs opacity-80 mb-4 leading-relaxed">
              Create prize pools and earn commission when pools complete. No upfront costs.
            </p>
            <div className="space-y-1 mb-4">
              <p className="text-xs opacity-90">• Create unlimited prize pools</p>
              <p className="text-xs opacity-90">• Earn 10 percent commission</p>
              <p className="text-xs opacity-90">• List products from local shops</p>
              <p className="text-xs opacity-90">• Build your community</p>
            </div>
            <Link href="/agent/register">
              <button className="w-full bg-white text-gray-800 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition shadow-md">
                Register as Agent →
              </button>
            </Link>
          </div>
        </div>
        
        {/* Vendor Card */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="p-6 text-white">
            <div className="text-4xl mb-3">🏭</div>
            <h3 className="text-xl font-bold mb-1">Vendor</h3>
            <p className="text-sm opacity-90 mb-3">List Products and Offer Discounts</p>
            <p className="text-xs opacity-80 mb-4 leading-relaxed">
              List your products as prizes. Winner gets product free. Non-winners get discounts.
            </p>
            <div className="space-y-1 mb-4">
              <p className="text-xs opacity-90">• List unlimited products</p>
              <p className="text-xs opacity-90">• Winner gets product free</p>
              <p className="text-xs opacity-90">• Offer discounts to non-winners</p>
              <p className="text-xs opacity-90">• Reach more customers</p>
            </div>
            <Link href="/vendor/register">
              <button className="w-full bg-white text-gray-800 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition shadow-md">
                Register as Vendor →
              </button>
            </Link>
          </div>
        </div>
        
        {/* Organization Card */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="p-6 text-white">
            <div className="text-4xl mb-3">🏢</div>
            <h3 className="text-xl font-bold mb-1">Organization</h3>
            <p className="text-sm opacity-90 mb-3">Create Private Pools for Members</p>
            <p className="text-xs opacity-80 mb-4 leading-relaxed">
              Create private prize pools for your members only. Help your community save together.
            </p>
            <div className="space-y-1 mb-4">
              <p className="text-xs opacity-90">• Create private pools for members</p>
              <p className="text-xs opacity-90">• Earn 10 percent commission</p>
              <p className="text-xs opacity-90">• Perfect for staff groups</p>
              <p className="text-xs opacity-90">• Build community bonds</p>
            </div>
            <Link href="/organization/register">
              <button className="w-full bg-white text-gray-800 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition shadow-md">
                Register Organization →
              </button>
            </Link>
          </div>
        </div>
        
      </div>
      
      <div className="text-center mt-8 text-sm text-gray-500">
        <p>Anyone can create a pool and earn 10 percent commission. Anyone can join pools for a chance to win prizes.</p>
      </div>
    </section>
  );
}
