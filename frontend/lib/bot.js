// lib/bot.js - COMPLETE WITH UPDATED MENU & WELCOME
import { Telegraf } from 'telegraf';
import { supabase, isSupabaseConfigured } from './supabase';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://abbaa-carraa-ethiopia.vercel.app';

if (!BOT_TOKEN) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN not set. Bot features will not work.');
}

export const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

// ============================================
// COMPLETE TRANSLATIONS - VERIFIED
// ============================================
const TRANSLATIONS = {
  en: {
    // Welcome & Language
    welcome: "🌟 *Welcome to Abbaa Carraa!*\n\n🏆 *Ethiopia's #1 Prize Platform*\n\n🚗 Win Cars\n🏠 Win Houses\n💰 Win Cash up to 10M ETB\n🏭 Win Machinery\n💻 Win Electronics\n\n💚 *2% Supports* Kidney & Heart Patients\n\n🎯 *Ready to win? Let's get started!*\n\n🏪 *Open Your Own Shop* - Create pools and earn 10% commission!",
    language_select: "🌐 *Choose Your Language*\n\nPlease select your preferred language:",
    language_set: "✅ Language set to English! 🎉",
    
    // Name & Phone
    ask_name: "📝 *What is your full name?*\n\nPlease enter your full name:",
    ask_phone: "📱 *What is your phone number?*\n\nExample: 0912345678",
    name_received: "✅ Thank you! Now please share your phone number:",
    phone_received: "✅ Thank you! Your profile is complete! 🎉",
    
    // Main Menu - UPDATED ORDER
    main_menu: "👋 *Welcome {name}!*\n\n🎯 *Choose an option below:*",
    programs: "🎯 *Abbaa Carraa Programs*\n\n*Choose your winning path:*\n\n1️⃣ 🚀 *Open Abbaa Carraa App*\nStart your journey now!\n\n2️⃣ 🏊 *Regular Pools*\n🚗 Cars • 🏠 Houses • 🏭 Machinery • 💻 Electronics\n💵 From 100 ETB\n\n3️⃣ 🏙️ *City VIP*\n💰 Win Cash up to 10M ETB\n📅 Daily • Weekly • Monthly Draws\n🎟️ 5 Tiers Available\n\n4️⃣ 🏪 *Merkato VIP*\n💰 Win Cash up to 10M ETB\n📅 Daily • Weekly • Monthly Draws\n🎟️ 5 Tiers Available\n\n5️⃣ 🏪 *Open Your Own Shop*\n💰 Earn 10% Commission\n👥 Create pools • Set your own prizes\n\n6️⃣ 🤝 *Partner Program*\n💰 Earn 10% Commission\n👥 Refer customers • Create pools\n\n7️⃣ 📊 *Dashboard*\nView your activity and tickets\n\n8️⃣ 📖 *How It Works*\nLearn how to win\n\n9️⃣ 🏆 *Winners*\nView recent winners\n\n🔟 📞 *Support*\nContact us",
    
    // Program Details
    program_1: "🚀 *Open Abbaa Carraa App*\n\nStart your winning journey now!\n\n👇 Click below to open the app:",
    program_2: "🏊 *Join Regular Pools*\n\n🚗 Win Cars\n🏠 Win Houses\n🏭 Win Machinery\n💻 Win Electronics\n\n💵 Entry from 100 ETB\n🎁 Amazing prizes await!",
    program_3: "🏙️ *Join City VIP*\n\n📍 Win in your city!\n💰 Up to 10M ETB Cash\n📅 Daily • Weekly • Monthly\n🎟️ 5 Tiers",
    program_4: "🏪 *Join Merkato VIP*\n\n💰 Up to 10M ETB Cash\n📅 Daily • Weekly • Monthly\n🎟️ 5 Tiers: Silver • Gold • Platinum • Diamond • Royal",
    program_5: "🏪 *Open Your Own Shop*\n\n💰 Earn 10% commission on every pool\n\n• Create your own prize pools\n• Set your own prizes and entry fees\n• Get paid when you reach the target\n• Withdraw your earnings anytime\n\nReady to start? 👇",
    program_6: "🤝 *Join Partner Program*\n\n💰 Earn 10% Commission\n\n• Agents: Refer customers\n• Vendors: Create pools\n• Organizations: Member pools",
    program_7: "📊 *Dashboard*\n\nView your activity, tickets, and stats.\n\n👇 Open your dashboard:",
    program_8: "📖 *How It Works*\n\n1️⃣ Choose a program\n2️⃣ Pick your tier\n3️⃣ Select seats\n4️⃣ Pay & win! 🎉",
    program_9: "🏆 *Recent Winners*",
    program_10: "📞 *Contact Support*\n\n📧 hundessanegassa@gmail.com\n📱 0930330323, 0913 277 922",
    
    // Winners & How It Works
    winners: "🏆 *Recent Winners*",
    no_winners: "No winners yet. Be the first! 🎯",
    how_it_works: "📖 *How It Works*\n\n1️⃣ Choose a program\n2️⃣ Pick your tier\n3️⃣ Select seats\n4️⃣ Pay & win! 🎉",
    
    // Support & Tickets
    support: "📞 *Contact Support*\n\n📧 hundessanegassa@gmail.com\n📱 0930330323, 0913 277 922",
    tickets: "🎫 *Your Tickets*",
    no_tickets: "📭 *No tickets yet.*\n\nJoin a program to start winning! 🎯",
    
    // Navigation Buttons
    back: "🔙 Back",
    open_app: "🚀 Open App",
    dashboard: "📊 Dashboard",
    join_now: "🎯 Join Now",
    apply_now: "🤝 Apply Now",
    view_winners: "🏆 View Winners",
    
    // Login
    login_success: "✅ *Login Successful!*\n\nWelcome {name}! 🎉\n\n🔐 Your session is ready!\n\nClick the button below to return to the app:",
    return_to_app: "🚀 Return to App",
    
    // Creator Menu
    creator_menu: "🏪 *Pool Creator Menu*\n\nWelcome {name}!\n\n📊 Manage your pools and earnings:\n\n• Create new pools\n• Track your earnings\n• View your pools\n• Request payouts",
    creator_stats: "📊 *Your Creator Stats*\n\n🏪 Shop: {shop}\n📦 Total Pools: {pools}\n💰 Total Earnings: ETB {earnings}\n⏳ Pending Fees: ETB {fees}\n👥 Total Participants: {participants}\n⭐ Rating: {rating}",
    creator_pools: "📋 *Your Pools*\n\n{list}",
    creator_pool_detail: "🏊 *{name}*\n\n💰 Prize: ETB {prize}\n🎫 Entry: ETB {entry}\n👥 Participants: {participants}\n📊 Progress: {progress}%\n📅 Draw Date: {draw}\n📌 Status: {status}",
    creator_earnings: "💰 *Earnings Summary*\n\nTotal Earnings: ETB {total}\nPending Fees: ETB {pending}\nAvailable for Withdrawal: ETB {available}",
    creator_withdraw: "💳 *Withdrawal Request*\n\nAmount: ETB {amount}\nMethod: {method}\nAccount: {account}\n\n✅ Request submitted!",
    creator_no_pools: "📭 *No pools created yet.*\n\nCreate your first pool to start earning! 🚀",
    
    // Become Creator
    become_creator: "🏪 *Become a Pool Creator!*\n\n💰 Earn 10% commission on every pool\n\n• Create your own prize pools\n• Set your own prizes and entry fees\n• Get paid when you reach the target\n• Withdraw your earnings anytime\n\nReady to start? 👇",
    
    // Button Labels
    become_creator_btn: "🏪 Open Your Own Shop",
    creator_shop: "🏪 My Shop",
    create_pool: "📝 Create Pool",
    my_pools: "📋 My Pools",
    earnings: "💰 Earnings",
    withdraw: "💳 Withdraw",
    stats: "📊 Stats"
  },

  am: {
    // Welcome & Language
    welcome: "🌟 *እንኳን ወደ Abbaa Carraa በደህና መጡ!*\n\n🏆 *የኢትዮጵያ ቀዳሚ የሽልማት መድረክ*\n\n🚗 መኪናዎች ያሸንፉ\n🏠 ቤቶች ያሸንፉ\n🏭 ማሽነሪዎች ያሸንፉ\n💻 ኤሌክትሮኒክስ ያሸንፉ\n💰 እስከ 10 ሚሊዮን ብር ያሸንፉ\n\n💚 *2% ለጤና* የኩላሊት እና የልብ ህመምተኞችን ይደግፋል\n\n🎯 *ለማሸነፍ ዝግጁ? እንጀምር!*\n\n🏪 *የራስዎን መደብር ይክፈቱ* - ፑሎች ይፍጠሩ እና 10% ኮሚሽን ያግኙ!",
    language_select: "🌐 *ቋንቋዎን ይምረጡ*\n\nእባክዎ የሚመርጡትን ቋንቋ ይምረጡ:",
    language_set: "✅ ቋንቋ ወደ አማርኛ ተቀይሯል! 🎉",
    
    // Name & Phone
    ask_name: "📝 *ሙሉ ስምዎ ምንድነው?*\n\nእባክዎ ሙሉ ስምዎን ያስገቡ:",
    ask_phone: "📱 *ስልክ ቁጥርዎ ምንድነው?*\n\nለምሳሌ: 0912345678",
    name_received: "✅ እናመሰግናለን! አሁን ስልክ ቁጥርዎን ያጋሩ:",
    phone_received: "✅ እናመሰግናለን! መገለጫዎ ተጠናቋል! 🎉",
    
    // Main Menu - UPDATED ORDER
    main_menu: "👋 *እንኳን ደህና መጡ {name}!*\n\n🎯 *ከታች ያለውን ይምረጡ:*",
    programs: "🎯 *የAbbaa Carraa ፕሮግራሞች*\n\n*የማሸነፍ መንገድዎን ይምረጡ:*\n\n1️⃣ 🚀 *የAbbaa Carraa መተግበሪያ ይክፈቱ*\nጉዞዎን አሁን ይጀምሩ!\n\n2️⃣ 🏊 *መደበኛ የእጣ መደቦች*\n🚗 መኪና • 🏠 ቤት • 🏭 ማሽነሪ • 💻 ኤሌክትሮኒክስ\n💵 ከ100 ብር ጀምሮ\n\n3️⃣ 🏙️ *የከተማ ቪአይፒ*\n💰 እስከ 10 ሚሊዮን ብር ጥሬ ገንዘብ\n📅 ዕለታዊ • ሳምንታዊ • ወርሃዊ\n🎟️ 5 ደረጃዎች\n\n4️⃣ 🏪 *መርካቶ ቪአይፒ*\n💰 እስከ 10 ሚሊዮን ብር ጥሬ ገንዘብ\n📅 ዕለታዊ • ሳምንታዊ • ወርሃዊ\n🎟️ 5 ደረጃዎች\n\n5️⃣ 🏪 *የራስዎን መደብር ይክፈቱ*\n💰 10% ኮሚሽን ያግኙ\n👥 ፑሎች ይፍጠሩ • የራስዎን ሽልማቶች ያዘጋጁ\n\n6️⃣ 🤝 *የአጋር ፕሮግራም*\n💰 10% ኮሚሽን ያግኙ\n👥 ደንበኞችን ያመልክቱ • ፑሎች ይፍጠሩ\n\n7️⃣ 📊 *ዳሽቦርድ*\nእንቅስቃሴዎን እና ቲኬቶችዎን ይመልከቱ\n\n8️⃣ 📖 *እንዴት እንሳተፋለን?*\nእንዴት እንደሚሳተፉ ይማሩ\n\n9️⃣ 🏆 *አሸናፊዎች*\nየቅርብ ጊዜ አሸናፊዎችን ይመልከቱ\n\n🔟 📞 *እኛን ያግኙ*\nያግኙን",
    
    // Program Details
    program_1: "🚀 *የAbbaa Carraa መተግበሪያ ይክፈቱ*\n\nየማሸነፍ ጉዞዎን አሁን ይጀምሩ!\n\n👇 መተግበሪያውን ለመክፈት ከታች ይጫኑ:",
    program_2: "🏊 *ወደ መደበኛ የእጣ መደቦች ይቀላቀሉ*\n\n🚗 መኪናዎች ያሸንፉ\n🏠 ቤቶች ያሸንፉ\n🏭 ማሽነሪዎች ያሸንፉ\n💻 ኤሌክትሮኒክስ ያሸንፉ\n\n💵 ከ100 ብር ጀምሮ\n🎁 አስደናቂ ሽልማቶች ይጠብቁዎታል!",
    program_3: "🏙️ *ወደ ከተማ ቪአይፒ ይቀላቀሉ*\n\n📍 በከተማዎ ያሸንፉ!\n💰 እስከ 10 ሚሊዮን ብር ጥሬ ገንዘብ\n📅 ዕለታዊ • ሳምንታዊ • ወርሃዊ\n🎟️ 5 ደረጃዎች",
    program_4: "🏪 *ወደ መርካቶ ቪአይፒ ይቀላቀሉ*\n\n💰 እስከ 10 ሚሊዮን ብር ጥሬ ገንዘብ\n📅 ዕለታዊ • ሳምንታዊ • ወርሃዊ\n🎟️ 5 ደረጃዎች",
    program_5: "🏪 *የራስዎን መደብር ይክፈቱ*\n\n💰 በእያንዳንዱ ፑል ላይ 10% ኮሚሽን ያግኙ\n\n• የራስዎን የእጣ መደቦች ይፍጠሩ\n• የራስዎን ሽልማቶች እና መግቢያ ያዘጋጁ\n• ዒላማውን ከደረሱ በኋላ ክፍያዎን ያግኙ\n• ገንዘብዎን በማንኛውም ጊዜ ያውጡ\n\nለመጀመር ዝግጁ? 👇",
    program_6: "🤝 *ወደ አጋር ፕሮግራም ይቀላቀሉ*\n\n💰 10% ኮሚሽን ያግኙ\n\n• ወኪሎች: ደንበኞችን ያመልክቱ\n• ነጋዴዎች: የእጣ መደቦች ይፍጠሩ\n• ድርጅቶች: ለአባላት የእጣ መደቦች ይፍጠሩ",
    program_7: "📊 *ዳሽቦርድ*\n\nእንቅስቃሴዎን፣ ቲኬቶችዎን እና ስታቲስቲክስዎን ይመልከቱ።\n\n👇 ዳሽቦርድዎን ይክፈቱ:",
    program_8: "📖 *እንዴት እንሳተፋለን?*\n\n1️⃣ ፕሮግራም ይምረጡ\n2️⃣ ደረጃዎን ይምረጡ\n3️⃣ መቀመጫ ይምረጡ\n4️⃣ ይክፈሉ እና ያሸንፉ! 🎉",
    program_9: "🏆 *የቅርብ ጊዜ አሸናፊዎች*",
    program_10: "📞 *እኛን ያግኙ*\n\n📧 hundessanegassa@gmail.com\n📱 0930330323, 0913 277 922",
    
    // Winners & How It Works
    winners: "🏆 *የቅርብ ጊዜ አሸናፊዎች*",
    no_winners: "ምንም አሸናፊዎች የሉም። የመጀመሪያው ይሁኑ! 🎯",
    how_it_works: "📖 *እንዴት እንሳተፋለን?*\n\n1️⃣ ፕሮግራም ይምረጡ\n2️⃣ ደረጃዎን ይምረጡ\n3️⃣ መቀመጫ ይምረጡ\n4️⃣ ይክፈሉ እና ያሸንፉ! 🎉",
    
    // Support & Tickets
    support: "📞 *እኛን ያግኙ*\n\n📧 hundessanegassa@gmail.com\n📱 0930330323, 0913 277 922",
    tickets: "🎫 *ቲኬቶችዎ*",
    no_tickets: "📭 *ምንም ቲኬቶች የሉዎትም.*\n\nለመጀመር ፕሮግራም ይቀላቀሉ! 🎯",
    
    // Navigation Buttons
    back: "🔙 ተመለስ",
    open_app: "🚀 መተግበሪያ ይክፈቱ",
    dashboard: "📊 ዳሽቦርድ",
    join_now: "🎯 አሁን ይቀላቀሉ",
    apply_now: "🤝 አሁን ያመልክቱ",
    view_winners: "🏆 አሸናፊዎችን ይመልከቱ",
    
    // Login
    login_success: "✅ *መግቢያ ተሳክቷል!*\n\nእንኳን ደህና መጡ {name}! 🎉\n\n🔐 ክፍለ ጊዜዎ ዝግጁ ነው!\n\nመተግበሪያውን ለመክፈት ከታች ያለውን ቁልፍ ይጫኑ:",
    return_to_app: "🚀 ወደ መተግበሪያ ተመለስ",
    
    // Creator Menu
    creator_menu: "🏪 *የእጣ መደብ MENU*\n\nእንኳን ደህና መጡ {name}!\n\n📊 የእጣ መደቦችዎን እና ገቢዎን ያስተዳድሩ:\n\n• አዳዲስ የእጣ መደቦችን ይፍጠሩ\n• ገቢዎን ይከታተሉ\n• የእጣ መደቦችዎን ይመልከቱ\n• ገንዘብ ለማውጣት ይጠይቁ",
    creator_stats: "📊 *የእርስዎ የእጣ መደብ ስታቲስቲክስ*\n\n🏪 መደብር: {shop}\n📦 ጠቅላላ የእጣ መደቦች: {pools}\n💰 ጠቅላላ ገቢ: ETB {earnings}\n⏳ በመጠበቅ ላይ: ETB {fees}\n👥 ጠቅላላ ተሳታፊዎች: {participants}\n⭐ ደረጃ: {rating}",
    creator_pools: "📋 *የእርስዎ የእጣ መደቦች*\n\n{list}",
    creator_pool_detail: "🏊 *{name}*\n\n💰 ሽልማት: ETB {prize}\n🎫 መግቢያ: ETB {entry}\n👥 ተሳታፊዎች: {participants}\n📊 እድገት: {progress}%\n📅 የእጣ ቀን: {draw}\n📌 ሁኔታ: {status}",
    creator_earnings: "💰 *የገቢ ማጠቃለያ*\n\nጠቅላላ ገቢ: ETB {total}\nበመጠበቅ ላይ: ETB {pending}\nለመውጣት ዝግጁ: ETB {available}",
    creator_withdraw: "💳 *የገንዘብ መውጫ ጥያቄ*\n\nመጠን: ETB {amount}\nዘዴ: {method}\nሂሳብ: {account}\n\n✅ ጥያቄ ተልኳል!",
    creator_no_pools: "📭 *እስካሁን ምንም የእጣ መደቦች አልፈጠሩም.*\n\nመጀመሪያ የእጣ መደብዎን ይፍጠሩ እና ማግኘት ይጀምሩ! 🚀",
    
    // Become Creator
    become_creator: "🏪 *የራስዎን መደብር ይክፈቱ!*\n\n💰 በእያንዳንዱ ፑል ላይ 10% ኮሚሽን ያግኙ\n\n• የራስዎን የእጣ መደቦች ይፍጠሩ\n• የራስዎን ሽልማቶች እና መግቢያ ያዘጋጁ\n• ዒላማውን ከደረሱ በኋላ ክፍያዎን ያግኙ\n• ገንዘብዎን በማንኛውም ጊዜ ያውጡ\n\nለመጀመር ዝግጁ? 👇",
    
    // Button Labels
    become_creator_btn: "🏪 የራስዎን መደብር ይክፈቱ",
    creator_shop: "🏪 የእኔ መደብር",
    create_pool: "📝 የእጣ መደብ ፍጠር",
    my_pools: "📋 የእጣ መደቦቼ",
    earnings: "💰 ገቢ",
    withdraw: "💳 ገንዘብ አውጡ",
    stats: "📊 ስታቲስቲክስ"
  },

  om: {
    // Welcome & Language
    welcome: "🌟 *Gara Abbaa Carraatti Baga Nagaan Dhufte!*\n\n🏆 *Itoophiyaatti Dirree Badhaasaa Olaanaa*\n\n🚗 Konkoolataa Mo'adhaa\n🏠 Mana Mo'adhaa\n🏭 Mashiniinoota Mo'adhaa\n💻 Elektirooniksoota Adda Addaa Mo'adhaa\n💰 Maallaqa Hanga Miliyoona 10ti Mo'adhaa\n\n💚 *%2 Fayyaaf* Dhibamtoota Kalee fi Onnee Gargaaruuf oola\n\n🎯 *Mo'achuuf Qophiidhaa? Eegalaa!*\n\n🏪 *Daldala Keessan Banadhaa* - Carraawwan Uumaa fi 10% Komishinii Argadhaa!",
    language_select: "🌐 *Afaan Filadhu*\n\nMaaloo afaan filachuu barbaaddan filadhaa:",
    language_set: "✅ Afaan Afaan Oromootti jijjiirame! 🎉",
    
    // Name & Phone
    ask_name: "📝 *Maqaa Keessan Guutuu Maal?*\n\nMaaloo maqaa keessan guutuu galchaa:",
    ask_phone: "📱 *Lakkoofsa Bilbilaa Keessan Maal?*\n\nFakkeenyaaf: 0912345678",
    name_received: "✅ Galatoomaa! Amma lakkoofsa bilbilaa keessan qoodadhaa:",
    phone_received: "✅ Galatoomaa! Profiiliin keessan xumurame! 🎉",
    
    // Main Menu - UPDATED ORDER
    main_menu: "👋 *Baga Nagaan Deebitan {name}!*\n\n🎯 *Filannoo Armaan Gadii Keessaa Filadhaa:*",
    programs: "🎯 *Sagaantawwaan Abbaa Carraa*\n\n*Karaa Mo'achuu Keessan Filadhaa:*\n\n1️⃣ 🚀 *Appii Abbaa Carraa Bani*\nImala Keessan Amma Eegalaa!\n\n2️⃣ 🏊 *Carraawwan Idilee*\n🚗 Konkoolataa • 🏠 Mana • 🏭 Mashiniinoota • 💻 Elektirooniksoota\n💵 100 ETB Irraa Eegalaa\n\n3️⃣ 🏙️ *VIP Magaalaa*\n💰 Maallaqa Hanga Miliyoona 10ti\n📅 Guyyaa • Torban • Ji'aa\n🎟️ Sadarkaa 5\n\n4️⃣ 🏪 *Merkato VIP*\n💰 Maallaqa Hanga Miliyoona 10ti\n📅 Guyyaa • Torban • Ji'aa\n🎟️ Sadarkaa 5\n\n5️⃣ 🏪 *Daldala Keessan Banadhaa*\n💰 10% Komishinii Argadhaa\n👥 Carraawwan Uumaa • Badhaasa mataa keetii kaa'i\n\n6️⃣ 🤝 *Sagantaa Michuu*\n💰 10% Komishinii Argadhaa\n👥 Maamiltoota Qoodadhaa • Carraawwan Uumaa\n\n7️⃣ 📊 *Daashboorardii*\nHojii fi Tikkeetoota keessan ilaalaa\n\n8️⃣ 📖 *Akkam Hojiirra Oola?*\nAkkam hirmaachuu akka dandeessan hubadhaa\n\n9️⃣ 🏆 *Mo'attoota*\nMo'attoota dhiyoo ilaalaa\n\n🔟 📞 *Qunnamtii*\nNu qunnamuu",
    
    // Program Details
    program_1: "🚀 *Appii Abbaa Carraa Bani*\n\nImala mo'achuu keessan amma eegalaa!\n\n👇 Appii banuuf jalatti cuqaasaa:",
    program_2: "🏊 *Carraawwan Idilee itti hirmaadhaa*\n\n🚗 Konkoolataa mo'adhaa\n🏠 Mana mo'adhaa\n🏭 Mashiniinoota mo'adhaa\n💻 Elektirooniksoota mo'adhaa\n\n💵 100 ETB irraa eegalaa\n🎁 Badhaasa ajaa'ibsiisaa eegachaa jira!",
    program_3: "🏙️ *VIP Magaalaa itti hirmaadhaa*\n\n📍 Magaalaa keessan keessatti mo'adhaa!\n💰 Maallaqa Hanga Miliyoona 10ti\n📅 Guyyaa • Torban • Ji'aa\n🎟️ Sadarkaa 5",
    program_4: "🏪 *Merkato VIP itti hirmaadhaa*\n\n💰 Maallaqa Hanga Miliyoona 10ti\n📅 Guyyaa • Torban • Ji'aa\n🎟️ Sadarkaa 5",
    program_5: "🏪 *Daldala Keessan Banadhaa*\n\n💰 Carraa tokkoon tokkoon 10% Komishinii Argadhaa\n\n• Carraawwan Badhaasaa Keessan Uumaa\n• Badhaasa fi kaffaltii seensaa mataa keetii kaa'i\n• Yeroo galma irra geesse kaffaltii argadhu\n• Galii Keessan Yeroo Barbaaddan Baafadha\n\nJalqabuuf Qophiidha? 👇",
    program_6: "🤝 *Sagantaa Michuu Itti Hirmaadhaa*\n\n💰 10% Komishinii Argadhaa\n\n• Bakka Bu'oota: Maamiltoota Qoodadhaa\n• Dhiyeestoota: Carraawwan Idilee Uumaa\n• Dhaabbattoonni: Miseensotaaf Carraa Idilee Uumaa",
    program_7: "📊 *Daashboorardii*\n\nHojii, Tikkeetoota fi istaatistikaa keessan ilaalaa.\n\n👇 Daashboorardiin keessan banadhaa:",
    program_8: "📖 *Akkam Hojiirra Oola?*\n\n1️⃣ Sagantaalee jiraan Filadhaa\n2️⃣ Sadarkaa Keessan Filadhaa\n3️⃣ Teessoo Filadhaa\n4️⃣ Kaffalaati Mo'adhaa! 🎉",
    program_9: "🏆 *Mo'attoota Dhiyoo*",
    program_10: "📞 *Nu Qunnamaa*\n\n📧 hundessanegassa@gmail.com\n📱 0930330323, 0913 277 922",
    
    // Winners & How It Works
    winners: "🏆 *Mo'attoota Dhiyoo*",
    no_winners: "Mo'attaan Dhiyoo Hin Jiru. Isa Jalqabaa Ta'aa! 🎯",
    how_it_works: "📖 *Akkam Hojiirra Oola?*\n\n1️⃣ Sagantaalee jiraan Filadhaa\n2️⃣ Sadarkaa Keessan Filadhaa\n3️⃣ Teessoo Filadhaa\n4️⃣ Kaffalaati Mo'adhaa! 🎉",
    
    // Support & Tickets
    support: "📞 *Nu Qunnamaa*\n\n📧 hundessanegassa@gmail.com\n📱 0930330323, 0913 277 922",
    tickets: "🎫 *Tikkeetoota Keessan*",
    no_tickets: "📭 *Tikkeetii Tokko Hin Qabdu.*\n\nMo'aachuuf sagaantaalee jiraan irratti Hirmaadhu! 🎯",
    
    // Navigation Buttons
    back: "🔙 Deebi'i",
    open_app: "🚀 Appii Bani",
    dashboard: "📊 Daashboorardii Koo",
    join_now: "🎯 Amma Hirmaadhu",
    apply_now: "🤝 Amma Dorgomi",
    view_winners: "🏆 Mo'attoota Ilaali",
    
    // Login
    login_success: "✅ *Galmeen Milkaa'eera!*\n\nBaga Nagaan Dhufte {name}! 🎉\n\n🔐 Galmeen Keessan Qophii Dha!\n\nAppii Banuuf Jalatti Cuqaasaa:",
    return_to_app: "🚀 Gara Appii Deebi'i",
    
    // Creator Menu
    creator_menu: "🏪 *MENU Uumaa Carraa*\n\nBaga Nagaan Dhufte {name}!\n\n📊 Carraawwan Keessan fi Galii Keessan Bulchaa:\n\n• Carraawwan Haaraa Uumaa\n• Galii Keessan Eegalaa\n• Carraawwan Keessan Ilaalaa\n• Maallaqa Baasuuf Gaafadhaa",
    creator_stats: "📊 *istaatii Uumaa Carraa*\n\n🏪 Dunkaana: {shop}\n📦 Carraawwan: {pools}\n💰 Galii Guutuu: ETB {earnings}\n⏳ Kaffaltii Eegamaa Jiru: ETB {fees}\n👥 Hirmattoota: {participants}\n⭐ Sadarkaa: {rating}",
    creator_pools: "📋 *Carraawwan Keessan*\n\n{list}",
    creator_pool_detail: "🏊 *{name}*\n\n💰 Badhaasa: ETB {prize}\n🎫 Seensa: ETB {entry}\n👥 Hirmattoota: {participants}\n📊 Adeemsa irra: {progress}%\n📅 Guyyaa carraan itti bahu: {draw}\n📌 Haala: {status}",
    creator_earnings: "💰 *Cuunfaa Galii*\n\nGalii waliigalaa: ETB {total}\nKanfaltii Eegamaa: ETB {pending}\nBahaafachuuf ni eegama: ETB {available}",
    creator_withdraw: "💳 *Gaafii Baasii Maallaqaa*\n\nHanga: ETB {amount}\nKaraa: {method}\nakkawontii: {account}\n\n✅ Gaaffiin dhiyaate!",
    creator_no_pools: "📭 *Carraa Tokko Hin Uumne.*\n\nCarraa Keessan Jalqabaa Uumaati Galii Argachuu Eegalaa! 🚀",
    
    // Become Creator
    become_creator: "🏪 *Daldala Keessan Banadhaa!*\n\n💰 Carraa tokkoon tokkoon 10% Komishinii Argadhaa\n\n• Carraawwan Badhaasaa Keessan Uumaa\n• Badhaasa fi kaffaltii seensaa mataa keetii kaa'i\n• Yeroo galma irra geesse kaffaltii argadhu\n• Galii Keessan Yeroo Barbaaddan Baafadha\n\nJalqabuuf Qophiidha? 👇",
    
    // Button Labels
    become_creator_btn: "🏪 Daldala Keessan Banadhaa",
    creator_shop: "🏪 Dunkaana Koo",
    create_pool: "📝 Carraa Uumaa",
    my_pools: "📋 Carraawwan Koo",
    earnings: "💰 Galii",
    withdraw: "💳 Maallaqa Bahuu",
    stats: "📊 Galii"
  }
};

