import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

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
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white
