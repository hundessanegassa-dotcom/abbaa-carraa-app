// lib/bot.js - COMPLETE WORKING BOT WITH LANGUAGE FIRST, THEN PROGRAMS
import { Telegraf } from 'telegraf';
import { supabase } from './supabase';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN not set. Bot features will not work.');
}

export const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

// ============================================
// COMPLETE TRANSLATIONS - ENGLISH
// ============================================
const TRANSLATIONS = {
  en: {
    language_select: "🌐 *Choose Your Language*\n\nPlease select your preferred language:",
    language_set: "✅ Language set to English",
    welcome: {
      title: (name) => `👋 *Welcome to Abbaa Carraa, ${name}!*`,
      subtitle: "🏆 *Ethiopia's Premier Prize Platform*",
      prompt: "🎯 *What You Can Do:*\n\n🏪 Merkato VIP - Win Cash up to 10M ETB\n🏙️ City VIP - Win Cash in 94 Cities\n🏊 Regular Pools - Win Cars, Houses & More",
      action: "📱 *All actions happen inside the app!*\n\n🔽 *Press the button below to get started!*"
    },
    merkato_vip: {
      title: "🏪 *Merkato VIP*",
      subtitle: "💰 Win Cash up to 10M ETB!",
      tiers_label: "*6 Premium Tiers:*",
      footer: "📱 All actions happen inside the app!\n\n🔽 Press the button below to get started!"
    },
    city_vip: {
      title: "🏙️ *City VIP Programs*",
      subtitle: "📍 Win Cash in 94 Ethiopian Cities!",
      tiers_label: "*6 Premium Tiers Available:*",
      cities_label: "🏙️ *Available Cities:*",
      cities_list: "Addis Ababa, Shaggar, Dire Dawa, Mekelle, Gondar, Bahir Dar, Hawassa, Adama, Jimma, and 85+ more!",
      footer: "📱 All actions happen inside the app!\n\n🔽 Press the button below to get started!"
    },
    regular_pools: {
      title: "🏊 *Regular Prize Pools*",
      subtitle: "🎁 Win Amazing Prizes:",
      items: "🚗 Cars - Various Models\n🏠 Houses - Property Investments\n🏭 Machinery - Equipment & Tools\n💻 Electronics - Gadgets & Devices\n🎁 Much More!",
      description: "💰 Multiple prize pools available with different entry levels.",
      footer: "📱 All actions happen inside the app!\n\n🔽 Press the button below to get started!"
    },
    winners: {
      title: "🏆 *Recent Winners*",
      no_winners: "No recent winners to display. Be the first! 🎯",
      footer: "📱 View all winners in the app:"
    },
    how_it_works: {
      title: "📖 *How It Works*",
      step1: "1️⃣ *Find a Pool*\n• 🏪 Merkato VIP - Win Cash up to 10M ETB\n• 🏙️ City VIP - Win Cash in 94 Cities\n• 🏊 Regular Pools - Win Cars, Houses & More",
      step2: "2️⃣ *Contribute*\n• Choose your tier (Silver, Gold, Platinum, Diamond, Royal, Emperor)\n• Secure payment inside the app\n• Get your seat number",
      step3: "3️⃣ *Win!*\n• Winners are announced regularly\n• Claim your prize\n• Join the Hall of Fame!",
      health: "💚 *2% Supports* Kidney & Heart Disease Patients",
      footer: "📱 Start your journey now:"
    },
    support: {
      title: "📞 *Contact Support*",
      subtitle: "Our team is here to help you 24/7.",
      ways: "📱 *Ways to reach us:*",
      email: "📧 Email: hundessanegassa@gmail.com",
      phone: "📱 Phone: 0930330323, 0913 277 922",
      help: "💬 *Quick Help:*\n• For payment issues: Use /mytickets to check status\n• For program info: Use /programs\n• For general help: Visit our FAQ page"
    },
    help: {
      title: "📖 *Help & Support*",
      subtitle: "🤖 *Available Commands:*",
      commands: "/start - 🚀 Welcome message\n/help - 📖 This help message\n/mytickets - 🎫 View your tickets\n/programs - 🎯 View available programs\n/language - 🌐 Change language\n/support - 📞 Contact support\n/winners - 🏆 View recent winners\n/howitworks - 📖 How it works",
      footer: "📱 *Need Help?*\nContact our support team 24/7"
    },
    tickets: {
      title: "🎫 *Your Tickets*",
      no_tickets: "📭 *You don't have any tickets yet.*\n\nJoin a program to get started!",
      status_verified: "✅ Verified",
      status_pending: "⏳ Pending",
      footer: "📱 View all tickets in the app:"
    },
    programs: {
      title: "🎯 *Available Programs*",
      subtitle: "Choose from our premium programs below:",
      merkato: "🏪 *Merkato VIP* - Win Cash up to 10M ETB",
      city: "🏙️ *City VIP* - Win Cash in 94 Cities",
      regular: "🏊 *Regular Pools* - Win Cars, Houses, Machinery & Electronics",
      commission: "💰 *20% Commission* for Agents & Partners",
      health: "💚 *2% Supports* Kidney & Heart Patients",
      action: "👇 Select a program below to learn more:"
    },
    vip_tiers: {
      title: "🏆 *VIP Tiers*",
      silver: "🥈 Silver: 100K ETB - 1,200 Seats",
      gold: "🥇 Gold: 500K ETB - 1,200 Seats",
      platinum: "💎 Platinum: 1M ETB - 2,400 Seats",
      diamond: "💠 Diamond: 2M ETB - 2,400 Seats",
      royal: "👑 Royal: 5M ETB - 2,400 Seats",
      emperor: "🏆 Emperor: 10M ETB - 2,400 Seats"
    },
    buttons: {
      language_english: "🇬🇧 English",
      language_amharic: "🇪🇹 አማርኛ",
      language_oromo: "🌍 Afaan Oromo",
      back_to_menu: "🔙 Back to Main Menu",
      open_app: "🚀 Open Abbaa Carraa",
      dashboard: "📊 My Dashboard",
      merkato: "🏪 Merkato VIP",
      city: "🏙️ City VIP",
      pools: "🏊 Regular Pools",
      register: "📝 Register Now",
      winners: "🏆 Winners",
      select_city: "🎯 Select City",
      view_all_cities: "🔍 View All Cities",
      join_merkato: "🎯 Join Merkato VIP",
      join_city: "🎯 Join City VIP",
      view_pools: "🎯 View All Pools",
      get_started: "🚀 Get Started",
      live_chat: "💬 Live Chat",
      faq: "❓ FAQ",
      hall_of_fame: "🏆 Hall of Fame",
      how_it_works: "📖 How It Works",
      support: "📞 Support",
      help: "ℹ️ Help"
    }
  },

  // ============================================
  // AMHARIC TRANSLATIONS
  // ============================================
  am: {
    language_select: "🌐 *ቋንቋዎን ይምረጡ*\n\nእባክዎ የሚመርጡትን ቋንቋ ይምረጡ:",
    language_set: "✅ ቋንቋ ወደ አማርኛ ተቀይሯል",
    welcome: {
      title: (name) => `👋 *እንኳን ወደ Abbaa Carraa በደህና መጡ, ${name}!*`,
      subtitle: "🏆 *የኢትዮጵያ ቀዳሚ የሽልማት መድረክ*",
      prompt: "🎯 *ምን ማድረግ ይፈልጋሉ:*\n\n🏪 መርካቶ ቪአይፒ - እስከ 10M ብር ያሸንፉ\n🏙️ ከተማ ቪአይፒ - በ94 ከተሞች ያሸንፉ\n🏊 መደበኛ የእጣ መደቦች - መኪና፣ ቤት እና ሌሎች",
      action: "📱 *ሁሉም ተግባራት በመተግበሪያው ውስጥ ይከናወናሉ!*\n\n🔽 *ለመጀመር ከታች ያለውን ቁልፍ ይጫኑ!*"
    },
    merkato_vip: {
      title: "🏪 *መርካቶ ቪአይፒ*",
      subtitle: "💰 እስከ 10M ብር ጥሬ ገንዘብ ያሸንፉ!",
      tiers_label: "*6 የቪአይፒ ደረጃዎች:*",
      footer: "📱 ሁሉም ተግባራት በመተግበሪያው ውስጥ ይከናወናሉ!\n\n🔽 ለመጀመር ከታች ያለውን ቁልፍ ይጫኑ!"
    },
    city_vip: {
      title: "🏙️ *የከተማ ቪአይፒ ፕሮግራሞች*",
      subtitle: "📍 በ94 የኢትዮጵያ ከተሞች ጥሬ ገንዘብ ያሸንፉ!",
      tiers_label: "*6 የቪአይፒ ደረጃዎች ይገኛሉ:*",
      cities_label: "🏙️ *የሚገኙ ከተሞች:*",
      cities_list: "አዲስ አበባ፣ ሸገር፣ ድሬ ዳዋ፣ መቀሌ፣ ጎንደር፣ ባህር ዳር፣ ሀዋሳ፣ አዳማ፣ ጅማ እና ከ85 በላይ ሌሎች!",
      footer: "📱 ሁሉም ተግባራት በመተግበሪያው ውስጥ ይከናወናሉ!\n\n🔽 ለመጀመር ከታች ያለውን ቁልፍ ይጫኑ!"
    },
    regular_pools: {
      title: "🏊 *መደበኛ የሽልማት መደቦች*",
      subtitle: "🎁 አስደናቂ ሽልማቶችን ያሸንፉ:",
      items: "🚗 መኪናዎች - የተለያዩ ሞዴሎች\n🏠 ቤቶች - የንብረት ኢንቨስትመንቶች\n🏭 ማሽነሪዎች - መሳሪያዎች እና ቁሳቁሶች\n💻 ኤሌክትሮኒክስ - ጋጄቶች እና መሳሪያዎች\n🎁 እና ሌሎች ብዙ!",
      description: "💰 የተለያዩ የመግቢያ ደረጃዎች ያላቸው በርካታ የሽልማት መደቦች ይገኛሉ።",
      footer: "📱 ሁሉም ተግባራት በመተግበሪያው ውስጥ ይከናወናሉ!\n\n🔽 ለመጀመር ከታች ያለውን ቁልፍ ይጫኑ!"
    },
    winners: {
      title: "🏆 *የቅርብ ጊዜ አሸናፊዎች*",
      no_winners: "ምንም አሸናፊዎች የሉም። የመጀመሪያው ይሁኑ! 🎯",
      footer: "📱 ሁሉንም አሸናፊዎች በመተግበሪያው ውስጥ ይመልከቱ:"
    },
    how_it_works: {
      title: "📖 *እንዴት እንሳተፋለን?*",
      step1: "1️⃣ *የእጣ መደብ ይምረጡ*\n• 🏪 መርካቶ ቪአይፒ - እስከ 10M ብር ያሸንፉ\n• 🏙️ ከተማ ቪአይፒ - በ94 ከተሞች ያሸንፉ\n• 🏊 መደበኛ የእጣ መደቦች - መኪና፣ ቤት እና ሌሎች",
      step2: "2️⃣ *አስተዋፅኦ ያድርጉ*\n• ደረጃዎን ይምረጡ (ብር፣ ወርቅ፣ ፕላቲኒየም፣ አልማዝ፣ ንጉሣዊ፣ ንጉሠ ነገሥት)\n• በመተግበሪያው ውስጥ ደህንነቱ በተጠበቀ ሁኔታ ይክፈሉ\n• የመቀመጫ ቁጥርዎን ያግኙ",
      step3: "3️⃣ *ያሸንፉ!*\n• አሸናፊዎች በየጊዜው ይገለፃሉ\n• ሽልማትዎን ይውሰዱ\n• የክብር አዳራሹን ይቀላቀሉ!",
      health: "💚 *2% ለጤና* የኩላሊት እና የልብ ህመምተኞችን ይደግፋል",
      footer: "📱 ጉዞዎን አሁን ይጀምሩ:"
    },
    support: {
      title: "📞 *እኛን ያግኙ*",
      subtitle: "ቡድናችን 24/7 ለእርዳታ ዝግጁ ነው።",
      ways: "📱 *እኛን ለማግኘት መንገዶች:*",
      email: "📧 ኢሜይል: hundessanegassa@gmail.com",
      phone: "📱 ስልክ: 0930330323, 0913 277 922",
      help: "💬 *ፈጣን እርዳታ:*\n• ለክፍያ ችግሮች: /mytickets ይጠቀሙ\n• ለፕሮግራም መረጃ: /programs ይጠቀሙ\n• ለአጠቃላይ እርዳታ: የእኛን FAQ ገፅ ይጎብኙ"
    },
    help: {
      title: "📖 *እርዳታ እና ድጋፍ*",
      subtitle: "🤖 *የሚገኙ ትዕዛዞች:*",
      commands: "/start - 🚀 የእንኳን ደህና መጣችሁ መልዕክት\n/help - 📖 ይህ የእርዳታ መልዕክት\n/mytickets - 🎫 ቲኬቶችዎን ይመልከቱ\n/programs - 🎯 የሚገኙ ፕሮግራሞችን ይመልከቱ\n/language - 🌐 ቋንቋ ይቀይሩ\n/support - 📞 እኛን ያግኙ\n/winners - 🏆 የቅርብ ጊዜ አሸናፊዎችን ይመልከቱ\n/howitworks - 📖 እንዴት እንሳተፋለን",
      footer: "📱 *እርዳታ ያስፈልግዎታል?*\nቡድናችንን 24/7 ያግኙ"
    },
    tickets: {
      title: "🎫 *ቲኬቶችዎ*",
      no_tickets: "📭 *ምንም ቲኬቶች የሉዎትም.*\n\nእባክዎ ለመጀመር ፕሮግራም ይቀላቀሉ!",
      status_verified: "✅ የተረጋገጠ",
      status_pending: "⏳ በመጠባበቅ ላይ",
      footer: "📱 ሁሉንም ቲኬቶች በመተግበሪያው ውስጥ ይመልከቱ:"
    },
    programs: {
      title: "🎯 *የሚገኙ ፕሮግራሞች*",
      subtitle: "ከታች ካሉት ፕሮግራሞች ይምረጡ:",
      merkato: "🏪 *መርካቶ ቪአይፒ* - እስከ 10M ብር ጥሬ ገንዘብ ያሸንፉ",
      city: "🏙️ *ከተማ ቪአይፒ* - በ94 ከተሞች ጥሬ ገንዘብ ያሸንፉ",
      regular: "🏊 *መደበኛ የእጣ መደቦች* - መኪና፣ ቤት፣ ማሽነሪ እና ኤሌክትሮኒክስ ያሸንፉ",
      commission: "💰 *20% ኮሚሽን* ለተወካዮች እና አጋሮች",
      health: "💚 *2% ለጤና* የኩላሊት እና የልብ ህመምተኞችን ይደግፋል",
      action: "👇 ለበለጠ መረጃ ከታች ያለውን ፕሮግራም ይምረጡ:"
    },
    vip_tiers: {
      title: "🏆 *የቪአይፒ ደረጃዎች*",
      silver: "🥈 ብር: 100K ብር - 1,200 መቀመጫዎች",
      gold: "🥇 ወርቅ: 500K ብር - 1,200 መቀመጫዎች",
      platinum: "💎 ፕላቲኒየም: 1M ብር - 2,400 መቀመጫዎች",
      diamond: "💠 አልማዝ: 2M ብር - 2,400 መቀመጫዎች",
      royal: "👑 ንጉሣዊ: 5M ብር - 2,400 መቀመጫዎች",
      emperor: "🏆 ንጉሠ ነገሥት: 10M ብር - 2,400 መቀመጫዎች"
    },
    buttons: {
      language_english: "🇬🇧 English",
      language_amharic: "🇪🇹 አማርኛ",
      language_oromo: "🌍 Afaan Oromo",
      back_to_menu: "🔙 ወደ ዋና ምናሌ",
      open_app: "🚀 አባካራን ይክፈቱ",
      dashboard: "📊 የእኔ ዳሽቦርድ",
      merkato: "🏪 መርካቶ ቪአይፒ",
      city: "🏙️ ከተማ ቪአይፒ",
      pools: "🏊 መደበኛ የእጣ መደቦች",
      register: "📝 ይመዝገቡ",
      winners: "🏆 አሸናፊዎች",
      select_city: "🎯 ከተማ ይምረጡ",
      view_all_cities: "🔍 ሁሉንም ከተሞች ይመልከቱ",
      join_merkato: "🎯 መርካቶ ቪአይፒ ይቀላቀሉ",
      join_city: "🎯 ከተማ ቪአይፒ ይቀላቀሉ",
      view_pools: "🎯 ሁሉንም መደቦች ይመልከቱ",
      get_started: "🚀 ይጀምሩ",
      live_chat: "💬 የቀጥታ ውይይት",
      faq: "❓ ተደጋጋሚ ጥያቄዎች",
      hall_of_fame: "🏆 የክብር አዳራሽ",
      how_it_works: "📖 እንዴት እንሳተፋለን",
      support: "📞 እኛን ያግኙ",
      help: "ℹ️ እርዳታ"
    }
  },

  // ============================================
  // AFAN OROMO TRANSLATIONS
  // ============================================
  om: {
    language_select: "🌐 *Afaan Filadhu*\n\nMaaloo afaan barbaddaan filadha:",
    language_set: "✅ Afaan Afaan Oromootti jijjiirame",
    welcome: {
      title: (name) => `👋 *Gara Abbaa Carraatti, ${name}! Baga nagaan dhufte!*`,
      subtitle: "🏆 *Itoophiyaatti Dirree Badhaasaa Olaanaa *",
      prompt: "🎯 *Maal hirmaachu barbaaddu:*\n\n🏪 Merkato VIP - Maallaqa hanga miliyoona 10 ta'u argadha\n🏙️ VIP Magaalaa - Magaalaa 94 keessatti Maallaqa hanga miliyoona 10n mo'aadha\n🏊 carraa idilee - Konkoolataa, Mana, Mashinoota fi Elektirooniksii fkkf mo'aadha",
      action: "📱 *Gochaaleen hundi appii keessatti raawwatamu!*\n\n🔽 *geesituu armaan gadii cuqasuun eegala!*"
    },
    merkato_vip: {
      title: "🏪 *Merkato VIP*",
      subtitle: "💰 Maallaqa hanga miliyoona 10 ta'u mo'aadha!",
      tiers_label: "*Sadarkaa VIP 6:*",
      footer: "📱 Gochaaleen hundi appii keessatti raawwatamu!\n\n🔽geesituu armaan gadii cuqasuun eegala !"
    },
    city_vip: {
      title: "🏙️ *sagaantaa VIP magaloota*",
      subtitle: "📍 itoophiyaatti Magaaloota 94 keessatti Maallaqaan mo'aadha!",
      tiers_label: "*Sadarkaa VIP 6 ni argamu:*",
      cities_label: "🏙️ *Magaaleen Argaman:*",
      cities_list: "Addis Ababa, Shaggar, Dire Dawa, Mekelle, Gondar, Bahir Dar, Hawassa, Adama, Jimma, fi 85+ fi kan biroo!",
      footer: "📱 Gochaaleen hundi appii keessatti raawwatamu!\n\n🔽geesituu armaan gadii cuqasuun eegala !"
    },
    regular_pools: {
      title: "🏊 *carraa Badhaasa Idilee*",
      subtitle: "🎁 Badhaasa ajaa'ibsiisaa ta'e injifadhaa:",
      items: "🚗 Konkoolataa - Gosoota Addaddaa\n🏠 Mana - Investimantii Qabeenyaa\n🏭 Mashiniin - lodaara, ekskavataara fi mashinoota biroo\n💻 Elektirooniksii - televishiini, firijii, bilbiloota ammayyaa fi Meeshaalee biroo\n🎁 Waan Bayeessa!",
      description: "💰Carraa badhaasaa garaa garaa sadarkaa galmee adda addaa qabanitu jira.",
      footer: "📱 Gochaaleen hundi appii keessatti raawwatamu!\n\n🔽 geesituu armaan gadii cuqasuun eegala!"
    },
    winners: {
      title: "🏆 *Mo'attoota Dhiyoo*",
      no_winners: "Mo'attaann dhiyoo hin jiru. Isa jalqabaa ta'aa! 🎯",
      footer: "📱 Mo'attoota hundaa appii keessatti ilaali:"
    },
    how_it_works: {
      title: "📖 *Akkam Hojiirra Oola?*",
      step1: "1️⃣ *ta'uumsa carraa Tokko filaadhu*\n• 🏪 Merkato VIP - Maallaqa hanga miliyoona 10 ta'u mo'aadhu\n• 🏙️ VIP Magaalaa - Magaalaa 94 keessatti Maallaqaan mo'aadhu\n• 🏊 Carraawaan idilee - Konkoolataa, Mana, Mashinoota fi Elektirooniksii mo'aadhu",
      step2: "2️⃣ *Gumaachuu*\n• Sadarkaa keessan filadha (Silver, Gold, Platinum, Diamond, Royal, Emperor)\n• Appii keessatti kaffaltii amanamaa ta'e raawwadhu\n• Lakkoofsa teessoo kee argadhu",
      step3: "3️⃣ *Mo'adhaa!*\n• Mo'attaan yeroon labsama\n• Badhaasa keessan fudhadha\n•Galma kabajaa seena !",
      health: "💚 *galiin %2 dhukubsatoota Kalee fi Onnee gargaaruuf oola",
      footer: "📱 Imala keessan amma eegalaa:"
    },
    support: {
      title: "📞 *Nu Qunnamuu*",
      subtitle: "Gareen keenya 24/7 isiin gargaaruuf qophiidha.",
      ways: "📱 *karaa/haala ittiin nu qunnamuu dandeessan:*",
      email: "📧 Email: hundessanegassa@gmail.com",
      phone: "📱 Bilbila: 0930330323, 0913 277 922",
      help: "💬 *Gargaarsa Saffisaa:*\n• Rakkoo kaffaltiitiif: /mytickets itti fayyadamaa\n• Odeeffannoo sagantoole jiraan baruuf: /programs itti fayyadamaa\n• Gargaarsa waliigalaaf: Fuula FAQ keenyarratti ilaalaa"
    },
    help: {
      title: "📖 *Gargaarsa fi Deeggarsa*",
      subtitle: "🤖 *ajajoota:*",
      commands: "/start - 🚀 Ergaa baga nagaan dhufte\n/help - 📖 Ergaa gargaarsaa kana\n/mytickets - 🎫 Tikkeetoota keessan ilaaluu\n/programs - 🎯 Tarkaanfiiwwan argaman ilaaluu\n/language - 🌐 Afaan jijjiiruu\n/support - 📞 Nu qunnamuu\n/winners - 🏆 Mo'attoota dhiyoo ilaaluu\n/howitworks - 📖 Akkam hojiirra oola",
      footer: "📱 *Gargaarsa Barbaaddaa?*\nGareen keenya 24/7 qunnamaa"
    },
    tickets: {
      title: "🎫 *Tikkeetoota Keessan*",
      no_tickets: "📭 *Tikkeetii tokko hin qabdu.*\n\nMaaloo Sagantaa tokkotti makamuudhaan jalqabi !",
      status_verified: "✅ Mirkanaa'e",
      status_pending: "⏳ Eegachaa jira",
      footer: "📱 Tikkeetoota hundaa appii keessatti ilaali:"
    },
    programs: {
      title: "🎯 *Tarkaanfiiwwan Argaman*",
      subtitle: "Tarkaanfiiwwan armaan gadii keessaa filadhu:",
      merkato: "🏪 *Merkato VIP* - Maallaqa hanga miliyoona 10 ta'u mo'aadhu",
      city: "🏙️ *VIP Magaalaa * - Magaalaa 94 keessatti Maallaqaan mo'aadhu",
      regular: "🏊 *carraawwaan idilee* - Konkoolataa, Mana, Mashiniin & Elektirooniksii mo'aadhu",
      commission: "💰 *Komishinii %20* bakka buutotaa fi partinarootaaf",
      health: "💚 *2% Fayyaaf* Dhibamtoota Kalee fi Onnee gargaaruuf oola",
      action: "👇 Odeeffannoo dabalataaf tarkaanfii jalatti argamu filadhu:"
    },
    vip_tiers: {
      title: "🏆 *Sadarkaa VIP*",
      silver: "🥈 Silver: 100K ETB - 1,200 Teessoo",
      gold: "🥇 Gold: 500K ETB - 1,200 Teessoo",
      platinum: "💎 Platinum: 1M ETB - 2,400 Teessoo",
      diamond: "💠 Diamond: 2M ETB - 2,400 Teessoo",
      royal: "👑 Royal: 5M ETB - 2,400 Teessoo",
      emperor: "🏆 Emperor: 10M ETB - 2,400 Teessoo"
    },
    buttons: {
      language_english: "🇬🇧 English",
      language_amharic: "🇪🇹 አማርኛ",
      language_oromo: "🌍 Afaan Oromo",
      back_to_menu: "🔙 gara Menutti deebi'i",
      open_app: "🚀 Abbaa Carraa Bani",
      dashboard: "📊 Daashboorardii Koo",
      merkato: "🏪 Merkato VIP",
      city: "🏙️ VIP Magaalaa ",
      pools: "🏊 carraawwaan idilee",
      register: "📝 Galmaa'i",
      winners: "🏆 Mo'attoota",
      select_city: "🎯 Magaalaa Filadhu",
      view_all_cities: "🔍 Magaalaa Hundaa Ilaali",
      join_merkato: "🎯 Merkato VIP'ti hirmaadhu",
      join_city: "🎯 VIP Magaalaatti hirmaadhu",
      view_pools: "🎯 carraawwaan idilee Hundaa Ilaali",
      get_started: "🚀 Eegali",
      live_chat: "💬 Marii sarara irraa",
      faq: "❓ FAQ",
      hall_of_fame: "🏆Galma Guddoota ",
      how_it_works: "📖 Akkam Hojiirra Oola",
      support: "📞 Nu Qunnamuu",
      help: "ℹ️ Gargaarsa"
    }
  }
};

