// lib/bot.js - COMPLETE FIXED WITH TELEGRAM LOGIN
import { Telegraf } from 'telegraf';
import { supabase } from './supabase';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN not set. Bot features will not work.');
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
    programs: "🎯 *Abbaa Carraa Programs*\n\n*Choose your winning path:*\n\n1️⃣ 🚀 *Open Abbaa Carraa App*\nStart your journey now!\n\n2️⃣ 🏊 *Regular Pools*\n🚗 Cars • 🏠 Houses • 🏭 Machinery • 💻 Electronics\n💵 From 100 ETB\n\n3️⃣ 🏙️ *City VIP*\n💰 Win Cash up to 10M ETB\n📅 Daily • Weekly • Monthly Draws\n🎟️ 5 Tiers Available\n\n4️⃣ 🏪 *Merkato VIP*\n💰 Win Cash up to 10M ETB\n📅 Daily • Weekly • Monthly Draws\n🎟️ 5 Tiers Available\n\n5️⃣ 🤝 *Partner Program*\n💰 Earn 10% Commission\n👥 Refer customers • Create pools",
    program_1: "🚀 *Open Abbaa Carraa App*\n\nStart your winning journey now!\n\n👇 Click below to open the app:",
    program_2: "🏊 *Join Regular Pools*\n\n🚗 Win Cars\n🏠 Win Houses\n🏭 Win Machinery\n💻 Win Electronics\n\n💵 Entry from 100 ETB\n🎁 Amazing prizes await!",
    program_3: "🏙️ *Join City VIP*\n\n📍 Win in your city!\n💰 Up to 10M ETB Cash\n📅 Daily • Weekly • Monthly\n🎟️ 5 Tiers",
    program_4: "🏪 *Join Merkato VIP*\n\n💰 Up to 10M ETB Cash\n📅 Daily • Weekly • Monthly\n🎟️ 5 Tiers: Silver • Gold • Platinum • Diamond • Royal",
    program_5: "🤝 *Join Partner Program*\n\n💰 Earn 10% Commission\n\n• Agents: Refer customers\n• Vendors: Create pools\n• Organizations: Member pools",
    winners: "🏆 *Recent Winners*",
    no_winners: "No winners yet. Be the first! 🎯",
    how_it_works: "📖 *How It Works*\n\n1️⃣ Choose a program\n2️⃣ Pick your tier\n3️⃣ Select seats\n4️⃣ Pay & win! 🎉",
    support: "📞 *Contact Support*\n\n📧 hundessanegassa@gmail.com\n📱 0930330323, 0913 277 922",
    tickets: "🎫 *Your Tickets*",
    no_tickets: "📭 *No tickets yet.*\n\nJoin a program to start winning! 🎯",
    back: "🔙 Back",
    open_app: "🚀 Open App",
    dashboard: "📊 Dashboard",
    join_now: "🎯 Join Now",
    apply_now: "🤝 Apply Now",
    view_winners: "🏆 View Winners",
    login_success: "✅ *Login Successful!*\n\nWelcome {name}! 🎉\n\n🔐 Your session is ready!\n\nClick the button below to return to the app:",
    return_to_app: "🚀 Return to App",
    login_button: "🔐 Login to Abbaa Carraa",
    login_message: "🔐 *Login to Abbaa Carraa*\n\nClick the button below to login:"
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
    programs: "🎯 *የAbbaa Carraa ፕሮግራሞች*\n\n*የማሸነፍ መንገድዎን ይምረጡ:*\n\n1️⃣ 🚀 *Abbaa Carraa መተግበሪያ ይክፈቱ*\nጉዞዎን አሁን ይጀምሩ!\n\n2️⃣ 🏊 *መደበኛ የእጣ መደቦች*\n🚗 መኪና • 🏠 ቤት • 🏭 ማሽነሪ • 💻 ኤሌክትሮኒክስ\n💵 ከ100 ብር ጀምሮ\n\n3️⃣ 🏙️ *የከተማ ቪአይፒ*\n💰 እስከ 10M ብር ጥሬ ገንዘብ\n📅 ዕለታዊ • ሳምንታዊ • ወርሃዊ\n🎟️ 5 ደረጃዎች\n\n4️⃣ 🏪 *መርካቶ ቪአይፒ*\n💰 እስከ 10M ብር ጥሬ ገንዘብ\n📅 ዕለታዊ • ሳምንታዊ • ወርሃዊ\n🎟️ 5 ደረጃዎች\n\n5️⃣ 🤝 *የአጋር ፕሮግራም*\n💰 10% ኮሚሽን ያግኙ\n👥 ደንበኞችን ያመልክቱ • ፑሎች ይፍጠሩ",
    program_1: "🚀 *Abbaa Carraa መተግበሪያ ይክፈቱ*\n\nየማሸነፍ ጉዞዎን አሁን ይጀምሩ!\n\n👇 መተግበሪያውን ለመክፈት ከታች ይጫኑ:",
    program_2: "🏊 *ወደ መደበኛ የእጣ መደቦች ይቀላቀሉ*\n\n🚗 መኪናዎች ያሸንፉ\n🏠 ቤቶች ያሸንፉ\n🏭 ማሽነሪዎች ያሸንፉ\n💻 ኤሌክትሮኒክስ ያሸንፉ\n\n💵 ከ100 ብር ጀምሮ\n🎁 አስደናቂ ሽልማቶች!",
    program_3: "🏙️ *ወደ ከተማ ቪአይፒ ይቀላቀሉ*\n\n📍 በከተማዎ ያሸንፉ!\n💰 እስከ 10M ብር ጥሬ ገንዘብ\n📅 ዕለታዊ • ሳምንታዊ • ወርሃዊ\n🎟️ 5 ደረጃዎች",
    program_4: "🏪 *ወደ መርካቶ ቪአይፒ ይቀላቀሉ*\n\n💰 እስከ 10M ብር ጥሬ ገንዘብ\n📅 ዕለታዊ • ሳምንታዊ • ወርሃዊ\n🎟️ 5 ደረጃዎች",
    program_5: "🤝 *ወደ አጋር ፕሮግራም ይቀላቀሉ*\n\n💰 10% ኮሚሽን ያግኙ\n\n• ወኪሎች: ደንበኞችን ያመልክቱ\n• ነጋዴዎች: የእጣ መደቦች ይፍጠሩ\n• ድርጅቶች: ለአባላት የእጣ መደቦች ይፍጠሩ",
    winners: "🏆 *የቅርብ ጊዜ አሸናፊዎች*",
    no_winners: "ምንም አሸናፊዎች የሉም። የመጀመሪያው ይሁኑ! 🎯",
    how_it_works: "📖 *እንዴት እንሳተፋለን?*\n\n1️⃣ ፕሮግራም ይምረጡ\n2️⃣ ደረጃዎን ይምረጡ\n3️⃣ መቀመጫ ይምረጡ\n4️⃣ ይክፈሉ እና ያሸንፉ! 🎉",
    support: "📞 *እኛን ያግኙ*\n\n📧 hundessanegassa@gmail.com\n📱 0930330323, 0913 277 922",
    tickets: "🎫 *ቲኬቶችዎ*",
    no_tickets: "📭 *ምንም ቲኬቶች የሉዎትም.*\n\nለመጀመር ፕሮግራም ይቀላቀሉ! 🎯",
    back: "🔙 ተመለስ",
    open_app: "🚀 መተግበሪያ ይክፈቱ",
    dashboard: "📊 ዳሽቦርድ",
    join_now: "🎯 አሁን ይቀላቀሉ",
    apply_now: "🤝 አሁን ያመልክቱ",
    view_winners: "🏆 አሸናፊዎችን ይመልከቱ",
    login_success: "✅ *መግቢያ ተሳክቷል!*\n\nእንኳን ደህና መጡ {name}! 🎉\n\n🔐 ክፍለ ጊዜዎ ዝግጁ ነው!\n\nመተግበሪያውን ለመክፈት ከታች ያለውን ቁልፍ ይጫኑ:",
    return_to_app: "🚀 ወደ መተግበሪያ ተመለስ",
    login_button: "🔐 ወደ Abbaa Carraa ይግቡ",
    login_message: "🔐 *ወደ Abbaa Carraa ይግቡ*\n\nለመግቢያ ከታች ያለውን ቁልፍ ይጫኑ:"
  },

  om: {
    welcome: "🌟 *Gara Abbaa Carraatti Baga nagaan dhufte!*\n\n🏆 *Itoophiyaatti Dirree Badhaasaa Olaanaa*\n\n🚗 Konkoolataa mo'adhaa\n🏠 Mana mo'adhaa\n💰 Maallaqa hanga miliyoona 10ti mo'adhaa\n🏭 Mashinoota mo'adhaa\n💻 Elektirooniksoota adda addaa mo'adhaa\n\n💚 *%2 Fayyaaf* Dhibamtoota Kalee fi Onnee gargaara\n\n🎯 *Mo'achuuf qophii? Eegalaa!*",
    language_select: "🌐 *Afaan Filadhu*\n\nMaaloo afaan fetaan filadha:",
    language_set: "✅ Afaan Afaan Oromootti jijjiirame! 🎉",
    ask_name: "📝 *Maqaa keessan guutuu galchaa?*\n\nMaaloo maqaa keessan guutuu galchaa:",
    ask_phone: "📱 *Lakkoofsa bilbilaa keessan galchaa?*\n\nFakkeenyaaf: 0912345678",
    name_received: "✅ Galatoomaa! Amma lakkoofsa bilbilaa keessan qoodadhaa:",
    phone_received: "✅ Galatoomaa! Profiiliin keessan xumurame! 🎉",
    main_menu: "👋 *Baga nagaan deebitan {name}!*\n\n🎯 *Filannoo armaan gadii keessaa filadhaa:*",
    programs: "🎯 *Tarkaanfiiwwan Abbaa Carraa*\n\n*Karaa mo'achuu keessan filadhaa:*\n\n1️⃣ 🚀 *Appii Abbaa Carraa Bani*\nImala keessan amma eegalaa!\n\n2️⃣ 🏊 *Carraawaan Idilee*\n🚗 Konkoolataa • 🏠 Mana • 🏭 Mashinoota • 💻 Elektirooniksoota gara garaa\n💵 100 ETB irraa eegalaa\n\n3️⃣ 🏙️ *VIP Magaalaa*\n💰 Maallaqa 10M ETB hanga ta'u\n📅 Guyyaa • Torban • Ji'aa\n🎟️ Sadarkaa 5\n\n4️⃣ 🏪 *Merkato VIP*\n💰 Maallaqa 10M ETB hanga ta'u\n📅 Guyyaa • Torban • Ji'aa\n🎟️ Sadarkaa 5\n\n5️⃣ 🤝 *Tarkaanfii partinaaraa*\n💰 10% Komishinii Argadhaa\n👥 Maamiltoota qoodadhaa • Carraa Idilee uumaa",
    program_1: "🚀 *Appii Abbaa Carraa Bani*\n\nImala mo'achuu keessan amma eegalaa!\n\n👇 Appii banuuf jalatti cuqaasaa:",
    program_2: "🏊 *Carraawwaan Idilee itti hirmaadhaa*\n\n🚗 Konkoolataa mo'adhaa\n🏠 Mana mo'adhaa\n🏭 Mashinoota mo'adhaa\n💻 Elektirooniksoota gara garaa mo'adhaa\n\n💵 100 ETB irraa eegalaa\n🎁 Badhaasa ajaa'ibsiisaa!",
    program_3: "🏙️ *VIP Magaalaa itti hirmaadhaa*\n\n📍 Magaalaa keessan keessatti mo'adhaa!\n💰 Maallaqa 10M ETB hanga ta'u\n📅 Guyyaa • Torban • Ji'aa\n🎟️ Sadarkaa 5",
    program_4: "🏪 *Merkato VIP itti hirmaadhaa*\n\n💰 Maallaqa 10M ETB hanga ta'u\n📅 Guyyaa • Torban • Ji'aa\n🎟️ Sadarkaa 5",
    program_5: "🤝 *Tarkaanfii paartinaraa itti hirmaadhaa*\n\n💰 10% Komishinii Argadhaa\n\n• Bakka Bu'oota: Maamiltoota qoodadhaa\n• Dhiyeestoota: Carraawwaan idilee uumaa\n• Dhaabbattoonni: Carraa Idilee miseensotaaf uuma",
    winners: "🏆 *Mo'attoota Dhiyoo*",
    no_winners: "Mo'attoon dhiyoo hin jiru. Isa jalqabaa ta'aa! 🎯",
    how_it_works: "📖 *Abbaa Carraa Akkam Hojiirra Oola?*\n\n1️⃣ Tarkaanfii filadhaa\n2️⃣ Sadarkaa keessan filadhaa\n3️⃣ Teessoo filadhaa\n4️⃣ Kaffalaa ti mo'adhaa! 🎉",
    support: "📞 *Nu Qunnamuu*\n\n📧 hundessanegassa@gmail.com\n📱 0930330323, 0913 277 922",
    tickets: "🎫 *Tikkeetoota Keessan*",
    no_tickets: "📭 *Tikkeetii tokko hin qabdu.*\n\nTarkaanfii tokko itti argachuuf hirmaadhu! 🎯",
    back: "🔙 Deebi'i",
    open_app: "🚀 Appii Bani",
    dashboard: "📊 Daashboorardii koo",
    join_now: "🎯 Amma hirmaadhu",
    apply_now: "🤝 Amma dorgomi",
    view_winners: "🏆 Mo'attoota ilaali",
    login_success: "✅ *Galmaa'iin Milkaa'e!*\n\nBaga nagaan dhufte {name}! 🎉\n\n🔐 Gaheessaan keessan qophii dha!\n\nAppii banuuf jalatti cuqaasaa:",
    return_to_app: "🚀 Gara Appii Deebi'i",
    login_button: "🔐 Gara Abbaa Carraa Galmaa'i",
    login_message: "🔐 *Gara Abbaa Carraa Galmaa'i*\n\nGalmaa'uuf jalatti cuqaasaa:"
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
      { command: 'mytickets', description: '🎫 My Tickets' },
      { command: 'login', description: '🔐 Login to Abbaa Carraa' }
    ]);
    console.log('✅ Bot commands set');
  } catch (error) {
    console.error('❌ Failed to set commands:', error);
  }
}

