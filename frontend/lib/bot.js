// lib/bot.js - COMPLETE FIXED VERSION
import { Telegraf } from 'telegraf';
import { supabase } from './supabase';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN not set');
}

export const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

// ============================================
// COMPLETE TRANSLATIONS
// ============================================
const TRANSLATIONS = {
  en: {
    welcome: "🌟 *Welcome to Abbaa Carraa!*\n\n🏆 *Ethiopia's #1 Prize Platform*\n\n🚗 Win Cars\n🏠 Win Houses\n💰 Win Cash up to 10M ETB\n🏭 Win Machinery\n💻 Win Electronics\n\n💚 *2% Supports* Kidney & Heart Patients\n\n🎯 *Ready to win? Let's get started!*",
    
    language_select: "🌐 *Choose Your Language*\n\nPlease select your preferred language:",
    language_set: "✅ Language set to English! 🎉",
    
    ask_name: "📝 *What is your full name?*\n\nPlease enter your full name:",
    ask_phone: "📱 *What is your phone number?*\n\nExample: 0912345678",
    name_received: "✅ Thank you! Now please share your phone number:",
    phone_received: "✅ Thank you! Your profile is complete! 🎉",
    
    main_menu: "👋 *Welcome {name}!*\n\n🎯 *Choose an option below:*",
    
    programs: "🎯 *Abbaa Carraa Programs*\n\n*Choose your winning path:*\n\n1️⃣ 🚀 *Open Abbaa Carraa App*\nStart your journey now!\n\n2️⃣ 🏊 *Regular Pools*\n🚗 Cars • 🏠 Houses • 🏭 Machinery • 💻 Electronics\n💵 From 100 ETB\n\n3️⃣ 🏙️ *City VIP*\n💰 Win Cash up to 10M ETB\n📅 Daily • Weekly • Monthly Draws\n🎟️ 5 Tiers Available\n\n4️⃣ 🏪 *Merkato VIP*\n💰 Win Cash up to 10M ETB\n📅 Daily • Weekly • Monthly Draws\n🎟️ 5 Tiers Available\n\n5️⃣ 🤝 *Partner Program*\n💰 Earn 10% Commission\n👥 Refer customers • Create pools\n\n👇 *Select a program below:*",
    
    program_1: "🚀 *Open Abbaa Carraa App*\n\nStart your winning journey now!\n\n👇 Click below to open the app:",
    program_2: "🏊 *Join Regular Pools*\n\n🚗 Win Cars\n🏠 Win Houses\n🏭 Win Machinery\n💻 Win Electronics\n\n💵 Entry from 100 ETB\n🎁 Amazing prizes await!\n\n👇 Join now:",
    program_3: "🏙️ *Join City VIP*\n\n📍 Win in your city!\n💰 Up to 10M ETB Cash\n📅 Daily • Weekly • Monthly\n🎟️ 5 Tiers\n\n👇 Join now:",
    program_4: "🏪 *Join Merkato VIP*\n\n💰 Up to 10M ETB Cash\n📅 Daily • Weekly • Monthly\n🎟️ 5 Tiers: Silver • Gold • Platinum • Diamond • Royal\n\n👇 Join now:",
    program_5: "🤝 *Join Partner Program*\n\n💰 Earn 10% Commission\n\n• Agents: Refer customers\n• Vendors: Create pools\n• Organizations: Member pools\n\n👇 Apply now:",
    
    winners: "🏆 *Recent Winners*\n\n",
    how_it_works: "📖 *How It Works*\n\n1️⃣ Choose a program\n2️⃣ Pick your tier\n3️⃣ Select seats\n4️⃣ Pay & win! 🎉",
    support: "📞 *Contact Support*\n\n📧 hundessanegassa@gmail.com\n📱 0930330323, 0913 277 922",
    tickets: "🎫 *Your Tickets*\n\n",
    no_tickets: "📭 *No tickets yet.*\n\nJoin a program to start winning! 🎯",
    
    back: "🔙 Back",
    open_app: "🚀 Open App",
    dashboard: "📊 Dashboard",
    join_now: "🎯 Join Now",
    apply_now: "🤝 Apply Now",
    view_winners: "🏆 View Winners"
  },
  
  am: {
    welcome: "🌟 *እንኳን ወደ Abbaa Carraa በደህና መጡ!*\n\n🏆 *የኢትዮጵያ ቀዳሚ የሽልማት መድረክ*\n\n🚗 መኪናዎች ያሸንፉ\n🏠 ቤቶች ያሸንፉ\n💰 እስከ 10M ብር ያሸንፉ\n🏭 ማሽነሪዎች ያሸንፉ\n💻 ኤሌክትሮኒክስ ያሸንፉ\n\n💚 *2% ለጤና* የኩላሊት እና የልብ ህመምተኞችን ይደግፋል\n\n🎯 *ለማሸነፍ ዝግጁ? እንጀምር!*",
    
    language_select: "🌐 *ቋንቋዎን ይምረጡ*\n\nእባክዎ የሚመርጡትን ቋንቋ ይምረጡ:",
    language_set: "✅ ቋንቋ ወደ አማርኛ ተቀይሯል! 🎉",
    
    ask_name: "📝 *ሙሉ ስምዎ ምንድነው?*\n\nእባክዎ ሙሉ ስምዎን ያስገቡ:",
    ask_phone: "📱 *ስልክ ቁጥርዎ ምንድነው?*\n\nለምሳሌ: 0912345678",
    name_received: "✅ እናመሰግናለን! አሁን ስልክ ቁጥርዎን ያጋሩ:",
    phone_received: "✅ እናመሰግናለን! መገለጫዎ ተጠናቋል! 🎉",
    
    main_menu: "👋 *እንኳን ደህና መጡ {name}!*\n\n🎯 *ከታች ያለውን ይምረጡ:*",
    
    programs: "🎯 *የአባካራ ፕሮግራሞች*\n\n*የማሸነፍ መንገድዎን ይምረጡ:*\n\n1️⃣ 🚀 *አባካራ መተግበሪያ ይክፈቱ*\nጉዞዎን አሁን ይጀምሩ!\n\n2️⃣ 🏊 *መደበኛ የእጣ መደቦች*\n🚗 መኪና • 🏠 ቤት • 🏭 ማሽነሪ • 💻 ኤሌክትሮኒክስ\n💵 ከ100 ብር ጀምሮ\n\n3️⃣ 🏙️ *የከተማ ቪአይፒ*\n💰 እስከ 10M ብር ጥሬ ገንዘብ\n📅 ዕለታዊ • ሳምንታዊ • ወርሃዊ\n🎟️ 5 ደረጃዎች\n\n4️⃣ 🏪 *መርካቶ ቪአይፒ*\n💰 እስከ 10M ብር ጥሬ ገንዘብ\n📅 ዕለታዊ • ሳምንታዊ • ወርሃዊ\n🎟️ 5 ደረጃዎች: ብር • ወርቅ • ፕላቲኒየም • አልማዝ • ንጉሣዊ\n\n5️⃣ 🤝 *የአጋር ፕሮግራም*\n💰 10% ኮሚሽን ያግኙ\n👥 ደንበኞችን ያመልክቱ • ፑሎች ይፍጠሩ\n\n👇 *ከታች ያለውን ፕሮግራም ይምረጡ:*",
    
    program_1: "🚀 *አባካራ መተግበሪያ ይክፈቱ*\n\nየማሸነፍ ጉዞዎን አሁን ይጀምሩ!\n\n👇 መተግበሪያውን ለመክፈት ከታች ይጫኑ:",
    program_2: "🏊 *ወደ መደበኛ የእጣ መደቦች ይቀላቀሉ*\n\n🚗 መኪናዎች ያሸንፉ\n🏠 ቤቶች ያሸንፉ\n🏭 ማሽነሪዎች ያሸንፉ\n💻 ኤሌክትሮኒክስ ያሸንፉ\n\n💵 ከ100 ብር ጀምሮ\n🎁 አስደናቂ ሽልማቶች!\n\n👇 አሁን ይቀላቀሉ:",
    program_3: "🏙️ *ወደ ከተማ ቪአይፒ ይቀላቀሉ*\n\n📍 በከተማዎ ያሸንፉ!\n💰 እስከ 10M ብር ጥሬ ገንዘብ\n📅 ዕለታዊ • ሳምንታዊ • ወርሃዊ\n🎟️ 5 ደረጃዎች\n\n👇 አሁን ይቀላቀሉ:",
    program_4: "🏪 *ወደ መርካቶ ቪአይፒ ይቀላቀሉ*\n\n💰 እስከ 10M ብር ጥሬ ገንዘብ\n📅 ዕለታዊ • ሳምንታዊ • ወርሃዊ\n🎟️ 5 ደረጃዎች\n\n👇 አሁን ይቀላቀሉ:",
    program_5: "🤝 *ወደ አጋር ፕሮግራም ይቀላቀሉ*\n\n💰 10% ኮሚሽን ያግኙ\n\n• ወኪሎች: ደንበኞችን ያመልክቱ\n• ነጋዴዎች: ፑሎች ይፍጠሩ\n• ድርጅቶች: ለአባላት ፑሎች\n\n👇 አሁን ያመልክቱ:",
    
    winners: "🏆 *የቅርብ ጊዜ አሸናፊዎች*\n\n",
    how_it_works: "📖 *እንዴት እንሳተፋለን?*\n\n1️⃣ ፕሮግራም ይምረጡ\n2️⃣ ደረጃዎን ይምረጡ\n3️⃣ መቀመጫ ይምረጡ\n4️⃣ ይክፈሉ እና ያሸንፉ! 🎉",
    support: "📞 *እኛን ያግኙ*\n\n📧 hundessanegassa@gmail.com\n📱 0930330323, 0913 277 922",
    tickets: "🎫 *ቲኬቶችዎ*\n\n",
    no_tickets: "📭 *ምንም ቲኬቶች የሉዎትም.*\n\nለመጀመር ፕሮግራም ይቀላቀሉ! 🎯",
    
    back: "🔙 ተመለስ",
    open_app: "🚀 መተግበሪያ ይክፈቱ",
    dashboard: "📊 ዳሽቦርድ",
    join_now: "🎯 አሁን ይቀላቀሉ",
    apply_now: "🤝 አሁን ያመልክቱ",
    view_winners: "🏆 አሸናፊዎችን ይመልከቱ"
  },
  
  om: {
    welcome: "🌟 *Gara Abbaa Carraatti Baga nagaan dhufte!*\n\n🏆 *Itoophiyaatti Dirree Badhaasaa Olaanaa*\n\n🚗 Konkoolataa mo'adhaa\n🏠 Mana mo'adhaa\n💰 Maallaqa 10M ETB hanga ta'u mo'adhaa\n🏭 Mashiniin mo'adhaa\n💻 Elektirooniksii mo'adhaa\n\n💚 *%2 Fayyaaf* Dhibamtoota Kalee & Onnee gargaara\n\n🎯 *Mo'achuuf qophi? Eegalaa!*",
    
    language_select: "🌐 *Afaan Filadhu*\n\nMaaloo afaan fedhitan filadha:",
    language_set: "✅ Afaan Afaan Oromootti jijjiirame! 🎉",
    
    ask_name: "📝 *Maqaa keessan guutuu maal?*\n\nMaaloo maqaa keessan guutuu galchaa:",
    ask_phone: "📱 *Lakkoofsa bilbilaa keessan maal?*\n\nFakkeenyaaf: 0912345678",
    name_received: "✅ Galatoomaa! Amma lakkoofsa bilbilaa keessan qoodadhaa:",
    phone_received: "✅ Galatoomaa! Profiiliin keessan xumurame! 🎉",
    
    main_menu: "👋 *Baga nagaan deebitan {name}!*\n\n🎯 *Filannoo armaan gadii keessaa filadhaa:*",
    
    programs: "🎯 *Tarkaanfiiwwan Abbaa Carraa*\n\n*Karaa mo'achuu keessan filadhaa:*\n\n1️⃣ 🚀 *Abbaa Carraa Appii Banuu*\nImala keessan amma eegalaa!\n\n2️⃣ 🏊 *Pooliiwwan Idilee*\n🚗 Konkoolataa • 🏠 Mana • 🏭 Mashiniin • 💻 Elektirooniksii\n💵 100 ETB irraa eegalaa\n\n3️⃣ 🏙️ *VIP Magaalaa*\n💰 Maallaqa 10M ETB hanga ta'u\n📅 Guyyaa • Torban • Ji'aa\n🎟️ Sadarkaa 5\n\n4️⃣ 🏪 *Merkato VIP*\n💰 Maallaqa 10M ETB hanga ta'u\n📅 Guyyaa • Torban • Ji'aa\n🎟️ Sadarkaa 5: Silver • Gold • Platinum • Diamond • Royal\n\n5️⃣ 🤝 *Tarkaanfii Hiriyaa*\n💰 10% Komishinii Argadhaa\n👥 Maamiltoota qoodadhaa • Pooliiwwan uumaa\n\n👇 *Tarkaanfii armaan gadii keessaa filadhaa:*",
    
    program_1: "🚀 *Abbaa Carraa Appii Banuu*\n\nImala mo'achuu keessan amma eegalaa!\n\n👇 Appii banuuf jalatti cuqaasaa:",
    program_2: "🏊 *Pooliiwwan Idilee itti hirmaadhaa*\n\n🚗 Konkoolataa mo'adhaa\n🏠 Mana mo'adhaa\n🏭 Mashiniin mo'adhaa\n💻 Elektirooniksii mo'adhaa\n\n💵 100 ETB irraa eegalaa\n🎁 Badhaasa ajaa'ibsiisaa!\n\n👇 Amma hirmaadhaa:",
    program_3: "🏙️ *VIP Magaalaa itti hirmaadhaa*\n\n📍 Magaalaa keessan keessatti mo'adhaa!\n💰 Maallaqa 10M ETB hanga ta'u\n📅 Guyyaa • Torban • Ji'aa\n🎟️ Sadarkaa 5\n\n👇 Amma hirmaadhaa:",
    program_4: "🏪 *Merkato VIP itti hirmaadhaa*\n\n💰 Maallaqa 10M ETB hanga ta'u\n📅 Guyyaa • Torban • Ji'aa\n🎟️ Sadarkaa 5\n\n👇 Amma hirmaadhaa:",
    program_5: "🤝 *Tarkaanfii Hiriyaa itti hirmaadhaa*\n\n💰 10% Komishinii Argadhaa\n\n• Wakiliitoota: Maamiltoota qoodadhaa\n• Vendooritoota: Pooliiwwan uumaa\n• Dhaabbattoonni: Pooliiwwan miseensonniif\n\n👇 Amma ibsaa:",
    
    winners: "🏆 *Mo'attoota Dhiyoo*\n\n",
    how_it_works: "📖 *Akkam Hojiirra Oola?*\n\n1️⃣ Tarkaanfii filadhaa\n2️⃣ Sadarkaa keessan filadhaa\n3️⃣ Teessoo filadhaa\n4️⃣ Kaffalaa fi mo'adhaa! 🎉",
    support: "📞 *Nu Qunnamuu*\n\n📧 hundessanegassa@gmail.com\n📱 0930330323, 0913 277 922",
    tickets: "🎫 *Tikkeetoota Keessan*\n\n",
    no_tickets: "📭 *Tikkeetii tokko hin qabdu.*\n\nTarkaanfii tokko itti argachuuf kennadhu! 🎯",
    
    back: "🔙 Deebi'i",
    open_app: "🚀 Appii Banuu",
    dashboard: "📊 Daashboorardii",
    join_now: "🎯 Amma hirmaadhu",
    apply_now: "🤝 Amma ibsi",
    view_winners: "🏆 Mo'attoota ilaali"
  }
};