// VIP Tiers Data (shared across all languages)
const VIP_TIERS = [
  { id: 'silver', icon: '🥈', name_en: 'Silver', name_am: 'ብር', name_om: 'Silver', prize: '100K ETB', seats: 1200 },
  { id: 'gold', icon: '🥇', name_en: 'Gold', name_am: 'ወርቅ', name_om: 'Gold', prize: '500K ETB', seats: 1200 },
  { id: 'platinum', icon: '💎', name_en: 'Platinum', name_am: 'ፕላቲኒየም', name_om: 'Platinum', prize: '1M ETB', seats: 2400 },
  { id: 'diamond', icon: '💠', name_en: 'Diamond', name_am: 'አልማዝ', name_om: 'Diamond', prize: '2M ETB', seats: 2400 },
  { id: 'royal', icon: '👑', name_en: 'Royal', name_am: 'ንጉሣዊ', name_om: 'Royal', prize: '5M ETB', seats: 2400 },
  { id: 'emperor', icon: '🏆', name_en: 'Emperor', name_am: 'ንጉሠ ነገሥት', name_om: 'Emperor', prize: '10M ETB', seats: 2400 }
];

// ============================================
// BOT COMMAND HANDLERS
// ============================================
export async function setupBotCommands() {
  if (!bot) return;

  try {
    await bot.telegram.setMyCommands([
      { command: 'start', description: '🚀 Start the bot' },
      { command: 'help', description: '📖 Get help' },
      { command: 'mytickets', description: '🎫 View your tickets' },
      { command: 'programs', description: '🎯 View available programs' },
      { command: 'language', description: '🌐 Change language' },
      { command: 'support', description: '📞 Contact support' },
      { command: 'winners', description: '🏆 View recent winners' },
      { command: 'howitworks', description: '📖 How it works' },
    ]);
    console.log('✅ Bot commands set successfully');
  } catch (error) {
    console.error('❌ Failed to set bot commands:', error);
  }
}

