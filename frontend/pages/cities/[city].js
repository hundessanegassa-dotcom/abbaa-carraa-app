// pages/cities/[cityId].js - COMPLETE WITH 5 TIERS (100, 500, 1000, 2500, 5000 BIRR) & NO COMMISSION DISPLAY
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import NoSSR from '../../components/NoSSR';
import TopCitySelector from '../../components/TopCitySelector';
import UnifiedAgentApplication from '../../components/UnifiedAgentApplication';
import SeatSelector from '../../components/SeatSelector';
import CityTicket from '../../components/CityTicket';

// ✅ 5 TIERS FOR CITY VIP - 100, 500, 1000, 2500, 5000 BIRR
export const CITY_VIP_TIERS = {
  silver: {
    id: 'silver',
    labelEn: 'Silver',
    labelAm: 'ብር',
    icon: '🥈',
    contribution: 100,
    prize: 100000,      // ✅ 100,000 ETB
    seats: 1200,
    color: 'from-gray-400 to-gray-500',
    badge: 'Silver',
    tier: 1
  },
  gold: {
    id: 'gold',
    labelEn: 'Gold',
    labelAm: 'ወርቅ',
    icon: '🥇',
    contribution: 500,
    prize: 500000,      // ✅ 500,000 ETB
    seats: 1200,
    color: 'from-yellow-400 to-yellow-600',
    badge: 'Gold',
    tier: 2
  },
  platinum: {
    id: 'platinum',
    labelEn: 'Platinum',
    labelAm: 'ፕላቲኒየም',
    icon: '💎',
    contribution: 1000,
    prize: 2000000,     // ✅ 2,000,000 ETB
    seats: 2400,
    color: 'from-gray-300 to-blue-400',
    badge: 'Platinum',
    tier: 3
  },
  diamond: {
    id: 'diamond',
    labelEn: 'Diamond',
    labelAm: 'አልማዝ',
    icon: '💠',
    contribution: 2500,
    prize: 5000000,     // ✅ 5,000,000 ETB
    seats: 2400,
    color: 'from-blue-400 to-cyan-400',
    badge: 'Diamond',
    tier: 4
  },
  royal: {
    id: 'royal',
    labelEn: 'Royal',
    labelAm: 'ንጉሣዊ',
    icon: '👑',
    contribution: 5000,
    prize: 10000000,    // ✅ 10,000,000 ETB
    seats: 2400,
    color: 'from-purple-500 to-pink-500',
    badge: 'Royal',
    tier: 5
  }
};


// Helper function to get draw schedule text
function getDrawScheduleText(tierId, language) {
  const schedules = {
    silver: { en: 'Daily Draw', am: 'ዕለታዊ እጣ' },
    gold: { en: 'Daily Draw', am: 'ዕለታዊ እጣ' },
    platinum: { en: 'Weekly Draw', am: 'ሳምንታዊ እጣ' },
    diamond: { en: 'Weekly Draw', am: 'ሳምንታዊ እጣ' },
    royal: { en: 'Monthly Draw', am: 'ወርሃዊ እጣ' }
  };
  return schedules[tierId]?.[language] || schedules.silver[language];
}

