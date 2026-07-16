
// lib/bot.js - COMPLETE TELEGRAM BOT WITH 3 LANGUAGES (English, Amharic, Afan Oromo)
import { Telegraf } from 'telegraf';
import { supabase } from './supabase';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN not set. Bot features will not work.');
}

export const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

// ============================================
// USER SESSION STORAGE
// ============================================
const userSessions = {};

// ============================================
// COMPLETE TRANSLATIONS - 3 LANGUAGES
// ============================================
const TRANSLATIONS = {
  // ========== ENGLISH ==========
  en: {
    welcome: "👋 *Welcome to Abbaa Carraa!*\n\n🏆 Ethiopia's Premier Prize Platform\n\nPlease share your information to get started:",
    ask_name: "📝 *What is your full name?*\n\nPlease enter your full name:",
    ask_phone: "📱 *What is your phone number?*\n\nPlease enter your phone number (e.g., 0912345678):",
    name_received: "✅ Thank you! Your name has been saved.",
    phone_received: "✅ Thank you! Your phone number has been saved.",
    language_select: "🌐 *Choose Your Language*\n\nPlease select your preferred language:",
    language_set: "✅ Language set to English",
    
    main_menu: "🎯 *Main Menu*\n\nWelcome back, {name}! Choose an option below:",
    
    programs_title: "🎯 *Available Programs*\n\nChoose from our premium programs:",
    merkato_vip: "🏪 *Merkato VIP*\n💰 Win Cash up to 10M ETB\n🎟️ 5 Premium Tiers Available\n📅 Daily, Weekly & Monthly Draws",
    city_vip: "🏙️ *City VIP*\n📍 Win Cash in 94 Cities\n🎟️ 5 Premium Tiers Available\n📅 Daily, Weekly & Monthly Draws",
    regular_pools: "🏊 *Regular Pools*\n🚗 Win Cars\n🏠 Win Houses\n🏭 Win Machinery\n💻 Win Electronics\n🎁 Much More!",
    commission: "💰 *20% Commission* for Agents & Partners",
    health: "💚 *2% Supports* Kidney & Heart Patients",
    
    merkato_details: "🏪 *Merkato VIP Details*\n\n💰 Win Cash up to 10M ETB!\n\n*5 Premium Tiers:*\n🥈 Silver: 100 ETB - 1,200 Seats - 100K ETB Prize\n🥇 Gold: 500 ETB - 1,200 Seats - 500K ETB Prize\n💎 Platinum: 1,000 ETB - 2,400 Seats - 2M ETB Prize\n💠 Diamond: 2,500 ETB - 2,400 Seats - 5M ETB Prize\n👑 Royal: 5,000 ETB - 2,400 Seats - 10M ETB Prize\n\n📱 Join now inside the app!",
    
    city_details: "🏙️ *City VIP Details*\n\n📍 Win Cash in 94 Ethiopian Cities!\n\n*5 Premium Tiers:*\n🥈 Silver: 100 ETB - 1,200 Seats - 100K ETB Prize\n🥇 Gold: 500 ETB - 1,200 Seats - 500K ETB Prize\n💎 Platinum: 1,000 ETB - 2,400 Seats - 2M ETB Prize\n💠 Diamond: 2,500 ETB - 2,400 Seats - 5M ETB Prize\n👑 Royal: 5,000 ETB - 2,400 Seats - 10M ETB Prize\n\n🌍 Available in all Ethiopian cities!\n📱 Join now inside the app!",
    
    regular_details: "🏊 *Regular Prize Pools*\n\n🎁 Win Amazing Prizes:\n\n🚗 *Cars* - Various Models\n🏠 *Houses* - Property Investments\n🏭 *Machinery* - Equipment & Tools\n💻 *Electronics* - Gadgets & Devices\n🎁 *Much More!*\n\n💰 Multiple prize pools available with different entry levels.\n📱 Join now inside the app!",
    
    winners_title: "🏆 *Recent Winners*",
    no_winners: "No recent winners to display. Be the first! 🎯",
    winners_footer: "📱 View all winners in the app:",
    
    how_it_works: "📖 *How It Works*\n\n1️⃣ *Find a Pool*\n• 🏪 Merkato VIP - Win Cash up to 10M ETB\n• 🏙️ City VIP - Win Cash in 94 Cities\n• 🏊 Regular Pools - Win Cars, Houses & More\n\n2️⃣ *Contribute*\n• Choose your tier (Silver, Gold, Platinum, Diamond, Royal)\n• Secure payment inside the app\n• Get your seat number\n\n3️⃣ *Win!*\n• Winners are announced regularly\n• Claim your prize\n• Join the Hall of Fame!\n\n💚 *2% Supports* Kidney & Heart Disease Patients",
    
    support_title: "📞 *Contact Support*\n\nOur team is here to help you 24/7.\n\n📱 *Ways to reach us:*\n📧 Email: hundessanegassa@gmail.com\n📱 Phone: 0930330323, 0913 277 922\n\n💬 *Quick Help:*\n• For payment issues: Use /mytickets\n• For program info: Use /programs\n• For general help: Visit our FAQ page",
    
    help_title: "📖 *Help & Support*\n\n🤖 *Available Commands:*\n/start - 🚀 Welcome message\n/help - 📖 This help message\n/mytickets - 🎫 View your tickets\n/programs - 🎯 View available programs\n/language - 🌐 Change language\n/support - 📞 Contact support\n/winners - 🏆 View recent winners\n/howitworks - 📖 How it works",
    
    tickets_title: "🎫 *Your Tickets*",
    no_tickets: "📭 *You don't have any tickets yet.*\n\nJoin a program to get started!",
    status_verified: "✅ Verified",
    status_pending: "⏳ Pending",
    
    back: "🔙 Back to Main Menu",
    open_app: "🚀 Open Abbaa Carraa",
    dashboard: "📊 My Dashboard",
    merkato: "🏪 Merkato VIP",
    city: "🏙️ City VIP",
    pools: "🏊 Regular Pools",
    register: "📝 Register Now",
    winners: "🏆 Winners",
    how_it_works_btn: "📖 How It Works",
    support: "📞 Support",
    help: "ℹ️ Help",
    view_merkato: "🏪 View Merkato VIP",
    view_city: "🏙️ View City VIP",
    view_pools: "🏊 View Regular Pools",
    join_now: "🎯 Join Now"
  },

  // ========== AMHARIC ==========
  am: {
    welcome: "👋 *እንኳን ወደ Abbaa Carraa በደህና መጡ!*\n\n🏆 የኢትዮጵያ ቀዳሚ የሽልማት መድረክ\n\nእባክዎ ለመጀመር መረጃዎን ያጋሩ:",
    ask_name: "📝 *ሙሉ ስምዎ ምንድነው?*\n\nእባክዎ ሙሉ ስምዎን ያስገቡ:",
    ask_phone: "📱 *ስልክ ቁጥርዎ ምንድነው?*\n\nእባክዎ ስልክ ቁጥርዎን ያስገቡ (ለምሳሌ: 0912345678):",
    name_received: "✅ እናመሰግናለን! ስምዎ ተቀምጧል.",
    phone_received: "✅ እናመሰግናለን! ስልክ ቁጥርዎ ተቀምጧል.",
    language_select: "🌐 *ቋንቋዎን ይምረጡ*\n\nእባክዎ የሚመርጡትን ቋንቋ ይምረጡ:",
    language_set: "✅ ቋንቋ ወደ አማርኛ ተቀይሯል",
    
    main_menu: "🎯 *ዋና ምናሌ*\n\nእንኳን ደህና መጡ, {name}! ከታች ያለውን አማራጭ ይምረጡ:",
    
    programs_title: "🎯 *የሚገኙ ፕሮግራሞች*\n\nከታች ካሉት ፕሮግራሞች ይምረጡ:",
    merkato_vip: "🏪 *መርካቶ ቪአይፒ*\n💰 እስከ 10M ብር ጥሬ ገንዘብ ያሸንፉ\n🎟️ 5 የቪአይፒ ደረጃዎች\n📅 ዕለታዊ፣ ሳምንታዊ እና ወርሃዊ እጣዎች",
    city_vip: "🏙️ *ከተማ ቪአይፒ*\n📍 በ94 ከተሞች ጥሬ ገንዘብ ያሸንፉ\n🎟️ 5 የቪአይፒ ደረጃዎች\n📅 ዕለታዊ፣ ሳምንታዊ እና ወርሃዊ እጣዎች",
    regular_pools: "🏊 *መደበኛ የእጣ መደቦች*\n🚗 መኪናዎች ያሸንፉ\n🏠 ቤቶች ያሸንፉ\n🏭 ማሽነሪዎች ያሸንፉ\n💻 ኤሌክትሮኒክስ ያሸንፉ\n🎁 እና ሌሎች ብዙ!",
    commission: "💰 *20% ኮሚሽን* ለተወካዮች እና አጋሮች",
    health: "💚 *2% ለጤና* የኩላሊት እና የልብ ህመምተኞችን ይደግፋል",
    
    merkato_details: "🏪 *መርካቶ ቪአይፒ ዝርዝር*\n\n💰 እስከ 10M ብር ጥሬ ገንዘብ ያሸንፉ!\n\n*5 የቪአይፒ ደረጃዎች:*\n🥈 ብር: 100 ብር - 1,200 መቀመጫዎች - 100K ብር ሽልማት\n🥇 ወርቅ: 500 ብር - 1,200 መቀመጫዎች - 500K ብር ሽልማት\n💎 ፕላቲኒየም: 1,000 ብር - 2,400 መቀመጫዎች - 2M ብር ሽልማት\n💠 አልማዝ: 2,500 ብር - 2,400 መቀመጫዎች - 5M ብር ሽልማት\n👑 ንጉሣዊ: 5,000 ብር - 2,400 መቀመጫዎች - 10M ብር ሽልማት\n\n📱 አሁኑኑ በመተግበሪያው ውስጥ ይቀላቀሉ!",
    
    city_details: "🏙️ *ከተማ ቪአይፒ ዝርዝር*\n\n📍 በ94 የኢትዮጵያ ከተሞች ጥሬ ገንዘብ ያሸንፉ!\n\n*5 የቪአይፒ ደረጃዎች:*\n🥈 ብር: 100 ብር - 1,200 መቀመጫዎች - 100K ብር ሽልማት\n🥇 ወርቅ: 500 ብር - 1,200 መቀመጫዎች - 500K ብር ሽልማት\n💎 ፕላቲኒየም: 1,000 ብር - 2,400 መቀመጫዎች - 2M ብር ሽልማት\n💠 አልማዝ: 2,500 ብር - 2,400 መቀመጫዎች - 5M ብር ሽልማት\n👑 ንጉሣዊ: 5,000 ብር - 2,400 መቀመጫዎች - 10M ብር ሽልማት\n\n🌍 በሁሉም የኢትዮጵያ ከተሞች ይገኛል!\n📱 አሁኑኑ በመተግበሪያው ውስጥ ይቀላቀሉ!",
    
    regular_details: "🏊 *መደበኛ የሽልማት መደቦች*\n\n🎁 አስደናቂ ሽልማቶችን ያሸንፉ:\n\n🚗 *መኪናዎች* - የተለያዩ ሞዴሎች\n🏠 *ቤቶች* - የንብረት ኢንቨስትመንቶች\n🏭 *ማሽነሪዎች* - መሳሪያዎች እና ቁሳቁሶች\n💻 *ኤሌክትሮኒክስ* - ጋጄቶች እና መሳሪያዎች\n🎁 *እና ሌሎች ብዙ!*\n\n💰 የተለያዩ የመግቢያ ደረጃዎች ያላቸው በርካታ የሽልማት መደቦች ይገኛሉ።\n📱 አሁኑኑ በመተግበሪያው ውስጥ ይቀላቀሉ!",
    
    winners_title: "🏆 *የቅርብ ጊዜ አሸናፊዎች*",
    no_winners: "ምንም አሸናፊዎች የሉም። የመጀመሪያው ይሁኑ! 🎯",
    winners_footer: "📱 ሁሉንም አሸናፊዎች በመተግበሪያው ውስጥ ይመልከቱ:",
    
    how_it_works: "📖 *እንዴት እንሳተፋለን?*\n\n1️⃣ *የእጣ መደብ ይምረጡ*\n• 🏪 መርካቶ ቪአይፒ - እስከ 10M ብር ያሸንፉ\n• 🏙️ ከተማ ቪአይፒ - በ94 ከተሞች ያሸንፉ\n• 🏊 መደበኛ የእጣ መደቦች - መኪና፣ ቤት እና ሌሎች\n\n2️⃣ *አስተዋፅኦ ያድርጉ*\n• ደረጃዎን ይምረጡ (ብር፣ ወርቅ፣ ፕላቲኒየም፣ አልማዝ፣ ንጉሣዊ)\n• በመተግበሪያው ውስጥ ደህንነቱ በተጠበቀ ሁኔታ ይክፈሉ\n• የመቀመጫ ቁጥርዎን ያግኙ\n\n3️⃣ *ያሸንፉ!*\n• አሸናፊዎች በየጊዜው ይገለፃሉ\n• ሽልማትዎን ይውሰዱ\n• የክብር አዳራሹን ይቀላቀሉ!\n\n💚 *2% ለጤና* የኩላሊት እና የልብ ህመምተኞችን ይደግፋል",
    
    support_title: "📞 *እኛን ያግኙ*\n\nቡድናችን 24/7 ለእርዳታ ዝግጁ ነው።\n\n📱 *እኛን ለማግኘት መንገዶች:*\n📧 ኢሜይል: hundessanegassa@gmail.com\n📱 ስልክ: 0930330323, 0913 277 922\n\n💬 *ፈጣን እርዳታ:*\n• ለክፍያ ችግሮች: /mytickets ይጠቀሙ\n• ለፕሮግራም መረጃ: /programs ይጠቀሙ\n• ለአጠቃላይ እርዳታ: የእኛን FAQ ገፅ ይጎብኙ",
    
    help_title: "📖 *እርዳታ እና ድጋፍ*\n\n🤖 *የሚገኙ ትዕዛዞች:*\n/start - 🚀 የእንኳን ደህና መጣችሁ\n/help - 📖 ይህ የእርዳታ መልዕክት\n/mytickets - 🎫 ቲኬቶችዎን ይመልከቱ\n/programs - 🎯 ፕሮግራሞችን ይመልከቱ\n/language - 🌐 ቋንቋ ይቀይሩ\n/support - 📞 እኛን ያግኙ\n/winners - 🏆 አሸናፊዎችን ይመልከቱ\n/howitworks - 📖 እንዴት እንሳተፋለን",
    
    tickets_title: "🎫 *ቲኬቶችዎ*",
    no_tickets: "📭 *ምንም ቲኬቶች የሉዎትም.*\n\nእባክዎ ለመጀመር ፕሮግራም ይቀላቀሉ!",
    status_verified: "✅ የተረጋገጠ",
    status_pending: "⏳ በመጠባበቅ ላይ",
    
    back: "🔙 ወደ ዋና ምናሌ",
    open_app: "🚀 አባካራን ይክፈቱ",
    dashboard: "📊 የእኔ ዳሽቦርድ",
    merkato: "🏪 መርካቶ ቪአይፒ",
    city: "🏙️ ከተማ ቪአይፒ",
    pools: "🏊 መደበኛ የእጣ መደቦች",
    register: "📝 ይመዝገቡ",
    winners: "🏆 አሸናፊዎች",
    how_it_works_btn: "📖 እንዴት እንሳተፋለን",
    support: "📞 እኛን ያግኙ",
    help: "ℹ️ እርዳታ",
    view_merkato: "🏪 መርካቶ ቪአይፒ ይመልከቱ",
    view_city: "🏙️ ከተማ ቪአይፒ ይመልከቱ",
    view_pools: "🏊 መደበኛ መደቦችን ይመልከቱ",
    join_now: "🎯 አሁን ይቀላቀሉ"
  },

  // ========== AFAN OROMO ==========
  om: {
    welcome: "👋 *Gara Abbaa Carraatti Baga nagaan dhufte!*\n\n🏆 Itoophiyaatti Dirree Badhaasaa Olaanaa\n\nMaaloo odeeffannoo keessan qoodaadhaan eegaltaa:",
    ask_name: "📝 *Maqaa keessan guutuu maal?*\n\nMaaloo maqaa keessan guutuu galchaa:",
    ask_phone: "📱 *Lakkoofsa bilbilaa keessan maal?*\n\nMaaloo lakkoofsa bilbilaa keessan galchaa (fakkeenyaaf: 0912345678):",
    name_received: "✅ Galatoomaa! Maqaan keessan kuusameera.",
    phone_received: "✅ Galatoomaa! Lakkoofsi bilbilaa keessan kuusameera.",
    language_select: "🌐 *Afaan Filadhu*\n\nMaaloo afaan fedhitan filadha:",
    language_set: "✅ Afaan Afaan Oromootti jijjiirame",
    
    main_menu: "🎯 *Menu Ijoo*\n\nBaga nagaan deebitan, {name}! Filannoowwan armaan gadii keessaa filadhaa:",
    
    programs_title: "🎯 *Tarkaanfiiwwan Argaman*\n\nTarkaanfiiwwan armaan gadii keessaa filadhaa:",
    merkato_vip: "🏪 *Merkato VIP*\n💰 Maallaqa hanga 10M ETB ta'u argadhaa\n🎟️ Sadarkaa VIP 5 ni argamu\n📅 Qodaa Guyyaa, Torbanii fi Ji'aa",
    city_vip: "🏙️ *VIP Magaalaa*\n📍 Magaalaa 94 keessatti Maallaqa argadhaa\n🎟️ Sadarkaa VIP 5 ni argamu\n📅 Qodaa Guyyaa, Torbanii fi Ji'aa",
    regular_pools: "🏊 *Pooliiwwan Idilee*\n🚗 Konkoolataa mo'adhaa\n🏠 Mana mo'adhaa\n🏭 Mashiniin mo'adhaa\n💻 Elektirooniksii mo'adhaa\n🎁 Waan Bayeessa!",
    commission: "💰 *Komishinii %20* Wakiliitootaaf & Hiriyaatootaaf",
    health: "💚 *%2 Fayyaaf* Dhibamtoota Kalee & Onnee gargaara",
    
    merkato_details: "🏪 *Merkato VIP Ibsa*\n\n💰 Maallaqa hanga 10M ETB ta'u argadhaa!\n\n*Sadarkaa VIP 5:*\n🥈 Silver: 100 ETB - 1,200 Teessoo - 100K ETB Badhaasa\n🥇 Gold: 500 ETB - 1,200 Teessoo - 500K ETB Badhaasa\n💎 Platinum: 1,000 ETB - 2,400 Teessoo - 2M ETB Badhaasa\n💠 Diamond: 2,500 ETB - 2,400 Teessoo - 5M ETB Badhaasa\n👑 Royal: 5,000 ETB - 2,400 Teessoo - 10M ETB Badhaasa\n\n📱 Amma appii keessatti hirmaadhaa!",
    
    city_details: "🏙️ *VIP Magaalaa Ibsa*\n\n📍 Magaalaa 94 Itoophiyaa keessatti Maallaqa argadhaa!\n\n*Sadarkaa VIP 5:*\n🥈 Silver: 100 ETB - 1,200 Teessoo - 100K ETB Badhaasa\n🥇 Gold: 500 ETB - 1,200 Teessoo - 500K ETB Badhaasa\n💎 Platinum: 1,000 ETB - 2,400 Teessoo - 2M ETB Badhaasa\n💠 Diamond: 2,500 ETB - 2,400 Teessoo - 5M ETB Badhaasa\n👑 Royal: 5,000 ETB - 2,400 Teessoo - 10M ETB Badhaasa\n\n🌍 Magaalaa Itoophiyaa hunda keessatti argama!\n📱 Amma appii keessatti hirmaadhaa!",
    
    regular_details: "🏊 *Pooliiwwan Badhaasa Idilee*\n\n🎁 Badhaasawwan Dinqisiifatan mo'adhaa:\n\n🚗 *Konkoolataa* - Gosoota Addaddaa\n🏠 *Mana* - Investimantii Qabeenyaa\n🏭 *Mashiniin* - Meeshaalee fi Qodaa\n💻 *Elektirooniksii* - Gajetii fi Meeshaalee\n🎁 *Waan Bayeessa!*\n\n💰 Pooliiwwan badhaasa hedduu sadarkaa seenaa adda addaa ta'een ni argamu.\n📱 Amma appii keessatti hirmaadhaa!",
    
    winners_title: "🏆 *Mo'attoota Dhiyoo*",
    no_winners: "Mo'attoon dhiyoo hin jiru. Isa jalqabaa ta'aa! 🎯",
    winners_footer: "📱 Mo'attoota hundaa appii keessatti ilaali:",
    
    how_it_works: "📖 *Akkam Hojiirra Oola?*\n\n1️⃣ *Pool tokko barbaadhaa*\n• 🏪 Merkato VIP - Maallaqa hanga 10M ETB ta'u argadhaa\n• 🏙️ VIP Magaalaa - Magaalaa 94 keessatti Maallaqa argadhaa\n• 🏊 Pooliiwwan Idilee - Konkoolataa, Mana, fi Kan biroo mo'adhaa\n\n2️⃣ *Gumaachaa*\n• Sadarkaa keessan filadhaa (Silver, Gold, Platinum, Diamond, Royal)\n• Appii keessatti kaffaltii nagaa ta'e raawwadhaa\n• Lakkoofsa teessoo keessan argadhaa\n\n3️⃣ *Mo'adhaa!*\n• Mo'attaan yeroo yeroo lallabama\n• Badhaasa keessan fudhadhaa\n• Hall of Fame itti geessaa!\n\n💚 *%2 Fayyaaf* Dhibamtoota Kalee & Onnee gargaara",
    
    support_title: "📞 *Nu Qunnamuu*\n\nGareen keenya 24/7 isiin gargaaruuf qophiidha.\n\n📱 *Karaa ittiin nu qunnamuu dandeessan:*\n📧 Email: hundessanegassa@gmail.com\n📱 Bilbila: 0930330323, 0913 277 922\n\n💬 *Gargaarsa Saffisaa:*\n• Rakkoo kaffaltiitiif: /mytickets itti fayyadamaa\n• Odeeffannoo tarkaanfii: /programs itti fayyadamaa\n• Gargaarsa waliigalaaf: Fuula FAQ keenyarratti ilaalaa",
    
    help_title: "📖 *Gargaarsa fi Deeggarsa*\n\n🤖 *Ajajoota Jiraan:*\n/start - 🚀 Ergaa baga nagaan dhufte\n/help - 📖 Ergaa gargaarsaa kana\n/mytickets - 🎫 Tikkeetoota keessan ilaaluu\n/programs - 🎯 Tarkaanfiiwwan argaman ilaaluu\n/language - 🌐 Afaan jijjiiruu\n/support - 📞 Nu qunnamuu\n/winners - 🏆 Mo'attoota dhiyoo ilaaluu\n/howitworks - 📖 Akkam hojiirra oola",
    
    tickets_title: "🎫 *Tikkeetoota Keessan*",
    no_tickets: "📭 *Tikkeetii tokko hin qabdu.*\n\nMaaloo tarkaanfii tokko itti argachuuf kennadhu!",
    status_verified: "✅ Mirkanaa'e",
    status_pending: "⏳ Eegachaa jira",
    
    back: "🔙 gara Menu Ijootti deebi'i",
    open_app: "🚀 Abbaa Carraa Banuu",
    dashboard: "📊 Daashboorardii Koo",
    merkato: "🏪 Merkato VIP",
    city: "🏙️ VIP Magaalaa",
    pools: "🏊 Pooliiwwan Idilee",
    register: "📝 Galmaa'i",
    winners: "🏆 Mo'attoota",
    how_it_works_btn: "📖 Akkam Hojiirra Oola",
    support: "📞 Nu Qunnamuu",
    help: "ℹ️ Gargaarsa",
    view_merkato: "🏪 Merkato VIP Ilaali",
    view_city: "🏙️ VIP Magaalaa Ilaali",
    view_pools: "🏊 Pooliiwwan Idilee Ilaali",
    join_now: "🎯 Amma hirmaadhu"
  }
};