export async function handleBotMessages() {
  if (!bot) {
    console.log('⚠️ Bot not initialized');
    return;
  }

  // Global error handler
  bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('⚠️ Something went wrong. Please try again later.');
  });

  // ============================================
  // GET USER LANGUAGE FUNCTION
  // ============================================
  async function getUserLanguage(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('language')
        .eq('telegram_id', userId)
        .single();
      
      return data?.language || 'en';
    } catch (error) {
      return 'en';
    }
  }

  // ============================================
  // BUILD MAIN MENU FUNCTION - PROGRAMS FIRST
  // ============================================
  function buildMainMenu(lang) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com';
    
    return {
      inline_keyboard: [
        // PROGRAMS SECTION - FIRST
        [{ text: t.buttons.merkato, web_app: { url: `${appUrl}/merkato-vip` } }],
        [{ text: t.buttons.city, web_app: { url: `${appUrl}/cities` } }],
        [{ text: t.buttons.pools, web_app: { url: `${appUrl}/listings` } }],
        // APP ACTIONS
        [{ text: t.buttons.open_app, web_app: { url: appUrl } }],
        [{ text: t.buttons.dashboard, web_app: { url: `${appUrl}/dashboard` } }],
        [{ text: t.buttons.register, web_app: { url: `${appUrl}/register` } }],
        // SUPPORT & INFO
        [{ text: t.buttons.winners, web_app: { url: `${appUrl}/winners` } }],
        [{ text: t.buttons.how_it_works, web_app: { url: `${appUrl}/how-it-works` } }],
        [{ text: t.buttons.support, web_app: { url: `${appUrl}/contact` } }],
        [{ text: t.buttons.live_chat, web_app: { url: `${appUrl}/contact` } }],
        [{ text: t.buttons.faq, web_app: { url: `${appUrl}/faq` } }],
        // LANGUAGE SELECTION
        [{ text: t.buttons.language_english, callback_data: 'lang_en' }],
        [{ text: t.buttons.language_amharic, callback_data: 'lang_am' }],
        [{ text: t.buttons.language_oromo, callback_data: 'lang_om' }],
        [{ text: t.buttons.help, callback_data: 'help' }]
      ]
    };
  }

  // ============================================
  // BUILD PROGRAMS MENU
  // ============================================
  function buildProgramsMenu(lang) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com';
    
    return {
      inline_keyboard: [
        [{ text: t.buttons.merkato, web_app: { url: `${appUrl}/merkato-vip` } }],
        [{ text: t.buttons.city, web_app: { url: `${appUrl}/cities` } }],
        [{ text: t.buttons.pools, web_app: { url: `${appUrl}/listings` } }],
        [{ text: t.buttons.back_to_menu, callback_data: 'main_menu' }]
      ]
    };
  }

  // ============================================
  // START COMMAND - LANGUAGE FIRST
  // ============================================
  bot.start(async (ctx) => {
    const user = ctx.from;
    const name = user.first_name || 'User';
    
    // Save user to database
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_id', user.id)
        .single();

      if (!existingProfile) {
        await supabase
          .from('profiles')
          .insert({
            telegram_id: user.id,
            telegram_username: user.username,
            full_name: `${user.first_name} ${user.last_name || ''}`.trim(),
            email: `${user.username || user.id}@telegram.user`,
            language: 'en',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }

    // Get user's preferred language
    const lang = await getUserLanguage(user.id);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

    // STEP 1: LANGUAGE SELECTION FIRST
    const langKeyboard = {
      inline_keyboard: [
        [{ text: t.buttons.language_english, callback_data: 'lang_en' }],
        [{ text: t.buttons.language_amharic, callback_data: 'lang_am' }],
        [{ text: t.buttons.language_oromo, callback_data: 'lang_om' }]
      ]
    };

    await ctx.reply(t.language_select, {
      parse_mode: 'Markdown',
      reply_markup: langKeyboard
    });

    // STEP 2: WELCOME WITH PROGRAMS
    const welcomeMessage = 
      `${t.welcome.title(name)}\n\n` +
      `${t.welcome.subtitle}\n\n` +
      `${t.programs.title}\n\n` +
      `${t.programs.merkato}\n` +
      `${t.programs.city}\n` +
      `${t.programs.regular}\n\n` +
      `${t.programs.commission}\n` +
      `${t.programs.health}\n\n` +
      `${t.programs.action}`;

    await ctx.reply(welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: buildProgramsMenu(lang)
    });
  });

  // ============================================
  // LANGUAGE SELECTION CALLBACK
  // ============================================
  bot.action(/lang_(.+)/, async (ctx) => {
    const lang = ctx.match[1];
    const userId = ctx.from.id;
    const name = ctx.from.first_name || 'User';
    
    try {
      await supabase
        .from('profiles')
        .update({ language: lang })
        .eq('telegram_id', userId);
      
      const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
      
      await ctx.reply(t.language_set, { parse_mode: 'Markdown' });
      
      // Show welcome with programs in new language
      const welcomeMessage = 
        `${t.welcome.title(name)}\n\n` +
        `${t.welcome.subtitle}\n\n` +
        `${t.programs.title}\n\n` +
        `${t.programs.merkato}\n` +
        `${t.programs.city}\n` +
        `${t.programs.regular}\n\n` +
        `${t.programs.commission}\n` +
        `${t.programs.health}\n\n` +
        `${t.programs.action}`;

      await ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: buildProgramsMenu(lang)
      });
      
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Language update error:', error);
      await ctx.reply('⚠️ Failed to update language');
    }
  });

  // ============================================
  // PROGRAMS COMMAND
  // ============================================
  bot.command('programs', async (ctx) => {
    const lang = await getUserLanguage(ctx.from.id);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com';
    
    let tiersText = '';
    VIP_TIERS.forEach(tier => {
      const name = lang === 'am' ? tier.name_am : (lang === 'om' ? tier.name_om : tier.name_en);
      tiersText += `${tier.icon} ${name}: ${tier.prize} - ${tier.seats.toLocaleString()} Seats\n`;
    });

    const message = 
      `${t.programs.title}\n\n` +
      `${t.programs.merkato}\n` +
      `${t.programs.city}\n` +
      `${t.programs.regular}\n\n` +
      `${t.vip_tiers.title}\n${tiersText}\n` +
      `${t.programs.commission}\n` +
      `${t.programs.health}\n\n` +
      `${t.programs.action}`;

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: buildProgramsMenu(lang)
    });
  });

  // ============================================
  // HELP COMMAND
  // ============================================
  bot.help(async (ctx) => {
    const lang = await getUserLanguage(ctx.from.id);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.reply(
      `${t.help.title}\n\n${t.help.subtitle}\n${t.help.commands}\n\n${t.help.footer}`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.buttons.back_to_menu, callback_data: 'main_menu' }]
          ]
        }
      }
    );
  });

  // ============================================
  // MY TICKETS COMMAND
  // ============================================
  bot.command('mytickets', async (ctx) => {
    const user = ctx.from;
    const lang = await getUserLanguage(user.id);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com';
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('telegram_id', user.id)
        .single();

      if (!profile) {
        await ctx.reply(t.tickets.no_tickets, { parse_mode: 'Markdown' });
        return;
      }

      const userId = profile.id;

      const [merkatoTickets, cityTickets, regularTickets] = await Promise.all([
        supabase
          .from('merkato_vip_participants')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('city_vip_participants')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('regular_pool_participants')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(3)
      ]);

      const allTickets = [
        ...(merkatoTickets.data || []).map(t => ({ ...t, type: 'Merkato VIP' })),
        ...(cityTickets.data || []).map(t => ({ ...t, type: 'City VIP' })),
        ...(regularTickets.data || []).map(t => ({ ...t, type: 'Regular Pool' }))
      ];

      if (allTickets.length === 0) {
        await ctx.reply(t.tickets.no_tickets, { parse_mode: 'Markdown' });
        return;
      }

      let message = t.tickets.title;
      allTickets.slice(0, 5).forEach((ticket, i) => {
        const status = ticket.payment_status === 'verified' ? t.tickets.status_verified : t.tickets.status_pending;
        message += `${i + 1}. 🏆 ${ticket.type}\n`;
        message += `   💺 ${ticket.seat_numbers?.join(', ') || 'N/A'}\n`;
        message += `   ${status}\n`;
        message += `   #${ticket.ticket_number || 'N/A'}\n\n`;
      });

      if (allTickets.length > 5) {
        message += `*And ${allTickets.length - 5} more...*\n\n`;
      }

      message += t.tickets.footer;
      
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.buttons.dashboard, web_app: { url: `${appUrl}/dashboard` } }],
            [{ text: t.buttons.back_to_menu, callback_data: 'main_menu' }]
          ]
        }
      });
    } catch (error) {
      console.error('Error fetching tickets:', error);
      await ctx.reply('⚠️ Failed to fetch your tickets. Please try again later.');
    }
  });

  // ============================================
  // LANGUAGE COMMAND
  // ============================================
  bot.command('language', async (ctx) => {
    const lang = await getUserLanguage(ctx.from.id);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    const langKeyboard = {
      inline_keyboard: [
        [{ text: t.buttons.language_english, callback_data: 'lang_en' }],
        [{ text: t.buttons.language_amharic, callback_data: 'lang_am' }],
        [{ text: t.buttons.language_oromo, callback_data: 'lang_om' }],
        [{ text: t.buttons.back_to_menu, callback_data: 'main_menu' }]
      ]
    };

    await ctx.reply(t.language_select, {
      parse_mode: 'Markdown',
      reply_markup: langKeyboard
    });
  });

  // ============================================
  // SUPPORT COMMAND
  // ============================================
  bot.command('support', async (ctx) => {
    const lang = await getUserLanguage(ctx.from.id);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com';
    
    await ctx.reply(
      `${t.support.title}\n\n` +
      `${t.support.subtitle}\n\n` +
      `${t.support.ways}\n` +
      `${t.support.email}\n` +
      `${t.support.phone}\n\n` +
      `${t.support.help}`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.buttons.live_chat, web_app: { url: `${appUrl}/contact` } }],
            [{ text: t.buttons.faq, web_app: { url: `${appUrl}/faq` } }],
            [{ text: t.buttons.back_to_menu, callback_data: 'main_menu' }]
          ]
        }
      }
    );
  });

  // ============================================
  // WINNERS COMMAND
  // ============================================
  bot.command('winners', async (ctx) => {
    const lang = await getUserLanguage(ctx.from.id);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com';
    
    try {
      const { data: winners } = await supabase
        .from('pools')
        .select('*')
        .eq('status', 'completed')
        .not('winner_id', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(5);

      let winnersText = '';
      if (winners && winners.length > 0) {
        winners.forEach((w, i) => {
          winnersText += `${i + 1}. 🏆 ${w.title || 'Prize'}\n`;
          winnersText += `   💰 ${w.prize_amount || 'N/A'}\n\n`;
        });
      } else {
        winnersText = t.winners.no_winners;
      }

      await ctx.reply(
        `${t.winners.title}\n${winnersText}\n${t.winners.footer}`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: t.buttons.hall_of_fame, web_app: { url: `${appUrl}/winners` } }],
              [{ text: t.buttons.back_to_menu, callback_data: 'main_menu' }]
            ]
          }
        }
      );
    } catch (error) {
      console.error('Error fetching winners:', error);
      await ctx.reply('⚠️ Failed to fetch winners. Please try again later.');
    }
  });

  // ============================================
  // HOW IT WORKS COMMAND
  // ============================================
  bot.command('howitworks', async (ctx) => {
    const lang = await getUserLanguage(ctx.from.id);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com';
    
    await ctx.reply(
      `${t.how_it_works.title}\n\n` +
      `${t.how_it_works.step1}\n\n` +
      `${t.how_it_works.step2}\n\n` +
      `${t.how_it_works.step3}\n\n` +
      `${t.how_it_works.health}\n\n` +
      `${t.how_it_works.footer}`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.buttons.get_started, web_app: { url: appUrl } }],
            [{ text: t.buttons.back_to_menu, callback_data: 'main_menu' }]
          ]
        }
      }
    );
  });

  // ============================================
  // MAIN MENU CALLBACK
  // ============================================
  bot.action('main_menu', async (ctx) => {
    const lang = await getUserLanguage(ctx.from.id);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const name = ctx.from.first_name || 'User';
    
    const welcomeMessage = 
      `${t.welcome.title(name)}\n\n` +
      `${t.welcome.subtitle}\n\n` +
      `${t.programs.title}\n\n` +
      `${t.programs.merkato}\n` +
      `${t.programs.city}\n` +
      `${t.programs.regular}\n\n` +
      `${t.programs.commission}\n` +
      `${t.programs.health}\n\n` +
      `${t.programs.action}`;

    await ctx.editMessageText(welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: buildProgramsMenu(lang)
    });
    await ctx.answerCbQuery();
  });

  // ============================================
  // HELP CALLBACK
  // ============================================
  bot.action('help', async (ctx) => {
    const lang = await getUserLanguage(ctx.from.id);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.reply(
      `${t.help.title}\n\n${t.help.subtitle}\n${t.help.commands}\n\n${t.help.footer}`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.buttons.back_to_menu, callback_data: 'main_menu' }]
          ]
        }
      }
    );
    await ctx.answerCbQuery();
  });

  // ============================================
  // HANDLE TEXT MESSAGES
  // ============================================
  bot.on('text', async (ctx) => {
    const text = ctx.message.text.toLowerCase();
    const lang = await getUserLanguage(ctx.from.id);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    if (text.includes('hello') || text.includes('hi') || text.includes('ሰላም') || text.includes('salam')) {
      await ctx.reply(
        `👋 Hello! Welcome to Abbaa Carraa.\n\n` +
        `Type /start to begin or /help for assistance.`
      );
    } else if (text.includes('ticket') || text.includes('ቲኬት')) {
      await ctx.reply(
        `🎫 *Tickets*\n\n` +
        `Use /mytickets to view your tickets.\n` +
        `Or visit the app: ${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/dashboard`,
        { parse_mode: 'Markdown' }
      );
    } else if (text.includes('program') || text.includes('ፕሮግራም') || text.includes('sagantaa')) {
      await ctx.reply(
        `🎯 *Programs*\n\n` +
        `Use /programs to see all available programs.\n` +
        `Or visit the app: ${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}`,
        { parse_mode: 'Markdown' }
      );
    } else if (text.includes('winner') || text.includes('አሸናፊ') || text.includes('mo'atta')) {
      await ctx.reply(
        `🏆 *Winners*\n\n` +
        `Use /winners to see recent winners.\n` +
        `Or visit the app: ${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/winners`,
        { parse_mode: 'Markdown' }
      );
    } else if (text.includes('how') || text.includes('እንዴት') || text.includes('akkam')) {
      await ctx.reply(
        `📖 *How It Works*\n\n` +
        `Use /howitworks to learn more.\n` +
        `Or visit the app: ${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await ctx.reply(
        `🤔 I didn't understand that.\n\n` +
        `Try one of these commands:\n` +
        `/start - Welcome message\n` +
        `/help - Help information\n` +
        `/mytickets - View your tickets\n` +
        `/programs - View available programs\n` +
        `/language - Change language\n` +
        `/support - Contact support\n` +
        `/winners - View recent winners\n` +
        `/howitworks - How it works`,
        { parse_mode: 'Markdown' }
      );
    }
  });
}

export default bot;