// ============================================
// HELPERS
// ============================================
const userSessions = {};

async function getUserLanguage(userId) {
  if (!supabase || !isSupabaseConfigured()) return 'en';
  
  try {
    const { data } = await supabase
      .from('profiles')
      .select('language')
      .eq('telegram_id', userId)
      .single();
    return data?.language || 'en';
  } catch {
    return 'en';
  }
}

async function updateUserLanguage(userId, lang) {
  if (!supabase || !isSupabaseConfigured()) return false;
  
  try {
    await supabase
      .from('profiles')
      .update({ language: lang })
      .eq('telegram_id', userId);
    return true;
  } catch {
    return false;
  }
}

async function saveUserProfile(userId, username, firstName, lastName, phone, fullName) {
  if (!supabase || !isSupabaseConfigured()) return false;
  
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', userId)
      .single();

    if (!existing) {
      await supabase.from('profiles').insert({
        telegram_id: userId,
        telegram_username: username,
        full_name: fullName || `${firstName} ${lastName || ''}`.trim(),
        phone: phone || '',
        email: `${username || userId}@telegram.user`,
        language: 'en',
        role: 'individual',
        user_type: 'individual',
        agreement_accepted: true,
        status: 'active',
        created_at: new Date().toISOString()
      });
    } else {
      await supabase.from('profiles').update({
        full_name: fullName || existing.full_name,
        phone: phone || existing.phone,
        updated_at: new Date().toISOString()
      }).eq('telegram_id', userId);
    }
    return true;
  } catch {
    return false;
  }
}

