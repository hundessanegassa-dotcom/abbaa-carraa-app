import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
export async function getServerSideProps() {
  return { props: {} };
}
export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    { number: 1, title: 'Choose a Prize Pool', icon: '🎁', description: 'Browse through our active prize pools and choose one you want to join. Each pool has a fixed prize value and entry fee.' },
    { number: 2, title: 'Make a Contribution', icon: '💰', description: 'Pay the entry fee via Telebirr, CBE Birr, or bank transfer. Each contribution gives you one ticket number.' },
    { number: 3, title: 'Get Your Ticket', icon: '🎫', description: 'You\'ll receive a unique ticket number. More contributions = more tickets = higher chance to win!' },
    { number: 4, title: 'Watch the Live Draw', icon: '🎲', description: 'When the pool reaches 100%, we run a live, transparent random draw to select the winner.' },
    { number: 5, title: 'Win & Celebrate!', icon: '🏆', description: 'Winner is notified immediately via SMS and email. Prize is delivered within 14 days!' }
  ];

  const roles = [
    { icon: '👤', title: 'Individual', description: 'Join pools and win prizes', link: '/register?role=individual' },
    { icon: '🤝', title: 'Agent', description: 'Create pools, earn 10% commission', link: '/become-agent' },
    { icon: '🏪', title: 'Vendor', description: 'List products, earn commission', link: '/become-vendor' },
    { icon: '🏢', title: 'Organization', description: 'Private pools for members, earn 10%', link: '/become-organization' }
  ];

  const benefits = [
    { icon: '💚', title: '2% for Health', description: 'Every contribution helps kidney and heart disease patients in Ethiopia' },
    { icon: '🔒', title: 'Fair & Transparent', description: 'Blockchain-verified random draws' },
    { icon: '💰', title: 'Cash Equivalent', description: 'Winner gets cash equal to prize value' },
    { icon: '🤝', title: 'Earn Commission', description: 'Create pools and earn 10% commission' }
  ];

  return (
    <>
      <Head><title>How It Works - Abbaa Carraa Ethio</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Join prize pools, contribute, and win amazing prizes while supporting health initiatives in Ethiopia
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Steps */}
          <h2 className="text-2xl font-bold text-center mb-8">Simple 5-Step Process</h2>
          <div className="space-y-6">
            {steps.map(step => (
              <div key={step.number} className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-xl font-bold text-green-600">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800">{step.title}</h3>
                    <p className="text-gray-600 mt-1">{step.description}</p>
                  </div>
                  <div className="text-3xl">{step.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Roles Section */}
          <h2 className="text-2xl font-bold text-center mt-12 mb-8">Choose Your Role</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {roles.map((role, i) => (
              <Link key={i} href={role.link} className="bg-white rounded-2xl p-5 text-center shadow-md hover:shadow-lg transition group">
                <div className="text-4xl mb-2 group-hover:scale-110 transition">{role.icon}</div>
                <h3 className="font-bold text-gray-800">{role.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{role.description}</p>
              </Link>
            ))}
          </div>

          {/* Benefits */}
          <h2 className="text-2xl font-bold text-center mt-12 mb-8">Why Choose Abbaa Carraa?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-md text-center">
                <div className="text-4xl mb-3">{benefit.icon}</div>
                <h3 className="font-bold text-lg">{benefit.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* FAQ Link */}
          <div className="mt-8 text-center">
            <Link href="/faq" className="text-green-600 hover:underline">
              Still have questions? Check our FAQ →
            </Link>
          </div>

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-xl font-bold mb-4">Ready to Start Winning?</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-white text-green-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition">
                Create Account
              </Link>
              <Link href="/listings" className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-full font-semibold transition">
                Browse Pools →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
