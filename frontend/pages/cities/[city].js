// pages/cities/[city].js - COMPLETE WITH ALL 94 CITIES, SIMPLIFIED 3 BUTTONS
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import toast from 'react-hot-toast';
import TicketImage from '../../components/TicketImage';

// ============================================
// ALL 94 ETHIOPIAN CITIES - COMPLETE LIST
// ============================================
const allCities = [
  { id: 'addis-ababa', name: 'አዲስ አበባ', nameEn: 'Addis Ababa', region: 'Central', icon: '🏙️', description: 'የኢትዮጵያ የንግድ እና ዲፕሎማሲ ልብ', descriptionEn: 'Heart of Ethiopian Commerce & Diplomacy' },
  { id: 'shaggar', name: 'ሸገር', nameEn: 'Shaggar City', region: 'Oromia', icon: '🏗️', description: 'ብልህ ከተማ እና የኢንቨስትመንት ማዕከል', descriptionEn: 'Smart City & Investment Hub' },
  { id: 'dire-dawa', name: 'ድሬ ዳዋ', nameEn: 'Dire Dawa', region: 'Dire Dawa', icon: '🚂', description: 'የንግድ እና የማኑፋክቸሪንግ ከተማ', descriptionEn: 'Trade & Manufacturing Hub' },
  { id: 'mekelle', name: 'መቀሌ', nameEn: 'Mekelle', region: 'Tigray', icon: '🏭', description: 'ከፍተኛ የኢኮኖሚ ዕድገት ካለው ከተማ', descriptionEn: 'City with Highest GDP per Capita' },
  { id: 'axum', name: 'አክሱም', nameEn: 'Axum', region: 'Tigray', icon: '🏛️', description: 'የታላቁ የአክሱም መንግስት ዋና ከተማ', descriptionEn: 'Capital of the Ancient Axumite Kingdom' },
  { id: 'adigrat', name: 'አዲግራት', nameEn: 'Adigrat', region: 'Tigray', icon: '🏔️', description: 'የሰሜን ትግራይ የንግድ ማዕከል', descriptionEn: 'North Tigray Trade Center' },
  { id: 'shire', name: 'ሽሬ', nameEn: 'Shire', region: 'Tigray', icon: '🏔️', description: 'የምዕራብ ትግራይ ዋና ከተማ', descriptionEn: 'Capital of West Tigray' },
  { id: 'mekoni', name: 'መቆኒ', nameEn: 'Mekoni', region: 'Tigray', icon: '🏔️', description: 'የምዕራብ ትግራይ ከተማ', descriptionEn: 'West Tigray Town' },
  { id: 'maychew', name: 'ማይጨው', nameEn: 'Maychew', region: 'Tigray', icon: '🏔️', description: 'የደቡብ ትግራይ ከተማ', descriptionEn: 'South Tigray Town' },
  { id: 'abiy-addi', name: 'አቢይ አዲ', nameEn: 'Abiy Addi', region: 'Tigray', icon: '🏔️', description: 'የማዕከላዊ ትግራይ ከተማ', descriptionEn: 'Central Tigray Town' },
  { id: 'wukro', name: 'ውቅሮ', nameEn: 'Wukro', region: 'Tigray', icon: '🏔️', description: 'የምስራቅ ትግራይ ከተማ', descriptionEn: 'East Tigray Town' },
  { id: 'gondar', name: 'ጎንደር', nameEn: 'Gondar', region: 'Amhara', icon: '🏰', description: 'የባህል ቅርስ እና የቱሪዝም ከተማ', descriptionEn: 'Cultural Heritage & Tourism City' },
  { id: 'bahir-dar', name: 'ባህር ዳር', nameEn: 'Bahir Dar', region: 'Amhara', icon: '🏞️', description: 'የታና ሀይቅ እና የጨርቃጨርቅ ከተማ', descriptionEn: 'Lake Tana & Textile City' },
  { id: 'dessie', name: 'ደሴ', nameEn: 'Dessie', region: 'Amhara', icon: '🏔️', description: 'የንግድ እና የእርሻ ከተማ', descriptionEn: 'Trade & Agriculture City' },
  { id: 'debre-markos', name: 'ደብረ ማርቆስ', nameEn: 'Debre Markos', region: 'Amhara', icon: '⛪', description: 'የምስራቅ ጎጃም ዋና ከተማ', descriptionEn: 'Capital of East Gojjam' },
  { id: 'finote-selam', name: 'ፍኖተ ሰላም', nameEn: 'Finote Selam', region: 'Amhara', icon: '🌅', description: 'የምዕራብ ጎጃም ዋና ከተማ', descriptionEn: 'Capital of West Gojjam' },
  { id: 'woldia', name: 'ወልዲያ', nameEn: 'Woldia', region: 'Amhara', icon: '🎓', description: 'የወልዲያ ዩኒቨርሲቲ ከተማ', descriptionEn: 'Woldia University City' },
  { id: 'debre-birhan', name: 'ደብረ ብርሃን', nameEn: 'Debre Birhan', region: 'Amhara', icon: '⭐', description: 'የፀሐይ ብርሃን ከተማ', descriptionEn: 'City of Sunlight' },
  { id: 'kombolcha', name: 'ኮምቦልቻ', nameEn: 'Kombolcha', region: 'Amhara', icon: '🏭', description: 'የኢንዱስትሪ ዞን እና ደረቅ ወደብ', descriptionEn: 'Industrial Zone & Dry Port' },
  { id: 'sekota', name: 'ሰቆጣ', nameEn: 'Sekota', region: 'Amhara', icon: '🏔️', description: 'የዋግ ሽራ ዞን ዋና ከተማ', descriptionEn: 'Capital of Wag Hemra Zone' },
  { id: 'aykal', name: 'አይከል', nameEn: 'Aykal', region: 'Amhara', icon: '🏔️', description: 'የምዕራብ ጎጃም ከተማ', descriptionEn: 'West Gojjam Town' },
  { id: 'metema', name: 'ሜተማ', nameEn: 'Metema', region: 'Amhara', icon: '🛣️', description: 'የኢትዮ-ሱዳን ድንበር ከተማ', descriptionEn: 'Ethio-Sudan Border Town' },
  { id: 'debre-tabor', name: 'ደብረ ታቦር', nameEn: 'Debre Tabor', region: 'Amhara', icon: '⛪', description: 'የጥንታዊ ገዳማት ከተማ', descriptionEn: 'City of Ancient Monasteries' },
  { id: 'bati', name: 'ባቲ', nameEn: 'Bati', region: 'Amhara', icon: '🏔️', description: 'የንግድ እና የእርሻ ከተማ', descriptionEn: 'Trade & Agriculture Town' },
  { id: 'kemise', name: 'ቀሚሴ', nameEn: 'Kemise', region: 'Amhara', icon: '🏔️', description: 'የንግድ እና የእርሻ ከተማ', descriptionEn: 'Trade & Agriculture Town' },
  { id: 'injibara', name: 'እንጅባራ', nameEn: 'Injibara', region: 'Amhara', icon: '🏔️', description: 'የአዊ ዞን ዋና ከተማ', descriptionEn: 'Capital of Awi Zone' },
  { id: 'lalibela', name: 'ላሊበላ', nameEn: 'Lalibela', region: 'Amhara', icon: '⛪', description: 'የዩኔስኮ ቅርስ ከተማ', descriptionEn: 'UNESCO World Heritage Site' },
  { id: 'adama', name: 'አዳማ', nameEn: 'Adama', region: 'Oromia', icon: '🏭', description: 'የኢንዱስትሪ እና የንግድ ከተማ', descriptionEn: 'Industrial & Trade City' },
  { id: 'jimma', name: 'ጅማ', nameEn: 'Jimma', region: 'Oromia', icon: '☕', description: 'የቡና እና የንግድ ከተማ', descriptionEn: 'Coffee & Trade City' },
  { id: 'bishoftu', name: 'ቢሾፍቱ', nameEn: 'Bishoftu', region: 'Oromia', icon: '✈️', description: 'የሀይቆች እና የአየር ሃይል ከተማ', descriptionEn: 'City of Lakes & Air Force Base' },
  { id: 'asella', name: 'አሰላ', nameEn: 'Asella', region: 'Oromia', icon: '🏔️', description: 'የአርሲ ዋና ከተማ እና የእርሻ ማዕከል', descriptionEn: 'Capital of Arsi & Agricultural Hub' },
  { id: 'shashemene', name: 'ሻሸመኔ', nameEn: 'Shashemene', region: 'Oromia', icon: '🛍️', description: 'የንግድ እና የኢንዱስትሪ ከተማ', descriptionEn: 'Trade & Industrial City' },
  { id: 'robe', name: 'ሮቤ', nameEn: 'Robe', region: 'Oromia', icon: '🌄', description: 'የባሌ ተራራ በር | የቱሪዝም ማዕከል', descriptionEn: 'Gateway to Bale Mountains | Tourism Hub' },
  { id: 'ginir', name: 'ጊኒር', nameEn: 'Ginir', region: 'Oromia', icon: '🏞️', description: 'የባሌ ምስራቅ የንግድ ማዕከል', descriptionEn: 'Eastern Bale Trade Center' },
  { id: 'yabelo', name: 'ያቤሎ', nameEn: 'Yabelo', region: 'Oromia', icon: '🐪', description: 'የእንስሳት እርባታ እና የንግድ ከተማ', descriptionEn: 'Livestock & Trade City' },
  { id: 'moyale', name: 'ሞያሌ', nameEn: 'Moyale', region: 'Oromia', icon: '🛣️', description: 'የኢትዮ-ኬንያ ድንበር ከተማ', descriptionEn: 'Ethio-Kenya Border Town' },
  { id: 'chiro', name: 'ቺሮ', nameEn: 'Chiro', region: 'Oromia', icon: '🏔️', description: 'የምስራቅ ሀረርጌ ዋና ከተማ', descriptionEn: 'Capital of East Hararghe' },
  { id: 'fiche', name: 'ፊጬ', nameEn: 'Fiche', region: 'Oromia', icon: '🌾', description: 'የሰሜን ሸዋ የእህል ማዕከል', descriptionEn: 'North Shewa Grain Center' },
  { id: 'woliso', name: 'ወሊሶ', nameEn: 'Woliso', region: 'Oromia', icon: '💧', description: 'የሙቀት ምንጭ እና የቱሪዝም ከተማ', descriptionEn: 'Hot Springs & Tourism City' },
  { id: 'ambo', name: 'አምቦ', nameEn: 'Ambo', region: 'Oromia', icon: '💧', description: 'የማዕድን ውሃ እና የግብርና ከተማ', descriptionEn: 'Mineral Water & Agriculture City' },
  { id: 'nekemte', name: 'ነቀምቴ', nameEn: 'Nekemte', region: 'Oromia', icon: '☕', description: 'የቡና እና የንግድ ከተማ', descriptionEn: 'Coffee & Trade City' },
  { id: 'gimbi', name: 'ጊምቢ', nameEn: 'Gimbi', region: 'Oromia', icon: '🏔️', description: 'የምዕራብ ወለጋ የንግድ ማዕከል', descriptionEn: 'West Wollega Trade Center' },
  { id: 'dembi-dollo', name: 'ደምቢ ዶሎ', nameEn: 'Dembi Dollo', region: 'Oromia', icon: '💰', description: 'የወርቅ ማዕድን እና የንግድ ከተማ', descriptionEn: 'Gold Mining & Trade City' },
  { id: 'shambu', name: 'ሻምቡ', nameEn: 'Shambu', region: 'Oromia', icon: '🌾', description: 'የሆሮ ጉዱሩ ዋና ከተማ', descriptionEn: 'Capital of Horo Guduru' },
  { id: 'metu', name: 'መቱ', nameEn: 'Metu', region: 'Oromia', icon: '🌿', description: 'የቡና እና የግብርና ከተማ', descriptionEn: 'Coffee & Agriculture City' },
  { id: 'bedele', name: 'በደሌ', nameEn: 'Bedele', region: 'Oromia', icon: '🍺', description: 'የቢራ ፋብሪካ እና የቡና ከተማ', descriptionEn: 'Brewery & Coffee City' },
  { id: 'bule-hora', name: 'ቡሌ ሆራ', nameEn: 'Bule Hora', region: 'Oromia', icon: '🎓', description: 'የቡሌ ሆራ ዩኒቨርሲቲ ከተማ', descriptionEn: 'Bule Hora University City' },
  { id: 'negele-borana', name: 'ነገሌ ቦረና', nameEn: 'Negele Borana', region: 'Oromia', icon: '🐪', description: 'የቦረና የእንስሳት እርባታ ማዕከል', descriptionEn: 'Borana Livestock Center' },
  { id: 'ziway', name: 'ዚዋይ', nameEn: 'Ziway', region: 'Oromia', icon: '🐟', description: 'የአሳ ማጥመድ እና የቱሪዝም ከተማ', descriptionEn: 'Fishing & Tourism City' },
  { id: 'mojo', name: 'ሞጆ', nameEn: 'Mojo', region: 'Oromia', icon: '🚛', description: 'የሎጂስቲክስ እና የኢንዱስትሪ ከተማ', descriptionEn: 'Logistics & Industrial Town' },
  { id: 'dodola', name: 'ዶዶላ', nameEn: 'Dodola', region: 'Oromia', icon: '🏔️', description: 'የባሌ ተራራ መግቢያ', descriptionEn: 'Gateway to Bale Mountains' },
  { id: 'gera', name: 'ጌራ', nameEn: 'Gera', region: 'Oromia', icon: '☕', description: 'የቡና ማምረቻ አካባቢ', descriptionEn: 'Coffee Producing Area' },
  { id: 'agaro', name: 'አጋሮ', nameEn: 'Agaro', region: 'Oromia', icon: '☕', description: 'የቡና እና የንግድ ከተማ', descriptionEn: 'Coffee & Trade Town' },
  { id: 'lemu', name: 'ለሙ', nameEn: 'Lemu', region: 'Oromia', icon: '🌾', description: 'የእህል እርሻ አካባቢ', descriptionEn: 'Grain Farming Area' },
  { id: 'hagere-mariam', name: 'ሀገረ ማርያም', nameEn: 'Hagere Mariam', region: 'Oromia', icon: '🏔️', description: 'የደቡብ ኢትዮጵያ ከተማ', descriptionEn: 'South Ethiopia Town' },
  { id: 'shakiso', name: 'ሻኪሶ', nameEn: 'Shakiso', region: 'Oromia', icon: '💰', description: 'የወርቅ ማዕድን ከተማ', descriptionEn: 'Gold Mining Town' },
  { id: 'kibre-mengist', name: 'ቅብረ መንግስት', nameEn: 'Kibre Mengist', region: 'Oromia', icon: '🏔️', description: 'የደቡብ ኢትዮጵያ ከተማ', descriptionEn: 'South Ethiopia Town' },
  { id: 'wachile', name: 'ዋቺሌ', nameEn: 'Wachile', region: 'Oromia', icon: '🐪', description: 'የእንስሳት እርባታ አካባቢ', descriptionEn: 'Livestock Area' },
  { id: 'goba', name: 'ጎባ', nameEn: 'Goba', region: 'Oromia', icon: '🏔️', description: 'የባሌ ተራራ መግቢያ', descriptionEn: 'Gateway to Bale Mountains' },
  { id: 'sinana', name: 'ሲናና', nameEn: 'Sinana', region: 'Oromia', icon: '🌾', description: 'የእህል እርሻ አካባቢ', descriptionEn: 'Grain Farming Area' },
  { id: 'dinsho', name: 'ዲንሾ', nameEn: 'Dinsho', region: 'Oromia', icon: '🏞️', description: 'የባሌ ተራራ ብሔራዊ ፓርክ መግቢያ', descriptionEn: 'Bale Mountains National Park Gateway' },
  { id: 'jijiga', name: 'ጅጅጋ', nameEn: 'Jijiga', region: 'Somali', icon: '🐪', description: 'የሶማሌ ክልል ዋና ከተማ', descriptionEn: 'Capital of Somali Region' },
  { id: 'degehabur', name: 'ደገሃቡር', nameEn: 'Degehabur', region: 'Somali', icon: '🏔️', description: 'የሶማሌ ክልል ከተማ', descriptionEn: 'Somali Region Town' },
  { id: 'kebri-dehar', name: 'ቀብሪ ደሃር', nameEn: 'Kebri Dehar', region: 'Somali', icon: '🏔️', description: 'የሶማሌ ክልል የንግድ ማዕከል', descriptionEn: 'Somali Region Trade Center' },
  { id: 'gode', name: 'ጎዴ', nameEn: 'Gode', region: 'Somali', icon: '🏔️', description: 'የሶማሌ ክልል ከተማ', descriptionEn: 'Somali Region Town' },
  { id: 'warder', name: 'ዋርደር', nameEn: 'Warder', region: 'Somali', icon: '🐪', description: 'የሶማሌ ክልል ከተማ', descriptionEn: 'Somali Region Town' },
  { id: 'shilabo', name: 'ሺላቦ', nameEn: 'Shilabo', region: 'Somali', icon: '🐪', description: 'የሶማሌ ክልል ከተማ', descriptionEn: 'Somali Region Town' },
  { id: 'kelafo', name: 'ከላፎ', nameEn: 'Kelafo', region: 'Somali', icon: '🏔️', description: 'የሶማሌ ክልል ከተማ', descriptionEn: 'Somali Region Town' },
  { id: 'mustahil', name: 'ሙስታሂል', nameEn: 'Mustahil', region: 'Somali', icon: '🏔️', description: 'የሶማሌ ክልል ከተማ', descriptionEn: 'Somali Region Town' },
  { id: 'ferfer', name: 'ፌርፌር', nameEn: 'Ferfer', region: 'Somali', icon: '🛣️', description: 'የኢትዮ-ሶማሊያ ድንበር ከተማ', descriptionEn: 'Ethio-Somalia Border Town' },
  { id: 'harar', name: 'ሀረር', nameEn: 'Harar', region: 'Harari', icon: '🏛️', description: 'የባህል ቅርስ እና የእስላም ቅድስት ከተማ', descriptionEn: 'Cultural Heritage & Islamic Holy City' },
  { id: 'hawassa', name: 'ሀዋሳ', nameEn: 'Hawassa', region: 'Sidama', icon: '🏞️', description: 'የኢንዱስትሪ ፓርክ እና የሀይቅ ከተማ', descriptionEn: 'Industrial Park & Lake City' },
  { id: 'yirgalem', name: 'ይርጋለም', nameEn: 'Yirgalem', region: 'Sidama', icon: '☕', description: 'የቡና እና የግብርና ከተማ', descriptionEn: 'Coffee & Agriculture Town' },
  { id: 'arba-minch', name: 'አርባ ምንጭ', nameEn: 'Arba Minch', region: 'South', icon: '🏞️', description: 'የአርባ ምንጭ ዩኒቨርሲቲ ከተማ', descriptionEn: 'Arba Minch University City' },
  { id: 'sodo', name: 'ሶዶ', nameEn: 'Sodo', region: 'South', icon: '🛍️', description: 'የወላይታ ዞን ዋና ከተማ', descriptionEn: 'Capital of Wolayita Zone' },
  { id: 'dilla', name: 'ዲላ', nameEn: 'Dilla', region: 'South', icon: '☕', description: 'የቡና እና የንግድ ከተማ', descriptionEn: 'Coffee & Trade City' },
  { id: 'sawla', name: 'ሳውላ', nameEn: 'Sawla', region: 'South', icon: '🏔️', description: 'የደቡብ ኢትዮጵያ ከተማ', descriptionEn: 'South Ethiopia Town' },
  { id: 'jinka', name: 'ጂንካ', nameEn: 'Jinka', region: 'South', icon: '🏔️', description: 'የደቡብ ኢትዮጵያ ባህላዊ ከተማ', descriptionEn: 'Traditional City of South Ethiopia' },
  { id: 'konso', name: 'ኮንሶ', nameEn: 'Konso', region: 'South', icon: '🏔️', description: 'የዩኔስኮ ቅርስ ከተማ', descriptionEn: 'UNESCO Heritage Town' },
  { id: 'karat', name: 'ካራት', nameEn: 'Karat', region: 'South', icon: '🏔️', description: 'የኮንሶ ዞን ዋና ከተማ', descriptionEn: 'Capital of Konso Zone' },
  { id: 'bonga', name: 'ቦንጋ', nameEn: 'Bonga', region: 'South', icon: '☕', description: 'የቡና ማምረቻ አካባቢ', descriptionEn: 'Coffee Producing Area' },
  { id: 'mizan-teferi', name: 'ሚዛን ተፈሪ', nameEn: 'Mizan Teferi', region: 'South', icon: '🏔️', description: 'የቤንች ማጂ ዞን ዋና ከተማ', descriptionEn: 'Capital of Bench Maji Zone' },
  { id: 'teppi', name: 'ቴፒ', nameEn: 'Teppi', region: 'South', icon: '🌿', description: 'የቡና እርሻ አካባቢ', descriptionEn: 'Coffee Farming Area' },
  { id: 'gereb', name: 'ገሬብ', nameEn: 'Gereb', region: 'South', icon: '🏔️', description: 'የደቡብ ኢትዮጵያ ከተማ', descriptionEn: 'South Ethiopia Town' },
  { id: 'key-afar', name: 'ቀይ አፋር', nameEn: 'Key Afar', region: 'South', icon: '🏔️', description: 'የደቡብ ኢትዮጵያ ከተማ', descriptionEn: 'South Ethiopia Town' },
  { id: 'bako', name: 'ባኮ', nameEn: 'Bako', region: 'South', icon: '🏔️', description: 'የደቡብ ኢትዮጵያ ከተማ', descriptionEn: 'South Ethiopia Town' },
  { id: 'welkite', name: 'ወልቂጤ', nameEn: 'Welkite', region: 'South', icon: '🏔️', description: 'የጉራጌ ዞን ዋና ከተማ', descriptionEn: 'Capital of Gurage Zone' },
  { id: 'assosa', name: 'አሶሳ', nameEn: 'Assosa', region: 'Benishangul', icon: '🌿', description: 'የቤንሻንጉል ክልል ዋና ከተማ', descriptionEn: 'Capital of Benishangul Region' },
  { id: 'gilgel-beles', name: 'ግልገል በለስ', nameEn: 'Gilgel Beles', region: 'Benishangul', icon: '💧', description: 'የግልገል በለስ ከተማ', descriptionEn: 'Gilgel Beles Town' },
  { id: 'kamashi', name: 'ካማሺ', nameEn: 'Kamashi', region: 'Benishangul', icon: '🏔️', description: 'የካማሺ ዞን ዋና ከተማ', descriptionEn: 'Capital of Kamashi Zone' },
  { id: 'metekel', name: 'ሜተከል', nameEn: 'Metekel', region: 'Benishangul', icon: '🏔️', description: 'የሜተከል ዞን ዋና ከተማ', descriptionEn: 'Capital of Metekel Zone' },
  { id: 'dibate', name: 'ዲባቴ', nameEn: 'Dibate', region: 'Benishangul', icon: '🏔️', description: 'የቤንሻንጉል ክልል ከተማ', descriptionEn: 'Benishangul Region Town' },
  { id: 'gambella', name: 'ጋምቤላ', nameEn: 'Gambella', region: 'Gambella', icon: '🏞️', description: 'የጋምቤላ ክልል ዋና ከተማ', descriptionEn: 'Capital of Gambella Region' },
  { id: 'meti', name: 'ሜቲ', nameEn: 'Meti', region: 'Gambella', icon: '🏔️', description: 'የጋምቤላ ክልል ከተማ', descriptionEn: 'Gambella Region Town' },
  { id: 'fugnido', name: 'ፉኝዶ', nameEn: 'Fugnido', region: 'Gambella', icon: '🏞️', description: 'የስደተኞች ከተማ', descriptionEn: 'Refugee Town' },
  { id: 'itur', name: 'ኢቱር', nameEn: 'Itur', region: 'Gambella', icon: '🏔️', description: 'የጋምቤላ ክልል ከተማ', descriptionEn: 'Gambella Region Town' },
  { id: 'semera', name: 'ሰሜራ', nameEn: 'Semera', region: 'Afar', icon: '🐪', description: 'የአፋር ክልል ዋና ከተማ', descriptionEn: 'Capital of Afar Region' },
  { id: 'asaita', name: 'አሳይታ', nameEn: 'Asaita', region: 'Afar', icon: '🏔️', description: 'የአፋር ክልል ታሪካዊ ከተማ', descriptionEn: 'Historical Afar Town' },
  { id: 'logiya', name: 'ሎጊያ', nameEn: 'Logiya', region: 'Afar', icon: '🛣️', description: 'የአፋር ክልል ከተማ', descriptionEn: 'Afar Region Town' },
  { id: 'abila', name: 'አቢላ', nameEn: 'Abila', region: 'Afar', icon: '🐪', description: 'የአፋር ክልል ከተማ', descriptionEn: 'Afar Region Town' },
  { id: 'dubti', name: 'ዱብቲ', nameEn: 'Dubti', region: 'Afar', icon: '🏔️', description: 'የአፋር ክልል ከተማ', descriptionEn: 'Afar Region Town' },
  { id: 'elidar', name: 'ኤልዳር', nameEn: 'Elidar', region: 'Afar', icon: '🏔️', description: 'የአፋር ክልል ከተማ', descriptionEn: 'Afar Region Town' },
  { id: 'chifra', name: 'ቺፍራ', nameEn: 'Chifra', region: 'Afar', icon: '🏔️', description: 'የአፋር ክልል ከተማ', descriptionEn: 'Afar Region Town' }
];