// ============================================
// HELPERS
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

async function updateUserLanguage(userId, lang) {
  try {
    await supabase
      .from('profiles')
      .update({ language: lang })
      .eq('telegram_id', userId);
    return true;
  } catch (error) {
    console.error('Language update error:', error);
    return false;
  }
}

async function saveUserProfile(userId, username, firstName, lastName, phone, fullName) {
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', userId)
      .single();

    if (!existing) {
      await supabase
        .from('profiles')
        .insert({
          telegram_id: userId,
          telegram_username: username,
          full_name: fullName || `${firstName} ${lastName || ''}`.trim(),
          phone: phone || '',
          email: `${username || userId}@telegram.user`,
          language: 'en',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } else {
      await supabase
        .from('profiles')
        .update({
          full_name: fullName || existing.full_name,
          phone: phone || existing.phone,
          telegram_username: username,
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', userId);
    }
    return true;
  } catch (error) {
    console.error('Save user error:', error);
    return false;
  }
}

// ============================================
// BUILD MENUS
// ============================================
function buildMainMenu(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com';
  
  return {
    inline_keyboard: [
      [{ text: t.merkato, callback_data: 'merkato' }],
      [{ text: t.city, callback_data: 'city' }],
      [{ text: t.pools, callback_data: 'pools' }],
      [{ text: t.winners, callback_data: 'winners' }],
      [{ text: t.how_it_works_btn, callback_data: 'howitworks' }],
      [{ text: t.support, callback_data: 'support' }],
      [{ text: t.open_app, web_app: { url: appUrl } }],
      [{ text: t.dashboard, web_app: { url: `${appUrl}/dashboard` } }],
      [{ text: t.register, web_app: { url: `${appUrl}/register` } }],
      [{ text: t.back, callback_data: 'main_menu' }]
    ]
  };
}

function buildProgramsMenu(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  return {
    inline_keyboard: [
      [{ text: t.view_merkato, callback_data: 'merkato_details' }],
      [{ text: t.view_city, callback_data: 'city_details' }],
      [{ text: t.view_pools, callback_data: 'pools_details' }],
      [{ text: t.back, callback_data: 'main_menu' }]
    ]
  };
}

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

  bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('⚠️ Something went wrong. Please try again later.');
  });

  // ============================================
  // START COMMAND - COLLECT NAME & PHONE FIRST
  // ============================================
  bot.start(async (ctx) => {
    const user = ctx.from;
    const userId = user.id;
    
    // Initialize session
    userSessions[userId] = {
      step: 'ask_name',
      data: {}
    };
    
    const t = TRANSLATIONS.en;
    
    await ctx.reply(
      `${t.welcome}\n\n${t.ask_name}`,
      { parse_mode: 'Markdown' }
    );
  });

  // ============================================
  // HANDLE TEXT MESSAGES - FOR NAME & PHONE COLLECTION
  // ============================================
  bot.on('text', async (ctx) => {
    const user = ctx.from;
    const userId = user.id;
    const text = ctx.message.text.trim();
    
    // Check if user is in registration flow
    const session = userSessions[userId];
    if (!session) {
      // If not in session, show main menu
      const lang = await getUserLanguage(userId);
      const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
      const name = user.first_name || 'User';
      
      await ctx.reply(
        t.main_menu.replace('{name}', name),
        {
          parse_mode: 'Markdown',
          reply_markup: buildMainMenu(lang)
        }
      );
      return;
    }

    // Handle registration flow
    if (session.step === 'ask_name') {
      // Save name
      session.data.fullName = text;
      session.step = 'ask_phone';
      
      const t = TRANSLATIONS.en;
      await ctx.reply(
        `${t.name_received}\n\n${t.ask_phone}`,
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    if (session.step === 'ask_phone') {
      // Save phone
      session.data.phone = text;
      session.step = 'complete';
      
      // Save user to database
      await saveUserProfile(
        userId,
        user.username,
        user.first_name,
        user.last_name,
        text,
        session.data.fullName
      );
      
      // Show language selection with 3 languages
      const langKeyboard = {
        inline_keyboard: [
          [{ text: '🇬🇧 English', callback_data: 'lang_en' }],
          [{ text: '🇪🇹 አማርኛ', callback_data: 'lang_am' }],
          [{ text: '🌍 Afaan Oromo', callback_data: 'lang_om' }]
        ]
      };
      
      await ctx.reply(
        TRANSLATIONS.en.language_select,
        {
          parse_mode: 'Markdown',
          reply_markup: langKeyboard
        }
      );
      
      // Clean up session
      delete userSessions[userId];
      return;
    }
  });

  // ============================================
  // CALLBACK HANDLERS - LANGUAGE SELECTION (3 LANGUAGES)
  // ============================================
  bot.action(/lang_(.+)/, async (ctx) => {
    const lang = ctx.match[1];
    const userId = ctx.from.id;
    const user = ctx.from;
    const name = user.first_name || 'User';
    
    // Only accept valid languages
    if (!['en', 'am', 'om'].includes(lang)) {
      await ctx.answerCbQuery('Invalid language selection');
      return;
    }
    
    await updateUserLanguage(userId, lang);
    
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.reply(t.language_set, { parse_mode: 'Markdown' });
    
    // Show main menu
    await ctx.reply(
      t.main_menu.replace('{name}', name),
      {
        parse_mode: 'Markdown',
        reply_markup: buildMainMenu(lang)
      }
    );
    
    await ctx.answerCbQuery();
  });

  bot.action('main_menu', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const user = ctx.from;
    const name = user.first_name || 'User';
    
    await ctx.editMessageText(
      t.main_menu.replace('{name}', name),
      {
        parse_mode: 'Markdown',
        reply_markup: buildMainMenu(lang)
      }
    );
    await ctx.answerCbQuery();
  });

  // ============================================
  // PROGRAM CALLBACKS
  // ============================================
  bot.action('merkato', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(
      t.merkato_vip,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.view_merkato, callback_data: 'merkato_details' }],
            [{ text: t.join_now, web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/merkato-vip` } }],
            [{ text: t.back, callback_data: 'main_menu' }]
          ]
        }
      }
    );
    await ctx.answerCbQuery();
  });

  bot.action('city', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(
      t.city_vip,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.view_city, callback_data: 'city_details' }],
            [{ text: t.join_now, web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/cities` } }],
            [{ text: t.back, callback_data: 'main_menu' }]
          ]
        }
      }
    );
    await ctx.answerCbQuery();
  });

  bot.action('pools', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(
      t.regular_pools,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.view_pools, callback_data: 'pools_details' }],
            [{ text: t.join_now, web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/listings` } }],
            [{ text: t.back, callback_data: 'main_menu' }]
          ]
        }
      }
    );
    await ctx.answerCbQuery();
  });

  // ============================================
  // DETAILS CALLBACKS
  // ============================================
  bot.action('merkato_details', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(
      t.merkato_details,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.join_now, web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/merkato-vip` } }],
            [{ text: t.back, callback_data: 'main_menu' }]
          ]
        }
      }
    );
    await ctx.answerCbQuery();
  });

  bot.action('city_details', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(
      t.city_details,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.join_now, web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/cities` } }],
            [{ text: t.back, callback_data: 'main_menu' }]
          ]
        }
      }
    );
    await ctx.answerCbQuery();
  });

  bot.action('pools_details', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(
      t.regular_details,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.join_now, web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/listings` } }],
            [{ text: t.back, callback_data: 'main_menu' }]
          ]
        }
      }
    );
    await ctx.answerCbQuery();
  });

  // ============================================
  // HELP COMMAND
  // ============================================
  bot.help(async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.reply(
      t.help_title,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.back, callback_data: 'main_menu' }]
          ]
        }
      }
    );
  });

  // ============================================
  // MY TICKETS COMMAND
  // ============================================
  bot.command('mytickets', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com';
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('telegram_id', userId)
        .single();

      if (!profile) {
        await ctx.reply(t.no_tickets, { parse_mode: 'Markdown' });
        return;
      }

      const userId_db = profile.id;

      const [merkatoTickets, cityTickets, regularTickets] = await Promise.all([
        supabase
          .from('merkato_vip_participants')
          .select('*')
          .eq('user_id', userId_db)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('city_vip_participants')
          .select('*')
          .eq('user_id', userId_db)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('regular_pool_participants')
          .select('*')
          .eq('user_id', userId_db)
          .order('created_at', { ascending: false })
          .limit(3)
      ]);

      const allTickets = [
        ...(merkatoTickets.data || []).map(t => ({ ...t, type: 'Merkato VIP' })),
        ...(cityTickets.data || []).map(t => ({ ...t, type: 'City VIP' })),
        ...(regularTickets.data || []).map(t => ({ ...t, type: 'Regular Pool' }))
      ];

      if (allTickets.length === 0) {
        await ctx.reply(t.no_tickets, { parse_mode: 'Markdown' });
        return;
      }

      let message = t.tickets_title;
      allTickets.slice(0, 5).forEach((ticket, i) => {
        const status = ticket.payment_status === 'verified' ? t.status_verified : t.status_pending;
        message += `${i + 1}. 🏆 ${ticket.type}\n`;
        message += `   💺 ${ticket.seat_numbers?.join(', ') || 'N/A'}\n`;
        message += `   ${status}\n`;
        message += `   #${ticket.ticket_number || 'N/A'}\n\n`;
      });

      if (allTickets.length > 5) {
        message += `*And ${allTickets.length - 5} more...*\n\n`;
      }

      message += `📱 View all tickets in the app:`;
      
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.dashboard, web_app: { url: `${appUrl}/dashboard` } }],
            [{ text: t.back, callback_data: 'main_menu' }]
          ]
        }
      });
    } catch (error) {
      console.error('Error fetching tickets:', error);
      await ctx.reply('⚠️ Failed to fetch your tickets. Please try again later.');
    }
  });

  // ============================================
  // LANGUAGE COMMAND - WITH 3 LANGUAGES
  // ============================================
  bot.command('language', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    const langKeyboard = {
      inline_keyboard: [
        [{ text: '🇬🇧 English', callback_data: 'lang_en' }],
        [{ text: '🇪🇹 አማርኛ', callback_data: 'lang_am' }],
        [{ text: '🌍 Afaan Oromo', callback_data: 'lang_om' }],
        [{ text: t.back, callback_data: 'main_menu' }]
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
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.reply(
      t.support_title,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.back, callback_data: 'main_menu' }]
          ]
        }
      }
    );
  });

  // ============================================
  // WINNERS COMMAND
  // ============================================
  bot.command('winners', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
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
        winnersText = t.no_winners;
      }

      await ctx.reply(
        `${t.winners_title}\n\n${winnersText}\n${t.winners_footer}`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: t.winners || '🏆 View All', web_app: { url: `${appUrl}/winners` } }],
              [{ text: t.back, callback_data: 'main_menu' }]
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
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.reply(
      t.how_it_works,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.back, callback_data: 'main_menu' }]
          ]
        }
      }
    );
  });

  // ============================================
  // PROGRAMS COMMAND
  // ============================================
  bot.command('programs', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.reply(
      t.programs_title,
      {
        parse_mode: 'Markdown',
        reply_markup: buildProgramsMenu(lang)
      }
    );
  });

  // ============================================
  // SUPPORT CALLBACK
  // ============================================
  bot.action('support', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(
      t.support_title,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.back, callback_data: 'main_menu' }]
          ]
        }
      }
    );
    await ctx.answerCbQuery();
  });

  // ============================================
  // HOW IT WORKS CALLBACK
  // ============================================
  bot.action('howitworks', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(
      t.how_it_works,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.back, callback_data: 'main_menu' }]
          ]
        }
      }
    );
    await ctx.answerCbQuery();
  });

  // ============================================
  // WINNERS CALLBACK
  // ============================================
  bot.action('winners', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
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
        winnersText = t.no_winners;
      }

      await ctx.editMessageText(
        `${t.winners_title}\n\n${winnersText}\n${t.winners_footer}`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🏆 Hall of Fame', web_app: { url: `${appUrl}/winners` } }],
              [{ text: t.back, callback_data: 'main_menu' }]
            ]
          }
        }
      );
    } catch (error) {
      console.error('Error fetching winners:', error);
      await ctx.reply('⚠️ Failed to fetch winners. Please try again later.');
    }
    await ctx.answerCbQuery();
  });
}

export default bot;