// ============================================
// CREATOR HELPERS
// ============================================
async function isPoolCreator(userId) {
  if (!supabase || !isSupabaseConfigured()) return false;
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_id', userId)
      .single();
    
    if (!profile) return false;
    
    const { data: creator } = await supabase
      .from('pool_creators')
      .select('id')
      .eq('user_id', profile.id)
      .maybeSingle();
    
    return !!creator;
  } catch {
    return false;
  }
}

async function getCreatorData(userId) {
  if (!supabase || !isSupabaseConfigured()) return null;
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_id', userId)
      .single();
    
    if (!profile) return null;
    
    const { data: creator } = await supabase
      .from('pool_creators')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle();
    
    return creator;
  } catch {
    return null;
  }
}

// ============================================
// LOGIN FLOW HANDLER
// ============================================
async function handleLoginFlow(ctx) {
  const user = ctx.from;
  const userId = user.id;
  
  console.log('🔐 Starting login flow for user:', userId);
  
  if (!supabase || !isSupabaseConfigured()) {
    console.error('❌ Supabase not configured!');
    await ctx.reply('⚠️ Login service is not available. Please try again later.');
    return;
  }
  
  try {
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      username: user.username || 'unknown',
      firstName: user.first_name || 'User',
      lastName: user.last_name || '',
      timestamp: Date.now()
    })).toString('base64');
    
    console.log('✅ Token generated:', token.substring(0, 30) + '...');
    
    const { error } = await supabase
      .from('login_tokens')
      .insert({
        token: token,
        telegram_id: user.id,
        username: user.username || null,
        first_name: user.first_name || null,
        last_name: user.last_name || null,
        expires_at: new Date(Date.now() + 300000).toISOString()
      });
    
    if (error) {
      console.error('❌ Database insert error:', error);
      await ctx.reply('⚠️ Login failed. Please try again.');
      return;
    }
    
    console.log('✅ Token stored in database');
    
    const redirectUrl = `${APP_URL}/auth/callback?token=${encodeURIComponent(token)}&telegram_id=${user.id}`;
    
    console.log('🔗 Redirect URL:', redirectUrl);
    
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.reply(
      t.login_success.replace('{name}', user.first_name || 'User'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ 
              text: t.return_to_app, 
              url: redirectUrl
            }]
          ]
        }
      }
    );
    
    console.log('✅ Login message sent to user');
    
  } catch (error) {
    console.error('❌ Login error:', error);
    await ctx.reply('⚠️ Login failed. Please try again.');
  }
}