// ============================================
// COMPLETE CITY DATA - ALL 94 ETHIOPIAN CITIES
// ============================================
const cityData = {
  // ===================== CENTRAL & MAJOR CITIES =====================
  'addis-ababa': { name: 'አዲስ አበባ | Addis Ababa', slogan: 'የኢትዮጵያ የንግድ እና የዲፕሎማሲ ልብ', businesses: '50,000+', workers: '200,000+', color: 'from-gray-700 to-gray-900', icon: '🏙️', product: 'ዘመናዊ አገልግሎቶች, ቴክኖሎጂ', description: 'የኢትዮጵያ ዋና ከተማ እና የንግድ ማዕከል', population: '5M+', region: 'Central' },
  'shaggar': { name: 'ሸገር | Shaggar City', slogan: 'ብልህ ከተማ እና የኢንቨስትመንት ማዕከል', businesses: '25,000+', workers: '100,000+', color: 'from-gray-700 to-gray-900', icon: '🏗️', product: 'ቴክኖሎጂ, ዘመናዊ አገልግሎቶች', description: 'ብልህ ከተማ እና የኢንቨስትመንት ማዕከል', population: '3M+', region: 'Oromia' },
  'dire-dawa': { name: 'ድሬ ዳዋ | Dire Dawa', slogan: 'የሎጂስቲክስ እና የማኑፋክቸሪንግ በር', businesses: '15,000+', workers: '60,000+', color: 'from-gray-700 to-gray-900', icon: '🚂', product: 'ጨርቃጨርቅ, ሎጂስቲክስ', description: 'ሁለተኛዋ ትልቋ ከተማ', population: '535K+', region: 'Dire Dawa' },
  
  // ===================== TIGRAY REGION =====================
  'mekelle': { name: 'መቀሌ | Mekelle', slogan: 'የሰሜኑ የኢንዱስትሪ እና የትምህርት ማዕከል', businesses: '18,000+', workers: '70,000+', color: 'from-gray-700 to-gray-900', icon: '🏭', product: 'ሲሚንቶ, ፋርማሲዩቲካልስ', description: 'የሰሜን ኢትዮጵያ የንግድ ማዕከል', population: '500K+', region: 'Tigray' },
  'axum': { name: 'አክሱም | Axum', slogan: 'የታላቁ የአክሱም መንግስት ዋና ከተማ', businesses: '5,000+', workers: '20,000+', color: 'from-gray-700 to-gray-900', icon: '🏛️', product: 'ቱሪዝም, ቅርስ', description: 'የታሪካዊ ቅርስ ከተማ', population: '70K+', region: 'Tigray' },
  'adigrat': { name: 'አዲግራት | Adigrat', slogan: 'የሰሜን ትግራይ የንግድ ማዕከል', businesses: '4,000+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የሰሜን ትግራይ የንግድ ማዕከል', population: '80K+', region: 'Tigray' },
  'shire': { name: 'ሽሬ | Shire', slogan: 'የምዕራብ ትግራይ ዋና ከተማ', businesses: '6,000+', workers: '25,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የምዕራብ ትግራይ የንግድ ማዕከል', population: '100K+', region: 'Tigray' },
  'mekoni': { name: 'መቆኒ | Mekoni', slogan: 'የምዕራብ ትግራይ ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የምዕራብ ትግራይ ከተማ', population: '50K+', region: 'Tigray' },
  'maychew': { name: 'ማይጨው | Maychew', slogan: 'የደቡብ ትግራይ ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የደቡብ ትግራይ ከተማ', population: '40K+', region: 'Tigray' },
  'abiy-addi': { name: 'አቢይ አዲ | Abiy Addi', slogan: 'የማዕከላዊ ትግራይ ከተማ', businesses: '2,500+', workers: '10,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የማዕከላዊ ትግራይ ከተማ', population: '30K+', region: 'Tigray' },
  'wukro': { name: 'ውቅሮ | Wukro', slogan: 'የምስራቅ ትግራይ ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የምስራቅ ትግራይ ከተማ', population: '50K+', region: 'Tigray' },
  
  // ===================== AMHARA REGION =====================
  'gondar': { name: 'ጎንደር | Gondar', slogan: 'የባህል ቅርስ እና የቱሪዝም ከተማ', businesses: '10,000+', workers: '40,000+', color: 'from-gray-700 to-gray-900', icon: '🏰', product: 'ቱሪዝም, ጨርቃጨርቅ', description: 'የባህል ቅርስ ከተማ', population: '350K+', region: 'Amhara' },
  'bahir-dar': { name: 'ባህር ዳር | Bahir Dar', slogan: 'የሀይቆች እና የጨርቃጨርቅ ከተማ', businesses: '12,000+', workers: '50,000+', color: 'from-gray-700 to-gray-900', icon: '🏞️', product: 'ጨርቃጨርቅ, ቱሪዝም', description: 'የታና ሀይቅ ዳርቻ', population: '350K+', region: 'Amhara' },
  'dessie': { name: 'ደሴ | Dessie', slogan: 'የንግድ እና የእርሻ ከተማ', businesses: '7,000+', workers: '25,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ግብርና, ንግድ', description: 'የንግድ እና የእርሻ ከተማ', population: '229K+', region: 'Amhara' },
  'debre-markos': { name: 'ደብረ ማርቆስ | Debre Markos', slogan: 'የምስራቅ ጎጃም ዋና ከተማ', businesses: '8,000+', workers: '30,000+', color: 'from-gray-700 to-gray-900', icon: '⛪', product: 'ንግድ, ግብርና', description: 'የምስራቅ ጎጃም ዋና ከተማ', population: '120K+', region: 'Amhara' },
  'finote-selam': { name: 'ፍኖተ ሰላም | Finote Selam', slogan: 'የምዕራብ ጎጃም ዋና ከተማ', businesses: '6,000+', workers: '20,000+', color: 'from-gray-700 to-gray-900', icon: '🌅', product: 'ንግድ, ግብርና', description: 'የምዕራብ ጎጃም ዋና ከተማ', population: '80K+', region: 'Amhara' },
  'woldia': { name: 'ወልዲያ | Woldia', slogan: 'የወልዲያ ዩኒቨርሲቲ ከተማ', businesses: '5,000+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '🎓', product: 'ትምህርት, ንግድ', description: 'የወልዲያ ዩኒቨርሲቲ ከተማ', population: '60K+', region: 'Amhara' },
  'debre-birhan': { name: 'ደብረ ብርሃን | Debre Birhan', slogan: 'የፀሐይ ብርሃን ከተማ', businesses: '7,000+', workers: '25,000+', color: 'from-gray-700 to-gray-900', icon: '⭐', product: 'ንግድ, ግብርና', description: 'የፀሐይ ብርሃን ከተማ', population: '100K+', region: 'Amhara' },
  'kombolcha': { name: 'ኮምቦልቻ | Kombolcha', slogan: 'የኢንዱስትሪ ዞን እና ደረቅ ወደብ', businesses: '4,000+', workers: '18,000+', color: 'from-gray-700 to-gray-900', icon: '🏭', product: 'ኢንዱስትሪ, ሎጂስቲክስ', description: 'የኢንዱስትሪ ዞን እና ደረቅ ወደብ', population: '120K+', region: 'Amhara' },
  'sekota': { name: 'ሰቆጣ | Sekota', slogan: 'የዋግ ሽራ ዞን ዋና ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የዋግ ሽራ ዞን ዋና ከተማ', population: '40K+', region: 'Amhara' },
  'aykal': { name: 'አይከል | Aykal', slogan: 'የምዕራብ ጎጃም ከተማ', businesses: '3,000+', workers: '10,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የምዕራብ ጎጃም ከተማ', population: '35K+', region: 'Amhara' },
  'metema': { name: 'ሜተማ | Metema', slogan: 'የኢትዮ-ሱዳን ድንበር ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🛣️', product: 'ንግድ, ድንበር', description: 'የኢትዮ-ሱዳን ድንበር ከተማ', population: '50K+', region: 'Amhara' },
  'debre-tabor': { name: 'ደብረ ታቦር | Debre Tabor', slogan: 'የጥንታዊ ገዳማት ከተማ', businesses: '4,000+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '⛪', product: 'ቱሪዝም, ግብርና', description: 'የጥንታዊ ገዳማት ከተማ', population: '70K+', region: 'Amhara' },
  'bati': { name: 'ባቲ | Bati', slogan: 'የንግድ እና የእርሻ ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የንግድ እና የእርሻ ከተማ', population: '50K+', region: 'Amhara' },
  'kemise': { name: 'ቀሚሴ | Kemise', slogan: 'የንግድ እና የእርሻ ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የንግድ እና የእርሻ ከተማ', population: '45K+', region: 'Amhara' },
  'injibara': { name: 'እንጅባራ | Injibara', slogan: 'የአዊ ዞን ዋና ከተማ', businesses: '3,000+', workers: '10,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የአዊ ዞን ዋና ከተማ', population: '40K+', region: 'Amhara' },
  'lalibela': { name: 'ላሊበላ | Lalibela', slogan: 'የዩኔስኮ ቅርስ ከተማ', businesses: '3,000+', workers: '10,000+', color: 'from-gray-700 to-gray-900', icon: '⛪', product: 'ቱሪዝም, ባህል', description: 'የዩኔስኮ ቅርስ ከተማ', population: '30K+', region: 'Amhara' },
  
  // ===================== OROMIA REGION =====================
  'adama': { name: 'አዳማ | Adama', slogan: 'የመኪና እና የኢንዱስትሪ ከተማ', businesses: '20,000+', workers: '80,000+', color: 'from-gray-700 to-gray-900', icon: '🏭', product: 'የመኪና መሰብሰቢያ, ጨርቃጨርቅ', description: 'የኢንዱስትሪ ከተማ', population: '500K+', region: 'Oromia' },
  'jimma': { name: 'ጅማ | Jimma', slogan: 'የቡና እና የንግድ ከተማ', businesses: '8,000+', workers: '30,000+', color: 'from-gray-700 to-gray-900', icon: '☕', product: 'ቡና, ማር', description: 'የቡና ከተማ', population: '250K+', region: 'Oromia' },
  'bishoftu': { name: 'ቢሾፍቱ | Bishoftu', slogan: 'የሀይቆች እና የአየር ሃይል ከተማ', businesses: '12,000+', workers: '45,000+', color: 'from-gray-700 to-gray-900', icon: '✈️', product: 'ቱሪዝም, አቪዬሽን', description: 'የሀይቆች ከተማ', population: '150K+', region: 'Oromia' },
  'asella': { name: 'አሰላ | Asella', slogan: 'የአርሲ ዋና ከተማ እና የእርሻ ማዕከል', businesses: '8,000+', workers: '30,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'እህል, ግብርና', description: 'የአርሲ ዋና ከተማ', population: '130K+', region: 'Oromia' },
  'shashemene': { name: 'ሻሸመኔ | Shashemene', slogan: 'የንግድ እና የኢንዱስትሪ ከተማ', businesses: '6,000+', workers: '25,000+', color: 'from-gray-700 to-gray-900', icon: '🛍️', product: 'ንግድ, ኢንዱስትሪ', description: 'የንግድ እና የኢንዱስትሪ ከተማ', population: '150K+', region: 'Oromia' },
  'robe': { name: 'ሮቤ | Robe', slogan: 'የባሌ ተራራ በር | የቱሪዝም ማዕከል', businesses: '5,000+', workers: '20,000+', color: 'from-gray-700 to-gray-900', icon: '🌄', product: 'ቱሪዝም, ግብርና', description: 'የባሌ ተራራ በር', population: '80K+', region: 'Oromia' },
  'ginir': { name: 'ጊኒር | Ginir', slogan: 'የባሌ ምስራቅ የንግድ ማዕከል', businesses: '4,000+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '🏞️', product: 'ንግድ, ግብርና', description: 'የባሌ ምስራቅ የንግድ ማዕከል', population: '60K+', region: 'Oromia' },
  'yabelo': { name: 'ያቤሎ | Yabelo', slogan: 'የእንስሳት እርባታ እና የንግድ ከተማ', businesses: '4,000+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '🐪', product: 'እንስሳት, ንግድ', description: 'የእንስሳት እርባታ ከተማ', population: '50K+', region: 'Oromia' },
  'moyale': { name: 'ሞያሌ | Moyale', slogan: 'የኢትዮ-ኬንያ ድንበር ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🛣️', product: 'ንግድ, ድንበር', description: 'የኢትዮ-ኬንያ ድንበር ከተማ', population: '40K+', region: 'Oromia' },
  'chiro': { name: 'ቺሮ | Chiro', slogan: 'የምስራቅ ሀረርጌ ዋና ከተማ', businesses: '5,000+', workers: '20,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የምስራቅ ሀረርጌ ዋና ከተማ', population: '80K+', region: 'Oromia' },
  'fiche': { name: 'ፊጬ | Fiche', slogan: 'የሰሜን ሸዋ የእህል ማዕከል', businesses: '5,000+', workers: '18,000+', color: 'from-gray-700 to-gray-900', icon: '🌾', product: 'እህል, ግብርና', description: 'የሰሜን ሸዋ የእህል ማዕከል', population: '70K+', region: 'Oromia' },
  'woliso': { name: 'ወሊሶ | Woliso', slogan: 'የሙቀት ምንጭ እና የቱሪዝም ከተማ', businesses: '4,000+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '💧', product: 'ቱሪዝም, ሙቀት ምንጭ', description: 'የሙቀት ምንጭ ከተማ', population: '50K+', region: 'Oromia' },
  'ambo': { name: 'አምቦ | Ambo', slogan: 'የማዕድን ውሃ እና የግብርና ከተማ', businesses: '4,000+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '💧', product: 'ማዕድን ውሃ, ግብርና', description: 'የማዕድን ውሃ ከተማ', population: '100K+', region: 'Oromia' },
  'nekemte': { name: 'ነቀምቴ | Nekemte', slogan: 'የቡና እና የንግድ ከተማ', businesses: '6,000+', workers: '25,000+', color: 'from-gray-700 to-gray-900', icon: '☕', product: 'ቡና, ንግድ', description: 'የቡና እና የንግድ ከተማ', population: '150K+', region: 'Oromia' },
  'gimbi': { name: 'ጊምቢ | Gimbi', slogan: 'የምዕራብ ወለጋ የንግድ ማዕከል', businesses: '4,000+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የምዕራብ ወለጋ የንግድ ማዕከል', population: '60K+', region: 'Oromia' },
  'dembi-dollo': { name: 'ደምቢ ዶሎ | Dembi Dollo', slogan: 'የወርቅ ማዕድን እና የንግድ ከተማ', businesses: '4,000+', workers: '18,000+', color: 'from-gray-700 to-gray-900', icon: '💰', product: 'ወርቅ, ንግድ', description: 'የወርቅ ማዕድን ከተማ', population: '50K+', region: 'Oromia' },
  'shambu': { name: 'ሻምቡ | Shambu', slogan: 'የሆሮ ጉዱሩ ዋና ከተማ', businesses: '4,000+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '🌾', product: 'ንግድ, ግብርና', description: 'የሆሮ ጉዱሩ ዋና ከተማ', population: '50K+', region: 'Oromia' },
  'metu': { name: 'መቱ | Metu', slogan: 'የቡና እና የግብርና ከተማ', businesses: '2,500+', workers: '10,000+', color: 'from-gray-700 to-gray-900', icon: '🌿', product: 'ቡና, ግብርና', description: 'የቡና እና የግብርና ከተማ', population: '60K+', region: 'Oromia' },
  'bedele': { name: 'በደሌ | Bedele', slogan: 'የቢራ ፋብሪካ እና የቡና ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🍺', product: 'ቢራ, ቡና', description: 'የቢራ ፋብሪካ ከተማ', population: '40K+', region: 'Oromia' },
  'bule-hora': { name: 'ቡሌ ሆራ | Bule Hora', slogan: 'የቡሌ ሆራ ዩኒቨርሲቲ ከተማ', businesses: '4,000+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '🎓', product: 'ትምህርት, ንግድ', description: 'የቡሌ ሆራ ዩኒቨርሲቲ ከተማ', population: '70K+', region: 'Oromia' },
  'negele-borana': { name: 'ነገሌ ቦረና | Negele Borana', slogan: 'የቦረና የእንስሳት እርባታ ማዕከል', businesses: '4,000+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '🐪', product: 'እንስሳት, ንግድ', description: 'የቦረና የእንስሳት እርባታ ማዕከል', population: '60K+', region: 'Oromia' },
  'ziway': { name: 'ዚዋይ | Ziway', slogan: 'የአሳ ማጥመድ እና የቱሪዝም ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🐟', product: 'አሳ, ቱሪዝም', description: 'የአሳ ማጥመድ ከተማ', population: '80K+', region: 'Oromia' },
  'mojo': { name: 'ሞጆ | Mojo', slogan: 'የሎጂስቲክስ እና የኢንዱስትሪ ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🚛', product: 'ሎጂስቲክስ, ኢንዱስትሪ', description: 'የሎጂስቲክስ እና የኢንዱስትሪ ከተማ', population: '50K+', region: 'Oromia' },
  'dodola': { name: 'ዶዶላ | Dodola', slogan: 'የባሌ ተራራ መግቢያ', businesses: '2,500+', workers: '10,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ቱሪዝም, ግብርና', description: 'የባሌ ተራራ መግቢያ', population: '30K+', region: 'Oromia' },
  'gera': { name: 'ጌራ | Gera', slogan: 'የቡና ማምረቻ አካባቢ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '☕', product: 'ቡና', description: 'የቡና ማምረቻ አካባቢ', population: '25K+', region: 'Oromia' },
  'agaro': { name: 'አጋሮ | Agaro', slogan: 'የቡና እና የንግድ ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '☕', product: 'ቡና, ንግድ', description: 'የቡና እና የንግድ ከተማ', population: '40K+', region: 'Oromia' },
  'lemu': { name: 'ለሙ | Lemu', slogan: 'የእህል እርሻ አካባቢ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🌾', product: 'እህል', description: 'የእህል እርሻ አካባቢ', population: '20K+', region: 'Oromia' },
  'hagere-mariam': { name: 'ሀገረ ማርያም | Hagere Mariam', slogan: 'የደቡብ ኢትዮጵያ ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የደቡብ ኢትዮጵያ ከተማ', population: '40K+', region: 'Oromia' },
  'shakiso': { name: 'ሻኪሶ | Shakiso', slogan: 'የወርቅ ማዕድን ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '💰', product: 'ወርቅ', description: 'የወርቅ ማዕድን ከተማ', population: '35K+', region: 'Oromia' },
  'kibre-mengist': { name: 'ቅብረ መንግስት | Kibre Mengist', slogan: 'የደቡብ ኢትዮጵያ ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የደቡብ ኢትዮጵያ ከተማ', population: '45K+', region: 'Oromia' },
  'wachile': { name: 'ዋቺሌ | Wachile', slogan: 'የእንስሳት እርባታ አካባቢ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🐪', product: 'እንስሳት', description: 'የእንስሳት እርባታ አካባቢ', population: '20K+', region: 'Oromia' },
  'goba': { name: 'ጎባ | Goba', slogan: 'የባሌ ተራራ መግቢያ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ቱሪዝም, ግብርና', description: 'የባሌ ተራራ መግቢያ', population: '35K+', region: 'Oromia' },
  'sinana': { name: 'ሲናና | Sinana', slogan: 'የእህል እርሻ አካባቢ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🌾', product: 'እህል', description: 'የእህል እርሻ አካባቢ', population: '25K+', region: 'Oromia' },
  'dinsho': { name: 'ዲንሾ | Dinsho', slogan: 'የባሌ ተራራ ብሔራዊ ፓርክ መግቢያ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🏞️', product: 'ቱሪዝም', description: 'የባሌ ተራራ ብሔራዊ ፓርክ መግቢያ', population: '20K+', region: 'Oromia' },
  
  // ===================== SOMALI REGION =====================
  'jijiga': { name: 'ጅጅጋ | Jijiga', slogan: 'የንግድ እና የእንስሳት ከተማ', businesses: '6,000+', workers: '20,000+', color: 'from-gray-700 to-gray-900', icon: '🐪', product: 'ንግድ, እንስሳት', description: 'የሶማሌ ክልል ዋና ከተማ', population: '200K+', region: 'Somali' },
  'degehabur': { name: 'ደገሃቡር | Degehabur', slogan: 'የሶማሌ ክልል ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, እንስሳት', description: 'የሶማሌ ክልል ከተማ', population: '60K+', region: 'Somali' },
  'kebri-dehar': { name: 'ቀብሪ ደሃር | Kebri Dehar', slogan: 'የሶማሌ ክልል የንግድ ማዕከል', businesses: '4,000+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, እንስሳት', description: 'የሶማሌ ክልል የንግድ ማዕከል', population: '80K+', region: 'Somali' },
  'gode': { name: 'ጎዴ | Gode', slogan: 'የሶማሌ ክልል ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, እንስሳት', description: 'የሶማሌ ክልል ከተማ', population: '50K+', region: 'Somali' },
  'warder': { name: 'ዋርደር | Warder', slogan: 'የሶማሌ ክልል ከተማ', businesses: '2,500+', workers: '10,000+', color: 'from-gray-700 to-gray-900', icon: '🐪', product: 'ንግድ, እንስሳት', description: 'የሶማሌ ክልል ከተማ', population: '40K+', region: 'Somali' },
  'shilabo': { name: 'ሺላቦ | Shilabo', slogan: 'የሶማሌ ክልል ከተማ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, እንስሳት', description: 'የሶማሌ ክልል ከተማ', population: '30K+', region: 'Somali' },
  'kelafo': { name: 'ከላፎ | Kelafo', slogan: 'የሶማሌ ክልል ከተማ', businesses: '2,500+', workers: '10,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, እንስሳት', description: 'የሶማሌ ክልል ከተማ', population: '45K+', region: 'Somali' },
  'mustahil': { name: 'ሙስታሂል | Mustahil', slogan: 'የሶማሌ ክልል ከተማ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, እንስሳት', description: 'የሶማሌ ክልል ከተማ', population: '25K+', region: 'Somali' },
  'ferfer': { name: 'ፌርፌር | Ferfer', slogan: 'የኢትዮ-ሶማሊያ ድንበር ከተማ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🛣️', product: 'ንግድ, ድንበር', description: 'የኢትዮ-ሶማሊያ ድንበር ከተማ', population: '30K+', region: 'Somali' },
  
  // ===================== HARARI REGION =====================
  'harar': { name: 'ሀረር | Harar', slogan: 'የባህል ቅርስ እና የእስላም ቅድስት ከተማ', businesses: '5,000+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '🏛️', product: 'ቱሪዝም, ባህል', description: 'የባህል ቅርስ ከተማ', population: '150K+', region: 'Harari' },
  
  // ===================== SIDAMA REGION =====================
  'hawassa': { name: 'ሀዋሳ | Hawassa', slogan: 'የኢንዱስትሪ ፓርክ እና የሀይቅ ከተማ', businesses: '12,000+', workers: '50,000+', color: 'from-gray-700 to-gray-900', icon: '🏞️', product: 'ጨርቃጨርቅ, አሳ', description: 'የሲዳማ ክልል ዋና ከተማ', population: '387K+', region: 'Sidama' },
  'yirgalem': { name: 'ይርጋለም | Yirgalem', slogan: 'የቡና እና የግብርና ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '☕', product: 'ቡና, ግብርና', description: 'የቡና እና የግብርና ከተማ', population: '40K+', region: 'Sidama' },
  
  // ===================== SOUTH ETHIOPIA REGION =====================
  'arba-minch': { name: 'አርባ ምንጭ | Arba Minch', slogan: 'የቱሪዝም እና የግብርና ከተማ', businesses: '5,000+', workers: '20,000+', color: 'from-gray-700 to-gray-900', icon: '🏞️', product: 'ቱሪዝም, ግብርና', description: 'የአርባ ምንጭ ዩኒቨርሲቲ ከተማ', population: '150K+', region: 'South' },
  'sodo': { name: 'ሶዶ | Sodo', slogan: 'የንግድ እና የግብርና ከተማ', businesses: '5,000+', workers: '18,000+', color: 'from-gray-700 to-gray-900', icon: '🛍️', product: 'ንግድ, ግብርና', description: 'የወላይታ ዞን ዋና ከተማ', population: '150K+', region: 'South' },
  'dilla': { name: 'ዲላ | Dilla', slogan: 'የቡና እና የንግድ ከተማ', businesses: '6,000+', workers: '22,000+', color: 'from-gray-700 to-gray-900', icon: '☕', product: 'ቡና, ግብርና', description: 'የጌዴኦ ዞን ዋና ከተማ', population: '100K+', region: 'South' },
  'sawla': { name: 'ሳውላ | Sawla', slogan: 'የደቡብ ኢትዮጵያ ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የደቡብ ኢትዮጵያ ከተማ', population: '50K+', region: 'South' },
  'jinka': { name: 'ጂንካ | Jinka', slogan: 'የደቡብ ኢትዮጵያ ባህላዊ ከተማ', businesses: '4,000+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ቱሪዝም, ባህል', description: 'የደቡብ ኢትዮጵያ ባህላዊ ከተማ', population: '70K+', region: 'South' },
  'konso': { name: 'ኮንሶ | Konso', slogan: 'የዩኔስኮ ቅርስ ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ቱሪዝም, ግብርና', description: 'የዩኔስኮ ቅርስ ከተማ', population: '60K+', region: 'South' },
  'karat': { name: 'ካራት | Karat', slogan: 'የኮንሶ ዞን ዋና ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የኮንሶ ዞን ዋና ከተማ', population: '50K+', region: 'South' },
  'bonga': { name: 'ቦንጋ | Bonga', slogan: 'የቡና ማምረቻ አካባቢ', businesses: '2,500+', workers: '10,000+', color: 'from-gray-700 to-gray-900', icon: '☕', product: 'ቡና', description: 'የቡና ማምረቻ አካባቢ', population: '30K+', region: 'South' },
  'mizan-teferi': { name: 'ሚዛን ተፈሪ | Mizan Teferi', slogan: 'የቤንች ማጂ ዞን ዋና ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የቤንች ማጂ ዞን ዋና ከተማ', population: '45K+', region: 'South' },
  'teppi': { name: 'ቴፒ | Teppi', slogan: 'የቡና እርሻ አካባቢ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🌿', product: 'ቡና', description: 'የቡና እርሻ አካባቢ', population: '25K+', region: 'South' },
  'gereb': { name: 'ገሬብ | Gereb', slogan: 'የደቡብ ኢትዮጵያ ከተማ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የደቡብ ኢትዮጵያ ከተማ', population: '20K+', region: 'South' },
  'key-afar': { name: 'ቀይ አፋር | Key Afar', slogan: 'የደቡብ ኢትዮጵያ ከተማ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የደቡብ ኢትዮጵያ ከተማ', population: '25K+', region: 'South' },
  'bako': { name: 'ባኮ | Bako', slogan: 'የደቡብ ኢትዮጵያ ከተማ', businesses: '2,500+', workers: '10,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የደቡብ ኢትዮጵያ ከተማ', population: '30K+', region: 'South' },
  'welkite': { name: 'ወልቂጤ | Welkite', slogan: 'የጉራጌ ዞን ዋና ከተማ', businesses: '4,000+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የጉራጌ ዞን ዋና ከተማ', population: '50K+', region: 'South' },
  
  // ===================== BENISHANGUL-GUMUZ REGION =====================
  'assosa': { name: 'አሶሳ | Assosa', slogan: 'የንግድ እና የግብርና ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🌿', product: 'ንግድ, ግብርና', description: 'የቤንሻንጉል ክልል ዋና ከተማ', population: '100K+', region: 'Benishangul' },
  'gilgel-beles': { name: 'ግልገል በለስ | Gilgel Beles', slogan: 'የግልገል በለስ ከተማ', businesses: '2,500+', workers: '10,000+', color: 'from-gray-700 to-gray-900', icon: '💧', product: 'ንግድ, ግብርና', description: 'የግልገል በለስ ከተማ', population: '40K+', region: 'Benishangul' },
  'kamashi': { name: 'ካማሺ | Kamashi', slogan: 'የካማሺ ዞን ዋና ከተማ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የካማሺ ዞን ዋና ከተማ', population: '30K+', region: 'Benishangul' },
  'metekel': { name: 'ሜተከል | Metekel', slogan: 'የሜተከል ዞን ዋና ከተማ', businesses: '2,500+', workers: '10,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የሜተከል ዞን ዋና ከተማ', population: '35K+', region: 'Benishangul' },
  'dibate': { name: 'ዲባቴ | Dibate', slogan: 'የቤንሻንጉል ክልል ከተማ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የቤንሻንጉል ክልል ከተማ', population: '25K+', region: 'Benishangul' },
  
  // ===================== GAMBELLA REGION =====================
  'gambella': { name: 'ጋምቤላ | Gambella', slogan: 'የጋምቤላ ክልል ዋና ከተማ', businesses: '3,500+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '🏞️', product: 'ንግድ, ግብርና', description: 'የጋምቤላ ክልል ዋና ከተማ', population: '80K+', region: 'Gambella' },
  'meti': { name: 'ሜቲ | Meti', slogan: 'የጋምቤላ ክልል ከተማ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የጋምቤላ ክልል ከተማ', population: '30K+', region: 'Gambella' },
  'fugnido': { name: 'ፉኝዶ | Fugnido', slogan: 'የስደተኞች ከተማ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🏞️', product: 'ንግድ, አገልግሎት', description: 'የስደተኞች ከተማ', population: '40K+', region: 'Gambella' },
  'itur': { name: 'ኢቱር | Itur', slogan: 'የጋምቤላ ክልል ከተማ', businesses: '1,500+', workers: '6,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የጋምቤላ ክልል ከተማ', population: '20K+', region: 'Gambella' },
  
  // ===================== AFAR REGION =====================
  'semera': { name: 'ሰሜራ | Semera', slogan: 'የአፋር ክልል ዋና ከተማ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🐪', product: 'ንግድ, እንስሳት', description: 'የአፋር ክልል ዋና ከተማ', population: '50K+', region: 'Afar' },
  'asaita': { name: 'አሳይታ | Asaita', slogan: 'የአፋር ክልል ታሪካዊ ከተማ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, እንስሳት', description: 'የአፋር ክልል ታሪካዊ ከተማ', population: '30K+', region: 'Afar' },
  'logiya': { name: 'ሎጊያ | Logiya', slogan: 'የአፋር ክልል ከተማ', businesses: '2,000+', workers: '7,000+', color: 'from-gray-700 to-gray-900', icon: '🛣️', product: 'ንግድ, እንስሳት', description: 'የአፋር ክልል ከተማ', population: '25K+', region: 'Afar' },
  'abila': { name: 'አቢላ | Abila', slogan: 'የአፋር ክልል ከተማ', businesses: '1,500+', workers: '6,000+', color: 'from-gray-700 to-gray-900', icon: '🐪', product: 'ንግድ, እንስሳት', description: 'የአፋር ክልል ከተማ', population: '20K+', region: 'Afar' },
  'dubti': { name: 'ዱብቲ | Dubti', slogan: 'የአፋር ክልል ከተማ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, እንስሳት', description: 'የአፋር ክልል ከተማ', population: '35K+', region: 'Afar' },
  'elidar': { name: 'ኤልዳር | Elidar', slogan: 'የአፋር ክልል ከተማ', businesses: '1,500+', workers: '6,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, እንስሳት', description: 'የአፋር ክልል ከተማ', population: '25K+', region: 'Afar' },
  'chifra': { name: 'ቺፍራ | Chifra', slogan: 'የአፋር ክልል ከተማ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, እንስሳት', description: 'የአፋር ክልል ከተማ', population: '30K+', region: 'Afar' }
};

// ✅ FUNCTION TO ADD UNLISTED CITY
export function addUnlistedCity(cityId, cityDataObj) {
  if (cityData[cityId]) {
    console.warn(`City "${cityId}" already exists. Use updateCityData to modify.`);
    return false;
  }
  cityData[cityId] = cityDataObj;
  return true;
}

// ✅ FUNCTION TO UPDATE EXISTING CITY
export function updateCityData(cityId, updates) {
  if (!cityData[cityId]) {
    console.warn(`City "${cityId}" does not exist. Use addUnlistedCity to create.`);
    return false;
  }
  cityData[cityId] = { ...cityData[cityId], ...updates };
  return true;
}

const cityList = Object.keys(cityData).map(key => ({
  id: key,
  name: cityData[key].name.split('|')[0].trim(),
  nameEn: cityData[key].name.split('|')[1]?.trim() || key,
  icon: cityData[key].icon
}));

export default function CityVip() {
  const router = useRouter();
  const { cityId } = router.query;
  const [language, setLanguage] = useState('am');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTiers, setShowTiers] = useState(true);
  const [showSeats, setShowSeats] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [participantId, setParticipantId] = useState(null);
  const [participantData, setParticipantData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cityInfo, setCityInfo] = useState(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showAgentApplication, setShowAgentApplication] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
    if (cityId) {
      const data = cityData[cityId];
      if (data) {
        setCityInfo(data);
      } else {
        // Handle unlisted city - use the ID as the name
        const formattedName = cityId.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        setCityInfo({ 
          name: formattedName + ' | ' + formattedName,
          slogan: 'አንድ ብሔር አንድ እድል | One Nation, One Opportunity',
          businesses: 'N/A',
          workers: 'N/A',
          color: 'from-gray-700 to-gray-900',
          icon: '🏙️',
          product: 'ንግድ እና አገልግሎት | Trade & Services',
          description: 'አዲስ ከተማ | New City',
          population: 'N/A',
          region: 'Ethiopia'
        });
      }
    }
    checkUser();
  }, [cityId]);

  const toggleLanguage = () => {
    const newLang = language === 'am' ? 'en' : 'am';
    setLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  const checkUser = async () => {
    setCheckingUser(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      const { tier } = router.query;
      if (user && tier && CITY_VIP_TIERS[tier]) {
        setSelectedTierId(tier);
        setSelectedTier(CITY_VIP_TIERS[tier]);
        setShowTiers(false);
        setShowSeats(true);
        router.replace(`/cities/${cityId}`, undefined, { shallow: true });
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setCheckingUser(false);
    }
  };

  const handleTierSelect = (tierId) => {
    if (!user) {
      const redirectUrl = `/cities/${cityId}?tier=${tierId}`;
      localStorage.setItem('abbaa_redirect_after_login', redirectUrl);
      sessionStorage.setItem('redirectAfterLogin', redirectUrl);
      toast.loading(language === 'am' ? 'እባክዎ ወደ ስርዓት ይግቡ...' : 'Please login...');
      router.push('/login');
      return;
    }
    setSelectedTierId(tierId);
    setSelectedTier(CITY_VIP_TIERS[tierId]);
    setShowTiers(false);
    setShowSeats(true);
  };

  const handleSeatsSelected = async ({ seats, totalAmount, seatCount, tier }) => {
    const tierConfig = CITY_VIP_TIERS[tier];
    setLoading(true);
    
    try {
      const ticketNumber = `CT-${tier.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      const { data: participant, error } = await supabase
        .from('city_vip_participants')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          city: cityInfo?.name?.split('|')[0] || cityId || 'Unknown City',
          tier: tier,
          pool_type: tier,
          seat_numbers: seats,
          contribution_amount: totalAmount,
          prize_amount: tierConfig.prize,
          payment_status: 'pending',
          ticket_number: ticketNumber,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setParticipantId(participant.id);
      setSelectedSeats(seats);
      setShowSeats(false);
      setShowPayment(true);
      
      toast.success(language === 'am' ? 'መቀመጫዎች ተይዘዋል! እባክዎ ክፍያ ይፈጽሙ' : 'Seats reserved! Please complete payment.');
      
    } catch (error) {
      console.error('Error:', error);
      toast.error(language === 'am' ? 'መቀመጫዎችን ማስያዝ አልተቻለም' : 'Failed to reserve seats');
    } finally {
      setLoading(false);
    }
  };

  const compressImage = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        const maxSize = 1024;
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.7);
      };
    };
  });

  const handlePaymentSubmit = async () => {
    if (!selectedFile) {
      toast.error(language === 'am' ? 'እባክዎ የክፍያ ማስረጃ ይስቀሉ' : 'Please upload payment screenshot');
      return;
    }
    
    setIsSubmitting(true);
    const loadingToast = toast.loading(language === 'am' ? 'የክፍያ ማስረጃ በላይናላይ ላይ እየተሰቀለ ነው...' : 'Uploading payment screenshot...');
    
    try {
      const compressedFile = await compressImage(selectedFile);
      const fileName = `city-payments/${participantId}/${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, compressedFile);
      
      if (uploadError) throw new Error('Upload failed: ' + uploadError.message);
      
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);
      
      const { error: updateError } = await supabase
        .from('city_vip_participants')
        .update({
          payment_status: 'pending_verification',
          payment_proof_url: publicUrl,
          payment_submitted_at: new Date().toISOString()
        })
        .eq('id', participantId);
      
      if (updateError) throw updateError;
      
      const { data: updatedParticipant } = await supabase
        .from('city_vip_participants')
        .select('*')
        .eq('id', participantId)
        .single();
      
      setParticipantData(updatedParticipant);
      setShowPayment(false);
      setShowTicket(true);
      
      toast.success(language === 'am' ? 'ክፍያ ተልኳል! ያልተረጋገጠ ቲኬትዎ ዝግጁ ነው' : 'Payment submitted! Your unverified ticket is ready', { id: loadingToast });
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || (language === 'am' ? 'ክፍያ መላክ አልተቻለም' : 'Failed to submit payment'), { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSeats = () => {
    setShowSeats(false);
    setShowTiers(true);
  };

  const handleClosePayment = () => {
    setShowPayment(false);
    setShowSeats(true);
  };

  const handleCloseTicket = () => {
    setShowTicket(false);
    router.push('/dashboard');
  };

  const renderTierSelection = () => {
    const tierIds = ['silver', 'gold', 'platinum', 'diamond', 'royal'];
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-w-7xl mx-auto">
        {tierIds.map((tierId) => {
          const tier = CITY_VIP_TIERS[tierId];
          if (!tier) return null;
          
          return (
            <div
              key={tierId}
              className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition hover:scale-105 cursor-pointer border-2 hover:border-green-500"
              onClick={() => handleTierSelect(tierId)}
            >
              <div className={'bg-gradient-to-r ' + tier.color + ' p-4 text-white text-center'}>
                <div className="text-4xl mb-2">{tier.icon}</div>
                <h3 className="font-bold text-xl">
                  {language === 'am' ? tier.labelAm : tier.labelEn}
                </h3>
                <span className="text-xs opacity-80">
                  {getDrawScheduleText(tierId, language)}
                </span>
              </div>
              
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{language === 'am' ? 'ክፍያ' : 'Entry'}</span>
                  <span className="font-semibold">ETB {tier.contribution.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{language === 'am' ? 'ሽልማት' : 'Prize'}</span>
                  <span className="font-bold text-green-600">ETB {tier.prize.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{language === 'am' ? 'መቀመጫዎች' : 'Seats'}</span>
                  <span className="font-semibold">{tier.seats.toLocaleString()}</span>
                </div>
                {/* ❌ Commission NOT displayed to public */}
                
                <button 
                  className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold text-sm transition"
                  onClick={(e) => { e.stopPropagation(); handleTierSelect(tierId); }}
                >
                  {language === 'am' ? 'መቀመጫ ምረጥ' : 'Select Seats'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!cityInfo || checkingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">{language === 'am' ? 'ከተማ በመጫን ላይ...' : 'Loading city...'}</p>
        </div>
      </div>
    );
  }

  return (
    <NoSSR>
      <>
        <Head>
          <title>{cityInfo.name.split('|')[0]} VIP - Win up to 5M ETB | Abbaa Carraa</title>
        </Head>

        <nav className="sticky top-0 z-50 bg-gray-900 shadow-lg border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl">🎫</span>
                <span className="font-bold text-white text-lg">Abbaa Carraa</span>
              </Link>
              <div className="flex items-center gap-3">
                <button onClick={toggleLanguage} className="bg-gray-700 text-white px-3 py-1 rounded-lg text-xs">
                  {language === 'am' ? '🇬🇧 English' : '🇪🇹 አማርኛ'}
                </button>
                <TopCitySelector />
              </div>
            </div>
          </div>
        </nav>

        <div className="min-h-screen bg-gray-100">
          <div className="container mx-auto px-4 pt-4 flex justify-end md:hidden">
            <button onClick={toggleLanguage} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">
              {language === 'am' ? '🇬🇧 English' : '🇪🇹 አማርኛ'}
            </button>
          </div>

          <div className="container mx-auto px-4 pt-4">
            <div className="relative">
              <button onClick={() => setShowCityDropdown(!showCityDropdown)} className="w-full md:w-auto bg-white border rounded-xl px-5 py-3 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cityInfo.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">{cityInfo.name.split('|')[0]}</div>
                    <div className="text-xs text-gray-500">{cityInfo.name.split('|')[1]}</div>
                  </div>
                </div>
                <svg className={'w-5 h-5 text-gray-400 transition-transform ' + (showCityDropdown ? 'rotate-180' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCityDropdown && (
                <div className="absolute top-full left-0 mt-2 w-full md:w-96 bg-white rounded-2xl shadow-2xl border z-50 max-h-96 overflow-y-auto">
                  <div className="sticky top-0 bg-white p-3 border-b">
                    <input type="text" id="citySearch" placeholder={language === 'am' ? 'ከተማ ፈልግ...' : 'Search city...'} className="w-full border rounded-lg px-4 py-2" onKeyUp={(e) => { var term = e.target.value.toLowerCase(); var items = document.querySelectorAll('.city-item'); for (var i = 0; i < items.length; i++) { var el = items[i]; el.style.display = el.textContent.toLowerCase().indexOf(term) > -1 ? 'flex' : 'none'; } }} />
                  </div>
                  {cityList.map(function(c) {
                    return (
                      <a key={c.id} href={'/cities/' + c.id} className={'city-item flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b cursor-pointer ' + (cityId === c.id ? 'bg-gray-100' : '')}>
                        <span className="text-2xl">{c.icon}</span>
                        <div>
                          <div className="font-medium text-gray-800">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.nameEn}</div>
                        </div>
                        {cityId === c.id && <span className="ml-auto text-green-600 text-sm">✓</span>}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-12 text-center mt-4 mx-4 rounded-2xl">
            <div className="text-6xl mb-3">{cityInfo.icon}</div>
            <h1 className="text-3xl md:text-4xl font-bold">{cityInfo.name.split('|')[0]} VIP</h1>
            <div className="text-emerald-300 font-bold text-lg mt-2">
              {language === 'am' 
                ? '✨ ዛሬ የከተማችንን ተሳታፊ ሚሊየነር እናድርገው! ✨'
                : '✨ Let\'s make our city participant a millionaire today! ✨'}
            </div>
            <p className="text-gray-200 mt-2">
              {language === 'am' ? 'እስከ 5 ሚሊዮን ብር ለማሸነፍ መቀመጫዎን ይምረጡ' : 'Select your seat to win up to 5 Million ETB'}
            </p>
          </div>

          {showTiers && (
            <div className="container mx-auto px-4 py-8">
              <h2 className="text-2xl font-bold text-center mb-6">
                {language === 'am' ? 'የእርስዎን ደረጃ ይምረጡ' : 'Select Your Tier'}
              </h2>
              <p className="text-center text-gray-500 mb-8">
                {language === 'am' 
                  ? 'በጀትዎ እና በሚፈልጉት ሽልማት ላይ በመመስረት ይምረጡ' 
                  : 'Choose based on your budget and desired prize'}
              </p>
              {renderTierSelection()}
            </div>
          )}

          {showSeats && selectedTier && (
            <SeatSelector
              isOpen={showSeats}
              onClose={handleCloseSeats}
              onCancel={handleCloseSeats}
              programType="city"
              city={cityInfo?.name?.split('|')[0] || cityId || 'Unknown City'}
              tierId={selectedTierId}
              entryFee={selectedTier.contribution}
              totalSeats={selectedTier.seats}
              maxSeats={5}
              language={language}
              onSeatsSelected={handleSeatsSelected}
              poolInfo={{ prize: selectedTier.prize }}
            />
          )}

          {showPayment && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
                  <h2 className="text-xl font-bold">{language === 'am' ? 'ክፍያ ያጠናቅቁ' : 'Complete Payment'}</h2>
                  <button onClick={handleClosePayment} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                <div className="p-6">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
                    <p className="text-sm text-gray-600">{language === 'am' ? 'የተመረጡ መቀመጫዎች' : 'Selected Seats'}</p>
                    <p className="font-bold">{selectedSeats.join(', ')}</p>
                    <p className="text-xl font-bold text-green-600 mt-2">
                      ETB {(selectedSeats.length * selectedTier.contribution).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {selectedSeats.length} {language === 'am' ? 'መቀመጫ ×' : 'seats ×'} ETB {selectedTier.contribution.toLocaleString()}
                    </p>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{language === 'am' ? 'ክፍያ ወደዚህ ይላኩ:' : 'Send payment to:'}</p>
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <p className="font-semibold">📱 TeleBirr: 0913277922</p>
                    <p className="font-semibold mt-2">🏦 CBE Bank: 1000601091686</p>
                    <p className="text-sm text-gray-600 mt-2">{language === 'am' ? 'የሂሳብ ባለቤት:' : 'Account:'} Negassa Hundessa</p>
                  </div>
                  
                  <div className="border-2 border-dashed rounded-lg p-4 text-center mb-4 hover:border-green-500 transition">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      id="paymentFile" 
                      onChange={(e) => {
                        var file = e.target.files[0];
                        if (file) { 
                          setSelectedFile(file); 
                          setPreviewUrl(URL.createObjectURL(file)); 
                        }
                      }} 
                    />
                    <label htmlFor="paymentFile" className="cursor-pointer block">
                      {previewUrl ? (
                        <div>
                          <img src={previewUrl} className="max-h-32 mx-auto mb-2 rounded" />
                          <p className="text-green-600 text-sm">✓ {language === 'am' ? 'ማስረጃ ተመርጧል' : 'Screenshot selected'}</p>
                        </div>
                      ) : (
                        <div>
                          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-500 mt-2">{language === 'am' ? 'የክፍያ ማስረጃ ለመጫን ጠቅ ያድርጉ' : 'Click to upload payment screenshot'}</p>
                          <p className="text-xs text-gray-400">JPEG, PNG (Max 5MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                  
                  <button 
                    onClick={handlePaymentSubmit} 
                    disabled={isSubmitting || !selectedFile} 
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    {isSubmitting ? 
                      (language === 'am' ? 'በሂደት ላይ...' : 'Processing...') : 
                      (language === 'am' ? 'ክፍያ አስገባ እና ቲኬት አግኝ' : 'Submit Payment & Get Ticket')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showTicket && participantData && (
            <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-md w-full">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 flex justify-between rounded-t-2xl">
                  <h3 className="text-white font-bold">
                    {language === 'am' ? 'የእርስዎ ቲኬት' : 'Your Ticket'}
                  </h3>
                  <button onClick={handleCloseTicket} className="text-white text-2xl">×</button>
                </div>
                <div className="p-6">
                  <CityTicket 
                    participant={participantData}
                    pool={selectedTier}
                    cityInfo={cityInfo}
                    type="unverified"
                    tierId={selectedTierId}
                    language={language}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="container mx-auto px-4 py-12">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">🤝</span>
                  <div>
                    <h3 className="text-2xl font-bold">
                      {language === 'am' ? 'የ' + cityInfo.name.split('|')[0] + ' ወኪል ይሁኑ' : 'Become an Agent for ' + cityInfo.name.split('|')[0]}
                    </h3>
                    <p className="text-gray-300">
                      {language === 'am' ? 'በሚያመጧቸው ደንበኞች ሁሉ 10% ኮሚሽን ያግኙ!' : 'Earn 10% commission on every successful contribution!'}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-green-600/30 rounded-full px-2 py-1">✓ Regular Pools</span>
                      <span className="text-xs bg-purple-600/30 rounded-full px-2 py-1">✓ City VIP</span>
                      <span className="text-xs bg-yellow-600/30 rounded-full px-2 py-1">✓ Merkato VIP</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowAgentApplication(true)} className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2">
                  {language === 'am' ? 'እንደ ወኪል ያመልክቱ →' : 'Apply as Agent →'}
                </button>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div><div className="text-2xl">💰</div><p className="font-semibold">{language === 'am' ? '10% ኮሚሽን' : '10% Commission'}</p></div>
                <div><div className="text-2xl">🔗</div><p className="font-semibold">{language === 'am' ? 'ማጣቀሻ ሊንክ' : 'Referral Link'}</p></div>
                <div><div className="text-2xl">💳</div><p className="font-semibold">{language === 'am' ? 'ቀላል መውጫ' : 'Easy Withdrawal'}</p></div>
              </div>
            </div>
          </div>
        </div>

        {showAgentApplication && (
          <UnifiedAgentApplication 
            onClose={() => setShowAgentApplication(false)} 
            preSelectedCity={cityInfo?.name?.split('|')[0] || cityId || 'Unknown City'} 
            preSelectedProgram="city_vip" 
          />
        )}
      </>
    </NoSSR>
  );
}
