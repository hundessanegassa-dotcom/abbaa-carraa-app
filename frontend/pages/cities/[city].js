// pages/cities/[city].js - COMPLETE WITH ALL 80+ ETHIOPIAN CITIES
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import NoSSR from '../../components/NoSSR';
import TopCitySelector from '../../components/TopCitySelector';
import UnifiedAgentApplication from '../../components/UnifiedAgentApplication';
import Ticket from '../../components/Ticket';

// Helper function for next draw dates
const getNextSunday = () => {
  const today = new Date();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + (7 - today.getDay()) % 7);
  return nextSunday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const getNextMonthEnd = () => {
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return lastDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// ============================================
// COMPLETE CITY DATA - ALL 80+ ETHIOPIAN CITIES
// ============================================
const cityData = {
  // ===================== CENTRAL & MAJOR CITIES =====================
  'addis-ababa': {
    name: 'አዲስ አበባ | Addis Ababa',
    slogan: 'የኢትዮጵያ የንግድ እና የዲፕሎማሲ ልብ',
    businesses: '50,000+',
    workers: '200,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏙️',
    product: 'ዘመናዊ አገልግሎቶች, ቴክኖሎጂ',
    description: 'የኢትዮጵያ ዋና ከተማ እና የንግድ ማዕከል',
    population: '5M+',
    region: 'Central'
  },
  'shaggar': {
    name: 'ሸገር | Shaggar City',
    slogan: 'ብልህ ከተማ እና የኢንቨስትመንት ማዕከል',
    businesses: '25,000+',
    workers: '100,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏗️',
    product: 'ቴክኖሎጂ, ዘመናዊ አገልግሎቶች',
    description: 'ብልህ ከተማ እና የኢንቨስትመንት ማዕከል',
    population: '3M+',
    region: 'Oromia'
  },
  'dire-dawa': {
    name: 'ድሬ ዳዋ | Dire Dawa',
    slogan: 'የሎጂስቲክስ እና የማኑፋክቸሪንግ በር',
    businesses: '15,000+',
    workers: '60,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🚂',
    product: 'ጨርቃጨርቅ, ሎጂስቲክስ',
    description: 'ሁለተኛዋ ትልቋ ከተማ',
    population: '535K+',
    region: 'Dire Dawa'
  },

  // ===================== TIGRAY REGION =====================
  'mekelle': {
    name: 'መቀሌ | Mekelle',
    slogan: 'የሰሜኑ የኢንዱስትሪ እና የትምህርት ማዕከል',
    businesses: '18,000+',
    workers: '70,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏭',
    product: 'ሲሚንቶ, ፋርማሲዩቲካልስ',
    description: 'የሰሜን ኢትዮጵያ የንግድ ማዕከል',
    population: '500K+',
    region: 'Tigray'
  },
  'axum': {
    name: 'አክሱም | Axum',
    slogan: 'የታላቁ የአክሱም መንግስት ዋና ከተማ',
    businesses: '5,000+',
    workers: '20,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏛️',
    product: 'ቱሪዝም, ቅርስ',
    description: 'የታሪካዊ ቅርስ ከተማ',
    population: '70K+',
    region: 'Tigray'
  },
  'adigrat': {
    name: 'አዲግራት | Adigrat',
    slogan: 'የሰሜን ትግራይ የንግድ ማዕከል',
    businesses: '4,000+',
    workers: '15,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ንግድ, ግብርና',
    description: 'የሰሜን ትግራይ የንግድ ማዕከል',
    population: '80K+',
    region: 'Tigray'
  },
  'shire': {
    name: 'ሽሬ | Shire',
    slogan: 'የምዕራብ ትግራይ ዋና ከተማ',
    businesses: '6,000+',
    workers: '25,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ንግድ, ግብርና',
    description: 'የምዕራብ ትግራይ የንግድ ማዕከል',
    population: '100K+',
    region: 'Tigray'
  },
  'mekoni': {
    name: 'መቆኒ | Mekoni',
    slogan: 'የምዕራብ ትግራይ ከተማ',
    businesses: '3,000+',
    workers: '12,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ንግድ, ግብርና',
    description: 'የምዕራብ ትግራይ ከተማ',
    population: '50K+',
    region: 'Tigray'
  },
  'maychew': {
    name: 'ማይጨው | Maychew',
    slogan: 'የደቡብ ትግራይ ከተማ',
    businesses: '3,000+',
    workers: '12,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ንግድ, ግብርና',
    description: 'የደቡብ ትግራይ ከተማ',
    population: '40K+',
    region: 'Tigray'
  },

  // ===================== AMHARA REGION =====================
  'gondar': {
    name: 'ጎንደር | Gondar',
    slogan: 'የባህል ቅርስ እና የቱሪዝም ከተማ',
    businesses: '10,000+',
    workers: '40,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏰',
    product: 'ቱሪዝም, ጨርቃጨርቅ',
    description: 'የባህል ቅርስ ከተማ',
    population: '350K+',
    region: 'Amhara'
  },
  'bahir-dar': {
    name: 'ባህር ዳር | Bahir Dar',
    slogan: 'የሀይቆች እና የጨርቃጨርቅ ከተማ',
    businesses: '12,000+',
    workers: '50,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏞️',
    product: 'ጨርቃጨርቅ, ቱሪዝም',
    description: 'የታና ሀይቅ ዳርቻ',
    population: '350K+',
    region: 'Amhara'
  },
  'dessie': {
    name: 'ደሴ | Dessie',
    slogan: 'የንግድ እና የእርሻ ከተማ',
    businesses: '7,000+',
    workers: '25,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ግብርና, ንግድ',
    description: 'የንግድ እና የእርሻ ከተማ',
    population: '229K+',
    region: 'Amhara'
  },
  'debre-markos': {
    name: 'ደብረ ማርቆስ | Debre Markos',
    slogan: 'የምስራቅ ጎጃም ዋና ከተማ',
    businesses: '8,000+',
    workers: '30,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '⛪',
    product: 'ንግድ, ግብርና',
    description: 'የምስራቅ ጎጃም ዋና ከተማ',
    population: '120K+',
    region: 'Amhara'
  },
  'finote-selam': {
    name: 'ፍኖተ ሰላም | Finote Selam',
    slogan: 'የምዕራብ ጎጃም ዋና ከተማ',
    businesses: '6,000+',
    workers: '20,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🌅',
    product: 'ንግድ, ግብርና',
    description: 'የምዕራብ ጎጃም ዋና ከተማ',
    population: '80K+',
    region: 'Amhara'
  },
  'woldia': {
    name: 'ወልዲያ | Woldia',
    slogan: 'የወልዲያ ዩኒቨርሲቲ ከተማ',
    businesses: '5,000+',
    workers: '15,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🎓',
    product: 'ትምህርት, ንግድ',
    description: 'የወልዲያ ዩኒቨርሲቲ ከተማ',
    population: '60K+',
    region: 'Amhara'
  },
  'debre-birhan': {
    name: 'ደብረ ብርሃን | Debre Birhan',
    slogan: 'የፀሐይ ብርሃን ከተማ',
    businesses: '7,000+',
    workers: '25,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '⭐',
    product: 'ንግድ, ግብርና',
    description: 'የፀሐይ ብርሃን ከተማ',
    population: '100K+',
    region: 'Amhara'
  },
  'kombolcha': {
    name: 'ኮምቦልቻ | Kombolcha',
    slogan: 'የኢንዱስትሪ ዞን እና ደረቅ ወደብ',
    businesses: '4,000+',
    workers: '18,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏭',
    product: 'ኢንዱስትሪ, ሎጂስቲክስ',
    description: 'የኢንዱስትሪ ዞን እና ደረቅ ወደብ',
    population: '120K+',
    region: 'Amhara'
  },
  'sekota': {
    name: 'ሰቆጣ | Sekota',
    slogan: 'የዋግ ሽራ ዞን ዋና ከተማ',
    businesses: '3,000+',
    workers: '12,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ንግድ, ግብርና',
    description: 'የዋግ ሽራ ዞን ዋና ከተማ',
    population: '40K+',
    region: 'Amhara'
  },
  'aykal': {
    name: 'አይከል | Aykal',
    slogan: 'የምዕራብ ጎጃም ከተማ',
    businesses: '3,000+',
    workers: '10,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ንግድ, ግብርና',
    description: 'የምዕራብ ጎጃም ከተማ',
    population: '35K+',
    region: 'Amhara'
  },
  'metema': {
    name: 'ሜተማ | Metema',
    slogan: 'የኢትዮ-ሱዳን ድንበር ከተማ',
    businesses: '3,000+',
    workers: '12,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🛣️',
    product: 'ንግድ, ድንበር',
    description: 'የኢትዮ-ሱዳን ድንበር ከተማ',
    population: '50K+',
    region: 'Amhara'
  },
  'debre-tabor': {
    name: 'ደብረ ታቦር | Debre Tabor',
    slogan: 'የጥንታዊ ገዳማት ከተማ',
    businesses: '4,000+',
    workers: '15,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '⛪',
    product: 'ቱሪዝም, ግብርና',
    description: 'የጥንታዊ ገዳማት ከተማ',
    population: '70K+',
    region: 'Amhara'
  },

  // ===================== OROMIA REGION =====================
  'adama': {
    name: 'አዳማ | Adama',
    slogan: 'የመኪና እና የኢንዱስትሪ ከተማ',
    businesses: '20,000+',
    workers: '80,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏭',
    product: 'የመኪና መሰብሰቢያ, ጨርቃጨርቅ',
    description: 'የኢንዱስትሪ ከተማ',
    population: '500K+',
    region: 'Oromia'
  },
  'jimma': {
    name: 'ጅማ | Jimma',
    slogan: 'የቡና እና የንግድ ከተማ',
    businesses: '8,000+',
    workers: '30,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '☕',
    product: 'ቡና, ማር',
    description: 'የቡና ከተማ',
    population: '250K+',
    region: 'Oromia'
  },
  'bishoftu': {
    name: 'ቢሾፍቱ | Bishoftu',
    slogan: 'የሀይቆች እና የአየር ሃይል ከተማ',
    businesses: '12,000+',
    workers: '45,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '✈️',
    product: 'ቱሪዝም, አቪዬሽን',
    description: 'የሀይቆች ከተማ',
    population: '150K+',
    region: 'Oromia'
  },
  'asella': {
    name: 'አሰላ | Asella',
    slogan: 'የአርሲ ዋና ከተማ እና የእርሻ ማዕከል',
    businesses: '8,000+',
    workers: '30,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'እህል, ግብርና',
    description: 'የአርሲ ዋና ከተማ',
    population: '130K+',
    region: 'Oromia'
  },
  'shashemene': {
    name: 'ሻሸመኔ | Shashemene',
    slogan: 'የንግድ እና የኢንዱስትሪ ከተማ',
    businesses: '6,000+',
    workers: '25,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🛍️',
    product: 'ንግድ, ኢንዱስትሪ',
    description: 'የንግድ እና የኢንዱስትሪ ከተማ',
    population: '150K+',
    region: 'Oromia'
  },
  'robe': {
    name: 'ሮቤ | Robe',
    slogan: 'የባሌ ተራራ በር | የቱሪዝም ማዕከል',
    businesses: '5,000+',
    workers: '20,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🌄',
    product: 'ቱሪዝም, ግብርና',
    description: 'የባሌ ተራራ በር',
    population: '80K+',
    region: 'Oromia'
  },
  'ginir': {
    name: 'ጊኒር | Ginir',
    slogan: 'የባሌ ምስራቅ የንግድ ማዕከል',
    businesses: '4,000+',
    workers: '15,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏞️',
    product: 'ንግድ, ግብርና',
    description: 'የባሌ ምስራቅ የንግድ ማዕከል',
    population: '60K+',
    region: 'Oromia'
  },
  'yabelo': {
    name: 'ያቤሎ | Yabelo',
    slogan: 'የእንስሳት እርባታ እና የንግድ ከተማ',
    businesses: '4,000+',
    workers: '15,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🐪',
    product: 'እንስሳት, ንግድ',
    description: 'የእንስሳት እርባታ ከተማ',
    population: '50K+',
    region: 'Oromia'
  },
  'moyale': {
    name: 'ሞያሌ | Moyale',
    slogan: 'የኢትዮ-ኬንያ ድንበር ከተማ',
    businesses: '3,000+',
    workers: '12,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🛣️',
    product: 'ንግድ, ድንበር',
    description: 'የኢትዮ-ኬንያ ድንበር ከተማ',
    population: '40K+',
    region: 'Oromia'
  },
  'chiro': {
    name: 'ቺሮ | Chiro',
    slogan: 'የምስራቅ ሀረርጌ ዋና ከተማ',
    businesses: '5,000+',
    workers: '20,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ንግድ, ግብርና',
    description: 'የምስራቅ ሀረርጌ ዋና ከተማ',
    population: '80K+',
    region: 'Oromia'
  },
  'fiche': {
    name: 'ፊጬ | Fiche',
    slogan: 'የሰሜን ሸዋ የእህል ማዕከል',
    businesses: '5,000+',
    workers: '18,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🌾',
    product: 'እህል, ግብርና',
    description: 'የሰሜን ሸዋ የእህል ማዕከል',
    population: '70K+',
    region: 'Oromia'
  },
  'woliso': {
    name: 'ወሊሶ | Woliso',
    slogan: 'የሙቀት ምንጭ እና የቱሪዝም ከተማ',
    businesses: '4,000+',
    workers: '15,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '💧',
    product: 'ቱሪዝም, ሙቀት ምንጭ',
    description: 'የሙቀት ምንጭ ከተማ',
    population: '50K+',
    region: 'Oromia'
  },
  'ambo': {
    name: 'አምቦ | Ambo',
    slogan: 'የማዕድን ውሃ እና የግብርና ከተማ',
    businesses: '4,000+',
    workers: '15,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '💧',
    product: 'ማዕድን ውሃ, ግብርና',
    description: 'የማዕድን ውሃ ከተማ',
    population: '100K+',
    region: 'Oromia'
  },
  'nekemte': {
    name: 'ነቀምቴ | Nekemte',
    slogan: 'የቡና እና የንግድ ከተማ',
    businesses: '6,000+',
    workers: '25,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '☕',
    product: 'ቡና, ንግድ',
    description: 'የቡና እና የንግድ ከተማ',
    population: '150K+',
    region: 'Oromia'
  },
  'gimbi': {
    name: 'ጊምቢ | Gimbi',
    slogan: 'የምዕራብ ወለጋ የንግድ ማዕከል',
    businesses: '4,000+',
    workers: '15,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ንግድ, ግብርና',
    description: 'የምዕራብ ወለጋ የንግድ ማዕከል',
    population: '60K+',
    region: 'Oromia'
  },
  'dembi-dollo': {
    name: 'ደምቢ ዶሎ | Dembi Dollo',
    slogan: 'የወርቅ ማዕድን እና የንግድ ከተማ',
    businesses: '4,000+',
    workers: '18,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '💰',
    product: 'ወርቅ, ንግድ',
    description: 'የወርቅ ማዕድን ከተማ',
    population: '50K+',
    region: 'Oromia'
  },
  'shambu': {
    name: 'ሻምቡ | Shambu',
    slogan: 'የሆሮ ጉዱሩ ዋና ከተማ',
    businesses: '4,000+',
    workers: '15,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🌾',
    product: 'ንግድ, ግብርና',
    description: 'የሆሮ ጉዱሩ ዋና ከተማ',
    population: '50K+',
    region: 'Oromia'
  },
  'metu': {
    name: 'መቱ | Metu',
    slogan: 'የቡና እና የግብርና ከተማ',
    businesses: '2,500+',
    workers: '10,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🌿',
    product: 'ቡና, ግብርና',
    description: 'የቡና እና የግብርና ከተማ',
    population: '60K+',
    region: 'Oromia'
  },
  'bedele': {
    name: 'በደሌ | Bedele',
    slogan: 'የቢራ ፋብሪካ እና የቡና ከተማ',
    businesses: '3,000+',
    workers: '12,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🍺',
    product: 'ቢራ, ቡና',
    description: 'የቢራ ፋብሪካ ከተማ',
    population: '40K+',
    region: 'Oromia'
  },
  'bule-hora': {
    name: 'ቡሌ ሆራ | Bule Hora',
    slogan: 'የቡሌ ሆራ ዩኒቨርሲቲ ከተማ',
    businesses: '4,000+',
    workers: '15,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🎓',
    product: 'ትምህርት, ንግድ',
    description: 'የቡሌ ሆራ ዩኒቨርሲቲ ከተማ',
    population: '70K+',
    region: 'Oromia'
  },
  'negele-borana': {
    name: 'ነገሌ ቦረና | Negele Borana',
    slogan: 'የቦረና የእንስሳት እርባታ ማዕከል',
    businesses: '4,000+',
    workers: '15,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🐪',
    product: 'እንስሳት, ንግድ',
    description: 'የቦረና የእንስሳት እርባታ ማዕከል',
    population: '60K+',
    region: 'Oromia'
  },
  'ziway': {
    name: 'ዚዋይ | Ziway',
    slogan: 'የአሳ ማጥመድ እና የቱሪዝም ከተማ',
    businesses: '3,000+',
    workers: '12,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🐟',
    product: 'አሳ, ቱሪዝም',
    description: 'የአሳ ማጥመድ ከተማ',
    population: '80K+',
    region: 'Oromia'
  },

  // ===================== SOMALI REGION =====================
  'jijiga': {
    name: 'ጅጅጋ | Jijiga',
    slogan: 'የንግድ እና የእንስሳት ከተማ',
    businesses: '6,000+',
    workers: '20,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🐪',
    product: 'ንግድ, እንስሳት',
    description: 'የሶማሌ ክልል ዋና ከተማ',
    population: '200K+',
    region: 'Somali'
  },
  'degehabur': {
    name: 'ደገሃቡር | Degehabur',
    slogan: 'የሶማሌ ክልል ከተማ',
    businesses: '3,000+',
    workers: '12,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ንግድ, እንስሳት',
    description: 'የሶማሌ ክልል ከተማ',
    population: '60K+',
    region: 'Somali'
  },
  'kebri-dehar': {
    name: 'ቀብሪ ደሃር | Kebri Dehar',
    slogan: 'የሶማሌ ክልል የንግድ ማዕከል',
    businesses: '4,000+',
    workers: '15,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ንግድ, እንስሳት',
    description: 'የሶማሌ ክልል የንግድ ማዕከል',
    population: '80K+',
    region: 'Somali'
  },
  'gode': {
    name: 'ጎዴ | Gode',
    slogan: 'የሶማሌ ክልል ከተማ',
    businesses: '3,000+',
    workers: '12,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ንግድ, እንስሳት',
    description: 'የሶማሌ ክልል ከተማ',
    population: '50K+',
    region: 'Somali'
  },

  // ===================== HARARI REGION =====================
  'harar': {
    name: 'ሀረር | Harar',
    slogan: 'የባህል ቅርስ እና የእስላም ቅድስት ከተማ',
    businesses: '5,000+',
    workers: '15,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏛️',
    product: 'ቱሪዝም, ባህል',
    description: 'የባህል ቅርስ ከተማ',
    population: '150K+',
    region: 'Harari'
  },

  // ===================== SIDAMA REGION =====================
  'hawassa': {
    name: 'ሀዋሳ | Hawassa',
    slogan: 'የኢንዱስትሪ ፓርክ እና የሀይቅ ከተማ',
    businesses: '12,000+',
    workers: '50,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏞️',
    product: 'ጨርቃጨርቅ, አሳ',
    description: 'የሲዳማ ክልል ዋና ከተማ',
    population: '387K+',
    region: 'Sidama'
  },
  'yirgalem': {
    name: 'ይርጋለም | Yirgalem',
    slogan: 'የቡና እና የግብርና ከተማ',
    businesses: '3,000+',
    workers: '12,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '☕',
    product: 'ቡና, ግብርና',
    description: 'የቡና እና የግብርና ከተማ',
    population: '40K+',
    region: 'Sidama'
  },

  // ===================== SOUTH ETHIOPIA REGION =====================
  'arba-minch': {
    name: 'አርባ ምንጭ | Arba Minch',
    slogan: 'የቱሪዝም እና የግብርና ከተማ',
    businesses: '5,000+',
    workers: '20,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏞️',
    product: 'ቱሪዝም, ግብርና',
    description: 'የአርባ ምንጭ ዩኒቨርሲቲ ከተማ',
    population: '150K+',
    region: 'South'
  },
  'sodo': {
    name: 'ሶዶ | Sodo',
    slogan: 'የንግድ እና የግብርና ከተማ',
    businesses: '5,000+',
    workers: '18,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🛍️',
    product: 'ንግድ, ግብርና',
    description: 'የወላይታ ዞን ዋና ከተማ',
    population: '150K+',
    region: 'South'
  },
  'dilla': {
    name: 'ዲላ | Dilla',
    slogan: 'የቡና እና የንግድ ከተማ',
    businesses: '6,000+',
    workers: '22,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '☕',
    product: 'ቡና, ግብርና',
    description: 'የጌዴኦ ዞን ዋና ከተማ',
    population: '100K+',
    region: 'South'
  },
  'sawla': {
    name: 'ሳውላ | Sawla',
    slogan: 'የደቡብ ኢትዮጵያ ከተማ',
    businesses: '3,000+',
    workers: '12,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ንግድ, ግብርና',
    description: 'የደቡብ ኢትዮጵያ ከተማ',
    population: '50K+',
    region: 'South'
  },
  'jinka': {
    name: 'ጂንካ | Jinka',
    slogan: 'የደቡብ ኢትዮጵያ ባህላዊ ከተማ',
    businesses: '4,000+',
    workers: '15,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ቱሪዝም, ባህል',
    description: 'የደቡብ ኢትዮጵያ ባህላዊ ከተማ',
    population: '70K+',
    region: 'South'
  },
  'konso': {
    name: 'ኮንሶ | Konso',
    slogan: 'የዩኔስኮ ቅርስ ከተማ',
    businesses: '3,000+',
    workers: '12,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ቱሪዝም, ግብርና',
    description: 'የዩኔስኮ ቅርስ ከተማ',
    population: '60K+',
    region: 'South'
  },
  'karat': {
    name: 'ካራት | Karat',
    slogan: 'የኮንሶ ዞን ዋና ከተማ',
    businesses: '3,000+',
    workers: '12,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ንግድ, ግብርና',
    description: 'የኮንሶ ዞን ዋና ከተማ',
    population: '50K+',
    region: 'South'
  },

  // ===================== BENISHANGUL-GUMUZ REGION =====================
  'assosa': {
    name: 'አሶሳ | Assosa',
    slogan: 'የንግድ እና የግብርና ከተማ',
    businesses: '3,000+',
    workers: '12,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🌿',
    product: 'ንግድ, ግብርና',
    description: 'የቤንሻንጉል ክልል ዋና ከተማ',
    population: '100K+',
    region: 'Benishangul'
  },
  'gilgel-beles': {
    name: 'ግልገል በለስ | Gilgel Beles',
    slogan: 'የግልገል በለስ ከተማ',
    businesses: '2,500+',
    workers: '10,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '💧',
    product: 'ንግድ, ግብርና',
    description: 'የግልገል በለስ ከተማ',
    population: '40K+',
    region: 'Benishangul'
  },
  'kamashi': {
    name: 'ካማሺ | Kamashi',
    slogan: 'የካማሺ ዞን ዋና ከተማ',
    businesses: '2,000+',
    workers: '8,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ንግድ, ግብርና',
    description: 'የካማሺ ዞን ዋና ከተማ',
    population: '30K+',
    region: 'Benishangul'
  },

  // ===================== GAMBELLA REGION =====================
  'gambella': {
    name: 'ጋምቤላ | Gambella',
    slogan: 'የጋምቤላ ክልል ዋና ከተማ',
    businesses: '3,500+',
    workers: '15,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏞️',
    product: 'ንግድ, ግብርና',
    description: 'የጋምቤላ ክልል ዋና ከተማ',
    population: '80K+',
    region: 'Gambella'
  },
  'meti': {
    name: 'ሜቲ | Meti',
    slogan: 'የጋምቤላ ክልል ከተማ',
    businesses: '2,000+',
    workers: '8,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ንግድ, ግብርና',
    description: 'የጋምቤላ ክልል ከተማ',
    population: '30K+',
    region: 'Gambella'
  },

  // ===================== AFAR REGION =====================
  'semera': {
    name: 'ሰሜራ | Semera',
    slogan: 'የአፋር ክልል ዋና ከተማ',
    businesses: '2,000+',
    workers: '8,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🐪',
    product: 'ንግድ, እንስሳት',
    description: 'የአፋር ክልል ዋና ከተማ',
    population: '50K+',
    region: 'Afar'
  },
  'asaita': {
    name: 'አሳይታ | Asaita',
    slogan: 'የአፋር ክልል ታሪካዊ ከተማ',
    businesses: '2,000+',
    workers: '8,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏔️',
    product: 'ንግድ, እንስሳት',
    description: 'የአፋር ክልል ታሪካዊ ከተማ',
    population: '30K+',
    region: 'Afar'
  },
  'logiya': {
    name: 'ሎጊያ | Logiya',
    slogan: 'የአፋር ክልል ከተማ',
    businesses: '2,000+',
    workers: '7,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🛣️',
    product: 'ንግድ, እንስሳት',
    description: 'የአፋር ክልል ከተማ',
    population: '25K+',
    region: 'Afar'
  }
};

// City list for dropdown
const cityList = Object.keys(cityData).map(key => ({
  id: key,
  name: cityData[key].name.split('|')[0].trim(),
  nameEn: cityData[key].name.split('|')[1]?.trim() || key,
  icon: cityData[key].icon
}));

// FIXED: compressImage without reject
const compressImage = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
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
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

const validateFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const MAX_SIZE = 5 * 1024 * 1024;
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please upload a valid image file (JPEG, PNG, WEBP)');
  }
  
  if (file.size > MAX_SIZE) {
    throw new Error('File size must be less than 5MB');
  }
  
  return true;
};