// VIP Pool configurations
const vipPools = {
  daily: { name: "Daily", nameAm: "ዕለታዊ", entryFee: 500, prize: 1000000, totalSeats: 2400, explanation: "Pay 500 ETB, win 1,000,000 ETB", explanationAm: "500 ብር ከፍለው 1,000,000 ብር ያሸንፉ" },
  weekly: { name: "Weekly", nameAm: "ሳምንታዊ", entryFee: 2500, prize: 10000000, totalSeats: 4800, explanation: "Pay 2,500 ETB, win 10,000,000 ETB", explanationAm: "2,500 ብር ከፍለው 10,000,000 ብር ያሸንፉ" },
  monthly: { name: "Monthly", nameAm: "ወርሃዊ", entryFee: 5000, prize: 40000000, totalSeats: 9600, explanation: "Pay 5,000 ETB, win 40,000,000 ETB", explanationAm: "5,000 ብር ከፍለው 40,000,000 ብር ያሸንፉ" }
};

// Helper functions
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
        const MAX_SIZE = 1024;
        if (width > height) {
          if (width > MAX_SIZE) { height = (height * MAX_SIZE) / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width = (width * MAX_SIZE) / height; height = MAX_SIZE; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.7);
      };
    };
  });
};

const validateFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) throw new Error('Please upload a valid image file');
  if (file.size > 5 * 1024 * 1024) throw new Error('File size must be less than 5MB');
  return true;
};

