// pages/cities/[city].js - COMPLETE WITH ALL 94 CITIES, AMHARIC SUPPORT, ALL SEATS VISIBLE, REFRESH BUTTON, 3D BANNER UPLOAD
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import NoSSR from '../../components/NoSSR';
import TopCitySelector from '../../components/TopCitySelector';
import UnifiedAgentApplication from '../../components/UnifiedAgentApplication';
import TicketImage from '../../components/TicketImage';
import ThreeDBannerUpload from '../../components/ThreeDBannerUpload';

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

const cityList = Object.keys(cityData).map(key => ({
  id: key,
  name: cityData[key].name.split('|')[0].trim(),
  nameEn: cityData[key].name.split('|')[1]?.trim() || key,
  icon: cityData[key].icon
}));

const compressImage = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        const MAX_WIDTH = 1024, MAX_HEIGHT = 1024;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width; canvas.height = height;
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
  if (!allowedTypes.includes(file.type)) throw new Error('Please upload a valid image file');
  if (file.size > 5 * 1024 * 1024) throw new Error('File size must be less than 5MB');
  return true;
};

// VIP Pools with 3 different colors for buttons
const vipPools = {
  daily: { 
    name: "ዕለታዊ ሚሊየነር | Daily Millionaire", 
    nameAm: "ዕለታዊ",
    nameEn: "Daily",
    tier: "ለሁሉም ኢትዮጵያዊ", frequency: "Daily", 
    contribution: "500", contributionFormatted: "500 ETB", prize: "1,000,000 ETB", prizeNumber: 1000000, 
    totalSeats: 2400, seatsPerRow: 20, rows: 120, time: "Every Day at 8:00 PM", 
    color: "from-gray-700 to-gray-900", icon: "⭐", 
    buttonColor: "bg-blue-500 hover:bg-blue-600",
    activeColor: "border-blue-500 bg-blue-50",
    textColor: "text-blue-600",
    description: "Start your day with a chance to become an instant millionaire!" 
  },
  weekly: { 
    name: "ሳምንታዊ ግዙፍ አሸናፊ | Weekly Mega Winner", 
    nameAm: "ሳምንታዊ",
    nameEn: "Weekly",
    tier: "VIP 2", frequency: "Weekly", 
    contribution: "2500", contributionFormatted: "2,500 ETB", prize: "10,000,000 ETB", prizeNumber: 10000000, 
    totalSeats: 4800, seatsPerRow: 20, rows: 240, time: "Every Sunday at 6:00 PM", 
    color: "from-gray-700 to-gray-900", icon: "🏆", 
    buttonColor: "bg-green-500 hover:bg-green-600",
    activeColor: "border-green-500 bg-green-50",
    textColor: "text-green-600",
    description: "Ten MILLION Birr changes everything!" 
  },
  monthly: { 
    name: "ወርሃዊ አሸናፊ | Monthly Winner", 
    nameAm: "ወርሃዊ",
    nameEn: "Monthly",
    tier: "VIP 1", frequency: "Monthly", 
    contribution: "5000", contributionFormatted: "5,000 ETB", prize: "40,000,000 ETB", prizeNumber: 40000000, 
    totalSeats: 9600, seatsPerRow: 20, rows: 480, time: "Last Day of Month at 8:00 PM", 
    color: "from-gray-700 to-gray-900", icon: "👑", 
    buttonColor: "bg-orange-500 hover:bg-orange-600",
    activeColor: "border-orange-500 bg-orange-50",
    textColor: "text-orange-600",
    description: "The ULTIMATE nationwide prize pool!" 
  }
};