// ============================================
// BUILD MENUS - UPDATED
// ============================================
function buildMainMenu(lang, isCreator = false) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  const buttons = [
    [{ text: '🚀 ' + t.open_app, web_app: { url: APP_URL } }],
    [{ text: '🏊 Regular Pools', callback_data: 'regular' }],
    [{ text: '🏙️ City VIP', callback_data: 'city' }],
    [{ text: '🏪 Merkato VIP', callback_data: 'merkato' }],
  ];
  
  // Add Creator Shop button
  if (isCreator) {
    buttons.push([{ text: '🏪 ' + (t.creator_shop || 'My Shop'), callback_data: 'creator_menu' }]);
  } else {
    buttons.push([{ text: '🏪 ' + (t.become_creator_btn || 'Open Your Own Shop'), callback_data: 'become_creator' }]);
  }
  
  buttons.push(
    [{ text: '🤝 Partner Program', callback_data: 'partner' }],
    [{ text: '📊 Dashboard', web_app: { url: `${APP_URL}/dashboard` } }],
    [{ text: '📖 How It Works', callback_data: 'how' }],
    [{ text: '🏆 Winners', callback_data: 'winners' }],
    [{ text: '📞 Support', callback_data: 'support' }]
  );
  
  return {
    inline_keyboard: buttons
  };
}

