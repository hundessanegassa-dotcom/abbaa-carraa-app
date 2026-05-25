import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

export default function AgreementModal({ isOpen, onClose, onAccept, userRole }) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState('en');
  const [downloading, setDownloading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const agreementRef = useRef(null);

  const translations = {
    en: {
      title: 'Abbaa Carraa User Agreement',
      version: 'Version 1.0',
      lastUpdated: 'Last Updated: May 25, 2026',
      governingLaw: 'Governing Law: Federal Democratic Republic of Ethiopia',
      jurisdiction: 'Jurisdiction: Addis Ababa, Ethiopia',
      back: 'Back',
      download: 'Download',
      cancel: 'Cancel',
      agree: 'I Agree & Continue',
      scrollToEnable: 'Please scroll to the bottom to enable agreement'
    },
    am: {
      title: 'የአባ ካራ ተጠቃሚ ስምምነት',
      version: 'ስሪት 1.0',
      lastUpdated: 'የመጨረሻ ማሻሻያ: ግንቦት 25, 2026',
      governingLaw: 'የሚተዳደርበት ህግ: የኢፌዴሪ ህግ',
      jurisdiction: 'የህግ ስልጣን: አዲስ አበባ, ኢትዮጵያ',
      back: 'ተመለስ',
      download: 'አውርድ',
      cancel: 'ሰርዝ',
      agree: 'ተስማማና ቀጥል',
      scrollToEnable: 'ለማስቻል እባክዎ እስከ መጨረሻው ይሸብልሉ'
    },
    om: {
      title: 'Abbaa Carraa Walii Galtee Itti Fayyadamaa',
      version: 'Gulaala 1.0',
      lastUpdated: 'Yeroo Dhufee: Waxabajjii 25, 2026',
      governingLaw: 'Seera Itoophiyaa Federaalawaa Dimokraatawaa Rippaabiliika',
      jurisdiction: 'Murtii: Finfinnee, Itoophiyaa',
      back: 'Duuba',
      download: 'Buufadhu',
      cancel: 'Dhiisi',
      agree: 'Waliigalee Itti Fufi',
      scrollToEnable: 'Sassaabuu danda\'uuf, gaafa xumuraatti gad buusi'
    }
  };

  const t = translations[language];

  const getRoleSpecificContent = () => {
    switch (userRole) {
      case 'agent':
        return {
          title: '🤝 Agent Agreement',
          sections: [
            { title: '1. Agent Commission Structure', content: 'You earn 10% commission on total pool collection when your pool successfully completes. Commission is added on top of the target amount (winner gets 100% of target).' },
            { title: '2. Pool Creation Rules', content: 'You must accurately describe prizes. No misleading claims. All pools must have a valid end date and real prize.' },
            { title: '3. Prize Delivery Obligation', content: 'Within 14 days of winner selection, you must deliver the prize or cash equivalent. Failure results in account suspension.' },
            { title: '4. Agent Verification', content: 'You must provide valid Digital ID for verification. Your application is subject to admin approval.' },
            { title: '5. Marketing and Promotion', content: 'You may promote your pools on social media but cannot use false or misleading advertising.' }
          ]
        };
      case 'vendor':
        return {
          title: '🏪 Vendor Agreement',
          sections: [
            { title: '1. Vendor Commission Structure', content: 'You earn 10% commission on product sales to pool winners. Commission is added on top of product price.' },
            { title: '2. Product Listing Rules', content: 'Products must be accurately described with real images. No counterfeit or prohibited items.' },
            { title: '3. Inventory Management', content: 'You must maintain accurate stock levels. Products out of stock will be automatically disabled.' },
            { title: '4. Delivery Obligation', content: 'You must deliver product to winner within 14 days of purchase. Provide tracking information.' },
            { title: '5. Business License', content: 'You must provide valid business license and TIN certificate. Your application is subject to admin approval.' },
            { title: '6. Discount for Non-Winners', content: 'You are encouraged to offer discount codes (5-50%) to non-winners to convert them into customers.' }
          ]
        };
      case 'organization':
        return {
          title: '🏢 Organization Agreement',
          sections: [
            { title: '1. Organization Commission Structure', content: 'You earn 10% commission on private pools created for your members. Commission added on top of target.' },
            { title: '2. Private Pool Rules', content: 'Pools marked as private are restricted to approved organization members only.' },
            { title: '3. Member Verification', content: 'You are responsible for verifying that all members joining your private pools are legitimate organization members.' },
            { title: '4. Payout Responsibility', content: 'You must pay the winner within 14 days of pool completion or provide cash equivalent.' },
            { title: '5. Organization Verification', content: 'You must provide valid organization registration documents and letter of authorization.' },
            { title: '6. Member Data Protection', content: 'You must protect member data in accordance with Ethiopian Data Protection Proclamation No. 1321/2024.' }
          ]
        };
      default:
        return {
          title: '👤 Individual Participant Agreement',
          sections: [
            { title: '1. Participation Rules', content: 'You may join active pools by paying the entry fee. Each entry fee equals one seat/ticket in the pool.' },
            { title: '2. Winner Selection', content: 'Winners are selected randomly using a cryptographically secure system. The draw result is final and binding.' },
            { title: '3. Prize Delivery', content: 'Winner must provide valid delivery address within 7 days of notification. Prizes delivered within 14 days.' },
            { title: '4. Cash Equivalent Guarantee', content: 'If the physical product is unavailable, you receive 100% cash equivalent of the target amount.' },
            { title: '5. No Commission', content: 'Individual participants do not earn commissions. You participate solely for a chance to win prizes.' },
            { title: '6. Profile Completion', content: 'You must complete your profile (phone, address) to qualify for prize delivery.' }
          ]
        };
    }
  };

  const commonSections = [
    { title: '1. Eligibility', content: 'You must be at least 18 years old to use this platform. By registering, you confirm you meet this requirement.' },
    { title: '2. Account Responsibility', content: 'You are responsible for maintaining the security of your account and for all activities that occur under your account.' },
    { title: '3. Prohibited Activities', content: 'You may not manipulate pools, create fake entries, exploit bugs, use bots, or engage in any fraudulent activity.' },
    { title: '4. Data Privacy', content: 'Your personal data is handled according to our Privacy Policy and Ethiopian Data Protection Proclamation No. 1321/2024. We do not sell your personal information.' },
    { title: '5. Termination', content: 'We reserve the right to suspend or terminate accounts that violate these terms, with or without notice.' },
    { title: '6. Dispute Resolution', content: 'Disputes will first be mediated by our support team. If unresolved, binding arbitration in Addis Ababa, Ethiopia.' },
    { title: '7. Limitation of Liability', content: 'Abbaa Carraa is not liable for any indirect, incidental, or consequential damages arising from your use of the platform.' },
    { title: '8. Governing Law', content: 'This agreement is governed by the laws of the Federal Democratic Republic of Ethiopia. Any legal action shall be brought in Addis Ababa.' }
  ];

  const roleContent = getRoleSpecificContent();
  const allSections = [...commonSections, ...roleContent.sections];

  const handleScroll = (e) => {
    const element = e.target;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    if (isAtBottom && !hasScrolled) {
      setHasScrolled(true);
    }
  };

  const handleDownload = async () => {
    if (!agreementRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(agreementRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `AbbaaCarraa_Agreement_${userRole}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = image;
      link.click();
      toast.success('Agreement downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download agreement');
    } finally {
      setDownloading(false);
      setShowDownloadMenu(false);
    }
  };

  const handleAccept = async () => {
    if (!agreed || !hasScrolled) {
      toast.error(t.scrollToEnable);
      return;
    }
    setSaving(true);
    onAccept();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b p-5">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                <span>{t.version}</span>
                <span>{t.lastUpdated}</span>
                <span>{t.governingLaw}</span>
                <span>{t.jurisdiction}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Language Selector */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button onClick={() => setLanguage('en')} className={`px-3 py-1 rounded-md text-sm font-medium transition ${language === 'en' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>🇬🇧 English</button>
                <button onClick={() => setLanguage('am')} className={`px-3 py-1 rounded-md text-sm font-medium transition ${language === 'am' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>🇪🇹 አማርኛ</button>
                <button onClick={() => setLanguage('om')} className={`px-3 py-1 rounded-md text-sm font-medium transition ${language === 'om' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>🇪🇹 Oromoo</button>
              </div>
              
              {/* Download Button */}
              <div className="relative">
                <button onClick={() => setShowDownloadMenu(!showDownloadMenu)} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-1">📥 {t.download}</button>
                {showDownloadMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border z-20">
                    <button onClick={handleDownload} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm">📸 Download as PNG</button>
                    <button onClick={() => window.print()} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm">📄 Print / Save as PDF</button>
                  </div>
                )}
              </div>
              
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
          </div>
          
          {/* Role Badge */}
          <div className="mt-3">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
              userRole === 'agent' ? 'bg-yellow-100 text-yellow-700' :
              userRole === 'vendor' ? 'bg-purple-100 text-purple-700' :
              userRole === 'organization' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
            }`}>
              {userRole === 'agent' && '🤝 Agent Agreement'}
              {userRole === 'vendor' && '🏪 Vendor Agreement'}
              {userRole === 'organization' && '🏢 Organization Agreement'}
              {userRole === 'individual' && '👤 Individual Agreement'}
            </span>
          </div>
        </div>

        {/* Agreement Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" onScroll={handleScroll} ref={agreementRef}>
          {/* Role-specific Header */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-5 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">
                {userRole === 'agent' && '🤝'}
                {userRole === 'vendor' && '🏪'}
                {userRole === 'organization' && '🏢'}
                {userRole === 'individual' && '👤'}
              </span>
              <h3 className="text-xl font-bold text-gray-800">{roleContent.title}</h3>
            </div>
            <p className="text-gray-600 text-sm">This agreement supplements the general terms and applies specifically to your role as a {userRole}. Please read carefully before accepting.</p>
          </div>

          {/* Agreement Sections */}
          <div className="space-y-6">
            {allSections.map((section, idx) => (
              <div key={idx} className="border-b border-gray-100 pb-4 last:border-0">
                <h4 className="font-bold text-gray-800 text-lg mb-2">{section.title}</h4>
                <p className="text-gray-600 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>

          {/* Legal Footer */}
          <div className="bg-gray-50 rounded-xl p-4 mt-6 text-center text-xs text-gray-500 border-t">
            <p>© 2026 Abbaa Carraa PLC. All rights reserved.</p>
            <p className="mt-1">This agreement is governed by the laws of the Federal Democratic Republic of Ethiopia.</p>
            <p>Any disputes shall be resolved through binding arbitration in Addis Ababa, Ethiopia.</p>
            <p className="mt-2">💚 2% of every contribution supports kidney and heart disease patients in Ethiopia.</p>
          </div>
        </div>

        {/* Footer with Agreement Checkbox */}
        <div className="sticky bottom-0 bg-white border-t p-5 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={!hasScrolled} className="w-5 h-5 cursor-pointer disabled:cursor-not-allowed" />
              <span className={!hasScrolled ? 'text-gray-400' : 'text-gray-700'}>
                I have read and agree to the Terms and Conditions
                {!hasScrolled && <span className="text-xs text-gray-400 block">({t.scrollToEnable})</span>}
              </span>
            </label>
            
            <div className="flex gap-3">
              <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">{t.cancel}</button>
              <button onClick={handleAccept} disabled={!agreed || !hasScrolled || saving} className={`px-6 py-2 rounded-lg font-semibold transition ${agreed && hasScrolled && !saving ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                {saving ? 'Saving...' : t.agree}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