export default function CityVip() {
  const router = useRouter();
  const { city } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cityInfo, setCityInfo] = useState(null);
  const [selectedType, setSelectedType] = useState('daily');
  const [poolInfo, setPoolInfo] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [participantId, setParticipantId] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [participantData, setParticipantData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [reservedSeats, setReservedSeats] = useState([]);
  const [reservationTimer, setReservationTimer] = useState(null);
  const [manualSeatInput, setManualSeatInput] = useState('');
  const [showSeatSelector, setShowSeatSelector] = useState(true);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');

  // Get city data from URL
  useEffect(() => {
    if (city) {
      const found = allCities.find(c => c.id === city);
      if (found) {
        setCityInfo(found);
      } else {
        setCityInfo({ id: city, name: decodeURIComponent(city), nameEn: city, icon: '🏙️', description: 'Ethiopian City' });
      }
    }
  }, [city]);

  // Set pool info when type changes
  useEffect(() => {
    if (selectedType) {
      setPoolInfo(vipPools[selectedType]);
      if (city) {
        router.replace(`/cities/${city}?type=${selectedType}`, undefined, { shallow: true });
      }
    }
  }, [selectedType, city]);

  // Check user and fetch seats
  useEffect(() => {
    checkUser();
  }, [city]);

  useEffect(() => {
    if (user && poolInfo && city) {
      fetchBookedSeats();
      fetchUserReservations();
      const interval = setInterval(() => {
        fetchBookedSeats();
        fetchUserReservations();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, poolInfo, city, selectedType]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const currentUrl = `/cities/${city}?type=${selectedType}`;
        localStorage.setItem('abbaa_redirect_after_login', currentUrl);
        sessionStorage.setItem('redirectAfterLogin', currentUrl);
        localStorage.setItem('pendingRole', 'individual');
        sessionStorage.setItem('pendingRole', 'individual');
        router.push('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
    }
  };

  async function fetchBookedSeats() {
    try {
      const { data, error } = await supabase
        .from('city_vip_participants')
        .select('seat_numbers, payment_status')
        .eq('city', city)
        .eq('pool_type', selectedType)
        .in('payment_status', ['verified', 'pending_verification']);
      
      if (error) throw error;
      
      const allBookedSeats = [];
      if (data) {
        data.forEach(participant => {
          if (participant.seat_numbers && Array.isArray(participant.seat_numbers)) {
            allBookedSeats.push(...participant.seat_numbers);
          }
        });
      }
      setBookedSeats([...new Set(allBookedSeats)]);
    } catch (err) {
      console.error('Error fetching booked seats:', err);
    }
  }

  async function fetchUserReservations() {
    if (!user) return;
    try {
      const poolId = `city_${city}_${selectedType}`;
      const { data, error } = await supabase
        .from('vip_seat_reservations')
        .select('seat_number, expires_at')
        .eq('user_id', user.id)
        .eq('pool_id', poolId)
        .gte('expires_at', new Date().toISOString());
      
      if (!error && data && data.length > 0) {
        const reservedSeatNumbers = data.map(r => r.seat_number);
        setReservedSeats(reservedSeatNumbers);
        setSelectedSeats(reservedSeatNumbers);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  }

  async function reserveSeatsInDB(seatNumbers) {
    if (!user) return false;
    const poolId = `city_${city}_${selectedType}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    const reservations = seatNumbers.map(seatNumber => ({
      pool_id: poolId,
      seat_number: seatNumber,
      user_id: user.id,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from('vip_seat_reservations')
      .upsert(reservations, { onConflict: 'pool_id, seat_number' });
    
    if (error) return false;
    
    if (reservationTimer) clearTimeout(reservationTimer);
    const timer = setTimeout(() => {
      releaseUserReservations();
      toast.warning('Your seat reservation has expired. Please reselect seats.');
      window.location.reload();
    }, 10 * 60 * 1000);
    setReservationTimer(timer);
    return true;
  }

  async function releaseSeats(seatNumbers) {
    if (!seatNumbers || seatNumbers.length === 0 || !user) return;
    const poolId = `city_${city}_${selectedType}`;
    await supabase
      .from('vip_seat_reservations')
      .delete()
      .eq('user_id', user.id)
      .eq('pool_id', poolId)
      .in('seat_number', seatNumbers);
  }

  async function releaseUserReservations() {
    if (!user) return;
    const poolId = `city_${city}_${selectedType}`;
    await supabase
      .from('vip_seat_reservations')
      .delete()
      .eq('user_id', user.id)
      .eq('pool_id', poolId);
    setReservedSeats([]);
    setSelectedSeats([]);
  }

  const handleManualSeatAdd = async () => {
    const seatNum = parseInt(manualSeatInput);
    if (isNaN(seatNum)) {
      toast.error('Please enter a valid seat number');
      return;
    }
    if (seatNum < 1 || seatNum > poolInfo.totalSeats) {
      toast.error(`Seat number must be between 1 and ${poolInfo.totalSeats}`);
      return;
    }
    if (bookedSeats.includes(seatNum)) {
      toast.error(`Seat ${seatNum} is already taken`);
      return;
    }
    if (selectedSeats.includes(seatNum)) {
      toast.error(`Seat ${seatNum} is already selected`);
      return;
    }
    if (selectedSeats.length >= 5) {
      toast.error(`You can only select up to 5 seats`);
      return;
    }
    
    const success = await reserveSeatsInDB([seatNum]);
    if (success) {
      setSelectedSeats([...selectedSeats, seatNum]);
      setReservedSeats([...reservedSeats, seatNum]);
      toast.success(`Seat ${seatNum} reserved for 10 minutes`);
      await fetchBookedSeats();
      setManualSeatInput('');
    }
  };

  const toggleSeat = async (seatNum) => {
    if (bookedSeats.includes(seatNum)) {
      toast.error(`Seat ${seatNum} is already taken`);
      return;
    }
    const isSelected = selectedSeats.includes(seatNum);
    if (isSelected) {
      await releaseSeats([seatNum]);
      setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
      setReservedSeats(reservedSeats.filter(s => s !== seatNum));
      toast.success(`Seat ${seatNum} released`);
    } else {
      if (selectedSeats.length >= 5) {
        toast.error(`You can only select up to 5 seats`);
        return;
      }
      const success = await reserveSeatsInDB([seatNum]);
      if (success) {
        setSelectedSeats([...selectedSeats, seatNum]);
        setReservedSeats([...reservedSeats, seatNum]);
        toast.success(`Seat ${seatNum} reserved for 10 minutes`);
        await fetchBookedSeats();
      }
    }
  };

  const confirmSeats = async () => {
    if (selectedSeats.length === 0) { 
      toast.error('Select at least one seat'); 
      return; 
    }
    
    setLoading(true);
    try {
      await fetchBookedSeats();
      const stillAvailable = selectedSeats.every(seat => !bookedSeats.includes(seat));
      if (!stillAvailable) {
        toast.error('Some seats are no longer available. Please reselect.');
        await fetchBookedSeats();
        setSelectedSeats([]);
        setLoading(false);
        return;
      }
      
      const ticketNumber = `CITY-${selectedType.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const totalAmount = selectedSeats.length * poolInfo.entryFee;
      
      const { data: participant, error } = await supabase
        .from('city_vip_participants')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email.split('@')[0],
          pool_type: selectedType,
          city: city,
          seat_numbers: selectedSeats,
          contribution_amount: totalAmount,
          prize_amount: poolInfo.prize,
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
      toast.success('Seats reserved! Please complete payment.');
    } catch (error) { 
      toast.error('Failed to reserve seats');
    } finally { 
      setLoading(false); 
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedFile) { 
      toast.error('Please upload payment screenshot'); 
      return; 
    }
    
    setUploading(true);
    try {
      const compressedFile = await compressImage(selectedFile);
      const fileName = `${user.id}/${Date.now()}_city_${city}_${selectedType}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, compressedFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);
      
      await supabase
        .from('city_vip_participants')
        .update({
          payment_status: 'pending_verification',
          payment_proof_url: publicUrl,
          payment_submitted_at: new Date().toISOString()
        })
        .eq('id', participantId);
      
      await releaseUserReservations();
      
      const { data: updatedParticipant } = await supabase
        .from('city_vip_participants')
        .select('*')
        .eq('id', participantId)
        .single();
      
      setParticipantData(updatedParticipant);
      setShowPayment(false);
      setShowTicket(true);
      toast.success('Payment submitted! Your ticket is ready');
    } catch (error) {
      toast.error('Failed to submit payment');
    } finally {
      setUploading(false);
    }
  };

  const getSeatColor = (seatNum) => {
    if (bookedSeats.includes(seatNum)) return 'bg-red-100 border-red-300 cursor-not-allowed opacity-60';
    if (selectedSeats.includes(seatNum)) return 'bg-emerald-600 text-white shadow-md';
    if (reservedSeats.includes(seatNum)) return 'bg-amber-100 border-amber-300 animate-pulse';
    return 'bg-white hover:bg-gray-50 border-gray-200 cursor-pointer';
  };

  const filteredCities = allCities.filter(c => 
    c.name.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
    c.nameEn.toLowerCase().includes(citySearchTerm.toLowerCase())
  );

  if (loading || !cityInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const totalAmount = selectedSeats.length * poolInfo.entryFee;
  const seatNumbers = Array.from({ length: Math.min(poolInfo.totalSeats, 500) }, (_, i) => i + 1);
  const availableCount = seatNumbers.filter(s => !bookedSeats.includes(s) && !selectedSeats.includes(s) && !reservedSeats.includes(s)).length;
  const takenCount = bookedSeats.length;

  return (
    <>
      <Head>
        <title>{cityInfo.name} VIP - Select Your Seat | Abbaa Carraa</title>
        <meta name="description" content={`Join ${cityInfo.name} VIP program. Win 1 Million ETB daily, 10 Million weekly, or 40 Million monthly.`} />
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-6 pb-32">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Back Button & City Selector */}
          <div className="flex justify-between items-center mb-5">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 text-sm">
              ← Back
            </button>
            
            {/* City Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="bg-white border border-gray-300 rounded-xl px-4 py-2 flex items-center gap-2 hover:shadow-md transition"
              >
                <span className="text-xl">{cityInfo.icon}</span>
                <span className="font-medium text-gray-800">{cityInfo.name}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showCityDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCityDropdown(false)} />
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                    <div className="p-3 bg-gray-50 border-b">
                      <input
                        type="text"
                        placeholder="Search city..."
                        value={citySearchTerm}
                        onChange={(e) => setCitySearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                        autoFocus
                      />
                      <p className="text-xs text-gray-400 mt-1">{filteredCities.length} cities found</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {filteredCities.map(c => (
                        <a
                          key={c.id}
                          href={`/cities/${c.id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b last:border-0 cursor-pointer"
                        >
                          <span className="text-2xl">{c.icon}</span>
                          <div>
                            <div className="font-medium text-gray-800">{c.name}</div>
                            <div className="text-xs text-gray-500">{c.nameEn}</div>
                          </div>
                          {city === c.id && (
                            <span className="ml-auto text-emerald-600 text-xs font-semibold">✓</span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* City Header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 text-center">
            <div className="text-5xl mb-2">{cityInfo.icon}</div>
            <h1 className="text-2xl font-bold text-gray-800">{cityInfo.name} VIP</h1>
            <p className="text-gray-500 text-sm mt-1">{cityInfo.description}</p>
          </div>

          {/* 3 Main Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setSelectedType('daily')}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                selectedType === 'daily' 
                  ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-lg font-bold">⭐ Daily</div>
              <div className="text-2xl font-bold text-emerald-600">ETB 500</div>
              <div className="text-xs text-gray-500 mt-1">Win 1,000,000 ETB</div>
            </button>

            <button
              onClick={() => setSelectedType('weekly')}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                selectedType === 'weekly' 
                  ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-lg font-bold">🏆 Weekly</div>
              <div className="text-2xl font-bold text-emerald-600">ETB 2,500</div>
              <div className="text-xs text-gray-500 mt-1">Win 10,000,000 ETB</div>
            </button>

            <button
              onClick={() => setSelectedType('monthly')}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                selectedType === 'monthly' 
                  ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-lg font-bold">👑 Monthly</div>
              <div className="text-2xl font-bold text-emerald-600">ETB 5,000</div>
              <div className="text-xs text-gray-500 mt-1">Win 40,000,000 ETB</div>
            </button>
          </div>

          {/* Selected Pool Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-500">Selected Pool</div>
              <div className="font-bold text-lg">{poolInfo.name}</div>
              <div className="text-sm text-gray-600">{poolInfo.explanation}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Total Seats</div>
              <div className="font-bold text-xl">{poolInfo.totalSeats.toLocaleString()}</div>
            </div>
          </div>

          {/* Seat Selection */}
          {!showPayment && !showTicket && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold mb-4">Select Your Seats (Max 5)</h3>
              
              {/* Manual Input */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm font-medium mb-2">🎯 Enter seat number manually:</p>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={manualSeatInput}
                    onChange={(e) => setManualSeatInput(e.target.value)}
                    placeholder={`Seat number (1-${poolInfo.totalSeats.toLocaleString()})`}
                    className="flex-1 px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleManualSeatAdd}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700"
                  >
                    Add Seat
                  </button>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b">
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-white border border-gray-300 rounded"></div><span className="text-xs">Available</span></div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-emerald-600 rounded"></div><span className="text-xs">Your Seats</span></div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-red-100 border border-red-300 rounded"></div><span className="text-xs">Taken</span></div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-amber-100 border border-amber-300 rounded animate-pulse"></div><span className="text-xs">Reserved (10 min)</span></div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-50 rounded-xl p-3 text-center border">
                  <div className="text-2xl font-bold text-emerald-600">{availableCount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Available</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center border">
                  <div className="text-2xl font-bold text-amber-600">{selectedSeats.length}</div>
                  <div className="text-xs text-gray-500">Your Seats</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center border">
                  <div className="text-2xl font-bold text-red-500">{takenCount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Taken</div>
                </div>
              </div>

              {/* Seat Grid */}
              <div className="grid grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-2 mb-6 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-xl border">
                {seatNumbers.map(seatNum => (
                  <button
                    key={seatNum}
                    onClick={() => toggleSeat(seatNum)}
                    disabled={bookedSeats.includes(seatNum) || (reservedSeats.includes(seatNum) && !selectedSeats.includes(seatNum))}
                    className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition-all border ${getSeatColor(seatNum)} ${selectedSeats.includes(seatNum) ? 'ring-2 ring-emerald-300' : ''}`}
                  >
                    <span>{seatNum}</span>
                  </button>
                ))}
              </div>
              
              {selectedSeats.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Selected Seats</p>
                      <p className="font-bold">{selectedSeats.sort((a,b)=>a-b).join(', ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="font-bold text-2xl text-emerald-600">ETB {totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  <button onClick={confirmSeats} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 mb-4">
                    Confirm & Proceed to Payment
                  </button>
                  <p className="text-xs text-gray-400 text-center">⏰ Seats reserved for 10 minutes</p>
                </div>
              )}
            </div>
          )}

          {/* Payment Modal */}
          {showPayment && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-5 flex justify-between">
                  <h2 className="text-xl font-bold">Complete Payment</h2>
                  <button onClick={() => { setShowPayment(false); setParticipantId(null); }} className="text-2xl">×</button>
                </div>
                <div className="p-6">
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
                    <p>City: {cityInfo.name}</p>
                    <p>Seats: {selectedSeats.join(', ')}</p>
                    <p className="text-2xl font-bold text-emerald-600">ETB {totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <p className="font-semibold">📱 TeleBirr: 0913277922</p>
                    <p className="font-semibold mt-2">🏦 CBE Bank: 1000601091686</p>
                    <p className="text-sm">Account: Negassa Hundessa</p>
                  </div>
                  
                  <div className="border-2 border-dashed rounded-xl p-4 text-center mb-4">
                    <input type="file" accept="image/*" className="hidden" id="paymentFile" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
                    }} />
                    <label htmlFor="paymentFile" className="cursor-pointer block">
                      {previewUrl ? (
                        <div><img src={previewUrl} className="max-h-32 mx-auto mb-2 rounded" /><p className="text-emerald-600">✓ Screenshot selected</p></div>
                      ) : (
                        <div><svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><p className="text-gray-500 mt-2">Upload payment screenshot</p></div>
                      )}
                    </label>
                  </div>
                  
                  <button onClick={handlePaymentSubmit} disabled={uploading} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold">
                    {uploading ? 'Processing...' : 'Submit Payment & Get Ticket'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ticket Display */}
          {showTicket && participantData && (
            <div className="bg-white rounded-2xl border p-6">
              <TicketImage participant={participantData} pool={poolInfo} isVerified={false} seatNumbers={selectedSeats} ticketNumber={participantData.ticket_number} amount={participantData.contribution_amount} createdAt={participantData.created_at} poolType="city" />
              <button onClick={() => router.push('/dashboard')} className="mt-6 w-full bg-gray-600 text-white py-2 rounded-xl">Go to Dashboard</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