function buildProgramMenu(lang, type) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  const urls = {
    regular: '/listings',
    city: '/cities',
    merkato: '/merkato-vip',
    partner: '/register',
    creator: '/creator/apply',
    dashboard: '/dashboard',
    winners: '/winners',
    support: '/support'
  };
  
  const buttonTexts = {
    regular: t.join_now,
    city: t.join_now,
    merkato: t.join_now,
    partner: t.apply_now,
    creator: t.apply_now,
    dashboard: t.dashboard,
    winners: t.view_winners,
    support: t.support
  };
  
  const label = type === 'creator' ? '🏪 Open Shop' :
                type === 'dashboard' ? '📊 Dashboard' :
                type === 'winners' ? '🏆 Winners' :
                type === 'support' ? '📞 Contact' :
                buttonTexts[type] || t.join_now;
  
  return {
    inline_keyboard: [
      [{ text: label, web_app: { url: `${APP_URL}${urls[type] || ''}` } }],
      [{ text: t.back, callback_data: 'menu' }]
    ]
  };
}

function buildCreatorMenu(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  return {
    inline_keyboard: [
      [{ text: '📝 ' + (t.create_pool || 'Create Pool'), callback_data: 'creator_create_pool' }],
      [{ text: '📋 ' + (t.my_pools || 'My Pools'), callback_data: 'creator_my_pools' }],
      [{ text: '💰 ' + (t.earnings || 'Earnings'), callback_data: 'creator_earnings' }],
      [{ text: '💳 ' + (t.withdraw || 'Withdraw'), callback_data: 'creator_withdraw' }],
      [{ text: '📊 ' + (t.stats || 'Stats'), callback_data: 'creator_stats' }],
      [{ text: t.back, callback_data: 'menu' }]
    ]
  };
}