export default function CityVip() {
  const router = useRouter();
  const { city } = router.query;
  const [language, setLanguage] = useState('am');
  const [activeTab, setActiveTab] = useState('daily');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cityInfo, setCityInfo] = useState(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showAgentApplication, setShowAgentApplication] = useState(false);
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
  const [showTicket, setShowTicket] = useState(false);
  const [participantData, setParticipantData] = useState(null);
  const [ticketType, setTicketType] = useState('unverified');
  const [currentRow, setCurrentRow] = useState(0);
  const [bannerUrls, setBannerUrls] = useState({
    daily: null,
    weekly: null,
    monthly: null
  });
  const seatGridRef = useRef(null);

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'am' ? 'en' : 'am';
    setLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  useEffect(() => {
    if (city) {
      const data = cityData[city];
      if (data) setCityInfo(data);
      else setCityInfo({ name: city.replace(/-/g, ' '), slogan: 'አንድ ብሔር አንድ እድል', businesses: '1,000+', workers: '5,000+', color: 'from-gray-700 to-gray-900', icon: '🇪🇹', product: 'ማህበረሰብ እና ንግድ', description: 'የኢትዮጵያ ከተማ', population: 'N/A', region: 'Ethiopia' });
    }
    checkUser();
    // Load saved banners from localStorage
    const savedBanners = localStorage.getItem(`city_banners_${city}`);
    if (savedBanners) {
      try {
        setBannerUrls(JSON.parse(savedBanners));
      } catch (e) {}
    }
  }, [city]);

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
      const { data } = await supabase.from('city_vip_participants').select('seat_numbers').eq('city', cityName).eq('pool_type', poolType).eq('payment_status', 'verified');
      if (data) setTakenSeats(data.flatMap(p => p.seat_numbers || []));
    } catch (error) { console.error('Error fetching taken seats:', error); }
  };

  const refreshSeats = async () => {
    if (!city || !selectedPoolType) {
      toast.error(language === 'am' ? 'እባክዎ መጀመሪያ የመቀመጫ ምርጫን ይክፈቱ' : 'Please open seat selection first');
      return;
    }
    setIsRefreshing(true);
    try {
      await fetchTakenSeats(city, selectedPoolType);
      toast.success(language === 'am' ? 'መቀመጫዎች ታድሰዋል! ✅' : 'Seats refreshed! ✅');
    } catch (error) {
      toast.error(language === 'am' ? 'መቀመጫዎችን ማደስ አልተቻለም' : 'Failed to refresh seats');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBannerUpload = (poolType, url) => {
    setBannerUrls(prev => ({
      ...prev,
      [poolType]: url
    }));
    // Save to localStorage
    localStorage.setItem(`city_banners_${city}`, JSON.stringify({
      ...bannerUrls,
      [poolType]: url
    }));
  };

  const handleJoinPool = async (poolType) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const redirectUrl = `/cities/${city}?type=${poolType}&showSeats=true`;
      localStorage.setItem('abbaa_redirect_after_login', redirectUrl);
      sessionStorage.setItem('redirectAfterLogin', redirectUrl);
      localStorage.setItem('pendingRole', 'individual');
      localStorage.setItem('pendingCity', city);
      sessionStorage.setItem('pendingRole', 'individual');
      sessionStorage.setItem('pendingCity', city);
      toast.loading(language === 'am' ? 'እባክዎ ወደ ስርዓት ይግቡ...' : 'Please login to join City VIP...');
      router.push('/login');
      return;
    }
    setSelectedPoolType(poolType);
    setSelectedSeats([]);
    await fetchTakenSeats(city, poolType);
    setShowSeatSelector(true);
  };

  const submitPayment = async (participantId, file) => {
    const loadingToast = toast.loading(language === 'am' ? 'የክፍያ ማስረጃ በላይናላይ ላይ እየተሰቀለ ነው...' : 'Uploading payment screenshot...');
    try {
      const optimizedFile = await compressImage(file);
      const fileName = `city-payments/${participantId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(fileName, optimizedFile);
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);
      await supabase.from('city_vip_participants').update({ payment_status: 'pending_verification', payment_proof_url: publicUrl, payment_submitted_at: new Date().toISOString() }).eq('id', participantId);
      const { data: updatedParticipant } = await supabase.from('city_vip_participants').select('*').eq('id', participantId).single();
      setParticipantData(updatedParticipant);
      setTicketType('unverified');
      setShowTicket(true);
      setShowPayment(false);
      setShowSeatSelector(false);
      toast.success(language === 'am' ? 'ክፍያ ተልኳል! ያልተረጋገጠ ቲኬትዎ ዝግጁ ነው' : 'Payment submitted! Your unverified ticket is ready', { id: loadingToast });
    } catch (error) {
      toast.error(error.message || (language === 'am' ? 'ክፍያ መላክ አልተቻለም' : 'Failed to submit payment'), { id: loadingToast });
      throw error;
    }
  };

  const renderSeatSelector = () => {
    if (!selectedPoolType) return null;
    const pool = vipPools[selectedPoolType];
    const entryFeeAmount = parseInt(pool.contribution);
    const totalSeatsCount = pool.totalSeats;
    const seatsPerRow = pool.seatsPerRow;
    const rows = Math.ceil(totalSeatsCount / seatsPerRow);
    const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    const scrollToRow = (rowIndex) => {
      setCurrentRow(rowIndex);
      if (seatGridRef.current) {
        const rowElement = document.getElementById(`row-${rowIndex}`);
        if (rowElement) rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    
    const toggleSeat = (seatNum) => {
      if (takenSeats.includes(seatNum)) { toast.error(language === 'am' ? `መቀመጫ ${seatNum} ተይዟል` : `Seat ${seatNum} is already taken`); return; }
      if (selectedSeats.includes(seatNum)) setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
      else if (selectedSeats.length < maxSeats) setSelectedSeats([...selectedSeats, seatNum]);
      else toast.error(language === 'am' ? `እስከ ${maxSeats} መቀመጫዎች ብቻ መምረጥ ይችላሉ` : `You can only select up to ${maxSeats} seats`);
    };
    
    const totalAmount = selectedSeats.length * entryFeeAmount;
    
    const confirmSeats = async () => {
      if (selectedSeats.length === 0) { toast.error(language === 'am' ? 'እባክዎ ቢያንስ አንድ መቀመጫ ይምረጡ' : 'Please select at least one seat'); return; }
      setLoading(true);
      try {
        const ticketNumber = `CITY-${selectedPoolType.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const { data: participant, error } = await supabase.from('city_vip_participants').insert({
          user_id: user.id, user_email: user.email, user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          pool_type: selectedPoolType, city: city, seat_numbers: selectedSeats, contribution_amount: totalAmount,
          prize_amount: parseInt(pool.prize.replace(/[^0-9]/g, '')), payment_status: 'pending', ticket_number: ticketNumber,
          status: 'active', created_at: new Date().toISOString()
        }).select().single();
        if (error) throw error;
        setParticipantId(participant.id);
        setShowSeatSelector(false);
        setShowPayment(true);
        toast.success(language === 'am' ? 'መቀመጫዎች ተይዘዋል! እባክዎ ክፍያ ይፈጽሙ' : 'Seats reserved! Please complete payment.');
      } catch (error) { toast.error(language === 'am' ? 'መቀመጫዎችን ማስያዝ አልተቻለም' : 'Failed to create participant record'); }
      finally { setLoading(false); }
    };
    
    const seatRows = [];
    for (let row = 0; row < rows; row++) {
      const startSeat = row * seatsPerRow + 1;
      const endSeat = Math.min(startSeat + seatsPerRow - 1, totalSeatsCount);
      const rowSeats = [];
      for (let seat = startSeat; seat <= endSeat; seat++) rowSeats.push(seat);
      seatRows.push(rowSeats);
    }
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2">
        <div className="bg-gray-100 rounded-2xl shadow-xl max-w-full w-full max-h-[98vh] overflow-hidden flex flex-col">
          <div className="sticky top-0 bg-gray-100 border-b border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">{language === 'am' ? 'መቀመጫዎችን ይምረጡ' : 'Select Your Seats'} (Max {maxSeats})</h2>
              <div className="flex gap-2">
                <button 
                  onClick={refreshSeats} 
                  disabled={isRefreshing}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs transition disabled:opacity-50 flex items-center gap-1"
                >
                  {isRefreshing ? (
                    <>
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Refreshing...
                    </>
                  ) : (
                    '🔄 Refresh Seats'
                  )}
                </button>
                <button 
                  onClick={() => { setShowSeatSelector(false); setSelectedPoolType(null); setSelectedSeats([]); }} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex overflow-x-auto gap-1 mt-3 pb-2">
              {Array.from({ length: Math.min(rows, 20) }).map((_, idx) => (
                <button key={idx} onClick={() => scrollToRow(idx)} className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition ${currentRow === idx ? 'bg-green-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-200'}`}>Row {rowLetters[idx] || (idx + 1)}</button>
              ))}
              {rows > 20 && <span className="px-2 py-1 text-xs text-gray-500">+{rows - 20} more</span>}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-wrap justify-center gap-4 mb-4 pb-3 border-b">
              <div className="flex items-center gap-2"><div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center text-white text-[10px] font-bold">✓</div><span className="text-xs">{language === 'am' ? 'የእርስዎ ምርጫ' : 'Selected by You'}</span></div>
              <div className="flex items-center gap-2"><div className="w-6 h-6 bg-gray-200 border border-gray-400 rounded"></div><span className="text-xs">{language === 'am' ? 'ክፍት' : 'Available'}</span></div>
              <div className="flex items-center gap-2"><div className="w-6 h-6 bg-gray-400 rounded"></div><span className="text-xs">{language === 'am' ? 'የተያዙ' : 'Taken'}</span></div>
            </div>
            <div className="text-center mb-4"><div className="inline-block bg-gray-600 text-white text-[10px] px-4 py-1 rounded-full">🎬 SCREEN</div><div className="w-full h-px bg-gray-300 mt-2"></div></div>
            <div ref={seatGridRef} className="space-y-2">
              {/* FIXED: Show ALL rows (removed slice(0, 25)) */}
              {seatRows.map((rowSeats, rowIndex) => (
                <div key={rowIndex} id={`row-${rowIndex}`} className="flex flex-wrap items-center gap-1">
                  <div className="w-8 text-[11px] font-mono font-semibold text-gray-500">{rowLetters[rowIndex] || (rowIndex + 1)}</div>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {rowSeats.map(seatNum => {
                      const isTaken = takenSeats.includes(seatNum);
                      const isSelected = selectedSeats.includes(seatNum);
                      let bgColor = 'bg-gray-200 border border-gray-400', textColor = 'text-gray-700';
                      if (isSelected) { bgColor = 'bg-green-600 border-green-700'; textColor = 'text-white'; }
                      if (isTaken) { bgColor = 'bg-gray-400 border-gray-500'; textColor = 'text-gray-600'; }
                      return (
                        <button key={seatNum} onClick={() => !isTaken && toggleSeat(seatNum)} disabled={isTaken}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${bgColor} ${textColor} ${isTaken ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-green-100'}`}
                          title={isTaken ? `Seat ${seatNum} is taken` : `Select Seat ${seatNum}`}>{seatNum}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {rows > 25 && <p className="text-xs text-gray-400 text-center mt-4">{language === 'am' ? `ሁሉም ${totalSeatsCount.toLocaleString()} መቀመጫዎች እዚህ ይታያሉ` : `All ${totalSeatsCount.toLocaleString()} seats are shown here`}</p>}
          </div>
          {selectedSeats.length > 0 && (
            <div className="sticky bottom-0 bg-gray-100 border-t border-gray-200 p-4">
              <div className="flex justify-between items-center mb-3 flex-wrap gap-3">
                <div><p className="text-xs text-gray-500">{language === 'am' ? 'የተመረጡ መቀመጫዎች' : 'Selected Seats'}</p><p className="font-bold">{selectedSeats.sort((a,b)=>a-b).join(', ')}</p></div>
                <div className="text-right"><p className="text-xs text-gray-500">{language === 'am' ? 'ጠቅላላ ክፍያ' : 'Total Amount'}</p><p className="font-bold text-xl text-green-600">ETB {totalAmount.toLocaleString()}</p><p className="text-[10px] text-gray-400">({selectedSeats.length} {language === 'am' ? 'መቀመጫ ×' : 'seats ×'} {pool.contributionFormatted})</p></div>
                <button onClick={confirmSeats} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-semibold transition disabled:opacity-50">{loading ? (language === 'am' ? 'በሂደት ላይ...' : 'Processing...') : (language === 'am' ? 'አረጋግጥ እና ወደ ክፍያ ቀጥል' : 'Confirm & Proceed to Payment')}</button>
              </div>
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
      try { validateFile(file); setPreviewUrl(URL.createObjectURL(file)); setSelectedFile(file); toast.success(language === 'am' ? 'ፋይል ተመርጧል' : 'File selected'); }
      catch (error) { toast.error(error.message); e.target.value = ''; }
    };
    
    const handlePaymentSubmit = async () => {
      if (!selectedFile) { toast.error(language === 'am' ? 'እባክዎ የክፍያ ማስረጃ ይስቀሉ' : 'Please upload payment screenshot'); return; }
      setIsSubmitting(true);
      try { await submitPayment(participantId, selectedFile); }
      catch (error) { console.error('Payment error:', error); }
      finally { setIsSubmitting(false); }
    };
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-5 flex justify-between">
            <h2 className="text-xl font-bold">{language === 'am' ? 'ክፍያ ያጠናቅቁ' : 'Complete Payment'}</h2>
            <button onClick={() => { setShowPayment(false); setSelectedPoolType(null); setParticipantId(null); }} className="text-2xl">×</button>
          </div>
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
              <p>{language === 'am' ? 'ከተማ:' : 'City:'} {cityInfo?.name?.split('|')[0] || city}</p>
              <p>{language === 'am' ? 'መቀመጫዎች:' : 'Seats:'} {selectedSeats.join(', ')}</p>
              <p className="text-xl font-bold text-green-600">ETB {totalAmount.toLocaleString()}</p>
            </div>
            <p className="text-sm text-gray-600 mb-2">{language === 'am' ? 'እባክዎ ክፍያ ወደዚህ ይላኩ:' : 'Send payment to:'}</p>
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="font-semibold">📱 TeleBirr: 0913277922</p>
              <p className="font-semibold">🏦 CBE Bank: 1000601091686</p>
              <p className="text-sm text-gray-600">{language === 'am' ? 'የሂሳብ ባለቤት:' : 'Account:'} Negassa Hundessa</p>
            </div>
            <div className="border-2 border-dashed rounded-lg p-4 text-center mb-4">
              <input type="file" accept="image/*" className="hidden" id="paymentScreenshot" onChange={handleFileSelect} />
              <label htmlFor="paymentScreenshot" className="cursor-pointer">
                {previewUrl ? <div><img src={previewUrl} className="max-h-32 mx-auto mb-2 rounded" /><p className="text-green-600">✓ {language === 'am' ? 'ማስረጃ ተመርጧል' : 'Screenshot selected'}</p></div> :
                <div><svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><p className="text-gray-500 mt-2">{language === 'am' ? 'የክፍያ ማስረጃ ለመጫን ጠቅ ያድርጉ' : 'Click to upload payment screenshot'}</p></div>}
              </label>
            </div>
            <button onClick={handlePaymentSubmit} disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold mt-4 disabled:opacity-50">
              {isSubmitting ? (language === 'am' ? 'በሂደት ላይ...' : 'Processing...') : (language === 'am' ? 'ክፍያ አስገባ እና ቲኬት አግኝ' : 'Submit Payment & Get Ticket')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTicket = () => {
    if (!showTicket || !participantData) return null;
    const pool = vipPools[participantData.pool_type];
    return (
      <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-md w-full">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 flex justify-between rounded-t-2xl">
            <h3 className="text-white font-bold">{language === 'am' ? 'የእርስዎ ቲኬት' : 'Your Ticket'}</h3>
            <button onClick={() => { setShowTicket(false); router.push('/dashboard'); }} className="text-white text-2xl">×</button>
          </div>
          <div className="p-6">
            <TicketImage participant={participantData} pool={pool} isVerified={false} seatNumbers={selectedSeats} ticketNumber={participantData.ticket_number} amount={participantData.contribution_amount} createdAt={participantData.created_at} poolType="city" />
            <button onClick={() => router.push('/dashboard')} className="mt-6 w-full bg-gray-600 text-white py-2 rounded-lg">{language === 'am' ? 'ወደ ዳሽቦርድ ሂድ' : 'Go to Dashboard'}</button>
          </div>
        </div>
      </div>
    );
  };

  const PoolCard = ({ type, pool }) => {
    const isActive = activeTab === type;
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition hover:scale-105">
        <div className={`bg-gradient-to-r ${pool.color} p-6 text-white`}>
          <div className="flex justify-between items-start">
            <div><p className="text-xs opacity-80">{pool.tier}</p><h3 className="text-2xl font-bold">{language === 'am' ? pool.nameAm : pool.nameEn}</h3></div>
            <div className="text-5xl animate-bounce">{pool.icon}</div>
          </div>
          <div className="mt-4 flex justify-between">
            <div><p className="text-sm opacity-80">{language === 'am' ? 'የመግቢያ ክፍያ' : 'Entry Fee'}</p><p className="text-2xl font-bold">{pool.contributionFormatted}</p></div>
            <div className="text-right"><p className="text-sm opacity-80">{language === 'am' ? 'ሽልማት' : 'Prize'}</p><p className="text-2xl font-bold">{pool.prize}</p></div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm">📅 {language === 'am' ? 'የእጣ ቀን:' : 'Draw:'} {pool.time}</div>
            <div className="flex items-center gap-2 text-gray-600 text-sm">💺 {language === 'am' ? 'ጠቅላላ መቀመጫዎች:' : 'Total Seats:'} {pool.totalSeats.toLocaleString()}</div>
          </div>
          <button onClick={() => handleJoinPool(type)} className={`w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2`}>
            🎯 {language === 'am' ? 'መቀመጫ ምረጡ እና ይቀላቀሉ →' : 'Select Seat & Join →'}
          </button>
        </div>
      </div>
    );
  };

  if (!cityInfo) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div></div>;

  return (
    <NoSSR>
      <>
        <Head><title>{cityInfo.name.split('|')[0]} VIP - Win 1M Daily, 10M Weekly, 40M Monthly | Abbaa Carraa</title></Head>
        <nav className="sticky top-0 z-50 bg-gray-900 shadow-lg border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2"><span className="text-2xl">🎫</span><span className="font-bold text-white text-lg">Abbaa Carraa</span></Link>
              <div className="flex items-center gap-3">
                <button onClick={toggleLanguage} className="bg-gray-700 text-white px-3 py-1 rounded-lg text-xs">{language === 'am' ? '🇬🇧 English' : '🇪🇹 አማርኛ'}</button>
                <TopCitySelector />
              </div>
            </div>
          </div>
        </nav>
        <div className="min-h-screen bg-gray-100">
          {/* Language Toggle - Mobile */}
          <div className="container mx-auto px-4 pt-4 flex justify-end md:hidden">
            <button onClick={toggleLanguage} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">{language === 'am' ? '🇬🇧 English' : '🇪🇹 አማርኛ'}</button>
          </div>

          {/* City Selector */}
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
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showCityDropdown && (
                <div className="absolute top-full left-0 mt-2 w-full md:w-96 bg-white rounded-2xl shadow-2xl border z-50 max-h-96 overflow-y-auto">
                  <div className="sticky top-0 bg-white p-3 border-b"><input type="text" id="citySearch" placeholder={language === 'am' ? 'ከተማ ፈልግ...' : 'Search city...'} className="w-full border rounded-lg px-4 py-2" onKeyUp={(e) => { const term = e.target.value.toLowerCase(); document.querySelectorAll('.city-item').forEach(el => { el.style.display = el.textContent.toLowerCase().includes(term) ? 'flex' : 'none'; }); }} /></div>
                  {cityList.map(c => (
                    <a key={c.id} href={`/cities/${c.id}`} className={`city-item flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b cursor-pointer ${city === c.id ? 'bg-gray-100' : ''}`}>
                      <span className="text-2xl">{c.icon}</span><div><div className="font-medium text-gray-800">{c.name}</div><div className="text-xs text-gray-500">{c.nameEn}</div></div>
                      {city === c.id && <span className="ml-auto text-green-600 text-sm">✓</span>}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hero Section - SIMPLIFIED WITH ATTRACTIVE TEXT */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-12 text-center mt-4 mx-4 rounded-2xl">
            <div className="text-6xl mb-3">{cityInfo.icon}</div>
            <h1 className="text-3xl md:text-4xl font-bold">{cityInfo.name.split('|')[0]} VIP</h1>
            {/* ATTRACTIVE AMHARIC TEXT ADDED */}
            <div className="text-emerald-300 font-bold text-lg mt-2">
              {language === 'am' 
                ? '✨ ዛሬ የከተማችንን ተሳታፊ ሚሊየነር እናድርገው! ✨'
                : '✨ Let\'s make our city participant a millionaire today! ✨'}
            </div>
            <p className="text-gray-200 mt-2">{language === 'am' ? 'እስከ 40 ሚሊዮን ብር ለማሸነፍ መቀመጫዎን ይምረጡ' : 'Select your seat to win up to 40 Million ETB'}</p>
          </div>
          {/* 3 COLORED TABS */}
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <button onClick={() => setActiveTab('daily')} className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'daily' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>⭐ {language === 'am' ? 'ዕለታዊ' : 'Daily'} (1M)</button>
              <button onClick={() => setActiveTab('weekly')} className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'weekly' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>🏆 {language === 'am' ? 'ሳምንታዊ' : 'Weekly'} (10M)</button>
              <button onClick={() => setActiveTab('monthly')} className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'monthly' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>👑 {language === 'am' ? 'ወርሃዊ' : 'Monthly'} (40M)</button>
            </div>
            <div className="max-w-4xl mx-auto"><PoolCard type={activeTab} pool={vipPools[activeTab]} /></div>
          </div>

          {/* Become an Agent Section */}
          <div className="container mx-auto px-4 py-12">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">🤝</span>
                  <div>
                    <h3 className="text-2xl font-bold">{language === 'am' ? `የ${cityInfo.name.split('|')[0]} ወኪል ይሁኑ` : `Become an Agent for ${cityInfo.name.split('|')[0]}`}</h3>
                    <p className="text-gray-300">{language === 'am' ? 'በሚያመጧቸው ደንበኞች ሁሉ 10% ኮሚሽን ያግኙ!' : 'Earn 10% commission on every successful contribution!'}</p>
                    <div className="flex gap-2 mt-2"><span className="text-xs bg-green-600/30 rounded-full px-2 py-1">✓ Regular Pools</span><span className="text-xs bg-purple-600/30 rounded-full px-2 py-1">✓ City VIP</span><span className="text-xs bg-yellow-600/30 rounded-full px-2 py-1">✓ Merkato VIP</span></div>
                  </div>
                </div>
                <button onClick={() => setShowAgentApplication(true)} className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2">{language === 'am' ? 'እንደ ወኪል ያመልክቱ →' : 'Apply as Agent →'}</button>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div><div className="text-2xl">💰</div><p className="font-semibold">{language === 'am' ? '10% ኮሚሽን' : '10% Commission'}</p></div>
                <div><div className="text-2xl">🔗</div><p className="font-semibold">{language === 'am' ? 'ማጣቀሻ ሊንክ' : 'Referral Link'}</p></div>
                <div><div className="text-2xl">💳</div><p className="font-semibold">{language === 'am' ? 'ቀላል መውጫ' : 'Easy Withdrawal'}</p></div>
              </div>
            </div>
          </div>
        </div>
        {renderSeatSelector()}
        {renderPayment()}
        {renderTicket()}
        {showAgentApplication && <UnifiedAgentApplication onClose={() => setShowAgentApplication(false)} preSelectedCity={city} preSelectedProgram="city_vip" />}
      </>
    </NoSSR>
  );
}
