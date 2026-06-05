// pages/cities/[city].js - MODIFIED to use CityLayout
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import NoSSR from '../../components/NoSSR';
import CityLayout from '../../components/CityLayout'; // IMPORT THE NEW LAYOUT

// ... (keep ALL your existing cityData, getNextSunday, getNextMonthEnd, etc.)

export default function CityVip() {
  const router = useRouter();
  const { city, name } = router.query;
  const [activeTab, setActiveTab] = useState('daily');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cityInfo, setCityInfo] = useState(null);
  // REMOVED: showCityDropdown state (now handled by layout)
  
  // ... (keep ALL your existing states: seat selection, payment, ticket, etc.)
  const [showSeatSelector, setShowSeatSelector] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedPoolType, setSelectedPoolType] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [participantId, setParticipantId] = useState(null);
  const [maxSeats, setMaxSeats] = useState(5);
  const [showTicket, setShowTicket] = useState(false);
  const [participantData, setParticipantData] = useState(null);
  const [ticketType, setTicketType] = useState('unverified');

  useEffect(() => {
    if (city) {
      const data = cityData[city];
      if (data) {
        setCityInfo(data);
      } else {
        setCityInfo({
          name: name ? decodeURIComponent(name) : city.replace(/-/g, ' '),
          slogan: 'አንድ ብሔር አንድ እድል | One Nation One Chance',
          businesses: '1,000+',
          workers: '5,000+',
          color: 'from-gray-700 to-gray-900',
          icon: '🇪🇹',
          product: 'ማህበረሰብ እና ንግድ | Community & Trade',
          description: 'የኢትዮጵያ ከተማ | Ethiopian City',
          population: 'N/A',
          region: 'Ethiopia'
        });
      }
    }
    checkUser();
  }, [city, name]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  // REMOVED: handleCityChange (now in layout)
  // REMOVED: city dropdown rendering (now in layout)

  // ... (keep ALL your existing functions: handleJoinPool, submitPayment, renderSeatSelector, renderPayment, renderTicketModal, PoolCard, etc.)

  if (!cityInfo) {
    return (
      <CityLayout currentCityId={city}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
        </div>
      </CityLayout>
    );
  }

  // Wrap with CityLayout instead of NoSSR
  return (
    <NoSSR>
      <CityLayout currentCityId={city}>
        <Head>
          <title>{cityInfo.name} VIP - Win 1M Daily, 10M Weekly, 40M Monthly | Abbaa Carraa</title>
          <meta name="description" content={`Join ${cityInfo.name} VIP program. Win 1 Million Birr daily, 10 Million weekly, or 40 Million monthly. Open to all ${cityInfo.name} traders and participants.`} />
        </Head>

        <div className="min-h-screen">
          {/* REMOVED: City Selector Dropdown section (now in navbar) */}
          
          {/* Hero Section - Keep as is */}
          <div className={`relative bg-gradient-to-r ${cityInfo.color} text-white overflow-hidden mt-0`}>
            {/* ... keep your existing hero section */}
          </div>

          {/* About City Section - Keep as is */}
          {/* ... */}

          {/* VIP Tabs - Keep as is */}
          {/* ... */}

          {/* Comparison Table - Keep as is */}
          {/* ... */}

          {/* How It Works - Keep as is */}
          {/* ... */}

          {/* CTA Banner - Keep as is */}
          {/* ... */}
        </div>

        {/* Modals - Keep as is */}
        {renderSeatSelector()}
        {renderPayment()}
        {renderTicketModal()}
      </CityLayout>
    </NoSSR>
  );
}