// ============================================
// HELPERS
// ============================================
const userSessions = {};

async function getUserLanguage(userId) {
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
// BUILD MENUS
// ============================================
function buildMainMenu(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com';
  
  return {
    inline_keyboard: [
      [{ text: '🚀 ' + t.open_app, web_app: { url: appUrl } }],
      [{ text: '🏊 Regular Pools', callback_data: 'regular' }],
      [{ text: '🏙️ City VIP', callback_data: 'city' }],
      [{ text: '🏪 Merkato VIP', callback_data: 'merkato' }],
      [{ text: '🤝 Partner Program', callback_data: 'partner' }],
      [{ text: '🏆 Winners', callback_data: 'winners' }],
      [{ text: '📖 How It Works', callback_data: 'how' }],
      [{ text: '📞 Support', callback_data: 'support' }],
      [{ text: '📊 Dashboard', web_app: { url: `${appUrl}/dashboard` } }]
    ]
  };
}

function buildProgramMenu(lang, type) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com';
  
  const urls = {
    regular: '/listings',
    city: '/cities',
    merkato: '/merkato-vip',
    partner: '/register'
  };
  
  const buttonTexts = {
    regular: t.join_now,
    city: t.join_now,
    merkato: t.join_now,
    partner: t.apply_now
  };
  
  return {
    inline_keyboard: [
      [{ text: buttonTexts[type] || t.join_now, web_app: { url: `${appUrl}${urls[type]}` } }],
      [{ text: t.back, callback_data: 'menu' }]
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
      { command: 'start', description: '🚀 Start' },
      { command: 'menu', description: '📋 Main Menu' },
      { command: 'help', description: '📖 Help' },
      { command: 'mytickets', description: '🎫 My Tickets' }
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
  // START COMMAND - FULL FLOW
  // ============================================
  bot.start(async (ctx) => {
    const user = ctx.from;
    const userId = user.id;
    
    // Initialize session
    userSessions[userId] = { 
      step: 'language',  // First step: language selection
      data: {} 
    };
    
    // 1. Show Welcome Message
    await ctx.reply(TRANSLATIONS.en.welcome, { parse_mode: 'Markdown' });
    
    // 2. Show Language Selection
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
  // LANGUAGE SELECTION CALLBACK - CONTINUES FLOW
  // ============================================
  bot.action(/lang_(.+)/, async (ctx) => {
    const lang = ctx.match[1];
    const userId = ctx.from.id;
    const user = ctx.from;
    
    // Update language in database
    await updateUserLanguage(userId, lang);
    
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    // 1. Confirm language change
    await ctx.reply(t.language_set, { parse_mode: 'Markdown' });
    
    // 2. Update session to next step (ask_name)
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
    
    // 3. Ask for name
    await ctx.reply(t.ask_name, { parse_mode: 'Markdown' });
    
    await ctx.answerCbQuery();
  });

  // ============================================
  // HANDLE TEXT - NAME & PHONE
  // ============================================
  bot.on('text', async (ctx) => {
    const user = ctx.from;
    const userId = user.id;
    const text = ctx.message.text.trim();
    
    const session = userSessions[userId];
    
    // If no session or completed, show menu
    if (!session) {
      const lang = await getUserLanguage(userId);
      const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
      await ctx.reply(t.main_menu.replace('{name}', user.first_name || 'User'), {
        parse_mode: 'Markdown',
        reply_markup: buildMainMenu(lang)
      });
      return;
    }

    // STEP: Ask Name
    if (session.step === 'ask_name') {
      session.data.fullName = text;
      session.step = 'ask_phone';
      
      const lang = session.language || await getUserLanguage(userId);
      const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
      
      await ctx.reply(t.ask_phone, { parse_mode: 'Markdown' });
      return;
    }
    
    // STEP: Ask Phone
    if (session.step === 'ask_phone') {
      session.data.phone = text;
      session.step = 'complete';
      
      const lang = session.language || await getUserLanguage(userId);
      const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
      
      // Save user profile
      await saveUserProfile(
        userId,
        user.username,
        user.first_name,
        user.last_name,
        text,
        session.data.fullName
      );
      
      await ctx.reply(t.phone_received, { parse_mode: 'Markdown' });
      
      // Show programs immediately
      await showPrograms(ctx, userId, lang);
      
      // Clear session
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
    
    // Show main menu with programs
    await ctx.reply(t.main_menu.replace('{name}', name), {
      parse_mode: 'Markdown',
      reply_markup: buildMainMenu(lang)
    });
    
    // Show detailed program descriptions
    await ctx.reply(t.programs, {
      parse_mode: 'Markdown'
    });
  }

  // ============================================
  // PROGRAM CALLBACKS
  // ============================================
  bot.action('regular', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(t.program_2, {
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
      parse_mode: 'Markdown',
      reply_markup: buildProgramMenu(lang, 'merkato')
    });
    await ctx.answerCbQuery();
  });

  bot.action('partner', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(t.program_5, {
      parse_mode: 'Markdown',
      reply_markup: buildProgramMenu(lang, 'partner')
    });
    await ctx.answerCbQuery();
  });

  // ============================================
  // MENU CALLBACK
  // ============================================
  bot.action('menu', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const user = ctx.from;
    
    await ctx.editMessageText(t.main_menu.replace('{name}', user.first_name || 'User'), {
      parse_mode: 'Markdown',
      reply_markup: buildMainMenu(lang)
    });
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

      let text = t.winners;
      if (winners && winners.length > 0) {
        winners.forEach((w, i) => {
          text += `${i+1}. 🏆 ${w.title || 'Prize'} - ${w.prize_amount || 'N/A'}\n`;
        });
      } else {
        text += 'No winners yet. Be the first! 🎯';
      }
      
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.view_winners, web_app: { url: `${appUrl}/winners` } }],
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

  // ============================================
  // HOW IT WORKS CALLBACK
  // ============================================
  bot.action('how', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(t.how_it_works, {
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
  // SUPPORT CALLBACK
  // ============================================
  bot.action('support', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(t.support, {
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
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 Dashboard', web_app: { url: `${appUrl}/dashboard` } }],
            [{ text: t.back, callback_data: 'menu' }]
          ]
        }
      });
    } catch {
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
      `/help - This help\n\n` +
      `Need more help? Contact support.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.back, callback_data: 'menu' }]
          ]
        }
      }
    );
  });

  // ============================================
  // MENU COMMAND
  // ============================================
  bot.command('menu', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const user = ctx.from;
    
    await ctx.reply(t.main_menu.replace('{name}', user.first_name || 'User'), {
      parse_mode: 'Markdown',
      reply_markup: buildMainMenu(lang)
    });
  });
}

export default bot;
