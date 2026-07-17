// lib/bot.js - SIMPLIFIED & ATTRACTIVE TELEGRAM BOT
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
    welcome: "👋 *Welcome to Abbaa Carraa!*\n\n🏆 *Ethiopia's Premier Prize Platform*\n\nWin cars, houses, cash up to 10M ETB, and more!\n\n💚 *2% Supports* Kidney & Heart Patients\n\nLet's get started! 🚀",
    language_select: "🌐 *Choose Your Language*\n\nPlease select your preferred language:",
    language_set: "✅ Language set to English",
    ask_name: "📝 *What is your full name?*",
    ask_phone: "📱 *What is your phone number?*\n\nExample: 0912345678",
    name_received: "✅ Got it! What's your phone number?",
    phone_received: "✅ Thank you!",
    main_menu: "👋 *Welcome back, {name}!*\n\n🎯 *Choose an option below:*",
    
    programs: "🎯 *Abbaa Carraa Programs*\n\nChoose your path to winning:",
    
    program_1: "🏪 *Join Regular Pools*\n🚗 Cars • 🏠 Houses • 🏭 Machinery • 💻 Electronics\n\n💵 Entry from 100 ETB\n🎁 Win amazing prizes!",
    
    program_2: "🏙️ *Join City VIP*\n📍 Your City, Your Chance!\n\n💰 Win Cash up to 10M ETB\n📅 Daily • Weekly • Monthly Draws\n🎟️ 5 Tiers Available",
    
    program_3: "🏪 *Join Merkato VIP*\n💰 Win Cash up to 10M ETB\n\n📅 Daily • Weekly • Monthly Draws\n🎟️ 5 Tiers Available\n🥈 Silver • 🥇 Gold • 💎 Platinum • 💠 Diamond • 👑 Royal",
    
    program_4: "🤝 *Join Partner Program*\n\nEarn 10% Commission!\n\n• 🤝 Agents: Refer customers\n• 🏪 Vendors: Create pools\n• 🏢 Organizations: Member pools\n\nStart earning today! 💰",
    
    join_regular: "🎯 *Regular Pools*\n\n🚗 Win Cars\n🏠 Win Houses\n🏭 Win Machinery\n💻 Win Electronics\n\n💵 From 100 ETB\n\n👇 Join now:",
    join_city: "🎯 *City VIP*\n\n📍 Win in your city!\n💰 Up to 10M ETB\n📅 Daily/Weekly/Monthly\n\n👇 Join now:",
    join_merkato: "🎯 *Merkato VIP*\n\n💰 Up to 10M ETB\n📅 Daily/Weekly/Monthly\n🎟️ 5 Tiers\n\n👇 Join now:",
    join_partner: "🤝 *Partner Program*\n\n💰 Earn 10% Commission\n\n• Agents: Share referral link\n• Vendors: Create pools\n• Organizations: Member pools\n\n👇 Apply now:",
    
    winners: "🏆 *Recent Winners*",
    how_it_works: "📖 *How It Works*\n\n1️⃣ Choose a program\n2️⃣ Pick your tier\n3️⃣ Select seats\n4️⃣ Pay & win! 🎉",
    support: "📞 *Contact Support*\n\n📧 hundessanegassa@gmail.com\n📱 0930330323, 0913 277 922",
    tickets: "🎫 *Your Tickets*",
    no_tickets: "📭 No tickets yet.\n\nJoin a program to start winning! 🎯",
    
    back: "🔙 Back",
    open_app: "🚀 Open App",
    dashboard: "📊 Dashboard",
    register: "📝 Register",
    join_now: "🎯 Join Now",
    apply_now: "🤝 Apply Now"
  },
  
  am: {
    welcome: "👋 *እንኳን ወደ Abbaa Carraa በደህና መጡ!*\n\n🏆 *የኢትዮጵያ ቀዳሚ የሽልማት መድረክ*\n\nመኪና፣ ቤት፣ እስከ 10M ብር እና ሌሎች ያሸንፉ!\n\n💚 *2% ለጤና* የኩላሊት እና የልብ ህመምተኞችን ይደግፋል\n\nእንጀምር! 🚀",
    language_select: "🌐 *ቋንቋዎን ይምረጡ*\n\nእባክዎ የሚመርጡትን ቋንቋ ይምረጡ:",
    language_set: "✅ ቋንቋ ወደ አማርኛ ተቀይሯል",
    ask_name: "📝 *ሙሉ ስምዎ ምንድነው?*",
    ask_phone: "📱 *ስልክ ቁጥርዎ ምንድነው?*\n\nለምሳሌ: 0912345678",
    name_received: "✅ እናመሰግናለን! ስልክ ቁጥርዎ ምንድነው?",
    phone_received: "✅ እናመሰግናለን!",
    main_menu: "👋 *እንኳን ደህና መጡ, {name}!*\n\n🎯 *ከታች ያለውን ይምረጡ:*",
    
    programs: "🎯 *የአባካራ ፕሮግራሞች*\n\nየማሸነፍ መንገድዎን ይምረጡ:",
    
    program_1: "🏪 *መደበኛ የእጣ መደቦች*\n🚗 መኪና • 🏠 ቤት • 🏭 ማሽነሪ • 💻 ኤሌክትሮኒክስ\n\n💵 ከ100 ብር ጀምሮ\n🎁 አስደናቂ ሽልማቶችን ያሸንፉ!",
    
    program_2: "🏙️ *የከተማ ቪአይፒ*\n📍 ከተማዎ, እድልዎ!\n\n💰 እስከ 10M ብር ጥሬ ገንዘብ\n📅 ዕለታዊ • ሳምንታዊ • ወርሃዊ እጣዎች\n🎟️ 5 ደረጃዎች",
    
    program_3: "🏪 *መርካቶ ቪአይፒ*\n💰 እስከ 10M ብር ጥሬ ገንዘብ\n\n📅 ዕለታዊ • ሳምንታዊ • ወርሃዊ እጣዎች\n🎟️ 5 ደረጃዎች\n🥈 ብር • 🥇 ወርቅ • 💎 ፕላቲኒየም • 💠 አልማዝ • 👑 ንጉሣዊ",
    
    program_4: "🤝 *የአጋር ፕሮግራም*\n\n10% ኮሚሽን ያግኙ!\n\n• 🤝 ወኪሎች: ደንበኞችን ያመልክቱ\n• 🏪 ነጋዴዎች: ፑሎች ይፍጠሩ\n• 🏢 ድርጅቶች: ለአባላት ፑሎች\n\nዛሬ ማግኘት ይጀምሩ! 💰",
    
    join_regular: "🎯 *መደበኛ የእጣ መደቦች*\n\n🚗 መኪናዎች ያሸንፉ\n🏠 ቤቶች ያሸንፉ\n🏭 ማሽነሪዎች ያሸንፉ\n💻 ኤሌክትሮኒክስ ያሸንፉ\n\n💵 ከ100 ብር ጀምሮ\n\n👇 አሁን ይቀላቀሉ:",
    join_city: "🎯 *የከተማ ቪአይፒ*\n\n📍 በከተማዎ ያሸንፉ!\n💰 እስከ 10M ብር\n📅 ዕለታዊ/ሳምንታዊ/ወርሃዊ\n\n👇 አሁን ይቀላቀሉ:",
    join_merkato: "🎯 *መርካቶ ቪአይፒ*\n\n💰 እስከ 10M ብር\n📅 ዕለታዊ/ሳምንታዊ/ወርሃዊ\n🎟️ 5 ደረጃዎች\n\n👇 አሁን ይቀላቀሉ:",
    join_partner: "🤝 *የአጋር ፕሮግራም*\n\n💰 10% ኮሚሽን ያግኙ\n\n• ወኪሎች: ሪፈራል ሊንክ ያጋሩ\n• ነጋዴዎች: ፑሎች ይፍጠሩ\n• ድርጅቶች: ለአባላት ፑሎች\n\n👇 አሁን ያመልክቱ:",
    
    winners: "🏆 *የቅርብ ጊዜ አሸናፊዎች*",
    how_it_works: "📖 *እንዴት እንሳተፋለን?*\n\n1️⃣ ፕሮግራም ይምረጡ\n2️⃣ ደረጃዎን ይምረጡ\n3️⃣ መቀመጫ ይምረጡ\n4️⃣ ይክፈሉ እና ያሸንፉ! 🎉",
    support: "📞 *እኛን ያግኙ*\n\n📧 hundessanegassa@gmail.com\n📱 0930330323, 0913 277 922",
    tickets: "🎫 *ቲኬቶችዎ*",
    no_tickets: "📭 ምንም ቲኬቶች የሉዎትም.\n\nለመጀመር ፕሮግራም ይቀላቀሉ! 🎯",
    
    back: "🔙 ተመለስ",
    open_app: "🚀 መተግበሪያ ይክፈቱ",
    dashboard: "📊 ዳሽቦርድ",
    register: "📝 ይመዝገቡ",
    join_now: "🎯 አሁን ይቀላቀሉ",
    apply_now: "🤝 አሁን ያመልክቱ"
  },
  
  om: {
    welcome: "👋 *Gara Abbaa Carraatti Baga nagaan dhufte!*\n\n🏆 *Itoophiyaatti Dirree Badhaasaa Olaanaa*\n\nKonkoolataa, Mana, Maallaqa 10M ETB hanga ta'u fi kan biroo mo'adhaa!\n\n💚 *%2 Fayyaaf* Dhibamtoota Kalee & Onnee gargaara\n\nEegalaa! 🚀",
    language_select: "🌐 *Afaan Filadhu*\n\nMaaloo afaan fedhitan filadha:",
    language_set: "✅ Afaan Afaan Oromootti jijjiirame",
    ask_name: "📝 *Maqaa keessan guutuu maal?*",
    ask_phone: "📱 *Lakkoofsa bilbilaa keessan maal?*\n\nFakkeenyaaf: 0912345678",
    name_received: "✅ Galatoomaa! Lakkoofsa bilbilaa keessan maal?",
    phone_received: "✅ Galatoomaa!",
    main_menu: "👋 *Baga nagaan deebitan, {name}!*\n\n🎯 *Filannoo armaan gadii keessaa filadhaa:*",
    
    programs: "🎯 *Tarkaanfiiwwan Abbaa Carraa*\n\nKaraa mo'achuu keessan filadhaa:",
    
    program_1: "🏪 *Pooliiwwan Idilee*\n🚗 Konkoolataa • 🏠 Mana • 🏭 Mashiniin • 💻 Elektirooniksii\n\n💵 100 ETB irraa eegalaa\n🎁 Badhaasa ajaa'ibsiisaa mo'adhaa!",
    
    program_2: "🏙️ *VIP Magaalaa*\n📍 Magaalaa keessan, Carraa keessan!\n\n💰 Maallaqa 10M ETB hanga ta'u\n📅 Guyyaa • Torban • Ji'aa Qodaa\n🎟️ Sadarkaa 5 ni argamu",
    
    program_3: "🏪 *Merkato VIP*\n💰 Maallaqa 10M ETB hanga ta'u\n\n📅 Guyyaa • Torban • Ji'aa Qodaa\n🎟️ Sadarkaa 5 ni argamu\n🥈 Silver • 🥇 Gold • 💎 Platinum • 💠 Diamond • 👑 Royal",
    
    program_4: "🤝 *Tarkaanfii Hiriyaa*\n\n10% Komishinii Argadhaa!\n\n• 🤝 Wakiliitoota: Maamiltoota qoodadhaa\n• 🏪 Vendooritoota: Pooliiwwan uumaa\n• 🏢 Dhaabbattoonni: Pooliiwwan miseensonniif\n\nAmma argachuu eegalaa! 💰",
    
    join_regular: "🎯 *Pooliiwwan Idilee*\n\n🚗 Konkoolataa mo'adhaa\n🏠 Mana mo'adhaa\n🏭 Mashiniin mo'adhaa\n💻 Elektirooniksii mo'adhaa\n\n💵 100 ETB irraa eegalaa\n\n👇 Amma hirmaadhaa:",
    join_city: "🎯 *VIP Magaalaa*\n\n📍 Magaalaa keessan keessatti mo'adhaa!\n💰 10M ETB hanga ta'u\n📅 Guyyaa/Torban/Ji'aa\n\n👇 Amma hirmaadhaa:",
    join_merkato: "🎯 *Merkato VIP*\n\n💰 10M ETB hanga ta'u\n📅 Guyyaa/Torban/Ji'aa\n🎟️ Sadarkaa 5\n\n👇 Amma hirmaadhaa:",
    join_partner: "🤝 *Tarkaanfii Hiriyaa*\n\n💰 10% Komishinii Argadhaa\n\n• Wakiliitoota: Liinkii qoodadhaa\n• Vendooritoota: Pooliiwwan uumaa\n• Dhaabbattoonni: Pooliiwwan miseensonniif\n\n👇 Amma ibsaa:",
    
    winners: "🏆 *Mo'attoota Dhiyoo*",
    how_it_works: "📖 *Akkam Hojiirra Oola?*\n\n1️⃣ Tarkaanfii filadhaa\n2️⃣ Sadarkaa keessan filadhaa\n3️⃣ Teessoo filadhaa\n4️⃣ Kaffalaa fi mo'adhaa! 🎉",
    support: "📞 *Nu Qunnamuu*\n\n📧 hundessanegassa@gmail.com\n📱 0930330323, 0913 277 922",
    tickets: "🎫 *Tikkeetoota Keessan*",
    no_tickets: "📭 Tikkeetii tokko hin qabdu.\n\nTarkaanfii tokko itti argachuuf kennadhu! 🎯",
    
    back: "🔙 Deebi'i",
    open_app: "🚀 Appii Banuu",
    dashboard: "📊 Daashboorardii",
    register: "📝 Galmaa'i",
    join_now: "🎯 Amma hirmaadhu",
    apply_now: "🤝 Amma ibsi"
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
  } catch {}
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
      [{ text: '🏪 Regular Pools', callback_data: 'regular' }],
      [{ text: '🏙️ City VIP', callback_data: 'city' }],
      [{ text: '🏪 Merkato VIP', callback_data: 'merkato' }],
      [{ text: '🤝 Partner Program', callback_data: 'partner' }],
      [{ text: '🏆 Winners', callback_data: 'winners' }],
      [{ text: '📖 How It Works', callback_data: 'how' }],
      [{ text: '📞 Support', callback_data: 'support' }],
      [{ text: '🚀 Open App', web_app: { url: appUrl } }],
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
  
  return {
    inline_keyboard: [
      [{ text: t.join_now, web_app: { url: `${appUrl}${urls[type]}` } }],
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
  // START COMMAND
  // ============================================
  bot.start(async (ctx) => {
    const user = ctx.from;
    const userId = user.id;
    
    userSessions[userId] = { step: 'ask_name', data: {} };
    
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    // 1. Welcome with description
    await ctx.reply(t.welcome, { parse_mode: 'Markdown' });
    
    // 2. Language selection
    await ctx.reply(t.language_select, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🇬🇧 English', callback_data: 'lang_en' }],
          [{ text: '🇪🇹 አማርኛ', callback_data: 'lang_am' }],
          [{ text: '🌍 Afaan Oromo', callback_data: 'lang_om' }]
        ]
      }
    });
    
    // 3. Ask name
    await ctx.reply(t.ask_name, { parse_mode: 'Markdown' });
  });

  // ============================================
  // LANGUAGE SELECTION
  // ============================================
  bot.action(/lang_(.+)/, async (ctx) => {
    const lang = ctx.match[1];
    const userId = ctx.from.id;
    
    await updateUserLanguage(userId, lang);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.reply(t.language_set, { parse_mode: 'Markdown' });
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
    if (!session) {
      const lang = await getUserLanguage(userId);
      const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
      await ctx.reply(t.main_menu.replace('{name}', user.first_name || 'User'), {
        parse_mode: 'Markdown',
        reply_markup: buildMainMenu(lang)
      });
      return;
    }

    if (session.step === 'ask_name') {
      session.data.fullName = text;
      session.step = 'ask_phone';
      
      const lang = await getUserLanguage(userId);
      const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
      await ctx.reply(t.ask_phone, { parse_mode: 'Markdown' });
      return;
    }
    
    if (session.step === 'ask_phone') {
      session.data.phone = text;
      session.step = 'complete';
      
      await saveUserProfile(
        userId,
        user.username,
        user.first_name,
        user.last_name,
        text,
        session.data.fullName
      );
      
      delete userSessions[userId];
      
      const lang = await getUserLanguage(userId);
      const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
      
      await ctx.reply(t.phone_received, { parse_mode: 'Markdown' });
      
      // Show programs immediately
      await showPrograms(ctx, userId);
    }
  });

  // ============================================
  // SHOW PROGRAMS
  // ============================================
  async function showPrograms(ctx, userId) {
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const user = ctx.from;
    const name = user?.first_name || 'User';
    
    // Main menu with programs
    await ctx.reply(t.main_menu.replace('{name}', name), {
      parse_mode: 'Markdown',
      reply_markup: buildMainMenu(lang)
    });
    
    // Show program descriptions
    await ctx.reply(
      `🎯 *Programs*\n\n` +
      `${t.program_1}\n\n` +
      `${t.program_2}\n\n` +
      `${t.program_3}\n\n` +
      `${t.program_4}`,
      { parse_mode: 'Markdown' }
    );
  }

  // ============================================
  // PROGRAM CALLBACKS
  // ============================================
  bot.action('regular', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(t.join_regular, {
      parse_mode: 'Markdown',
      reply_markup: buildProgramMenu(lang, 'regular')
    });
    await ctx.answerCbQuery();
  });

  bot.action('city', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(t.join_city, {
      parse_mode: 'Markdown',
      reply_markup: buildProgramMenu(lang, 'city')
    });
    await ctx.answerCbQuery();
  });

  bot.action('merkato', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(t.join_merkato, {
      parse_mode: 'Markdown',
      reply_markup: buildProgramMenu(lang, 'merkato')
    });
    await ctx.answerCbQuery();
  });

  bot.action('partner', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(t.join_partner, {
      parse_mode: 'Markdown',
      reply_markup: buildProgramMenu(lang, 'partner')
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
    
    await ctx.editMessageText(t.main_menu.replace('{name}', user.first_name || 'User'), {
      parse_mode: 'Markdown',
      reply_markup: buildMainMenu(lang)
    });
    await ctx.answerCbQuery();
  });

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

      let text = t.winners + '\n\n';
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
            [{ text: '🏆 Hall of Fame', web_app: { url: `${appUrl}/winners` } }],
            [{ text: '🔙 Back', callback_data: 'menu' }]
          ]
        }
      });
    } catch {
      await ctx.editMessageText('⚠️ Failed to load winners.', {
        reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'menu' }]] }
      });
    }
    await ctx.answerCbQuery();
  });

  bot.action('how', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(t.how_it_works, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Back', callback_data: 'menu' }]
        ]
      }
    });
    await ctx.answerCbQuery();
  });

  bot.action('support', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.editMessageText(t.support, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Back', callback_data: 'menu' }]
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

      let message = t.tickets + '\n\n';
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
            [{ text: '📊 View All', web_app: { url: `${appUrl}/dashboard` } }],
            [{ text: '📋 Menu', callback_data: 'menu' }]
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
            [{ text: '📋 Menu', callback_data: 'menu' }]
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