// ============================================
// HANDLE LOGIN COMMAND
// ============================================
async function handleLoginFlow(ctx) {
  const user = ctx.from;
  const userId = user.id;
  const lang = await getUserLanguage(userId);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  try {
    // Generate a secure login token
    const loginToken = Buffer.from(JSON.stringify({
      userId: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      timestamp: Date.now(),
      expires: Date.now() + 300000 // 5 minutes expiry
    })).toString('base64');
    
    // Store the token temporarily
    const { error } = await supabase
      .from('login_tokens')
      .insert({
        token: loginToken,
        telegram_id: user.id,
        username: user.username || null,
        first_name: user.first_name || null,
        last_name: user.last_name || null,
        expires_at: new Date(Date.now() + 300000).toISOString()
      });
    
    if (error) {
      console.error('Error storing login token:', error);
      await ctx.reply('⚠️ Login failed. Please try again.');
      return;
    }
    
    // Send login success message with deep link back to app
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com';
    
    await ctx.reply(
      t.login_success.replace('{name}', user.first_name || 'User'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ 
              text: t.return_to_app, 
              url: `${appUrl}/auth/callback?token=${loginToken}&telegram_id=${user.id}`
            }]
          ]
        }
      }
    );
    
  } catch (error) {
    console.error('Login error:', error);
    await ctx.reply('⚠️ Login failed. Please try again.');
  }
}

