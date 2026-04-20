import Link from 'next/link';

export default function RoleBanners() {
  const roles = [
    {
      id: 'individual',
      title: 'Individual',
      subtitle: 'Join Pools & Win Amazing Prizes',
      description: 'Contribute small amounts for a chance to win big! Cars, electronics, furniture, and more. Fair draws, transparent system, instant notifications.',
      features: [
        'Join any active prize pool',
        'Buy multiple seats for higher chances',
        'Get instant SMS and Email notifications',
        'Track your contributions and wins'
      ],
      buttonText: 'Join as Individual',
      buttonLink: '/register',
      bgColor: 'from-green-500 to-teal-500',
      icon: '👤'
    },
    {
      id: 'agent',
      title: 'Agent',
      subtitle: 'Earn 10% Commission on Every Pool',
      description: 'Create prize pools, list products from local businesses, and earn 10% commission when pools complete. No upfront costs - just community building!',
      features: [
        'Create unlimited prize pools',
        'Earn 10% commission on each pool',
        'List products from local shops',
        'Build your community and reputation'
      ],
      buttonText: 'Register as Agent',
      buttonLink: '/agent/register',
      bgColor: 'from-yellow-500 to-orange-500',
      icon: '🤝'
    },
    {
      id: 'vendor',
      title: 'Vendor',
      subtitle: 'List Products & Offer Discounts',
      description: 'Manufacturers, importers, and retailers: List your products as prizes. Winner gets the product FREE. Non-winners get exclusive discounts from you!',
      features: [
        'List unlimited products as prizes',
        'Winner gets product FREE - great marketing',
        'Offer discounts to non-winners',
        'Reach thousands of potential customers'
      ],
      buttonText: 'Register as Vendor',
      buttonLink: '/vendor/register',
      bgColor: 'from-purple-500 to-pink-500',
      icon: '🏭'
    },
    {
      id: 'organization',
      title: 'Organization',
      subtitle: 'Create Private Pools for Members',
      description: 'Banks, NGOs, schools, government offices, and community groups: Create private prize pools for your members only. Help your community save together!',
      features: [
        'Create private pools for members only',
        'Earn 10% commission on pools',
        'Perfect for staff savings groups',
        'Build stronger community bonds'
      ],
      buttonText: 'Register Organization',
      buttonLink: '/organization/register',
      bgColor: 'from-blue-500 to-cyan-500',
      icon: '🏢'
    }
  ];

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-center mb-4">Join Abbaa Carraa Today</h2>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        Choose how you want to participate - whether you want to create pools and earn commission,
        or join pools for a chance to win amazing prizes
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className={`bg-gradient-to-br ${role.bgColor} rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
          >
            <div className="p-6 text-white">
              <div className="text-4xl mb-3">{role.icon}</div>
              <h3 className="text-xl font-bold mb-1">{role.title}</h3>
              <p className="text-sm opacity-90 mb-3">{role.subtitle}</p>
              <p className="text-xs opacity-80 mb-4 leading-relaxed">{role.description}</p>
              
              <div className="space-y-1 mb-4">
                {role.features.map((feature, idx) => (
                  <p key={idx} className="text-xs opacity-90">✓ {feature}</p>
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
        <p>Anyone can create a pool (Organizer) and earn 10% commission | Anyone can join pools (Participant) for a chance to win prizes</p>
      </div>
    </section>
  );
}