// ============================================
// CREATOR HANDLERS
// ============================================
async function handleCreatorMenu(ctx) {
  const userId = ctx.from.id;
  const lang = await getUserLanguage(userId);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const user = ctx.from;
  
  const creator = await getCreatorData(userId);
  
  if (!creator) {
    await ctx.reply(t.become_creator, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏪 ' + (t.apply_now || 'Apply Now'), web_app: { url: `${APP_URL}/creator/apply` } }],
          [{ text: t.back, callback_data: 'menu' }]
        ]
      }
    });
    return;
  }
  
  await ctx.reply(t.creator_menu.replace('{name}', user.first_name || 'User'), {
    parse_mode: 'Markdown',
    reply_markup: buildCreatorMenu(lang)
  });
}

async function handleCreatorStats(ctx) {
  const userId = ctx.from.id;
  const lang = await getUserLanguage(userId);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_id', userId)
      .single();
    
    if (!profile) {
      await ctx.reply('⚠️ Profile not found.');
      return;
    }
    
    const { data: creator } = await supabase
      .from('pool_creators')
      .select('*')
      .eq('user_id', profile.id)
      .single();
    
    if (!creator) {
      await ctx.reply('⚠️ Creator profile not found.');
      return;
    }
    
    const { data: pools } = await supabase
      .from('pools')
      .select('*')
      .eq('creator_id', creator.id);
    
    const totalPools = pools?.length || 0;
    const totalParticipants = pools?.reduce((sum, p) => sum + (p.current_participants || 0), 0) || 0;
    const totalCollected = pools?.reduce((sum, p) => sum + (p.total_collected || 0), 0) || 0;
    const earnings = totalCollected * 0.10;
    const pendingFees = earnings - (creator.total_platform_fee_paid || 0);
    
    const stats = t.creator_stats
      .replace('{shop}', creator.business_name || (lang === 'am' ? 'የእኔ መደብር' : 'My Shop'))
      .replace('{pools}', totalPools)
      .replace('{earnings}', earnings.toLocaleString())
      .replace('{fees}', pendingFees.toLocaleString())
      .replace('{participants}', totalParticipants)
      .replace('{rating}', creator.rating || 0);
    
    await ctx.reply(stats, {
      parse_mode: 'Markdown'
    });
    
    await ctx.reply('👇 *Choose an option:*', {
      parse_mode: 'Markdown',
      reply_markup: buildCreatorMenu(lang)
    });
  } catch (error) {
    console.error('Error getting creator stats:', error);
    await ctx.reply('⚠️ Failed to load stats.');
  }
}

async function handleCreatorPools(ctx) {
  const userId = ctx.from.id;
  const lang = await getUserLanguage(userId);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_id', userId)
      .single();
    
    if (!profile) {
      await ctx.reply('⚠️ Profile not found.');
      return;
    }
    
    const { data: creator } = await supabase
      .from('pool_creators')
      .select('id')
      .eq('user_id', profile.id)
      .single();
    
    if (!creator) {
      await ctx.reply('⚠️ Creator profile not found.');
      return;
    }
    
    const { data: pools } = await supabase
      .from('pools')
      .select('*')
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: false });
    
    if (!pools || pools.length === 0) {
      await ctx.reply(t.creator_no_pools, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📝 ' + (t.create_pool || 'Create Pool'), web_app: { url: `${APP_URL}/creator/create-pool` } }],
            [{ text: t.back, callback_data: 'creator_menu' }]
          ]
        }
      });
      return;
    }
    
    let list = '';
    pools.slice(0, 5).forEach((p, i) => {
      const statusEmoji = p.lifecycle_status === 'active' ? '🟢' : 
                          p.lifecycle_status === 'draft' ? '📝' :
                          p.lifecycle_status === 'completed' ? '✅' : '⏳';
      list += `${i+1}. ${statusEmoji} ${p.prize_name}\n`;
      list += `   💰 ETB ${p.target_amount?.toLocaleString()} | 👥 ${p.current_participants || 0}\n`;
      list += `   📊 ${Math.min(Math.round(((p.total_collected || 0) / (p.target_amount || 1)) * 100), 100)}%\n\n`;
    });
    
    if (pools.length > 5) {
      list += `📚 +${pools.length - 5} ${lang === 'am' ? 'ተጨማሪ ፑሎች' : 'more pools'}`;
    }
    
    await ctx.reply(t.creator_pools.replace('{list}', list), {
      parse_mode: 'Markdown'
    });
    
    await ctx.reply('👇 *Choose an option:*', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📝 ' + (t.create_pool || 'Create Pool'), web_app: { url: `${APP_URL}/creator/create-pool` } }],
          [{ text: '📊 ' + (t.dashboard || 'Dashboard'), web_app: { url: `${APP_URL}/creator/dashboard` } }],
          [{ text: t.back, callback_data: 'creator_menu' }]
        ]
      }
    });
  } catch (error) {
    console.error('Error getting creator pools:', error);
    await ctx.reply('⚠️ Failed to load pools.');
  }
}

async function handleCreatorEarnings(ctx) {
  const userId = ctx.from.id;
  const lang = await getUserLanguage(userId);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_id', userId)
      .single();
    
    if (!profile) {
      await ctx.reply('⚠️ Profile not found.');
      return;
    }
    
    const { data: creator } = await supabase
      .from('pool_creators')
      .select('*')
      .eq('user_id', profile.id)
      .single();
    
    if (!creator) {
      await ctx.reply('⚠️ Creator profile not found.');
      return;
    }
    
    const { data: pools } = await supabase
      .from('pools')
      .select('total_collected')
      .eq('creator_id', creator.id);
    
    const totalCollected = pools?.reduce((sum, p) => sum + (p.total_collected || 0), 0) || 0;
    const totalEarnings = totalCollected * 0.10;
    const paidFees = creator.total_platform_fee_paid || 0;
    const pendingFees = totalEarnings - paidFees;
    const available = totalEarnings - paidFees;
    
    const earnings = t.creator_earnings
      .replace('{total}', totalEarnings.toLocaleString())
      .replace('{pending}', pendingFees.toLocaleString())
      .replace('{available}', available.toLocaleString());
    
    await ctx.reply(earnings, {
      parse_mode: 'Markdown'
    });
    
    await ctx.reply('👇 *Choose an option:*', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💳 ' + (t.withdraw || 'Withdraw'), callback_data: 'creator_withdraw' }],
          [{ text: '📊 ' + (t.stats || 'Stats'), callback_data: 'creator_stats' }],
          [{ text: t.back, callback_data: 'creator_menu' }]
        ]
      }
    });
  } catch (error) {
    console.error('Error getting earnings:', error);
    await ctx.reply('⚠️ Failed to load earnings.');
  }
}

async function handleCreatorWithdraw(ctx) {
  const userId = ctx.from.id;
  const lang = await getUserLanguage(userId);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  userSessions[userId] = {
    ...userSessions[userId],
    step: 'withdraw_amount',
    data: {}
  };
  
  await ctx.reply('💳 *Withdraw Funds*\n\n' +
    'Please enter the amount you want to withdraw (ETB):\n\n' +
    'Minimum: 100 ETB\n' +
    'Maximum: Your available balance',
    {
      parse_mode: 'Markdown'
    }
  );
}