export default function CityVip() {
  const router = useRouter();
  const { city, name } = router.query;
  const [activeTab, setActiveTab] = useState('daily');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cityInfo, setCityInfo] = useState(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showAgentApplication, setShowAgentApplication] = useState(false);
  
  // Seat selection states
  const [showSeatSelector, setShowSeatSelector] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedPoolType, setSelectedPoolType] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [participantId, setParticipantId] = useState(null);
  const [maxSeats, setMaxSeats] = useState(5);
  const [takenSeats, setTakenSeats] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reference, setReference] = useState('');
  
  // Ticket states
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

  // Check for redirect parameters on page load
  useEffect(() => {
    const { type, showSeats } = router.query;
    
    if (type && showSeats === 'true' && city && !showSeatSelector && !showPayment && !showTicket) {
      setSelectedPoolType(type);
      setSelectedSeats([]);
      fetchTakenSeats(city, type);
      setShowSeatSelector(true);
      router.replace(`/cities/${city}`, undefined, { shallow: true });
    }
  }, [router.query, city, showSeatSelector, showPayment, showTicket]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchTakenSeats = async (cityName, poolType) => {
    if (!cityName || !poolType) return;
    try {
      const { data } = await supabase
        .from('city_vip_participants')
        .select('seat_numbers')
        .eq('city', cityName)
        .eq('pool_type', poolType)
        .eq('payment_status', 'verified');
      
      if (data) {
        const allTaken = data.flatMap(p => p.seat_numbers || []);
        setTakenSeats(allTaken);
      }
    } catch (error) {
      console.error('Error fetching taken seats:', error);
    }
  };

  const vipPools = {
    daily: {
      name: "ዕለታዊ ሚሊየነር | Daily Millionaire",
      tier: "ለሁሉም ኢትዮጵያዊ | For Every Ethiopian",
      frequency: "Daily",
      contribution: "500",
      contributionFormatted: "500 ETB",
      prize: "1,000,000 ETB",
      prizeNumber: 1000000,
      winnerCount: 1,
      totalSeats: 2400,
      seatsPerRow: 20,
      rows: 120,
      time: "Every Day at 8:00 PM",
      color: "from-gray-700 to-gray-900",
      icon: "⭐",
      slogan: "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው",
      description: "Start your day with a chance to become an instant millionaire!",
      listedDate: "January 1, 2024",
      drawDate: "Every Day at 8:00 PM",
      nextDraw: "Today at 8:00 PM"
    },
    weekly: {
      name: "ሳምንታዊ ግዙፍ አሸናፊ | Weekly Mega Winner",
      tier: "VIP 2",
      frequency: "Weekly",
      contribution: "2500",
      contributionFormatted: "2,500 ETB",
      prize: "10,000,000 ETB",
      prizeNumber: 10000000,
      winnerCount: 1,
      totalSeats: 4800,
      seatsPerRow: 20,
      rows: 240,
      time: "Every Sunday at 6:00 PM",
      color: "from-gray-700 to-gray-900",
      icon: "🏆",
      slogan: "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው",
      description: "Ten MILLION Birr changes everything!",
      listedDate: "January 1, 2024",
      drawDate: "Every Sunday at 6:00 PM",
      nextDraw: getNextSunday()
    },
    monthly: {
      name: "ወርሃዊ አሸናፊ | Monthly Winner",
      tier: "VIP 1",
      frequency: "Monthly",
      contribution: "5000",
      contributionFormatted: "5,000 ETB",
      prize: "40,000,000 ETB",
      prizeNumber: 40000000,
      winnerCount: 1,
      totalSeats: 9600,
      seatsPerRow: 20,
      rows: 480,
      time: "Last Day of Month at 8:00 PM",
      color: "from-gray-700 to-gray-900",
      icon: "👑",
      slogan: "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው",
      description: "The ULTIMATE nationwide prize pool!",
      listedDate: "January 1, 2024",
      drawDate: "Last Day of Month at 8:00 PM",
      nextDraw: getNextMonthEnd()
    }
  };
  
  const handleJoinPool = async (poolType) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      const redirectUrl = `/cities/${city}?type=${poolType}&showSeats=true`;
      
      localStorage.setItem('abbaa_redirect_after_login', redirectUrl);
      localStorage.setItem('pendingRole', 'individual');
      localStorage.setItem('pendingCity', city);
      
      sessionStorage.setItem('redirectAfterLogin', redirectUrl);
      sessionStorage.setItem('pendingRole', 'individual');
      sessionStorage.setItem('pendingCity', city);
      
      localStorage.removeItem('isPartner');
      sessionStorage.removeItem('isPartner');
      
      toast.loading('Please login to join City VIP...');
      router.push('/login');
      return;
    }
    
    setSelectedPoolType(poolType);
    setSelectedSeats([]);
    await fetchTakenSeats(city, poolType);
    setShowSeatSelector(true);
  };

  const submitPayment = async (participantId, reference, file) => {
    const loadingToast = toast.loading('Uploading payment screenshot...');
    
    try {
      const optimizedFile = await compressImage(file);
      
      const fileExt = optimizedFile.name.split('.').pop();
      const fileName = `city-payments/${participantId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, optimizedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });
      
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);
      
      const { error: updateError } = await supabase
        .from('city_vip_participants')
        .update({
          payment_status: 'pending_verification',
          payment_proof_url: publicUrl,
          reference: reference,
          updated_at: new Date().toISOString(),
          payment_submitted_at: new Date().toISOString()
        })
        .eq('id', participantId);
      
      if (updateError) throw new Error(`Update failed: ${updateError.message}`);
      
      const { data: updatedParticipant, error: fetchError } = await supabase
        .from('city_vip_participants')
        .select('*')
        .eq('id', participantId)
        .single();
      
      if (fetchError) throw new Error(`Fetch failed: ${fetchError.message}`);
      
      setParticipantData(updatedParticipant);
      setTicketType('unverified');
      setShowTicket(true);
      setShowPayment(false);
      setShowSeatSelector(false);
      
      toast.success('Payment submitted! Your unverified ticket is ready', { id: loadingToast });
      
    } catch (error) {
      console.error('Payment submission error:', error);
      toast.error(error.message || 'Failed to submit payment. Please try again.', { id: loadingToast });
      throw error;
    }
  };

  // MOBILE-OPTIMIZED SEAT SELECTOR
  const renderSeatSelector = () => {
    if (!selectedPoolType) return null;
    
    const pool = vipPools[selectedPoolType];
    const entryFeeAmount = parseInt(pool.contribution);
    const totalSeatsCount = pool.totalSeats;
    const seatsPerRow = pool.seatsPerRow || 20;
    const rows = Math.ceil(totalSeatsCount / seatsPerRow);
    const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    const [currentRow, setCurrentRow] = useState(0);
    const seatGridRef = useRef(null);
    
    const scrollToRow = (rowIndex) => {
      setCurrentRow(rowIndex);
      if (seatGridRef.current) {
        const rowElement = document.getElementById(`row-${rowIndex}`);
        if (rowElement) {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };
    
    const toggleSeat = (seatNum) => {
      if (takenSeats.includes(seatNum)) {
        toast.error(`Seat ${seatNum} is already taken`);
        return;
      }
      if (selectedSeats.includes(seatNum)) {
        setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
      } else if (selectedSeats.length < maxSeats) {
        setSelectedSeats([...selectedSeats, seatNum]);
      } else {
        toast.error(`You can only select up to ${maxSeats} seats`);
      }
    };
    
    const totalAmount = selectedSeats.length * entryFeeAmount;
    
    const confirmSeats = async () => {
      if (selectedSeats.length === 0) {
        toast.error('Please select at least one seat');
        return;
      }
      
      setLoading(true);
      
      try {
        const ticketNumber = `CITY-${selectedPoolType.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        const { data: participant, error } = await supabase
          .from('city_vip_participants')
          .insert({
            user_id: user.id,
            user_email: user.email,
            user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            pool_type: selectedPoolType,
            city: city,
            seat_numbers: selectedSeats,
            contribution_amount: totalAmount,
            prize_amount: parseInt(pool.prize.replace(/[^0-9]/g, '')),
            payment_status: 'pending',
            ticket_number: ticketNumber,
            status: 'active',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        
        setParticipantId(participant.id);
        setShowSeatSelector(false);
        setShowPayment(true);
        
      } catch (error) {
        console.error('Error creating participant:', error);
        toast.error('Failed to create participant record: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    // Create seat grid with rows
    const seatRows = [];
    for (let row = 0; row < rows; row++) {
      const startSeat = row * seatsPerRow + 1;
      const endSeat = Math.min(startSeat + seatsPerRow - 1, totalSeatsCount);
      const rowSeats = [];
      for (let seat = startSeat; seat <= endSeat; seat++) {
        rowSeats.push(seat);
      }
      seatRows.push(rowSeats);
    }
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2">
        <div className="bg-gray-100 rounded-2xl shadow-xl max-w-full w-full max-h-[98vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-gray-100 border-b border-gray-200 p-4 z-10">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-800">Select Your Seats</h2>
                <p className="text-xs text-gray-500">{pool.name} • Max {maxSeats} seats</p>
              </div>
              <button 
                onClick={() => {
                  setShowSeatSelector(false);
                  setSelectedPoolType(null);
                  setSelectedSeats([]);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Quick Row Navigation */}
            <div className="flex overflow-x-auto gap-1 mt-3 pb-2">
              {Array.from({ length: Math.min(rows, 20) }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToRow(idx)}
                  className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition ${
                    currentRow === idx 
                      ? 'bg-green-600 text-white' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Row {rowLetters[idx] || (idx + 1)}
                </button>
              ))}
              {rows > 20 && (
                <span className="px-2 py-1 text-xs text-gray-500">+{rows - 20} more</span>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
            {/* Seat Legend */}
            <div className="flex flex-wrap justify-center gap-4 mb-4 pb-3 border-b border-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center text-white text-[10px] font-bold">✓</div>
                <span className="text-xs text-gray-700">Selected by You</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 border border-gray-400 rounded"></div>
                <span className="text-xs text-gray-700">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-400 rounded"></div>
                <span className="text-xs text-gray-700">Taken by Others</span>
              </div>
            </div>

            {/* Screen Indicator */}
            <div className="text-center mb-4">
              <div className="inline-block bg-gray-600 text-white text-[10px] px-4 py-1 rounded-full">🎬 SCREEN</div>
              <div className="w-full h-px bg-gray-300 mt-2"></div>
            </div>
            
            {/* Seat Grid */}
            <div ref={seatGridRef} className="space-y-2">
              {seatRows.map((rowSeats, rowIndex) => (
                <div key={rowIndex} id={`row-${rowIndex}`} className="flex flex-wrap items-center gap-1">
                  <div className="w-8 text-[11px] font-mono font-semibold text-gray-500">
                    {rowLetters[rowIndex] || (rowIndex + 1)}
                  </div>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {rowSeats.map(seatNum => {
                      const isTaken = takenSeats.includes(seatNum);
                      const isSelected = selectedSeats.includes(seatNum);
                      
                      let bgColor = 'bg-gray-200 border border-gray-400';
                      let textColor = 'text-gray-700';
                      let hoverClass = 'hover:bg-green-100 hover:border-green-400';
                      
                      if (isSelected) {
                        bgColor = 'bg-green-600 border-green-700';
                        textColor = 'text-white';
                        hoverClass = '';
                      }
                      if (isTaken) {
                        bgColor = 'bg-gray-400 border-gray-500';
                        textColor = 'text-gray-600';
                        hoverClass = 'cursor-not-allowed';
                      }
                      
                      return (
                        <button
                          key={seatNum}
                          onClick={() => !isTaken && toggleSeat(seatNum)}
                          disabled={isTaken}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${bgColor} ${textColor} ${hoverClass} ${isTaken ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={isTaken ? `Seat ${seatNum} is already taken` : `Select Seat ${seatNum}`}
                        >
                          {seatNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            {totalSeatsCount > 500 && (
              <p className="text-xs text-gray-400 text-center mt-4">
                Showing all {totalSeatsCount.toLocaleString()} seats (scroll to see more)
              </p>
            )}
          </div>
          
          {/* Footer with Green Button */}
          {selectedSeats.length > 0 && (
            <div className="sticky bottom-0 bg-gray-100 border-t border-gray-200 p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-xs text-gray-500">Selected Seats</p>
                  <p className="font-bold text-gray-800">{selectedSeats.sort((a,b)=>a-b).join(', ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="font-bold text-xl text-green-600">ETB {totalAmount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">({selectedSeats.length} seats × {pool.contributionFormatted})</p>
                </div>
              </div>
              <button
                onClick={confirmSeats}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Confirm & Proceed to Payment'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPayment = () => {
    if (!showPayment || !participantId || !selectedPoolType) return null;
    
    const pool = vipPools[selectedPoolType];
    const totalAmount = selectedSeats.length * parseInt(pool.contribution);
    
    const handleFileSelect = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        validateFile(file);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
        
        setSelectedFile(file);
        toast.success('File selected successfully');
      } catch (error) {
        toast.error(error.message);
        e.target.value = '';
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    };
    
    const handlePaymentSubmit = async () => {
      if (!selectedFile) {
        toast.error('Please upload payment screenshot');
        return;
      }
      
      setIsSubmitting(true);
      try {
        await submitPayment(participantId, reference, selectedFile);
      } catch (error) {
        console.error('Payment error:', error);
      } finally {
        setIsSubmitting(false);
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
            <h2 className="text-xl font-bold">Complete Payment</h2>
            <button 
              onClick={() => {
                setShowPayment(false);
                setSelectedPoolType(null);
                setParticipantId(null);
              }}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
              <p className="text-sm text-gray-600">Pool: {pool.name}</p>
              <p className="text-sm text-gray-600">City: {cityInfo?.name?.split('|')[0] || city}</p>
              <p className="text-sm text-gray-600">Seats: {selectedSeats.join(', ')}</p>
              <p className="text-xl font-bold text-green-600 mt-2">ETB {totalAmount.toLocaleString()}</p>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">Please send payment to:</p>
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="font-semibold">📱 TeleBirr: 0913277922</p>
              <p className="font-semibold mt-2">🏦 CBE Bank: 1000601091686</p>
              <p className="text-sm text-gray-600 mt-2">Account Name: Negassa Hundessa</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Reference Number/Transaction ID *</label>
              <input
                type="text"
                placeholder="Enter transaction ID or reference number"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="paymentScreenshot"
                onChange={handleFileSelect}
              />
              <label htmlFor="paymentScreenshot" className="cursor-pointer">
                {previewUrl ? (
                  <div>
                    <img src={previewUrl} alt="Preview" className="max-h-32 mx-auto mb-2 rounded" />
                    <p className="text-green-600">✓ {selectedFile?.name}</p>
                  </div>
                ) : (
                  <div>
                    <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 mt-2">Click to upload payment screenshot</p>
                    <p className="text-xs text-gray-400 mt-1">JPEG, PNG (Max 5MB) - Auto-compressed</p>
                  </div>
                )}
              </label>
            </div>
            
            <button
              onClick={handlePaymentSubmit}
              disabled={isSubmitting || !reference.trim()}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition mt-4 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Submit Payment & Get Ticket'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTicketModal = () => {
    if (!showTicket || !participantData) return null;
    
    const pool = vipPools[participantData.pool_type];
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 flex justify-between items-center">
              <h3 className="text-white font-bold text-lg">Your Ticket</h3>
              <button
                onClick={() => {
                  setShowTicket(false);
                  router.push('/dashboard');
                }}
                className="text-white hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <Ticket 
                participant={{
                  user_name: participantData.user_name,
                  user_email: participantData.user_email,
                  ticket_number: participantData.ticket_number,
                  created_at: participantData.created_at,
                  contribution_amount: participantData.contribution_amount
                }}
                pool={{
                  prize_name: pool.name,
                  target_amount: pool.prize,
                  pool_type: participantData.pool_type
                }}
                isVerified={ticketType === 'verified'}
                seatNumbers={participantData.seat_numbers}
                ticketNumber={participantData.ticket_number}
                amount={participantData.contribution_amount}
                createdAt={participantData.created_at}
              />
              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
          <div className="text-5xl animate-bounce">{pool.icon}</div>
        </div>
        <div className="mt-3 bg-white/20 backdrop-blur rounded-lg p-2 text-center">
          <p className="text-sm font-bold">{pool.slogan}</p>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div><p className="text-sm opacity-80">የመግቢያ ክፍያ | Entry Fee</p><p className="text-3xl font-bold">{pool.contributionFormatted}</p></div>
          <div className="text-right"><p className="text-sm opacity-80">የተረጋገጠ ሽልማት | Prize</p><p className="text-3xl font-bold">{pool.prize}</p></div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>{pool.time}</span></div>
          <div className="flex items-center gap-3 text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span>📅 Listed: {pool.listedDate}</span></div>
          <div className="flex items-center gap-3 text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>🎲 Draw: {pool.drawDate}</span></div>
          <div className="flex items-center gap-3 text-gray-600"><span className="text-yellow-500">⏰</span><span>Next Draw: {pool.nextDraw}</span></div>
          <div className="flex items-center gap-3 text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg><span>{pool.winnerCount} አሸናፊ | Winner Every {pool.frequency}</span></div>
          <div className="flex items-center gap-3 text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg><span>💺 Total Seats: {pool.totalSeats.toLocaleString()}</span></div>
        </div>
        <p className="text-gray-600 text-sm mb-6">{pool.description}</p>
        <button onClick={() => handleJoinPool(type)} className={`w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition transform hover:scale-105 flex items-center justify-center gap-2`}>🎯 Select Seat & Join {pool.frequency} Pool →</button>
      </div>
    </div>
  );

  if (!cityInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <NoSSR>
      <>
        <Head>
          <title>{cityInfo.name} VIP - Win 1M Daily, 10M Weekly, 40M Monthly | Abbaa Carraa</title>
          <meta name="description" content={`Join ${cityInfo.name} VIP program. Win 1 Million Birr daily, 10 Million weekly, or 40 Million monthly. Open to all ${cityInfo.name} traders and participants.`} />
        </Head>

        {/* Top Navbar with City Selector */}
        <nav className="sticky top-0 z-50 bg-gray-900 shadow-lg border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="text-2xl group-hover:scale-110 transition-transform">🎫</span>
                <div>
                  <span className="font-bold text-white text-lg">Merkato VIP</span>
                  <span className="text-xs text-gray-400 ml-2 hidden sm:inline">| Ethiopia's Premier Event Hub</span>
                </div>
              </Link>
              <TopCitySelector />
            </div>
          </div>
        </nav>

        <div className="min-h-screen bg-gray-100">
          {/* City Selector Dropdown */}
          <div className="container mx-auto px-4 pt-6">
            <div className="relative">
              <button
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="w-full md:w-auto bg-white border border-gray-300 rounded-xl px-5 py-3 flex items-center justify-between gap-3 hover:shadow-md transition group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cityInfo.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">{cityInfo.name.split('|')[0]}</div>
                    <div className="text-xs text-gray-500">{cityInfo.name.split('|')[1]}</div>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showCityDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showCityDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCityDropdown(false)} />
                  <div className="absolute top-full left-0 mt-2 w-full md:w-96 bg-white rounded-2xl shadow-2xl border z-50 max-h-96 overflow-y-auto">
                    <div className="sticky top-0 bg-white p-3 border-b">
                      <input
                        type="text"
                        id="citySearch"
                        placeholder="Search city..."
                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-500"
                        onKeyUp={(e) => {
                          const searchTerm = e.target.value.toLowerCase();
                          const items = document.querySelectorAll('.city-dropdown-item');
                          items.forEach(item => {
                            const text = item.textContent.toLowerCase();
                            item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
                          });
                        }}
                      />
                    </div>
                    {cityList.map(c => (
                      <a
                        key={c.id}
                        href={`/cities/${c.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/cities/${c.id}`;
                        }}
                        className={`city-dropdown-item w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center gap-3 border-b last:border-b-0 cursor-pointer ${city === c.id ? 'bg-gray-100' : ''}`}
                      >
                        <span className="text-2xl">{c.icon}</span>
                        <div>
                          <div className="font-medium text-gray-800">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.nameEn}</div>
                        </div>
                        {city === c.id && (
                          <span className="ml-auto text-green-600 text-sm">✓ Current</span>
                        )}
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Hero Section */}
          <div className={`relative bg-gradient-to-r ${cityInfo.color} text-white overflow-hidden mt-4`}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 text-9xl animate-bounce">{cityInfo.icon}</div>
              <div className="absolute bottom-10 right-10 text-9xl animate-pulse">🇪🇹</div>
            </div>
            <div className="relative container mx-auto px-4 py-20 text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-bold mb-6 animate-pulse">
                <span>🏆</span> {cityInfo.name.split('|')[0]} Special Program
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-4">
                <span className="block">{cityInfo.name.split('|')[0]}</span>
                <span className="bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">VIP</span>
              </h1>
              <p className="text-xl text-gray-200 max-w-2xl mx-auto">{cityInfo.slogan}</p>
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3"><div className="text-3xl font-bold">{cityInfo.businesses}</div><div className="text-sm">ንግዶች | Businesses</div></div>
                <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3"><div className="text-3xl font-bold">{cityInfo.workers}</div><div className="text-sm">ሠራተኞች | Workers</div></div>
                <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3"><div className="text-3xl font-bold">ሁሉም</div><div className="text-sm">ኢትዮጵያዊያን | All Ethiopians</div></div>
              </div>
            </div>
          </div>

          {/* About City Section */}
          <div className="container mx-auto px-4 py-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">🌟 ስለ {cityInfo.name.split('|')[0]} | About {cityInfo.name.split('|')[1] || cityInfo.name}</h2>
                  <p className="text-gray-600 leading-relaxed mb-4">{cityInfo.description}</p>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="border-l-4 border-gray-500 pl-3"><p className="font-semibold">የእምነት ንግድ | Trust-Based Commerce</p></div>
                    <div className="border-l-4 border-gray-500 pl-3"><p className="font-semibold">ዘመናዊ እኩብ | Modern Equb</p></div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">💎 ዋና ምርቶች | Main Products</h3>
                  <p className="text-gray-700 text-sm mb-4">{cityInfo.product}</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm"><span className="text-green-600">✓</span> በየቀኑ አንድ ሚሊየነር | One Millionaire Every Day</div>
                    <div className="flex items-center gap-2 text-sm"><span className="text-green-600">✓</span> በየሳምንቱ አንድ ሚሊየነር | One Millionaire Every Week</div>
                    <div className="flex items-center gap-2 text-sm"><span className="text-green-600">✓</span> በየወሩ አንድ ሚሊየነር | One Millionaire Every Month</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VIP Tabs */}
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <button onClick={() => setActiveTab('daily')} className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'daily' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>⭐ ዕለታዊ | Daily (1M)</button>
              <button onClick={() => setActiveTab('weekly')} className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'weekly' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>🏆 ሳምንታዊ | Weekly (10M)</button>
              <button onClick={() => setActiveTab('monthly')} className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'monthly' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>👑 ወርሃዊ | Monthly (40M)</button>
            </div>
            <div className="max-w-4xl mx-auto"><PoolCard type={activeTab} pool={vipPools[activeTab]} /></div>
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
                    <td className="px-6 py-4"><span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">ለሁሉም ኢትዮጵያዊ</span></td>
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
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg text-white animate-bounce">1️⃣</div>
                  <h3 className="font-bold text-xl mb-2">ምረጥ | Choose</h3>
                  <p className="text-gray-600">በየቀኑ፣ በየሳምንቱ ወይም በየወሩ የሚካሄደውን ፑል ምረጥ</p>
                  <p className="text-green-600 font-semibold text-sm mt-1">Choose Daily, Weekly, or Monthly Millionaire pool</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg text-white animate-bounce">2️⃣</div>
                  <h3 className="font-bold text-xl mb-2">ክፈል | Pay</h3>
                  <p className="text-gray-600">በቴሌብር ወይም በንግድ ባንክ መጠነኛ ክፍያ ክፈል</p>
                  <p className="text-green-600 font-semibold text-sm mt-1">Pay via TeleBirr or CBE Bank Transfer</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg text-white animate-bounce">3️⃣</div>
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

          {/* BECOME AN AGENT SECTION */}
          <div className="container mx-auto px-4 py-12">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">🤝</span>
                  <div>
                    <h3 className="text-2xl font-bold">Become an Agent for {cityInfo?.name?.split('|')[0]}</h3>
                    <p className="text-gray-300 mt-1">
                      Earn 10% commission on every successful contribution from customers you bring!
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      💰 Example: Customer contributes 10,000 ETB → You earn 1,000 ETB
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-xs bg-green-600/30 rounded-full px-2 py-1">✓ Regular Pools</span>
                      <span className="text-xs bg-purple-600/30 rounded-full px-2 py-1">✓ City VIP Programs</span>
                      <span className="text-xs bg-yellow-600/30 rounded-full px-2 py-1">✓ Merkato VIP</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowAgentApplication(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <span>🎯</span>
                  Apply as Agent
                  <span>→</span>
                </button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div><div className="text-2xl mb-1">💰</div><p className="font-semibold">10% Commission</p><p className="text-xs text-gray-400">On every successful contribution</p></div>
                  <div><div className="text-2xl mb-1">🔗</div><p className="font-semibold">Referral Link</p><p className="text-xs text-gray-400">Track all your customers</p></div>
                  <div><div className="text-2xl mb-1">💳</div><p className="font-semibold">Easy Withdrawal</p><p className="text-xs text-gray-400">TeleBirr or Bank Transfer</p></div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-16">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-4">ዛሬውኑ ይቀላቀሉ!</h2>
              <p className="text-xl mb-6">Join Today and Become {cityInfo.name.split('|')[0]}&apos;s Next Millionaire!</p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="/cities" className="inline-block bg-white text-gray-900 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-xl">🎯 Browse All Cities →</a>
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="inline-block bg-gray-700 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-800 transition transform hover:scale-105 shadow-xl">🏙️ Change City →</button>
              </div>
            </div>
          </div>
        </div>

        {renderSeatSelector()}
        {renderPayment()}
        {renderTicketModal()}

        {/* Agent Application Modal */}
        {showAgentApplication && (
          <UnifiedAgentApplication 
            onClose={() => setShowAgentApplication(false)} 
            preSelectedCity={city}
            preSelectedProgram="city_vip"
          />
        )}
      </>
    </NoSSR>
  );
}