// ============================================
// START COMMAND - WITH LOGIN HANDLING
// ============================================
bot.start(async (ctx) => {
  const user = ctx.from;
  const userId = user.id;
  
  // ✅ Check if this is a login request
  const startPayload = ctx.payload; // Value after ?start= in the link
  console.log('📱 Start payload:', startPayload);
  
  // Check for login in multiple ways
  const isLogin = startPayload === 'login' || 
                  startPayload?.startsWith('login') ||
                  startPayload?.includes('login');
  
  if (isLogin) {
    console.log('🔐 Login request detected!');
    await handleLoginFlow(ctx);
    return;
  }
  
  // ============================================
  // NORMAL START FLOW (Existing code)
  // ============================================
  
  // Initialize session
  userSessions[userId] = { 
    step: 'language',
    data: {} 
  };
  
  // 1. Welcome Message
  await ctx.reply(TRANSLATIONS.en.welcome, { parse_mode: 'Markdown' });
  
  // 2. Language Selection
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
// LOGIN COMMAND
// ============================================
bot.command('login', async (ctx) => {
  console.log('🔐 /login command received');
  await handleLoginFlow(ctx);
});

// ============================================
// LANGUAGE SELECTION CALLBACK
// ============================================
bot.action(/lang_(.+)/, async (ctx) => {
  const lang = ctx.match[1];
  const userId = ctx.from.id;
  
  await updateUserLanguage(userId, lang);
  
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  // 1. Language confirmed
  await ctx.reply(t.language_set, { parse_mode: 'Markdown' });
  
  // 2. Update session
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
  
  if (!session) {
    const lang = await getUserLanguage(userId);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    await ctx.reply(t.main_menu.replace('{name}', user.first_name || 'User'), {
      parse_mode: 'Markdown'
    });
    await ctx.reply('👇 *Choose an option below:*', {
      parse_mode: 'Markdown',
      reply_markup: buildMainMenu(lang)
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
  
  await ctx.reply(t.main_menu.replace('{name}', name), {
    parse_mode: 'Markdown'
  });
  
  await ctx.reply(t.programs, {
    parse_mode: 'Markdown'
  });
  
  await ctx.reply('👇 *Select a program below:*', {
    parse_mode: 'Markdown',
    reply_markup: buildMainMenu(lang)
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
  
  await ctx.editMessageText(t.program_5, {
    parse_mode: 'Markdown'
  });
  
  await ctx.reply('👇 *Apply now:*', {
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
    parse_mode: 'Markdown'
  });
  
  await ctx.reply('👇 *Choose an option below:*', {
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

    let text = t.winners;
    if (winners && winners.length > 0) {
      winners.forEach((w, i) => {
        text += `${i+1}. 🏆 ${w.title || 'Prize'} - ${w.prize_amount || 'N/A'}\n`;
      });
    } else {
      text += t.no_winners;
    }
    
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown'
    });
    
    await ctx.reply('👇 *View all winners:*', {
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

bot.action('how', async (ctx) => {
  const userId = ctx.from.id;
  const lang = await getUserLanguage(userId);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  await ctx.editMessageText(t.how_it_works, {
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
  
  await ctx.editMessageText(t.support, {
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
      parse_mode: 'Markdown'
    });
    
    await ctx.reply('👇 *View all tickets:*', {
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
    `/login - Login to Abbaa Carraa\n` +
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
  
  await ctx.reply(t.main_menu.replace('{name}', user.first_name || 'User'), {
    parse_mode: 'Markdown'
  });
  
  await ctx.reply('👇 *Choose an option below:*', {
    parse_mode: 'Markdown',
    reply_markup: buildMainMenu(lang)
  });
});

export default bot;
