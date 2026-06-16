// pages/listings.js - Updated with ALL 94 Ethiopian Cities, 3D Effects & All Features
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import PoolListings from '../components/PoolListings';
import PoolFilters from '../components/PoolFilters';
import PoolCard from '../components/PoolCard';
import NoSSR from '../components/NoSSR';
import UnifiedAgentApplication from '../components/UnifiedAgentApplication';
import NotificationCenter from '../components/NotificationCenter';

export async function getServerSideProps() {
  return { props: {} };
}

// ============================================
// COMPLETE CITY DATA - ALL 94 ETHIOPIAN CITIES
// ============================================
const cityVipPrograms = [
  // ===================== CENTRAL & MAJOR CITIES =====================
  { id: 'addis-ababa', name: 'አዲስ አበባ', nameEn: 'Addis Ababa', region: 'Central', population: '5M+', icon: '🏙️', color: 'from-blue-500 to-cyan-600', description: 'የኢትዮጵያ የንግድ እና የዲፕሎማሲ ልብ | Heart of Commerce & Diplomacy' },
  { id: 'shaggar', name: 'ሸገር', nameEn: 'Shaggar City', region: 'Oromia', population: '3M+', icon: '🏗️', color: 'from-teal-500 to-green-600', description: 'ብልህ ከተማ እና የኢንቨስትመንት ማዕከል | Smart City & Investment Hub' },
  { id: 'dire-dawa', name: 'ድሬ ዳዋ', nameEn: 'Dire Dawa', region: 'Dire Dawa', population: '535K+', icon: '🚂', color: 'from-green-500 to-teal-600', description: 'የሎጂስቲክስ እና የማኑፋክቸሪንግ በር | Logistics & Manufacturing Hub' },

  // ===================== TIGRAY REGION =====================
  { id: 'mekelle', name: 'መቀሌ', nameEn: 'Mekelle', region: 'Tigray', population: '500K+', icon: '🏭', color: 'from-purple-500 to-pink-600', description: 'የሰሜኑ የኢንዱስትሪ እና የትምህርት ማዕከል | Industrial & Education Hub' },
  { id: 'axum', name: 'አክሱም', nameEn: 'Axum', region: 'Tigray', population: '70K+', icon: '🏛️', color: 'from-amber-500 to-yellow-600', description: 'የታላቁ የአክሱም መንግስት ዋና ከተማ | Ancient Axumite Capital' },
  { id: 'adigrat', name: 'አዲግራት', nameEn: 'Adigrat', region: 'Tigray', population: '80K+', icon: '🏔️', color: 'from-indigo-500 to-purple-600', description: 'የሰሜን ትግራይ የንግድ ማዕከል | Northern Tigray Trade Center' },
  { id: 'shire', name: 'ሽሬ', nameEn: 'Shire', region: 'Tigray', population: '100K+', icon: '🏔️', color: 'from-sky-500 to-blue-600', description: 'የምዕራብ ትግራይ ዋና ከተማ | Western Tigray Capital' },
  { id: 'mekoni', name: 'መቆኒ', nameEn: 'Mekoni', region: 'Tigray', population: '50K+', icon: '🏔️', color: 'from-gray-500 to-gray-700', description: 'የምዕራብ ትግራይ ከተማ | Western Tigray City' },
  { id: 'maychew', name: 'ማይጨው', nameEn: 'Maychew', region: 'Tigray', population: '40K+', icon: '🏔️', color: 'from-stone-500 to-stone-700', description: 'የደቡብ ትግራይ ከተማ | Southern Tigray City' },
  { id: 'abiy-addi', name: 'አቢይ አዲ', nameEn: 'Abiy Addi', region: 'Tigray', population: '30K+', icon: '🏔️', color: 'from-amber-600 to-orange-700', description: 'የማዕከላዊ ትግራይ ከተማ | Central Tigray City' },
  { id: 'wukro', name: 'ውቅሮ', nameEn: 'Wukro', region: 'Tigray', population: '50K+', icon: '🏔️', color: 'from-lime-600 to-green-700', description: 'የምስራቅ ትግራይ ከተማ | Eastern Tigray City' },

  // ===================== AMHARA REGION =====================
  { id: 'gondar', name: 'ጎንደር', nameEn: 'Gondar', region: 'Amhara', population: '350K+', icon: '🏰', color: 'from-amber-500 to-yellow-600', description: 'የባህል ቅርስ እና የቱሪዝም ከተማ | Culture & Tourism City' },
  { id: 'bahir-dar', name: 'ባህር ዳር', nameEn: 'Bahir Dar', region: 'Amhara', population: '350K+', icon: '🏞️', color: 'from-cyan-500 to-blue-600', description: 'የሀይቆች እና የጨርቃጨርቅ ከተማ | City of Lakes & Textiles' },
  { id: 'dessie', name: 'ደሴ', nameEn: 'Dessie', region: 'Amhara', population: '229K+', icon: '🛍️', color: 'from-rose-500 to-pink-600', description: 'የንግድ እና የእርሻ ከተማ | Trade & Agriculture City' },
  { id: 'debre-markos', name: 'ደብረ ማርቆስ', nameEn: 'Debre Markos', region: 'Amhara', population: '120K+', icon: '⛪', color: 'from-violet-500 to-purple-600', description: 'የምስራቅ ጎጃም ዋና ከተማ | East Gojjam Capital' },
  { id: 'finote-selam', name: 'ፍኖተ ሰላም', nameEn: 'Finote Selam', region: 'Amhara', population: '80K+', icon: '🌅', color: 'from-orange-500 to-red-600', description: 'የምዕራብ ጎጃም ዋና ከተማ | West Gojjam Capital' },
  { id: 'woldia', name: 'ወልዲያ', nameEn: 'Woldia', region: 'Amhara', population: '60K+', icon: '🎓', color: 'from-indigo-500 to-purple-600', description: 'የወልዲያ ዩኒቨርሲቲ ከተማ | Woldia University City' },
  { id: 'debre-birhan', name: 'ደብረ ብርሃን', nameEn: 'Debre Birhan', region: 'Amhara', population: '100K+', icon: '⭐', color: 'from-yellow-500 to-amber-600', description: 'የፀሐይ ብርሃን ከተማ | City of Sunlight' },
  { id: 'kombolcha', name: 'ኮምቦልቻ', nameEn: 'Kombolcha', region: 'Amhara', population: '120K+', icon: '🏭', color: 'from-indigo-500 to-purple-600', description: 'የኢንዱስትሪ ዞን እና ደረቅ ወደብ | Industrial Zone & Dry Port' },
  { id: 'sekota', name: 'ሰቆጣ', nameEn: 'Sekota', region: 'Amhara', population: '40K+', icon: '🏔️', color: 'from-gray-600 to-gray-800', description: 'የዋግ ሽራ ዞን ዋና ከተማ | Wag Hemra Zone Capital' },
  { id: 'aykal', name: 'አይከል', nameEn: 'Aykal', region: 'Amhara', population: '35K+', icon: '🏔️', color: 'from-emerald-600 to-green-700', description: 'የምዕራብ ጎጃም ከተማ | West Gojjam City' },
  { id: 'metema', name: 'ሜተማ', nameEn: 'Metema', region: 'Amhara', population: '50K+', icon: '🛣️', color: 'from-amber-600 to-orange-700', description: 'የኢትዮ-ሱዳን ድንበር ከተማ | Ethio-Sudan Border Town' },
  { id: 'debre-tabor', name: 'ደብረ ታቦር', nameEn: 'Debre Tabor', region: 'Amhara', population: '70K+', icon: '⛪', color: 'from-purple-600 to-pink-700', description: 'የጥንታዊ ገዳማት ከተማ | Ancient Monasteries City' },
  { id: 'bati', name: 'ባቲ', nameEn: 'Bati', region: 'Amhara', population: '50K+', icon: '🏔️', color: 'from-teal-600 to-cyan-700', description: 'የንግድ እና የእርሻ ከተማ | Trade & Agriculture City' },
  { id: 'kemise', name: 'ቀሚሴ', nameEn: 'Kemise', region: 'Amhara', population: '45K+', icon: '🏔️', color: 'from-blue-600 to-indigo-700', description: 'የንግድ እና የእርሻ ከተማ | Trade & Agriculture City' },
  { id: 'injibara', name: 'እንጅባራ', nameEn: 'Injibara', region: 'Amhara', population: '40K+', icon: '🏔️', color: 'from-green-600 to-emerald-700', description: 'የአዊ ዞን ዋና ከተማ | Awi Zone Capital' },
  { id: 'lalibela', name: 'ላሊበላ', nameEn: 'Lalibela', region: 'Amhara', population: '30K+', icon: '⛪', color: 'from-orange-600 to-red-700', description: 'የዩኔስኮ ቅርስ ከተማ | UNESCO Heritage Site' },

  // ===================== OROMIA REGION =====================
  { id: 'adama', name: 'አዳማ', nameEn: 'Adama', region: 'Oromia', population: '500K+', icon: '🏭', color: 'from-orange-500 to-red-600', description: 'የመኪና እና የኢንዱስትሪ ከተማ | Automotive & Industrial City' },
  { id: 'jimma', name: 'ጅማ', nameEn: 'Jimma', region: 'Oromia', population: '250K+', icon: '☕', color: 'from-emerald-500 to-green-600', description: 'የቡና እና የንግድ ከተማ | Coffee & Trade City' },
  { id: 'bishoftu', name: 'ቢሾፍቱ', nameEn: 'Bishoftu', region: 'Oromia', population: '150K+', icon: '✈️', color: 'from-sky-500 to-blue-600', description: 'የሀይቆች እና የአየር ሃይል ከተማ | City of Lakes & Air Force' },
  { id: 'asella', name: 'አሰላ', nameEn: 'Asella', region: 'Oromia', population: '130K+', icon: '🏔️', color: 'from-amber-500 to-yellow-600', description: 'የአርሲ ዋና ከተማ እና የእርሻ ማዕከል | Arsi Capital & Agriculture' },
  { id: 'shashemene', name: 'ሻሸመኔ', nameEn: 'Shashemene', region: 'Oromia', population: '150K+', icon: '🛍️', color: 'from-purple-500 to-pink-600', description: 'የንግድ እና የኢንዱስትሪ ከተማ | Trade & Industrial City' },
  { id: 'robe', name: 'ሮቤ', nameEn: 'Robe', region: 'Oromia', population: '80K+', icon: '🌄', color: 'from-orange-500 to-red-600', description: 'የባሌ ተራራ በር | Bale Mountains Gateway' },
  { id: 'ginir', name: 'ጊኒር', nameEn: 'Ginir', region: 'Oromia', population: '60K+', icon: '🏞️', color: 'from-green-500 to-teal-600', description: 'የባሌ ምስራቅ የንግድ ማዕከል | East Bale Trade Center' },
  { id: 'yabelo', name: 'ያቤሎ', nameEn: 'Yabelo', region: 'Oromia', population: '50K+', icon: '🐪', color: 'from-amber-500 to-yellow-600', description: 'የእንስሳት እርባታ እና የንግድ ከተማ | Livestock & Trade City' },
  { id: 'moyale', name: 'ሞያሌ', nameEn: 'Moyale', region: 'Oromia', population: '40K+', icon: '🛣️', color: 'from-red-500 to-rose-600', description: 'የኢትዮ-ኬንያ ድንበር ከተማ | Ethio-Kenya Border Town' },
  { id: 'chiro', name: 'ቺሮ', nameEn: 'Chiro', region: 'Oromia', population: '80K+', icon: '🏔️', color: 'from-teal-500 to-green-600', description: 'የምስራቅ ሀረርጌ ዋና ከተማ | East Hararghe Capital' },
  { id: 'fiche', name: 'ፊጬ', nameEn: 'Fiche', region: 'Oromia', population: '70K+', icon: '🌾', color: 'from-yellow-500 to-amber-600', description: 'የሰሜን ሸዋ የእህል ማዕከል | North Shewa Grain Center' },
  { id: 'woliso', name: 'ወሊሶ', nameEn: 'Woliso', region: 'Oromia', population: '50K+', icon: '💧', color: 'from-cyan-500 to-blue-600', description: 'የሙቀት ምንጭ እና የቱሪዝም ከተማ | Hot Springs & Tourism' },
  { id: 'ambo', name: 'አምቦ', nameEn: 'Ambo', region: 'Oromia', population: '100K+', icon: '💧', color: 'from-blue-500 to-cyan-600', description: 'የማዕድን ውሃ እና የግብርና ከተማ | Mineral Water & Agriculture' },
  { id: 'nekemte', name: 'ነቀምቴ', nameEn: 'Nekemte', region: 'Oromia', population: '150K+', icon: '☕', color: 'from-lime-500 to-green-600', description: 'የቡና እና የንግድ ከተማ | Coffee & Trade City' },
  { id: 'gimbi', name: 'ጊምቢ', nameEn: 'Gimbi', region: 'Oromia', population: '60K+', icon: '🏔️', color: 'from-amber-600 to-orange-700', description: 'የምዕራብ ወለጋ የንግድ ማዕከል | West Wollega Trade Center' },
  { id: 'dembi-dollo', name: 'ደምቢ ዶሎ', nameEn: 'Dembi Dollo', region: 'Oromia', population: '50K+', icon: '💰', color: 'from-yellow-600 to-amber-700', description: 'የወርቅ ማዕድን እና የንግድ ከተማ | Gold Mining & Trade City' },
  { id: 'shambu', name: 'ሻምቡ', nameEn: 'Shambu', region: 'Oromia', population: '50K+', icon: '🌾', color: 'from-green-600 to-emerald-700', description: 'የሆሮ ጉዱሩ ዋና ከተማ | Horo Guduru Capital' },
  { id: 'metu', name: 'መቱ', nameEn: 'Metu', region: 'Oromia', population: '60K+', icon: '🌿', color: 'from-emerald-600 to-green-700', description: 'የቡና እና የግብርና ከተማ | Coffee & Agriculture City' },
  { id: 'bedele', name: 'በደሌ', nameEn: 'Bedele', region: 'Oromia', population: '40K+', icon: '🍺', color: 'from-amber-600 to-yellow-700', description: 'የቢራ ፋብሪካ እና የቡና ከተማ | Brewery & Coffee City' },
  { id: 'bule-hora', name: 'ቡሌ ሆራ', nameEn: 'Bule Hora', region: 'Oromia', population: '70K+', icon: '🎓', color: 'from-purple-600 to-indigo-700', description: 'የቡሌ ሆራ ዩኒቨርሲቲ ከተማ | Bule Hora University City' },
  { id: 'negele-borana', name: 'ነገሌ ቦረና', nameEn: 'Negele Borana', region: 'Oromia', population: '60K+', icon: '🐪', color: 'from-orange-600 to-red-700', description: 'የቦረና የእንስሳት እርባታ ማዕከል | Borana Livestock Center' },
  { id: 'ziway', name: 'ዚዋይ', nameEn: 'Ziway', region: 'Oromia', population: '80K+', icon: '🐟', color: 'from-cyan-600 to-blue-700', description: 'የአሳ ማጥመድ እና የቱሪዝም ከተማ | Fishing & Tourism City' },
  { id: 'mojo', name: 'ሞጆ', nameEn: 'Mojo', region: 'Oromia', population: '50K+', icon: '🚛', color: 'from-stone-600 to-gray-700', description: 'የሎጂስቲክስ እና የኢንዱስትሪ ከተማ | Logistics & Industrial City' },
  { id: 'dodola', name: 'ዶዶላ', nameEn: 'Dodola', region: 'Oromia', population: '30K+', icon: '🏔️', color: 'from-green-700 to-emerald-800', description: 'የባሌ ተራራ መግቢያ | Bale Mountains Entry Point' },
  { id: 'gera', name: 'ጌራ', nameEn: 'Gera', region: 'Oromia', population: '25K+', icon: '☕', color: 'from-lime-700 to-green-800', description: 'የቡና ማምረቻ አካባቢ | Coffee Production Area' },
  { id: 'agaro', name: 'አጋሮ', nameEn: 'Agaro', region: 'Oromia', population: '40K+', icon: '☕', color: 'from-emerald-700 to-green-800', description: 'የቡና እና የንግድ ከተማ | Coffee & Trade City' },
  { id: 'lemu', name: 'ለሙ', nameEn: 'Lemu', region: 'Oromia', population: '20K+', icon: '🌾', color: 'from-yellow-700 to-amber-800', description: 'የእህል እርሻ አካባቢ | Grain Farming Area' },
  { id: 'hagere-mariam', name: 'ሀገረ ማርያም', nameEn: 'Hagere Mariam', region: 'Oromia', population: '40K+', icon: '🏔️', color: 'from-gray-700 to-gray-900', description: 'የደቡብ ኢትዮጵያ ከተማ | Southern Ethiopia City' },
  { id: 'shakiso', name: 'ሻኪሶ', nameEn: 'Shakiso', region: 'Oromia', population: '35K+', icon: '💰', color: 'from-amber-700 to-orange-800', description: 'የወርቅ ማዕድን ከተማ | Gold Mining City' },
  { id: 'kibre-mengist', name: 'ቅብረ መንግስት', nameEn: 'Kibre Mengist', region: 'Oromia', population: '45K+', icon: '🏔️', color: 'from-slate-700 to-gray-900', description: 'የደቡብ ኢትዮጵያ ከተማ | Southern Ethiopia City' },
  { id: 'wachile', name: 'ዋቺሌ', nameEn: 'Wachile', region: 'Oromia', population: '20K+', icon: '🐪', color: 'from-orange-700 to-red-800', description: 'የእንስሳት እርባታ አካባቢ | Livestock Area' },
  { id: 'goba', name: 'ጎባ', nameEn: 'Goba', region: 'Oromia', population: '35K+', icon: '🏔️', color: 'from-cyan-700 to-blue-800', description: 'የባሌ ተራራ መግቢያ | Bale Mountains Entry Point' },
  { id: 'sinana', name: 'ሲናና', nameEn: 'Sinana', region: 'Oromia', population: '25K+', icon: '🌾', color: 'from-green-700 to-teal-800', description: 'የእህል እርሻ አካባቢ | Grain Farming Area' },
  { id: 'dinsho', name: 'ዲንሾ', nameEn: 'Dinsho', region: 'Oromia', population: '20K+', icon: '🏞️', color: 'from-emerald-700 to-green-800', description: 'የባሌ ተራራ ብሔራዊ ፓርክ | Bale Mountains National Park' },

  // ===================== SOMALI REGION =====================
  { id: 'jijiga', name: 'ጅጅጋ', nameEn: 'Jijiga', region: 'Somali', population: '200K+', icon: '🐪', color: 'from-amber-500 to-orange-600', description: 'የንግድ እና የእንስሳት ከተማ | Trade & Livestock City' },
  { id: 'degehabur', name: 'ደገሃቡር', nameEn: 'Degehabur', region: 'Somali', population: '60K+', icon: '🏔️', color: 'from-yellow-600 to-amber-700', description: 'የሶማሌ ክልል ከተማ | Somali Region City' },
  { id: 'kebri-dehar', name: 'ቀብሪ ደሃር', nameEn: 'Kebri Dehar', region: 'Somali', population: '80K+', icon: '🏔️', color: 'from-orange-600 to-red-700', description: 'የሶማሌ ክልል የንግድ ማዕከል | Somali Region Trade Center' },
  { id: 'gode', name: 'ጎዴ', nameEn: 'Gode', region: 'Somali', population: '50K+', icon: '🏔️', color: 'from-amber-600 to-orange-700', description: 'የሶማሌ ክልል ከተማ | Somali Region City' },
  { id: 'warder', name: 'ዋርደር', nameEn: 'Warder', region: 'Somali', population: '40K+', icon: '🐪', color: 'from-yellow-700 to-amber-800', description: 'የሶማሌ ክልል ከተማ | Somali Region City' },
  { id: 'shilabo', name: 'ሺላቦ', nameEn: 'Shilabo', region: 'Somali', population: '30K+', icon: '🏔️', color: 'from-orange-700 to-red-800', description: 'የሶማሌ ክልል ከተማ | Somali Region City' },
  { id: 'kelafo', name: 'ከላፎ', nameEn: 'Kelafo', region: 'Somali', population: '45K+', icon: '🏔️', color: 'from-amber-700 to-yellow-800', description: 'የሶማሌ ክልል ከተማ | Somali Region City' },
  { id: 'mustahil', name: 'ሙስታሂል', nameEn: 'Mustahil', region: 'Somali', population: '25K+', icon: '🏔️', color: 'from-stone-700 to-gray-900', description: 'የሶማሌ ክልል ከተማ | Somali Region City' },
  { id: 'ferfer', name: 'ፌርፌር', nameEn: 'Ferfer', region: 'Somali', population: '30K+', icon: '🛣️', color: 'from-slate-700 to-gray-900', description: 'የኢትዮ-ሶማሊያ ድንበር ከተማ | Ethio-Somalia Border Town' },

  // ===================== HARARI REGION =====================
  { id: 'harar', name: 'ሀረር', nameEn: 'Harar', region: 'Harari', population: '150K+', icon: '🏛️', color: 'from-red-500 to-rose-600', description: 'የባህል ቅርስ እና የእስላም ቅድስት ከተማ | Cultural Heritage & Islamic City' },

  // ===================== SIDAMA REGION =====================
  { id: 'hawassa', name: 'ሀዋሳ', nameEn: 'Hawassa', region: 'Sidama', population: '387K+', icon: '🏞️', color: 'from-teal-500 to-green-600', description: 'የኢንዱስትሪ ፓርክ እና የሀይቅ ከተማ | Industrial Park & Lake City' },
  { id: 'yirgalem', name: 'ይርጋለም', nameEn: 'Yirgalem', region: 'Sidama', population: '40K+', icon: '☕', color: 'from-emerald-600 to-green-700', description: 'የቡና እና የግብርና ከተማ | Coffee & Agriculture City' },

  // ===================== SOUTH ETHIOPIA REGION =====================
  { id: 'arba-minch', name: 'አርባ ምንጭ', nameEn: 'Arba Minch', region: 'South', population: '150K+', icon: '🏞️', color: 'from-teal-600 to-green-700', description: 'የቱሪዝም እና የግብርና ከተማ | Tourism & Agriculture City' },
  { id: 'sodo', name: 'ሶዶ', nameEn: 'Sodo', region: 'South', population: '150K+', icon: '🛍️', color: 'from-slate-600 to-gray-700', description: 'የንግድ እና የግብርና ከተማ | Trade & Agriculture City' },
  { id: 'dilla', name: 'ዲላ', nameEn: 'Dilla', region: 'South', population: '100K+', icon: '☕', color: 'from-amber-600 to-orange-700', description: 'የቡና እና የንግድ ከተማ | Coffee & Trade City' },
  { id: 'sawla', name: 'ሳውላ', nameEn: 'Sawla', region: 'South', population: '50K+', icon: '🏔️', color: 'from-green-600 to-teal-700', description: 'የደቡብ ኢትዮጵያ ከተማ | Southern Ethiopia City' },
  { id: 'jinka', name: 'ጂንካ', nameEn: 'Jinka', region: 'South', population: '70K+', icon: '🏔️', color: 'from-orange-600 to-red-700', description: 'የደቡብ ኢትዮጵያ ባህላዊ ከተማ | Southern Ethiopia Cultural City' },
  { id: 'konso', name: 'ኮንሶ', nameEn: 'Konso', region: 'South', population: '60K+', icon: '🏔️', color: 'from-amber-600 to-yellow-700', description: 'የዩኔስኮ ቅርስ ከተማ | UNESCO Heritage Site' },
  { id: 'karat', name: 'ካራት', nameEn: 'Karat', region: 'South', population: '50K+', icon: '🏔️', color: 'from-gray-600 to-gray-800', description: 'የኮንሶ ዞን ዋና ከተማ | Konso Zone Capital' },
  { id: 'bonga', name: 'ቦንጋ', nameEn: 'Bonga', region: 'South', population: '30K+', icon: '☕', color: 'from-lime-600 to-green-700', description: 'የቡና ማምረቻ አካባቢ | Coffee Production Area' },
  { id: 'mizan-teferi', name: 'ሚዛን ተፈሪ', nameEn: 'Mizan Teferi', region: 'South', population: '45K+', icon: '🏔️', color: 'from-cyan-600 to-blue-700', description: 'የቤንች ማጂ ዞን ዋና ከተማ | Bench Maji Zone Capital' },
  { id: 'teppi', name: 'ቴፒ', nameEn: 'Teppi', region: 'South', population: '25K+', icon: '🌿', color: 'from-emerald-700 to-green-800', description: 'የቡና እርሻ አካባቢ | Coffee Farming Area' },
  { id: 'gereb', name: 'ገሬብ', nameEn: 'Gereb', region: 'South', population: '20K+', icon: '🏔️', color: 'from-stone-700 to-gray-900', description: 'የደቡብ ኢትዮጵያ ከተማ | Southern Ethiopia City' },
  { id: 'key-afar', name: 'ቀይ አፋር', nameEn: 'Key Afar', region: 'South', population: '25K+', icon: '🏔️', color: 'from-red-700 to-rose-800', description: 'የደቡብ ኢትዮጵያ ከተማ | Southern Ethiopia City' },
  { id: 'bako', name: 'ባኮ', nameEn: 'Bako', region: 'South', population: '30K+', icon: '🏔️', color: 'from-teal-700 to-cyan-800', description: 'የደቡብ ኢትዮጵያ ከተማ | Southern Ethiopia City' },
  { id: 'welkite', name: 'ወልቂጤ', nameEn: 'Welkite', region: 'South', population: '50K+', icon: '🏔️', color: 'from-purple-700 to-indigo-800', description: 'የጉራጌ ዞን ዋና ከተማ | Gurage Zone Capital' },

  // ===================== BENISHANGUL-GUMUZ REGION =====================
  { id: 'assosa', name: 'አሶሳ', nameEn: 'Assosa', region: 'Benishangul', population: '100K+', icon: '🌿', color: 'from-emerald-600 to-green-700', description: 'የንግድ እና የግብርና ከተማ | Trade & Agriculture City' },
  { id: 'gilgel-beles', name: 'ግልገል በለስ', nameEn: 'Gilgel Beles', region: 'Benishangul', population: '40K+', icon: '💧', color: 'from-cyan-600 to-blue-700', description: 'የግልገል በለስ ከተማ | Gilgel Beles City' },
  { id: 'kamashi', name: 'ካማሺ', nameEn: 'Kamashi', region: 'Benishangul', population: '30K+', icon: '🏔️', color: 'from-orange-700 to-red-800', description: 'የካማሺ ዞን ዋና ከተማ | Kamashi Zone Capital' },
  { id: 'metekel', name: 'ሜተከል', nameEn: 'Metekel', region: 'Benishangul', population: '35K+', icon: '🏔️', color: 'from-green-700 to-teal-800', description: 'የሜተከል ዞን ዋና ከተማ | Metekel Zone Capital' },
  { id: 'dibate', name: 'ዲባቴ', nameEn: 'Dibate', region: 'Benishangul', population: '25K+', icon: '🏔️', color: 'from-amber-700 to-yellow-800', description: 'የቤንሻንጉል ክልል ከተማ | Benishangul Region City' },

  // ===================== GAMBELLA REGION =====================
  { id: 'gambella', name: 'ጋምቤላ', nameEn: 'Gambella', region: 'Gambella', population: '80K+', icon: '🏞️', color: 'from-teal-600 to-green-700', description: 'የጋምቤላ ክልል ዋና ከተማ | Gambella Region Capital' },
  { id: 'meti', name: 'ሜቲ', nameEn: 'Meti', region: 'Gambella', population: '30K+', icon: '🏔️', color: 'from-blue-700 to-indigo-800', description: 'የጋምቤላ ክልል ከተማ | Gambella Region City' },
  { id: 'fugnido', name: 'ፉኝዶ', nameEn: 'Fugnido', region: 'Gambella', population: '40K+', icon: '🏞️', color: 'from-emerald-700 to-green-800', description: 'የስደተኞች ከተማ | Refugee City' },
  { id: 'itur', name: 'ኢቱር', nameEn: 'Itur', region: 'Gambella', population: '20K+', icon: '🏔️', color: 'from-gray-700 to-gray-900', description: 'የጋምቤላ ክልል ከተማ | Gambella Region City' },

  // ===================== AFAR REGION =====================
  { id: 'semera', name: 'ሰሜራ', nameEn: 'Semera', region: 'Afar', population: '50K+', icon: '🐪', color: 'from-amber-600 to-yellow-700', description: 'የአፋር ክልል ዋና ከተማ | Afar Region Capital' },
  { id: 'asaita', name: 'አሳይታ', nameEn: 'Asaita', region: 'Afar', population: '30K+', icon: '🏔️', color: 'from-orange-700 to-red-800', description: 'የአፋር ክልል ታሪካዊ ከተማ | Afar Region Historical City' },
  { id: 'logiya', name: 'ሎጊያ', nameEn: 'Logiya', region: 'Afar', population: '25K+', icon: '🛣️', color: 'from-yellow-700 to-amber-800', description: 'የአፋር ክልል ከተማ | Afar Region City' },
  { id: 'abila', name: 'አቢላ', nameEn: 'Abila', region: 'Afar', population: '20K+', icon: '🐪', color: 'from-stone-700 to-gray-900', description: 'የአፋር ክልል ከተማ | Afar Region City' },
  { id: 'dubti', name: 'ዱብቲ', nameEn: 'Dubti', region: 'Afar', population: '35K+', icon: '🏔️', color: 'from-slate-700 to-gray-900', description: 'የአፋር ክልል ከተማ | Afar Region City' },
  { id: 'elidar', name: 'ኤልዳር', nameEn: 'Elidar', region: 'Afar', population: '25K+', icon: '🏔️', color: 'from-gray-800 to-gray-900', description: 'የአፋር ክልል ከተማ | Afar Region City' },
  { id: 'chifra', name: 'ቺፍራ', nameEn: 'Chifra', region: 'Afar', population: '30K+', icon: '🏔️', color: 'from-amber-800 to-orange-900', description: 'የአፋር ክልል ከተማ | Afar Region City' }
];

