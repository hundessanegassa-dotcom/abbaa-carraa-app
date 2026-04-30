import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function RoleBanners() {
  const { t } = useTranslation();

  const roles = [
    {
      id: 'individual',
      title: t('banners.individual'),
      description: t('banners.individual_desc'),
      buttonText: t('common.join_now'),
      buttonLink: '/register',
      bgColor: 'from-green-500 to-teal-500',
      icon: '👤'
    },
    {
      id: 'agent',
      title: t('banners.agent'),
      description: t('banners.agent_desc'),
      buttonText: t('common.become_agent'),
      buttonLink: '/agent/register',
      bgColor: 'from-yellow-500 to-orange-500',
      icon: '🤝'
    },
    {
      id: 'vendor',
      title: t('banners.vendor'),
      description: t('banners.vendor_desc'),
      buttonText: t('common.become_vendor'),
      buttonLink: '/vendor/register',
      bgColor: 'from-purple-500 to-pink-500',
      icon: '🏭'
    },
    {
      id: 'organization',
      title: t('banners.organization'),
      description: t('banners.organization_desc'),
      buttonText: t('common.become_org'),
      buttonLink: '/organization/register',
      bgColor: 'from-blue-500 to-cyan-500',
      icon: '🏢'
    }
  ];

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-center mb-4">{t('common.join_today') || 'Join Abbaa Carraa Today'}</h2>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        {t('common.join_description') || 'Choose how you want to participate. Create pools and earn commission or join pools to win prizes.'}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className={`bg-gradient-to-br ${role.bgColor} rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
          >
            <div className="p-6 text-white">
              <div className="text-4xl mb-3">{role.icon}</div>
              <h3 className="text-xl font-bold mb-2">{role.title}</h3>
              <p className="text-sm opacity-90 mb-4 leading-relaxed">{role.description}</p>
              <Link href={role.buttonLink}>
                <button className="w-full bg-white text-gray-800 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition shadow-md">
                  {role.buttonText} →
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
