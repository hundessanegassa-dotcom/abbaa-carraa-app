// pages/cities/index.js - COMPLETE CITY VIP LISTING PAGE (ALL CITIES)
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

// ALL ETHIOPIAN CITIES - COMPLETE LIST (80+ CITIES)
const ethiopianCities = [
  // ===================== CENTRAL & MAJOR CITIES =====================
  { id: 'addis-ababa', name: 'አዲስ አበባ', nameEn: 'Addis Ababa', region: 'Central', population: '5M+', icon: '🏙️', color: 'from-blue-500 to-cyan-600', description: 'የኢትዮጵያ የንግድ ልብ | Heart of Ethiopian Commerce', prizeAmount: 'Up to 40M ETB' },
  { id: 'shaggar', name: 'ሸገር', nameEn: 'Shaggar City', region: 'Oromia', population: '3M+', icon: '🏗️', color: 'from-teal-500 to-green-600', description: 'ብልህ ከተማ እና የኢንቨስትመንት ማዕከል | Smart City & Investment Hub', prizeAmount: 'Up to 40M ETB' },
  { id: 'dire-dawa', name: 'ድሬ ዳዋ', nameEn: 'Dire Dawa', region: 'Dire Dawa', population: '535K+', icon: '🚂', color: 'from-green-500 to-teal-600', description: 'የንግድ እና የማኑፋክቸሪንግ ከተማ | Trade & Manufacturing Hub', prizeAmount: 'Up to 40M ETB' },
  
  // ===================== TIGRAY REGION =====================
  { id: 'mekelle', name: 'መቀሌ', nameEn: 'Mekelle', region: 'Tigray', population: '500K+', icon: '🏭', color: 'from-purple-500 to-pink-600', description: 'ከፍተኛ የኢኮኖሚ ዕድገት | Highest GDP per Capita', prizeAmount: 'Up to 40M ETB' },
  { id: 'axum', name: 'አክሱም', nameEn: 'Axum', region: 'Tigray', population: '70K+', icon: '🏛️', color: 'from-red-500 to-rose-600', description: 'የታሪካዊ ቅርስ ከተማ | Historical Heritage City', prizeAmount: 'Up to 40M ETB' },
  { id: 'adigrat', name: 'አዲግራት', nameEn: 'Adigrat', region: 'Tigray', population: '80K+', icon: '🏔️', color: 'from-gray-500 to-slate-600', description: 'የሰሜን ትግራይ የንግድ ማዕከል | North Tigray Trade Center', prizeAmount: 'Up to 40M ETB' },
  { id: 'shire', name: 'ሽሬ', nameEn: 'Shire', region: 'Tigray', population: '100K+', icon: '🏔️', color: 'from-stone-500 to-stone-700', description: 'የምዕራብ ትግራይ ዋና ከተማ | Capital of West Tigray', prizeAmount: 'Up to 40M ETB' },
  { id: 'mekoni', name: 'መቆኒ', nameEn: 'Mekoni', region: 'Tigray', population: '50K+', icon: '🏔️', color: 'from-gray-600 to-gray-800', description: 'የምዕራብ ትግራይ ከተማ | West Tigray Town', prizeAmount: 'Up to 40M ETB' },
  { id: 'maychew', name: 'ማይጨው', nameEn: 'Maychew', region: 'Tigray', population: '40K+', icon: '🏔️', color: 'from-gray-600 to-gray-800', description: 'የደቡብ ትግራይ ከተማ | South Tigray Town', prizeAmount: 'Up to 40M ETB' },
  
  // ===================== AMHARA REGION =====================
  { id: 'gondar', name: 'ጎንደር', nameEn: 'Gondar', region: 'Amhara', population: '350K+', icon: '🏰', color: 'from-amber-500 to-yellow-600', description: 'የባህል እና የቱሪዝም ከተማ | Culture & Tourism City', prizeAmount: 'Up to 40M ETB' },
  { id: 'bahir-dar', name: 'ባህር ዳር', nameEn: 'Bahir Dar', region: 'Amhara', population: '350K+', icon: '🏞️', color: 'from-cyan-500 to-blue-600', description: 'የቱሪዝም እና የጨርቃጨርቅ ከተማ | Tourism & Textile City', prizeAmount: 'Up to 40M ETB' },
  { id: 'dessie', name: 'ደሴ', nameEn: 'Dessie', region: 'Amhara', population: '229K+', icon: '🏔️', color: 'from-yellow-500 to-orange-600', description: 'የንግድ እና የእርሻ ከተማ | Trade & Agriculture City', prizeAmount: 'Up to 40M ETB' },
  { id: 'debre-markos', name: 'ደብረ ማርቆስ', nameEn: 'Debre Markos', region: 'Amhara', population: '120K+', icon: '⛪', color: 'from-blue-500 to-indigo-600', description: 'የምስራቅ ጎጃም ዋና ከተማ | Capital of East Gojjam', prizeAmount: 'Up to 40M ETB' },
  { id: 'finote-selam', name: 'ፍኖተ ሰላም', nameEn: 'Finote Selam', region: 'Amhara', population: '80K+', icon: '🌅', color: 'from-orange-500 to-red-600', description: 'የምዕራብ ጎጃም ዋና ከተማ | Capital of West Gojjam', prizeAmount: 'Up to 40M ETB' },
  { id: 'woldia', name: 'ወልዲያ', nameEn: 'Woldia', region: 'Amhara', population: '60K+', icon: '🎓', color: 'from-indigo-500 to-purple-600', description: 'የወልዲያ ዩኒቨርሲቲ ከተማ | Woldia University City', prizeAmount: 'Up to 40M ETB' },
  { id: 'debre-birhan', name: 'ደብረ ብርሃን', nameEn: 'Debre Birhan', region: 'Amhara', population: '100K+', icon: '⭐', color: 'from-yellow-500 to-amber-600', description: 'የፀሐይ ብርሃን ከተማ | City of Sunlight', prizeAmount: 'Up to 40M ETB' },
  { id: 'kombolcha', name: 'ኮምቦልቻ', nameEn: 'Kombolcha', region: 'Amhara', population: '120K+', icon: '🏭', color: 'from-slate-600 to-gray-700', description: 'የኢንዱስትሪ ዞን እና ደረቅ ወደብ | Industrial Zone & Dry Port', prizeAmount: 'Up to 40M ETB' },
  { id: 'sekota', name: 'ሰቆጣ', nameEn: 'Sekota', region: 'Amhara', population: '40K+', icon: '🏔️', color: 'from-gray-600 to-gray-800', description: 'የዋግ ሽራ ዞን ዋና ከተማ | Capital of Wag Hemra Zone', prizeAmount: 'Up to 40M ETB' },
  { id: 'aykal', name: 'አይከል', nameEn: 'Aykal', region: 'Amhara', population: '35K+', icon: '🏔️', color: 'from-gray-600 to-gray-800', description: 'የምዕራብ ጎጃም ከተማ | West Gojjam Town', prizeAmount: 'Up to 40M ETB' },
  { id: 'metema', name: 'ሜተማ', nameEn: 'Metema', region: 'Amhara', population: '50K+', icon: '🛣️', color: 'from-amber-600 to-orange-700', description: 'የኢትዮ-ሱዳን ድንበር ከተማ | Ethio-Sudan Border Town', prizeAmount: 'Up to 40M ETB' },
  { id: 'debre-tabor', name: 'ደብረ ታቦር', nameEn: 'Debre Tabor', region: 'Amhara', population: '70K+', icon: '⛪', color: 'from-indigo-500 to-purple-600', description: 'የጥንታዊ ገዳማት ከተማ | City of Ancient Monasteries', prizeAmount: 'Up to 40M ETB' },
  
  // ===================== OROMIA REGION =====================
  { id: 'adama', name: 'አዳማ', nameEn: 'Adama', region: 'Oromia', population: '500K+', icon: '🏭', color: 'from-orange-500 to-red-600', description: 'የኢንዱስትሪ እና የንግድ ከተማ | Industrial & Trade City', prizeAmount: 'Up to 40M ETB' },
  { id: 'jimma', name: 'ጅማ', nameEn: 'Jimma', region: 'Oromia', population: '250K+', icon: '☕', color: 'from-emerald-500 to-green-600', description: 'የቡና እና የንግድ ከተማ | Coffee & Trade City', prizeAmount: 'Up to 40M ETB' },
  { id: 'bishoftu', name: 'ቢሾፍቱ', nameEn: 'Bishoftu', region: 'Oromia', population: '150K+', icon: '✈️', color: 'from-sky-500 to-blue-600', description: 'የሀይቆች ከተማ | City of Lakes', prizeAmount: 'Up to 40M ETB' },
  { id: 'asella', name: 'አሰላ', nameEn: 'Asella', region: 'Oromia', population: '130K+', icon: '🏔️', color: 'from-green-500 to-emerald-600', description: 'የአርሲ ዋና ከተማ | Capital of Arsi', prizeAmount: 'Up to 40M ETB' },
  { id: 'shashemene', name: 'ሻሸመኔ', nameEn: 'Shashemene', region: 'Oromia', population: '150K+', icon: '🛍️', color: 'from-purple-500 to-indigo-600', description: 'የንግድ እና የኢንዱስትሪ ከተማ | Trade & Industrial City', prizeAmount: 'Up to 40M ETB' },
  { id: 'robe', name: 'ሮቤ', nameEn: 'Robe', region: 'Oromia', population: '80K+', icon: '🌄', color: 'from-amber-600 to-orange-700', description: 'የባሌ ተራራ በር | Gateway to Bale Mountains', prizeAmount: 'Up to 40M ETB' },
  { id: 'ginir', name: 'ጊኒር', nameEn: 'Ginir', region: 'Oromia', population: '60K+', icon: '🏞️', color: 'from-emerald-600 to-green-700', description: 'የባሌ ምስራቅ የንግድ ማዕከል | Eastern Bale Trade Center', prizeAmount: 'Up to 40M ETB' },
  { id: 'yabelo', name: 'ያቤሎ', nameEn: 'Yabelo', region: 'Oromia', population: '50K+', icon: '🐪', color: 'from-yellow-600 to-amber-700', description: 'የእንስሳት እርባታ እና የንግድ ከተማ | Livestock & Trade City', prizeAmount: 'Up to 40M ETB' },
  { id: 'moyale', name: 'ሞያሌ', nameEn: 'Moyale', region: 'Oromia', population: '40K+', icon: '🛣️', color: 'from-gray-600 to-gray-800', description: 'የኢትዮ-ኬንያ ድንበር ከተማ | Ethio-Kenya Border Town', prizeAmount: 'Up to 40M ETB' },
  { id: 'chiro', name: 'ቺሮ', nameEn: 'Chiro', region: 'Oromia', population: '80K+', icon: '🏔️', color: 'from-orange-600 to-red-700', description: 'የምስራቅ ሀረርጌ ዋና ከተማ | Capital of East Hararghe', prizeAmount: 'Up to 40M ETB' },
  { id: 'fiche', name: 'ፊጬ', nameEn: 'Fiche', region: 'Oromia', population: '70K+', icon: '🌾', color: 'from-green-600 to-teal-700', description: 'የሰሜን ሸዋ የእህል ማዕከል | North Shewa Grain Center', prizeAmount: 'Up to 40M ETB' },
  { id: 'woliso', name: 'ወሊሶ', nameEn: 'Woliso', region: 'Oromia', population: '50K+', icon: '💧', color: 'from-cyan-600 to-blue-700', description: 'የሙቀት ምንጭ እና የቱሪዝም ከተማ | Hot Springs & Tourism City', prizeAmount: 'Up to 40M ETB' },
  { id: 'ambo', name: 'አምቦ', nameEn: 'Ambo', region: 'Oromia', population: '100K+', icon: '💧', color: 'from-green-500 to-teal-500', description: 'የማዕድን ውሃ እና የግብርና ከተማ | Mineral Water & Agriculture City', prizeAmount: 'Up to 40M ETB' },
  { id: 'nekemte', name: 'ነቀምቴ', nameEn: 'Nekemte', region: 'Oromia', population: '150K+', icon: '☕', color: 'from-amber-500 to-yellow-600', description: 'የቡና እና የንግድ ከተማ | Coffee & Trade City', prizeAmount: 'Up to 40M ETB' },
  { id: 'gimbi', name: 'ጊምቢ', nameEn: 'Gimbi', region: 'Oromia', population: '60K+', icon: '🏔️', color: 'from-gray-600 to-gray-800', description: 'የምዕራብ ወለጋ የንግድ ማዕከል | West Wollega Trade Center', prizeAmount: 'Up to 40M ETB' },
  { id: 'dembi-dollo', name: 'ደምቢ ዶሎ', nameEn: 'Dembi Dollo', region: 'Oromia', population: '50K+', icon: '💰', color: 'from-yellow-600 to-amber-700', description: 'የወርቅ ማዕድን እና የንግድ ከተማ | Gold Mining & Trade City', prizeAmount: 'Up to 40M ETB' },
  { id: 'shambu', name: 'ሻምቡ', nameEn: 'Shambu', region: 'Oromia', population: '50K+', icon: '🌾', color: 'from-green-600 to-teal-700', description: 'የሆሮ ጉዱሩ ዋና ከተማ | Capital of Horo Guduru', prizeAmount: 'Up to 40M ETB' },
  { id: 'metu', name: 'መቱ', nameEn: 'Metu', region: 'Oromia', population: '60K+', icon: '🌿', color: 'from-emerald-600 to-green-700', description: 'የቡና እና የግብርና ከተማ | Coffee & Agriculture City', prizeAmount: 'Up to 40M ETB' },
  { id: 'bedele', name: 'በደሌ', nameEn: 'Bedele', region: 'Oromia', population: '40K+', icon: '🍺', color: 'from-orange-600 to-red-700', description: 'የቢራ ፋብሪካ እና የቡና ከተማ | Brewery & Coffee City', prizeAmount: 'Up to 40M ETB' },
  { id: 'bule-hora', name: 'ቡሌ ሆራ', nameEn: 'Bule Hora', region: 'Oromia', population: '70K+', icon: '🎓', color: 'from-purple-600 to-indigo-700', description: 'የቡሌ ሆራ ዩኒቨርሲቲ ከተማ | Bule Hora University City', prizeAmount: 'Up to 40M ETB' },
  { id: 'negele-borana', name: 'ነገሌ ቦረና', nameEn: 'Negele Borana', region: 'Oromia', population: '60K+', icon: '🐪', color: 'from-yellow-600 to-amber-700', description: 'የቦረና የእንስሳት እርባታ ማዕከል | Borana Livestock Center', prizeAmount: 'Up to 40M ETB' },
  { id: 'ziway', name: 'ዚዋይ', nameEn: 'Ziway', region: 'Oromia', population: '80K+', icon: '🐟', color: 'from-cyan-600 to-blue-700', description: 'የአሳ ማጥመድ እና የቱሪዝም ከተማ | Fishing & Tourism City', prizeAmount: 'Up to 40M ETB' },
  
  // ===================== SOMALI REGION =====================
  { id: 'jijiga', name: 'ጅጅጋ', nameEn: 'Jijiga', region: 'Somali', population: '200K+', icon: '🐪', color: 'from-emerald-500 to-teal-600', description: 'የንግድ እና የእንስሳት ከተማ | Trade & Livestock City', prizeAmount: 'Up to 40M ETB' },
  { id: 'degehabur', name: 'ደገሃቡር', nameEn: 'Degehabur', region: 'Somali', population: '60K+', icon: '🏔️', color: 'from-gray-600 to-gray-800', description: 'የሶማሌ ክልል ከተማ | Somali Region Town', prizeAmount: 'Up to 40M ETB' },
  { id: 'kebri-dehar', name: 'ቀብሪ ደሃር', nameEn: 'Kebri Dehar', region: 'Somali', population: '80K+', icon: '🏔️', color: 'from-gray-600 to-gray-800', description: 'የሶማሌ ክልል የንግድ ማዕከል | Somali Region Trade Center', prizeAmount: 'Up to 40M ETB' },
  { id: 'gode', name: 'ጎዴ', nameEn: 'Gode', region: 'Somali', population: '50K+', icon: '🏔️', color: 'from-gray-600 to-gray-800', description: 'የሶማሌ ክልል ከተማ | Somali Region Town', prizeAmount: 'Up to 40M ETB' },
  
  // ===================== HARARI REGION =====================
  { id: 'harar', name: 'ሀረር', nameEn: 'Harar', region: 'Harari', population: '150K+', icon: '🏛️', color: 'from-rose-500 to-pink-600', description: 'የባህል ቅርስ ከተማ | Cultural Heritage City', prizeAmount: 'Up to 40M ETB' },
  
  // ===================== SIDAMA REGION =====================
  { id: 'hawassa', name: 'ሀዋሳ', nameEn: 'Hawassa', region: 'Sidama', population: '387K+', icon: '🏞️', color: 'from-teal-500 to-green-600', description: 'የኢንዱስትሪ ፓርክ ከተማ | Industrial Park City', prizeAmount: 'Up to 40M ETB' },
  { id: 'yirgalem', name: 'ይርጋለም', nameEn: 'Yirgalem', region: 'Sidama', population: '40K+', icon: '☕', color: 'from-green-600 to-teal-700', description: 'የቡና እና የግብርና ከተማ | Coffee & Agriculture Town', prizeAmount: 'Up to 40M ETB' },
  
  // ===================== SOUTH ETHIOPIA REGION =====================
  { id: 'arba-minch', name: 'አርባ ምንጭ', nameEn: 'Arba Minch', region: 'South', population: '150K+', icon: '🏞️', color: 'from-blue-500 to-cyan-600', description: 'የቱሪዝም እና የግብርና ከተማ | Tourism & Agriculture City', prizeAmount: 'Up to 40M ETB' },
  { id: 'sodo', name: 'ሶዶ', nameEn: 'Sodo', region: 'South', population: '150K+', icon: '🛍️', color: 'from-orange-500 to-red-600', description: 'የንግድ እና የግብርና ከተማ | Trade & Agriculture City', prizeAmount: 'Up to 40M ETB' },
  { id: 'dilla', name: 'ዲላ', nameEn: 'Dilla', region: 'South', population: '100K+', icon: '☕', color: 'from-green-600 to-teal-700', description: 'የቡና እና የንግድ ከተማ | Coffee & Trade City', prizeAmount: 'Up to 40M ETB' },
  { id: 'sawla', name: 'ሳውላ', nameEn: 'Sawla', region: 'South', population: '50K+', icon: '🏔️', color: 'from-gray-600 to-gray-800', description: 'የደቡብ ኢትዮጵያ ከተማ | South Ethiopia Town', prizeAmount: 'Up to 40M ETB' },
  { id: 'jinka', name: 'ጂንካ', nameEn: 'Jinka', region: 'South', population: '70K+', icon: '🏔️', color: 'from-rose-600 to-pink-700', description: 'የደቡብ ኢትዮጵያ ባህላዊ ከተማ | Traditional City of South Ethiopia', prizeAmount: 'Up to 40M ETB' },
  { id: 'konso', name: 'ኮንሶ', nameEn: 'Konso', region: 'South', population: '60K+', icon: '🏔️', color: 'from-orange-600 to-red-700', description: 'የዩኔስኮ ቅርስ ከተማ | UNESCO Heritage Town', prizeAmount: 'Up to 40M ETB' },
  { id: 'karat', name: 'ካራት', nameEn: 'Karat', region: 'South', population: '50K+', icon: '🏔️', color: 'from-gray-600 to-gray-800', description: 'የኮንሶ ዞን ዋና ከተማ | Capital of Konso Zone', prizeAmount: 'Up to 40M ETB' },
  
  // ===================== BENISHANGUL-GUMUZ REGION =====================
  { id: 'assosa', name: 'አሶሳ', nameEn: 'Assosa', region: 'Benishangul', population: '100K+', icon: '🌿', color: 'from-green-500 to-emerald-600', description: 'የንግድ እና የግብርና ከተማ | Trade & Agriculture City', prizeAmount: 'Up to 40M ETB' },
  { id: 'gilgel-beles', name: 'ግልገል በለስ', nameEn: 'Gilgel Beles', region: 'Benishangul', population: '40K+', icon: '💧', color: 'from-cyan-600 to-blue-700', description: 'የግልገል በለስ ከተማ | Gilgel Beles Town', prizeAmount: 'Up to 40M ETB' },
  { id: 'kamashi', name: 'ካማሺ', nameEn: 'Kamashi', region: 'Benishangul', population: '30K+', icon: '🏔️', color: 'from-gray-600 to-gray-800', description: 'የካማሺ ዞን ዋና ከተማ | Capital of Kamashi Zone', prizeAmount: 'Up to 40M ETB' },
  
  // ===================== GAMBELLA REGION =====================
  { id: 'gambella', name: 'ጋምቤላ', nameEn: 'Gambella', region: 'Gambella', population: '80K+', icon: '🏞️', color: 'from-teal-500 to-cyan-600', description: 'የጋምቤላ ክልል ዋና ከተማ | Capital of Gambella Region', prizeAmount: 'Up to 40M ETB' },
  { id: 'meti', name: 'ሜቲ', nameEn: 'Meti', region: 'Gambella', population: '30K+', icon: '🏔️', color: 'from-gray-600 to-gray-800', description: 'የጋምቤላ ክልል ከተማ | Gambella Region Town', prizeAmount: 'Up to 40M ETB' },
  
  // ===================== AFAR REGION =====================
  { id: 'semera', name: 'ሰሜራ', nameEn: 'Semera', region: 'Afar', population: '50K+', icon: '🐪', color: 'from-yellow-500 to-orange-600', description: 'የአፋር ክልል ዋና ከተማ | Capital of Afar Region', prizeAmount: 'Up to 40M ETB' },
  { id: 'asaita', name: 'አሳይታ', nameEn: 'Asaita', region: 'Afar', population: '30K+', icon: '🏔️', color: 'from-gray-600 to-gray-800', description: 'የአፋር ክልል ታሪካዊ ከተማ | Historical Afar Town', prizeAmount: 'Up to 40M ETB' },
  { id: 'logiya', name: 'ሎጊያ', nameEn: 'Logiya', region: 'Afar', population: '25K+', icon: '🛣️', color: 'from-gray-600 to-gray-800', description: 'የአፋር ክልል ከተማ | Afar Region Town', prizeAmount: 'Up to 40M ETB' },
];