// ============================================
// BOT COMMAND HANDLERS
// ============================================
export async function setupBotCommands() {
  if (!bot) return;
  try {
    await bot.telegram.setMyCommands([
      { command: 'start', description: '🚀 Start' },
      { command: 'menu', description: '📋 Main Menu' },
      { command: 'help', description: '📖 Help' },
      { command: 'mytickets', description: '🎫 My Tickets' },
      { command: 'login', description: '🔐 Login to Abbaa Carraa' },
      { command: 'creatorshop', description: '🏪 My Creator Shop' }
    ]);
    console.log('✅ Bot commands set');
  } catch (error) {
    console.error('❌ Failed to set commands:', error);
  }
}

export async function handleBotMessages() {
  if (!bot) {
    console.log('⚠️ Bot not initialized');
    return;
  }

  bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('⚠️ Please try again later.');
  });

  // ============================================
  // CREATOR SHOP COMMAND
  // ============================================
  bot.command('creatorshop', async (ctx) => {
    await handleCreatorMenu(ctx);
  });

  // ============================================
  // LOGIN COMMAND
  // ============================================
  bot.command('login', async (ctx) => {
    console.log('🔐 /login command received from:', ctx.from.id);
    await handleLoginFlow(ctx);
  });

  // ============================================
  // START COMMAND
  // ============================================
  bot.start(async (ctx) => {
    const user = ctx.from;
    const userId = user.id;
    
    const startPayload = ctx.payload;
    console.log('📱 Start payload:', startPayload);
    
    const isLogin = startPayload === 'login' || 
                    startPayload?.startsWith('login') ||
                    startPayload?.includes('login');
    
    if (isLogin) {
      console.log('🔐 Login request detected for user:', userId);
      await handleLoginFlow(ctx);
      return;
    }
    
    userSessions[userId] = { 
      step: 'language',
      data: {} 
    };
    
    // Send welcome with Open Your Own Shop
    await ctx.reply(TRANSLATIONS.en.welcome, { parse_mode: 'Markdown' });
    
    await ctx.reply(TRANSLATIONS.en.language_select, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🇬🇧 English', callback_data: 'lang_en' }],
          [{ text: '🇪🇹 አማርኛ', callback_data: 'lang_am' }],
          [{ text: '🌍 Afaan Oromo', callback_data: 'lang_om' }]
        ]
      }
    });
  });

  // ============================================
  // LANGUAGE SELECTION CALLBACK
  // ============================================
  bot.action(/lang_(.+)/, async (ctx) => {
    const lang = ctx.match[1];
    const userId = ctx.from.id;
    
    await updateUserLanguage(userId, lang);
    
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.reply(t.language_set, { parse_mode: 'Markdown' });
    
    if (userSessions[userId]) {
      userSessions[userId].step = 'ask_name';
      userSessions[userId].language = lang;
    } else {
      userSessions[userId] = { 
        step: 'ask_name', 
        language: lang,
        data: {} 
      };
    }
    
    await ctx.reply(t.ask_name, { parse_mode: 'Markdown' });
    
    await ctx.answerCbQuery();
  });

  // ============================================
  // HANDLE TEXT - NAME, PHONE, WITHDRAWAL
  // ============================================
  bot.on('text', async (ctx) => {
    const user = ctx.from;
    const userId = user.id;
    const text = ctx.message.text.trim();
    
    const session = userSessions[userId];
    
    // Handle withdrawal flow
    if (session && session.step === 'withdraw_amount') {
      const amount = parseFloat(text);
      
      if (isNaN(amount) || amount < 100) {
        await ctx.reply('⚠️ Please enter a valid amount (minimum 100 ETB):');
        return;
      }
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('telegram_id', userId)
          .single();
        
        if (!profile) {
          await ctx.reply('⚠️ Profile not found.');
          return;
        }
        
        const { data: creator } = await supabase
          .from('pool_creators')
          .select('*')
          .eq('user_id', profile.id)
          .single();
        
        if (!creator) {
          await ctx.reply('⚠️ Creator profile not found.');
          return;
        }
        
        const { data: pools } = await supabase
          .from('pools')
          .select('total_collected')
          .eq('creator_id', creator.id);
        
        const totalCollected = pools?.reduce((sum, p) => sum + (p.total_collected || 0), 0) || 0;
        const totalEarnings = totalCollected * 0.10;
        const paidFees = creator.total_platform_fee_paid || 0;
        const available = totalEarnings - paidFees;
        
        if (amount > available) {
          await ctx.reply(`⚠️ Insufficient balance. Available: ETB ${available.toLocaleString()}`);
          return;
        }
        
        const { error } = await supabase
          .from('creator_payouts')
          .insert({
            creator_id: creator.id,
            amount: amount,
            payout_type: 'commission',
            bank_name: creator.bank_name || 'TeleBirr',
            bank_account_number: creator.bank_account_number || creator.telebirr_number,
            bank_account_name: creator.bank_account_name || creator.business_name,
            telebirr_number: creator.telebirr_number,
            status: 'pending'
          });
        
        if (error) {
          console.error('Withdrawal error:', error);
          await ctx.reply('⚠️ Failed to submit withdrawal request. Please try again.');
          return;
        }
        
        const lang = await getUserLanguage(userId);
        const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
        
        await ctx.reply(t.creator_withdraw
          .replace('{amount}', amount.toLocaleString())
          .replace('{method}', creator.telebirr_number ? 'TeleBirr' : 'Bank Transfer')
          .replace('{account}', creator.telebirr_number || creator.bank_account_number || 'N/A'), {
            parse_mode: 'Markdown'
          }
        );
        
        delete userSessions[userId];
        
        await ctx.reply('👇 *Choose an option:*', {
          parse_mode: 'Markdown',
          reply_markup: buildCreatorMenu(lang)
        });
        return;
      } catch (error) {
        console.error('Withdrawal error:', error);
        await ctx.reply('⚠️ Failed to process withdrawal.');
        return;
      }
    }
    
    // Handle regular text flow
    if (!session) {
      const lang = await getUserLanguage(userId);
      const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
      const isCreator = await isPoolCreator(userId);
      await ctx.reply(t.main_menu.replace('{name}', user.first_name || 'User'), {
        parse_mode: 'Markdown'
      });
      await ctx.reply('👇 *Choose an option below:*', {
        parse_mode: 'Markdown',
        reply_markup: buildMainMenu(lang, isCreator)
      });
      return;
    }

    if (session.step === 'ask_name') {
      session.data.fullName = text;
      session.step = 'ask_phone';
      
      const lang = session.language || await getUserLanguage(userId);
      const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
      
      await ctx.reply(t.ask_phone, { parse_mode: 'Markdown' });
      return;
    }
    
    if (session.step === 'ask_phone') {
      session.data.phone = text;
      session.step = 'complete';
      
      const lang = session.language || await getUserLanguage(userId);
      const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
      
      await saveUserProfile(
        userId,
        user.username,
        user.first_name,
        user.last_name,
        text,
        session.data.fullName
      );
      
      await ctx.reply(t.phone_received, { parse_mode: 'Markdown' });
      
      await showPrograms(ctx, userId, lang);
      
      delete userSessions[userId];
      return;
    }
  });

  // ============================================
  // SHOW PROGRAMS
  // ============================================
  async function showPrograms(ctx, userId, lang) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const user = ctx.from;
    const name = user?.first_name || 'User';
    const isCreator = await isPoolCreator(userId);
    
    await ctx.reply(t.main_menu.replace('{name}', name), {
      parse_mode: 'Markdown'
    });
    
    await ctx.reply(t.programs, {
      parse_mode: 'Markdown'
    });
    
    await ctx.reply('👇 *Select a program below:*', {
      parse_mode: 'Markdown',
      reply_markup: buildMainMenu(lang, isCreator)
    });
  }

  // ============================================
  // PROGRAM CALLBACKS - UPDATED
  // ============================================
  bot.action('regular', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(t.program_2, {
      parse_mode: 'Markdown'
    });
    
    await ctx.reply('👇 *Join now:*', {
      parse_mode: 'Markdown',
      reply_markup: buildProgramMenu(lang, 'regular')
    });
    await ctx.answerCbQuery();
  });

  bot.action('city', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(t.program_3, {
      parse_mode: 'Markdown'
    });
    
    await ctx.reply('👇 *Join now:*', {
      parse_mode: 'Markdown',
      reply_markup: buildProgramMenu(lang, 'city')
    });
    await ctx.answerCbQuery();
  });

  bot.action('merkato', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(t.program_4, {
      parse_mode: 'Markdown'
    });
    
    await ctx.reply('👇 *Join now:*', {
      parse_mode: 'Markdown',
      reply_markup: buildProgramMenu(lang, 'merkato')
    });
    await ctx.answerCbQuery();
  });

  bot.action('partner', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(t.program_6, {
      parse_mode: 'Markdown'
    });
    
    await ctx.reply('👇 *Apply now:*', {
      parse_mode: 'Markdown',
      reply_markup: buildProgramMenu(lang, 'partner')
    });
    await ctx.answerCbQuery();
  });

  // ============================================
  // CREATOR CALLBACKS
  // ============================================
  bot.action('creator_menu', async (ctx) => {
    await handleCreatorMenu(ctx);
    await ctx.answerCbQuery();
  });

  bot.action('become_creator', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(t.become_creator, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏪 ' + (t.apply_now || 'Apply Now'), web_app: { url: `${APP_URL}/creator/apply` } }],
          [{ text: t.back, callback_data: 'menu' }]
        ]
      }
    });
    await ctx.answerCbQuery();
  });

  bot.action('creator_stats', async (ctx) => {
    await handleCreatorStats(ctx);
    await ctx.answerCbQuery();
  });

  bot.action('creator_my_pools', async (ctx) => {
    await handleCreatorPools(ctx);
    await ctx.answerCbQuery();
  });

  bot.action('creator_earnings', async (ctx) => {
    await handleCreatorEarnings(ctx);
    await ctx.answerCbQuery();
  });

  bot.action('creator_withdraw', async (ctx) => {
    await handleCreatorWithdraw(ctx);
    await ctx.answerCbQuery();
  });

  bot.action('creator_create_pool', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText('📝 *Create New Pool*\n\nClick the button below to create your pool:', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📝 ' + (t.create_pool || 'Create Pool'), web_app: { url: `${APP_URL}/creator/create-pool` } }],
          [{ text: t.back, callback_data: 'creator_menu' }]
        ]
      }
    });
    await ctx.answerCbQuery();
  });

  // ============================================
  // OTHER CALLBACKS
  // ============================================
  bot.action('menu', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const user = ctx.from;
    const isCreator = await isPoolCreator(userId);
    
    await ctx.editMessageText(t.main_menu.replace('{name}', user.first_name || 'User'), {
      parse_mode: 'Markdown'
    });
    
    await ctx.reply('👇 *Choose an option below:*', {
      parse_mode: 'Markdown',
      reply_markup: buildMainMenu(lang, isCreator)
    });
    await ctx.answerCbQuery();
  });

  bot.action('winners', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    try {
      const { data: winners } = await supabase
        .from('pools')
        .select('*')
        .eq('status', 'completed')
        .not('winner_id', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(5);

      let text = t.winners;
      if (winners && winners.length > 0) {
        winners.forEach((w, i) => {
          text += `${i+1}. 🏆 ${w.prize_name || 'Prize'} - ETB ${w.target_amount?.toLocaleString() || 'N/A'}\n`;
        });
      } else {
        text += '\n' + t.no_winners;
      }
      
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown'
      });
      
      await ctx.reply('👇 *View all winners:*', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.view_winners, web_app: { url: `${APP_URL}/winners` } }],
            [{ text: t.back, callback_data: 'menu' }]
          ]
        }
      });
    } catch {
      await ctx.editMessageText('⚠️ Failed to load winners.', {
        reply_markup: { inline_keyboard: [[{ text: t.back, callback_data: 'menu' }]] }
      });
    }
    await ctx.answerCbQuery();
  });

  bot.action('how', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(t.program_8, {
      parse_mode: 'Markdown'
    });
    
    await ctx.reply('👇 *Go back:*', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: t.back, callback_data: 'menu' }]
        ]
      }
    });
    await ctx.answerCbQuery();
  });

  bot.action('support', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(t.program_10, {
      parse_mode: 'Markdown'
    });
    
    await ctx.reply('👇 *Go back:*', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: t.back, callback_data: 'menu' }]
        ]
      }
    });
    await ctx.answerCbQuery();
  });

  // ============================================
  // MY TICKETS COMMAND
  // ============================================
  bot.command('mytickets', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
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

      const [merkato, city, regular] = await Promise.all([
        supabase.from('merkato_vip_participants').select('*').eq('user_id', profile.id).limit(5),
        supabase.from('city_vip_participants').select('*').eq('user_id', profile.id).limit(5),
        supabase.from('regular_pool_participants').select('*').eq('user_id', profile.id).limit(5)
      ]);

      const allTickets = [
        ...(merkato.data || []).map(t => ({ ...t, type: 'Merkato VIP' })),
        ...(city.data || []).map(t => ({ ...t, type: 'City VIP' })),
        ...(regular.data || []).map(t => ({ ...t, type: 'Regular' }))
      ];

      if (allTickets.length === 0) {
        await ctx.reply(t.no_tickets, { parse_mode: 'Markdown' });
        return;
      }

      let message = t.tickets;
      allTickets.slice(0, 5).forEach((ticket, i) => {
        const status = ticket.payment_status === 'verified' ? '✅' : '⏳';
        message += `${i+1}. ${status} ${ticket.type}\n`;
        message += `   Seats: ${ticket.seat_numbers?.join(', ') || 'N/A'}\n`;
        message += `   #${ticket.ticket_number || 'N/A'}\n\n`;
      });

      await ctx.reply(message, {
        parse_mode: 'Markdown'
      });
      
      await ctx.reply('👇 *View all tickets:*', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 Dashboard', web_app: { url: `${APP_URL}/dashboard` } }],
            [{ text: t.back, callback_data: 'menu' }]
          ]
        }
      });
    } catch (error) {
      console.error('Error loading tickets:', error);
      await ctx.reply('⚠️ Failed to load tickets.');
    }
  });

  // ============================================
  // HELP COMMAND
  // ============================================
  bot.help(async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.reply(
      `📖 *Help*\n\n` +
      `/start - Start the bot\n` +
      `/menu - Main menu\n` +
      `/mytickets - View tickets\n` +
      `/login - Login to Abbaa Carraa\n` +
      `/creatorshop - My Creator Shop\n` +
      `/help - This help\n\n` +
      `Need more help? Contact support.`,
      {
        parse_mode: 'Markdown'
      }
    );
    
    await ctx.reply('👇 *Go back:*', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: t.back, callback_data: 'menu' }]
        ]
      }
    });
  });

  // ============================================
  // MENU COMMAND
  // ============================================
  bot.command('menu', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const user = ctx.from;
    const isCreator = await isPoolCreator(userId);
    
    await ctx.reply(t.main_menu.replace('{name}', user.first_name || 'User'), {
      parse_mode: 'Markdown'
    });
    
    await ctx.reply('👇 *Choose an option below:*', {
      parse_mode: 'Markdown',
      reply_markup: buildMainMenu(lang, isCreator)
    });
  });
}

export default bot;