// Merkato VIP Data
const merkatoVip = {
  id: 'merkato',
  name: 'መርካቶ',
  nameEn: 'Merkato',
  icon: '🏪',
  color: 'from-yellow-500 to-orange-600',
  prize: '40M ETB',
  description: 'የአፍሪካ ትልቁ ገበያ',
  descriptionEn: "Africa's Largest Market",
  features: ['⭐ Daily 1,000,000 ETB', '🏆 Weekly 10,000,000 ETB', '👑 Monthly 40,000,000 ETB']
};

export default function Listings() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [pools, setPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAllCities, setShowAllCities] = useState(false);
  const [showAgentApplication, setShowAgentApplication] = useState(false);
  const [language, setLanguage] = useState('am');
  const [is3D, setIs3D] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    city: 'all',
    status: 'active',
    sort: 'newest'
  });
  const animationRef = useRef(null);

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
  }, []);

  // Auto-rotation for 3D effect
  useEffect(() => {
    if (is3D) {
      const animate = () => {
        setRotation(prev => (prev + 0.1) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [is3D]);

  useEffect(() => {
    checkUser();
    fetchPools();
  }, []);

  const toggle3D = () => {
    setIs3D(!is3D);
  };

  const get3DTransform = () => {
    if (!is3D) return 'none';
    if (isHovered) {
      return `perspective(800px) rotateY(${rotation}deg) scale(1.01)`;
    }
    return `perspective(800px) rotateY(${rotation}deg)`;
  };

  const toggleLanguage = () => {
    const newLang = language === 'am' ? 'en' : 'am';
    setLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
    i18n.changeLanguage(newLang);
  };

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        setProfile(profile);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  }

  async function fetchPools() {
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const allPools = data || [];
      setPools(allPools);
      setFeaturedPools(allPools.filter(pool => pool.is_featured === true));
      
    } catch (error) {
      console.error('Error loading pools:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const visibleCities = showAllCities ? cityVipPrograms : cityVipPrograms.slice(0, 12);

  return (
    <NoSSR>
      <>
        <Head>
          <title>Browse Prizes & VIP Programs - Abbaa Carraa</title>
          <meta name="description" content="Join regular pools or VIP programs in over 94 Ethiopian cities to win up to 40 Million ETB" />
        </Head>

        <DashboardLayout
          title={language === 'am' ? 'ዕድሎችን ይመልከቱ' : 'Browse Opportunities'}
          subtitle={language === 'am' ? 'የተለመዱ ፑሎችን ወይም ቪአይፒ ፕሮግራሞችን ይቀላቀሉ' : 'Join regular pools or VIP programs'}
          icon="🎯"
          bgGradient="from-blue-600 to-cyan-500"
          user={user}
          profile={profile}
          language={language}
          toggleLanguage={toggleLanguage}
          show3D={is3D}
        >
          {/* 3D Controls */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={toggle3D}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  is3D 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {is3D ? '🔄 3D ON' : '🔄 3D OFF'}
              </button>
              {user && (
                <NotificationCenter 
                  userId={user.id}
                  maxDisplay={3}
                  showSounds={true}
                  autoHide={true}
                  autoHideDuration={5000}
                />
              )}
            </div>
            <Link href="/activity" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              📋 {language === 'am' ? 'እንቅስቃሴዎች' : 'Activity Log'}
            </Link>
          </div>

          {/* Main Content with 3D Effect */}
          <div 
            className="transition-all duration-500"
            style={{
              transform: get3DTransform(),
              transformStyle: 'preserve-3d',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Filter Bar */}
            <PoolFilters
              onFilterChange={handleFilterChange}
              initialFilters={filters}
              show3D={is3D}
              autoRotate={false}
              showSearch={true}
              showSort={true}
              showReset={true}
              className="mb-8"
            />

            {/* VIP Programs Section */}
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">👑</span>
                <h2 className="text-2xl font-bold text-gray-800">
                  {language === 'am' ? 'ቪአይፒ ፕሮግራሞች' : 'VIP Programs'}
                </h2>
                <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  {language === 'am' ? 'እስከ 40 ሚሊዮን ብር' : 'Up to 40M ETB'}
                </span>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                  {cityVipPrograms.length} {language === 'am' ? 'ከተሞች' : 'Cities'}
                </span>
              </div>

              {/* Merkato VIP Card */}
              <Link href="/merkato-vip">
                <div className={`bg-gradient-to-r ${merkatoVip.color} rounded-2xl p-6 text-white hover:shadow-xl transition transform hover:scale-105 cursor-pointer mb-8`}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-6xl">{merkatoVip.icon}</div>
                      <div>
                        <h3 className="text-2xl font-bold">{merkatoVip.name} VIP</h3>
                        <p className="text-sm opacity-90">{merkatoVip.nameEn} VIP</p>
                        <p className="text-xs opacity-75 mt-1">{merkatoVip.description} | {merkatoVip.descriptionEn}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{merkatoVip.prize}</div>
                      <p className="text-xs opacity-75">{language === 'am' ? 'ከፍተኛ ሽልማት' : 'Max Prize'}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {merkatoVip.features.map((feature, idx) => (
                      <span key={idx} className="text-xs bg-white/20 rounded-full px-3 py-1">{feature}</span>
                    ))}
                  </div>
                  <button className="mt-4 w-full md:w-auto bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg text-sm font-semibold transition">
                    {language === 'am' ? 'መርካቶ ቪአይፒ ይቀላቀሉ →' : 'Join Merkato VIP →'}
                  </button>
                </div>
              </Link>

              {/* Ethiopian Cities VIP Grid */}
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🏙️</span>
                {language === 'am' ? 'የኢትዮጵያ ከተሞች ቪአይፒ' : 'Ethiopian Cities VIP'}
                <span className="text-sm font-normal text-gray-500">
                  ({cityVipPrograms.length} {language === 'am' ? 'ከተሞች' : 'Cities'} • {language === 'am' ? 'ንቁ' : 'Active'})
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {visibleCities.map((city) => (
                  <Link key={city.id} href={`/cities/${city.id}`}>
                    <div className={`bg-gradient-to-r ${city.color} rounded-xl p-4 text-white hover:shadow-lg transition transform hover:scale-105 cursor-pointer h-full`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-3xl">{city.icon}</div>
                        <span className="text-[10px] bg-white/20 rounded-full px-2 py-0.5">{city.population}</span>
                      </div>
                      <h4 className="font-bold text-lg">{city.name}</h4>
                      <p className="text-xs opacity-80">{city.nameEn}</p>
                      <p className="text-[11px] opacity-70 mt-1">{city.region}</p>
                      <p className="text-[10px] opacity-60 mt-1 line-clamp-2">{city.description}</p>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-[10px] bg-white/20 rounded-full px-2 py-0.5">Up to 40M ETB</span>
                        <span className="text-sm">{language === 'am' ? 'ይቀላቀሉ →' : 'Join →'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Show More / Show Less Button */}
              {cityVipPrograms.length > 12 && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => setShowAllCities(!showAllCities)}
                    className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1 mx-auto"
                  >
                    {showAllCities 
                      ? (language === 'am' ? 'ያንሱ ↑' : 'Show Less ↑') 
                      : (language === 'am' ? `ሁሉንም ${cityVipPrograms.length} ከተሞች ያሳዩ ↓` : `Show All ${cityVipPrograms.length} Cities ↓`)}
                  </button>
                </div>
              )}
            </div>

            {/* Regular Pools Section */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">🏊</span>
                <h2 className="text-2xl font-bold text-gray-800">
                  {language === 'am' ? 'መደበኛ ፑሎች' : 'Regular Pools'}
                </h2>
                <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                  {language === 'am' ? 'ንቁ' : 'Active'}
                </span>
              </div>

              <PoolListings
                initialFilters={filters}
                itemsPerPage={12}
                showFilters={false}
                showPagination={true}
                showViewToggle={true}
                showStats={true}
                featuredFirst={true}
                autoLoad={true}
              />
            </div>

            {/* Become an Agent Section */}
            <div className="mt-16">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white shadow-xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl">🤝</span>
                    <div>
                      <h3 className="text-2xl font-bold">
                        {language === 'am' ? 'ለመደበኛ ፑሎች ወኪል ይሁኑ' : 'Become an Agent for Regular Pools'}
                      </h3>
                      <p className="text-gray-300 mt-1">
                        {language === 'am' 
                          ? 'በሚያመጧቸው ደንበኞች ሁሉ 10% ኮሚሽን ያግኙ!'
                          : 'Earn 10% commission on every successful contribution from customers you bring!'}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        💰 {language === 'am' 
                          ? 'ለምሳሌ: ደንበኛ 10,000 ብር አበርክቷል → እርስዎ 1,000 ብር ያገኛሉ'
                          : 'Example: Customer contributes 10,000 ETB → You earn 1,000 ETB'}
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
                    {language === 'am' ? 'እንደ ወኪል ያመልክቱ' : 'Apply as Agent'}
                    <span>→</span>
                  </button>
                </div>

                {/* Commission Info */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl mb-1">💰</div>
                      <p className="font-semibold">{language === 'am' ? '10% ኮሚሽን' : '10% Commission'}</p>
                      <p className="text-xs text-gray-400">
                        {language === 'am' ? 'በእያንዳንዱ ተሳካ አበርክቶ' : 'On every successful contribution'}
                      </p>
                    </div>
                    <div>
                      <div className="text-2xl mb-1">🔗</div>
                      <p className="font-semibold">{language === 'am' ? 'ማጣቀሻ ሊንክ' : 'Referral Link'}</p>
                      <p className="text-xs text-gray-400">
                        {language === 'am' ? 'ሁሉንም ደንበኞችዎን ይከታተሉ' : 'Track all your customers'}
                      </p>
                    </div>
                    <div>
                      <div className="text-2xl mb-1">💳</div>
                      <p className="font-semibold">{language === 'am' ? 'ቀላል መውጫ' : 'Easy Withdrawal'}</p>
                      <p className="text-xs text-gray-400">
                        {language === 'am' ? 'ቴሌብር ወይም የባንክ ዝውውር' : 'TeleBirr or Bank Transfer'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>

        {/* Agent Application Modal */}
        {showAgentApplication && (
          <UnifiedAgentApplication 
            onClose={() => setShowAgentApplication(false)} 
            preSelectedProgram="regular"
          />
        )}
      </>
    </NoSSR>
  );
}