export default function CitiesIndex() {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [showAllCities, setShowAllCities] = useState(false);

  // Get unique regions for filter
  const regions = ['all', ...new Set(ethiopianCities.map(city => city.region))];

  // Filter cities based on search and region
  const filteredCities = ethiopianCities.filter(city => {
    const matchesSearch = city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          city.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          city.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === 'all' || city.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  const displayedCities = showAllCities ? filteredCities : filteredCities.slice(0, 12);

  return (
    <>
      <Head>
        <title>City VIP Programs - Join Your City's Exclusive VIP | Abbaa Carraa</title>
        <meta name="description" content="Join your city's VIP program and win up to 40 Million Birr. Available in all Ethiopian cities including Addis Ababa, Dire Dawa, Mekelle, Hawassa, and more." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 mb-6">
              <span className="text-2xl">🏙️</span>
              <span className="text-sm font-semibold">City VIP Programs</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Join Your City's <span className="text-yellow-400">Exclusive VIP</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
              Win up to 40 Million Birr in your city's VIP program. Available in all Ethiopian cities!
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a href="#cities" className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-full font-semibold transition flex items-center gap-2">
                Browse Cities <span>↓</span>
              </a>
              <Link href="/become-agent" className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-full font-semibold transition flex items-center gap-2">
                Become a City Agent 🤝
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search city (አዲስ አበባ, Addis Ababa...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 pl-10 focus:ring-2 focus:ring-green-500 outline-none"
                />
                <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Region Filter */}
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none bg-white"
              >
                {regions.map(region => (
                  <option key={region} value={region}>
                    {region === 'all' ? '📌 All Regions' : `📍 ${region} Region`}
                  </option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-500">
              Found {filteredCities.length} cities
            </div>
          </div>

          {/* Cities Grid */}
          <div id="cities" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {displayedCities.map((city) => (
              <Link key={city.id} href={`/cities/${city.id}`}>
                <div className={`bg-gradient-to-r ${city.color} rounded-2xl p-5 text-white hover:shadow-xl transition transform hover:scale-105 cursor-pointer h-full flex flex-col`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-4xl">{city.icon}</div>
                    <span className="text-[10px] bg-white/20 rounded-full px-2 py-0.5">{city.population}</span>
                  </div>
                  <h3 className="font-bold text-xl">{city.name}</h3>
                  <p className="text-sm opacity-90 mb-1">{city.nameEn}</p>
                  <p className="text-xs opacity-80 mt-2 line-clamp-2">{city.description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-[10px] bg-white/20 rounded-full px-2 py-0.5">{city.prizeAmount}</span>
                    <span className="text-sm font-semibold flex items-center gap-1">
                      Join Now <span className="text-lg">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* No Results */}
          {filteredCities.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl shadow-md">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No cities found</h3>
              <p className="text-gray-500">Try a different search term or clear the filter</p>
              <button
                onClick={() => { setSearchTerm(''); setRegionFilter('all'); }}
                className="mt-4 text-green-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Show More / Show Less Button */}
          {filteredCities.length > 12 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllCities(!showAllCities)}
                className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1 mx-auto"
              >
                {showAllCities ? 'Show Less ↑' : `Show All ${filteredCities.length} Cities ↓`}
              </button>
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <div className="bg-gray-100 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Why Join City VIP?</h2>
            <p className="text-center text-gray-600 mb-12">Exclusive benefits for city program participants</p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-6 text-center shadow-md hover:shadow-lg transition">
                <div className="text-5xl mb-4">🏆</div>
                <h3 className="text-xl font-bold mb-2">Huge Prizes</h3>
                <p className="text-gray-600">Win up to 40 Million Birr in your city's VIP program</p>
              </div>
              <div className="bg-white rounded-2xl p-6 text-center shadow-md hover:shadow-lg transition">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-xl font-bold mb-2">Daily, Weekly & Monthly</h3>
                <p className="text-gray-600">Three different pool types to suit your budget</p>
              </div>
              <div className="bg-white rounded-2xl p-6 text-center shadow-md hover:shadow-lg transition">
                <div className="text-5xl mb-4">💚</div>
                <h3 className="text-xl font-bold mb-2">Support Health</h3>
                <p className="text-gray-600">2% supports kidney & heart disease patients</p>
              </div>
            </div>
          </div>
        </div>

        {/* Become Agent CTA */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="text-5xl mb-4">🤝</div>
              <h2 className="text-3xl font-bold mb-4">Become a City Agent</h2>
              <p className="text-gray-300 mb-6">
                Earn 10% commission on every successful contribution from customers you bring to your city's VIP program!
              </p>
              <Link
                href="/become-agent"
                className="inline-block bg-green-600 hover:bg-green-700 px-8 py-3 rounded-full font-semibold transition transform hover:scale-105 shadow-lg"
              >
                Apply as City Agent →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
