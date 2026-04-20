import Link from 'next/link';

export default function RoleBanners() {
  const roles = [
    {
      id: 'individual',
      title: 'Individual',
      subtitle: 'Join Pools and Win Prizes',
      description: 'Contribute small amounts for a chance to win big. Fair draws and transparent system.',
      features: [
        'Join any active prize pool',
        'Buy multiple seats for higher chances',
        'Get instant notifications',
        'Track your contributions'
      ],
      buttonText: 'Join as Individual',
      buttonLink: '/register',
      bgColor: 'from-green-500 to-teal-500'
    },
    {
      id: 'agent',
      title: 'Agent',
      subtitle: 'Earn 10 Percent Commission',
      description: 'Create prize pools and earn commission when pools complete. No upfront costs.',
      features: [
        'Create unlimited prize pools',
        'Earn 10 percent commission',
        'List products from local shops',
        'Build your community'
      ],
      buttonText: 'Register as Agent',
      buttonLink: '/agent/register',
      bgColor: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'vendor',
      title: 'Vendor',
      subtitle: 'List Products and Offer Discounts',
      description: 'List your products as prizes. Winner gets product free. Non-winners get discounts.',
      features: [
        'List unlimited products',
        'Winner gets product free',
        'Offer discounts to non-winners',
        'Reach more customers'
      ],
      buttonText: 'Register as Vendor',
      buttonLink: '/vendor/register',
      bgColor: 'from-purple-500 to-pink-500'
    },
    {
      id: 'organization',
      title: 'Organization',
      subtitle: 'Create Private Pools for Members',
      description: 'Create private prize pools for your members only. Help your community save together.',
      features: [
        'Create private pools for members',
        'Earn 10 percent commission',
        'Perfect for staff groups',
        'Build community bonds'
      ],
      buttonText: 'Register Organization',
      buttonLink: '/organization/register',
      bgColor: 'from-blue-500 to-cyan-500'
    }
  ];

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-center mb-4">Join Abbaa Carraa Today</h2>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        Choose how you want to participate. Create pools and earn commission or join pools to win prizes.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className={`bg-gradient-to-br ${role.bgColor} rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
          >
            <div className="p-6 text-white">
              <h3 className="text-xl font-bold mb-1">{role.title}</h3>
              <p className="text-sm opacity-90 mb-3">{role.subtitle}</p>
              <p className="text-xs opacity-80 mb-4 leading-relaxed">{role.description}</p>
              
              <div className="space-y-1 mb-4">
                {role.features.map((feature, idx) => (
                  <p key={idx} className="text-xs opacity-90">• {feature}</p>
                ))}
              </div>
              
              <Link href={role.buttonLink}>
                <button className="w-full bg-white text-gray-800 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition shadow-md">
                  {role.buttonText} →
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-8 text-sm text-gray-500">
        <p>Anyone can create a pool and earn 10 percent commission. Anyone can join pools for a chance to win prizes.</p>
      </div>
    </section>
  );
}
