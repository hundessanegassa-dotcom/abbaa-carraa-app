// lib/bot.js - COMPLETE TELEGRAM BOT WITH PARTNER PROGRAM SUPPORT
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
  // ... (Keep all existing translations from previous version)
  // I'll show the new partner-related translations below
};

// ============================================
// NEW PARTNER TRANSLATIONS
// ============================================
const PARTNER_TRANSLATIONS = {
  en: {
    partner_menu: "🤝 *Partner Menu*\n\nWelcome {name}! You are registered as a {role}.\n\nChoose an option below:",
    agent_dashboard: "🤝 *Agent Dashboard*\n\n📊 Your Stats:\n• Total Referrals: {referrals}\n• Total Commission: ETB {commission}\n• Status: {status}\n\n🔗 Your Referral Link: {link}\n📋 Your Referral Code: {code}",
    vendor_dashboard: "🏪 *Vendor Dashboard*\n\n📊 Your Stats:\n• Pools Created: {pools}\n• Total Commission: ETB {commission}\n• Status: {status}",
    org_dashboard: "🏢 *Organization Dashboard*\n\n📊 Your Stats:\n• Pools Created: {pools}\n• Members: {members}\n• Total Commission: ETB {commission}\n• Status: {status}",
    partner_pending: "⏳ Your application is pending review. You'll be notified once approved.",
    partner_approved: "✅ Your partner application is approved! You can now start earning commissions.",
    partner_rejected: "❌ Your application was rejected. Please contact support for more information.",
    not_partner: "You are not registered as a partner. Would you like to apply?",
    apply_agent: "🤝 Apply as Agent",
    apply_vendor: "🏪 Apply as Vendor", 
    apply_org: "🏢 Apply as Organization",
    partner_status: "📊 *Partner Status*\n\nRole: {role}\nStatus: {status}\nCommission Earned: ETB {commission}\nReferrals: {referrals}",
    referral_code: "🔗 *Your Referral Code*\n\nCode: `{code}`\nLink: {link}\n\nShare this link with customers to earn commissions!",
    commission_history: "💰 *Commission History*\n\n{history}\n\nTotal: ETB {total}",
    no_commission: "No commission earned yet. Start referring customers to earn!",
    partner_help: "📖 *Partner Help*\n\nAs a partner, you earn 10% commission on every successful contribution!\n\n• Agents: Share your referral link\n• Vendors: Create prize pools\n• Organizations: Create pools for members\n\nNeed help? Contact support."
  },
  am: {
    partner_menu: "🤝 *የአጋር ምናሌ*\n\nእንኳን ደህና መጡ {name}! እንደ {role} ተመዝግበዋል።\n\nከታች ያለውን አማራጭ ይምረጡ:",
    agent_dashboard: "🤝 *የወኪል ዳሽቦርድ*\n\n📊 የእርስዎ ስታቲስቲክስ:\n• ጠቅላላ ሪፈራል: {referrals}\n• ጠቅላላ ኮሚሽን: ETB {commission}\n• ሁኔታ: {status}\n\n🔗 የሪፈራል ሊንክ: {link}\n📋 የሪፈራል ኮድ: {code}",
    vendor_dashboard: "🏪 *የነጋዴ ዳሽቦርድ*\n\n📊 የእርስዎ ስታቲስቲክስ:\n• የተፈጠሩ ፑሎች: {pools}\n• ጠቅላላ ኮሚሽን: ETB {commission}\n• ሁኔታ: {status}",
    org_dashboard: "🏢 *የድርጅት ዳሽቦርድ*\n\n📊 የእርስዎ ስታቲስቲክስ:\n• የተፈጠሩ ፑሎች: {pools}\n• አባላት: {members}\n• ጠቅላላ ኮሚሽን: ETB {commission}\n• ሁኔታ: {status}",
    partner_pending: "⏳ ማመልከቻዎ በግምገማ ላይ ነው። ከፀደቀ በኋላ ይነገሩዎታል።",
    partner_approved: "✅ የአጋር ማመልከቻዎ ጸድቋል! ኮሚሽን ማግኘት መጀመር ይችላሉ።",
    partner_rejected: "❌ ማመልከቻዎ ውድቅ ተደርጓል። ለበለጠ መረጃ ድጋፍን ያግኙ።",
    not_partner: "እርስዎ እንደ አጋር አልተመዘገቡም። ማመልከት ይፈልጋሉ?",
    apply_agent: "🤝 እንደ ወኪል ያመልክቱ",
    apply_vendor: "🏪 እንደ ነጋዴ ያመልክቱ",
    apply_org: "🏢 እንደ ድርጅት ያመልክቱ",
    partner_status: "📊 *የአጋር ሁኔታ*\n\nሚና: {role}\nሁኔታ: {status}\nየተገኘ ኮሚሽን: ETB {commission}\nሪፈራል: {referrals}",
    referral_code: "🔗 *የሪፈራል ኮድዎ*\n\nኮድ: `{code}`\nሊንክ: {link}\n\nይህን ሊንክ ለደንበኞች ያጋሩ ኮሚሽን ለማግኘት!",
    commission_history: "💰 *የኮሚሽን ታሪክ*\n\n{history}\n\nጠቅላላ: ETB {total}",
    no_commission: "እስካሁን ምንም ኮሚሽን አልተገኘም። ለመጀመር ደንበኞችን ያጋሩ!",
    partner_help: "📖 *የአጋር እርዳታ*\n\nእንደ አጋር፣ በእያንዳንዱ ስኬታማ ተሳትፎ 10% ኮሚሽን ያገኛሉ!\n\n• ወኪሎች: የሪፈራል ሊንክዎን ያጋሩ\n• ነጋዴዎች: የሽልማት ፑሎች ይፍጠሩ\n• ድርጅቶች: ለአባላት ፑሎች ይፍጠሩ\n\nእርዳታ ያስፈልግዎታል? ድጋፍን ያግኙ።"
  },
  om: {
    partner_menu: "🤝 *Menyuu Hiriyaa*\n\nBaga nagaan deebitan {name}! {role} taatanii galmaa'itan.\n\nFilannoo armaan gadii keessaa filadhaa:",
    agent_dashboard: "🤝 *Daashboorardii Wakilii*\n\n📊 Tilmaamota Keessan:\n• Waliigala Referraala: {referrals}\n• Komishinii Waliigala: ETB {commission}\n• Haala: {status}\n\n🔗 Liinkii Referraala: {link}\n📋 Koodii Referraala: {code}",
    vendor_dashboard: "🏪 *Daashboorardii Vendoorii*\n\n📊 Tilmaamota Keessan:\n• Pooliiwwan Uumaman: {pools}\n• Komishinii Waliigala: ETB {commission}\n• Haala: {status}",
    org_dashboard: "🏢 *Daashboorardii Dhaabbataa*\n\n📊 Tilmaamota Keessan:\n• Pooliiwwan Uumaman: {pools}\n• Miseenson: {members}\n• Komishinii Waliigala: ETB {commission}\n• Haala: {status}",
    partner_pending: "⏳ Ibsa keessan eegumsa jira. Ergamaammatameen erga mirkaneeffame booda beeksifamtu.",
    partner_approved: "✅ Ibsi hiriyaa keessan mirkaneeffame! Amma komishinii argachuu eegaluu dandeessu.",
    partner_rejected: "❌ Ibsi keessan didame. Odeeffannoo dabalataaf deeggarsa qunnamaa.",
    not_partner: "Hiriyaa taatanii hin galmaa'in. Ibsachuu barbaaddu?",
    apply_agent: "🤝 Wakilii ta'uuf ibsi",
    apply_vendor: "🏪 Vendoorii ta'uuf ibsi",
    apply_org: "🏢 Dhaabbataa ta'uuf ibsi",
    partner_status: "📊 *Haala Hiriyaa*\n\nGahee: {role}\nHaala: {status}\nKomishinii Argame: ETB {commission}\nReferraala: {referrals}",
    referral_code: "🔗 *Koodii Referraala Keessan*\n\nKoodii: `{code}`\nLiinkii: {link}\n\nLiinkii kana maamiltootaaf qoodadhaa komishinii argachuuf!",
    commission_history: "💰 *Seenaa Komishinii*\n\n{history}\n\nWaliigala: ETB {total}",
    no_commission: "Hanga ammaa komishinii hin argatin. Maamiltoota qoodachuudhaan eegalaa!",
    partner_help: "📖 *Gargaarsa Hiriyaa*\n\nHiriyaa taatanii, hirmaannaa milkaa'aa hunda irraa 10% komishinii argattu!\n\n• Wakiliitoota: Liinkii referraala keessan qoodadhaa\n• Vendooritoota: Pooliiwwan badhaasa uumaa\n• Dhaabbattoonni: Pooliiwwan miseensonniif uumaa\n\nGargaarsa barbaaddaa? Deeggarsa qunnamaa."
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

async function getUserRole(userId) {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('telegram_id', userId)
      .single();
    return data?.role || 'individual';
  } catch (error) {
    return 'individual';
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
          role: 'individual',
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

async function getPartnerData(userId, role) {
  try {
    const table = role === 'agent' ? 'agents' : 
                  role === 'vendor' ? 'vendors' : 'organizations';
    
    const { data } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return data;
  } catch (error) {
    return null;
  }
}

async function getReferralStats(partnerId) {
  try {
    const { data } = await supabase
      .from('referrals')
      .select('*')
      .eq('partner_id', partnerId);
    
    return data || [];
  } catch (error) {
    return [];
  }
}

async function getCommissionHistory(partnerId) {
  try {
    const { data } = await supabase
      .from('commission_transactions')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    return data || [];
  } catch (error) {
    return [];
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
      [{ text: '🤝 Partner', callback_data: 'partner' }],
      [{ text: t.winners, callback_data: 'winners' }],
      [{ text: t.how_it_works_btn, callback_data: 'howitworks' }],
      [{ text: t.support, callback_data: 'support' }],
      [{ text: t.open_app, web_app: { url: appUrl } }],
      [{ text: t.dashboard, web_app: { url: `${appUrl}/dashboard` } }],
      [{ text: t.back, callback_data: 'main_menu' }]
    ]
  };
}

function buildPartnerMenu(lang, role, status) {
  const t = PARTNER_TRANSLATIONS[lang] || PARTNER_TRANSLATIONS.en;
  
  let buttons = [
    [{ text: '📊 Dashboard', callback_data: 'partner_dashboard' }],
    [{ text: '🔗 My Referral Code', callback_data: 'partner_referral' }],
    [{ text: '💰 Commission History', callback_data: 'partner_commission' }],
    [{ text: '📖 Help', callback_data: 'partner_help' }],
  ];
  
  // If pending, show status button
  if (status === 'pending') {
    buttons = [
      [{ text: '⏳ Application Status', callback_data: 'partner_status' }],
      ...buttons,
    ];
  }
  
  buttons.push([{ text: t.back, callback_data: 'main_menu' }]);
  
  return { inline_keyboard: buttons };
}

function buildApplyPartnerMenu(lang) {
  const t = PARTNER_TRANSLATIONS[lang] || PARTNER_TRANSLATIONS.en;
  
  return {
    inline_keyboard: [
      [{ text: t.apply_agent, callback_data: 'apply_agent' }],
      [{ text: t.apply_vendor, callback_data: 'apply_vendor' }],
      [{ text: t.apply_org, callback_data: 'apply_org' }],
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
      { command: 'partner', description: '🤝 Partner dashboard' },
      { command: 'referral', description: '🔗 My referral code' },
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
  // START COMMAND - COLLECT NAME & PHONE
  // ============================================
  bot.start(async (ctx) => {
    const user = ctx.from;
    const userId = user.id;
    
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
  // HANDLE TEXT MESSAGES
  // ============================================
  bot.on('text', async (ctx) => {
    const user = ctx.from;
    const userId = user.id;
    const text = ctx.message.text.trim();
    
    const session = userSessions[userId];
    if (!session) {
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

    if (session.step === 'ask_name') {
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
      
      delete userSessions[userId];
      return;
    }
  });

  // ============================================
  // LANGUAGE SELECTION
  // ============================================
  bot.action(/lang_(.+)/, async (ctx) => {
    const lang = ctx.match[1];
    const userId = ctx.from.id;
    const user = ctx.from;
    const name = user.first_name || 'User';
    
    if (!['en', 'am', 'om'].includes(lang)) {
      await ctx.answerCbQuery('Invalid language selection');
      return;
    }
    
    await updateUserLanguage(userId, lang);
    
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    await ctx.reply(t.language_set, { parse_mode: 'Markdown' });
    
    await ctx.reply(
      t.main_menu.replace('{name}', name),
      {
        parse_mode: 'Markdown',
        reply_markup: buildMainMenu(lang)
      }
    );
    
    await ctx.answerCbQuery();
  });

  // ============================================
  // PARTNER COMMAND
  // ============================================
  bot.command('partner', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = PARTNER_TRANSLATIONS[lang] || PARTNER_TRANSLATIONS.en;
    const user = ctx.from;
    const name = user.first_name || 'User';
    
    const role = await getUserRole(userId);
    
    if (role === 'individual') {
      await ctx.reply(
        t.not_partner,
        {
          parse_mode: 'Markdown',
          reply_markup: buildApplyPartnerMenu(lang)
        }
      );
      return;
    }
    
    const partnerData = await getPartnerData(userId, role);
    
    if (!partnerData) {
      await ctx.reply(
        t.not_partner,
        {
          parse_mode: 'Markdown',
          reply_markup: buildApplyPartnerMenu(lang)
        }
      );
      return;
    }
    
    const statusText = partnerData.is_approved ? '✅ Approved' : '⏳ Pending';
    const roleNames = {
      agent: 'Agent',
      vendor: 'Vendor',
      organization: 'Organization'
    };
    
    await ctx.reply(
      t.partner_menu.replace('{name}', name).replace('{role}', roleNames[role] || role),
      {
        parse_mode: 'Markdown',
        reply_markup: buildPartnerMenu(lang, role, partnerData.is_approved ? 'approved' : 'pending')
      }
    );
  });

  // ============================================
  // PARTNER CALLBACKS
  // ============================================
  
  // Partner menu button
  bot.action('partner', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = PARTNER_TRANSLATIONS[lang] || PARTNER_TRANSLATIONS.en;
    const user = ctx.from;
    const name = user.first_name || 'User';
    
    const role = await getUserRole(userId);
    
    if (role === 'individual') {
      await ctx.editMessageText(
        t.not_partner,
        {
          parse_mode: 'Markdown',
          reply_markup: buildApplyPartnerMenu(lang)
        }
      );
      await ctx.answerCbQuery();
      return;
    }
    
    const partnerData = await getPartnerData(userId, role);
    
    if (!partnerData) {
      await ctx.editMessageText(
        t.not_partner,
        {
          parse_mode: 'Markdown',
          reply_markup: buildApplyPartnerMenu(lang)
        }
      );
      await ctx.answerCbQuery();
      return;
    }
    
    const roleNames = {
      agent: 'Agent',
      vendor: 'Vendor',
      organization: 'Organization'
    };
    
    await ctx.editMessageText(
      t.partner_menu.replace('{name}', name).replace('{role}', roleNames[role] || role),
      {
        parse_mode: 'Markdown',
        reply_markup: buildPartnerMenu(lang, role, partnerData.is_approved ? 'approved' : 'pending')
      }
    );
    await ctx.answerCbQuery();
  });

  // Partner Dashboard
  bot.action('partner_dashboard', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = PARTNER_TRANSLATIONS[lang] || PARTNER_TRANSLATIONS.en;
    
    const role = await getUserRole(userId);
    const partnerData = await getPartnerData(userId, role);
    
    if (!partnerData) {
      await ctx.reply('❌ Partner data not found');
      await ctx.answerCbQuery();
      return;
    }
    
    const statusText = partnerData.is_approved ? '✅ Approved' : '⏳ Pending Review';
    const referrals = await getReferralStats(partnerData.id);
    const commissions = await getCommissionHistory(partnerData.id);
    const totalCommission = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
    
    let message = '';
    const roleNames = {
      agent: 'Agent',
      vendor: 'Vendor', 
      organization: 'Organization'
    };
    
    if (role === 'agent') {
      message = t.agent_dashboard
        .replace('{referrals}', referrals.length)
        .replace('{commission}', totalCommission.toLocaleString())
        .replace('{status}', statusText)
        .replace('{link}', partnerData.referral_link || 'N/A')
        .replace('{code}', partnerData.referral_code || 'N/A');
    } else if (role === 'vendor') {
      message = t.vendor_dashboard
        .replace('{pools}', partnerData.total_pools_created || 0)
        .replace('{commission}', totalCommission.toLocaleString())
        .replace('{status}', statusText);
    } else if (role === 'organization') {
      message = t.org_dashboard
        .replace('{pools}', partnerData.total_pools_created || 0)
        .replace('{members}', 0) // TODO: Count organization members
        .replace('{commission}', totalCommission.toLocaleString())
        .replace('{status}', statusText);
    }
    
    await ctx.editMessageText(
      message,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔗 My Referral Code', callback_data: 'partner_referral' }],
            [{ text: '💰 Commission History', callback_data: 'partner_commission' }],
            [{ text: '📖 Help', callback_data: 'partner_help' }],
            [{ text: '🔙 Back to Partner Menu', callback_data: 'partner' }]
          ]
        }
      }
    );
    await ctx.answerCbQuery();
  });

  // Referral Code
  bot.action('partner_referral', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = PARTNER_TRANSLATIONS[lang] || PARTNER_TRANSLATIONS.en;
    
    const role = await getUserRole(userId);
    const partnerData = await getPartnerData(userId, role);
    
    if (!partnerData || !partnerData.referral_code) {
      await ctx.reply('❌ Referral code not found. Please contact support.');
      await ctx.answerCbQuery();
      return;
    }
    
    await ctx.editMessageText(
      t.referral_code
        .replace('{code}', partnerData.referral_code)
        .replace('{link}', partnerData.referral_link || 'N/A'),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 Dashboard', callback_data: 'partner_dashboard' }],
            [{ text: '🔙 Back to Partner Menu', callback_data: 'partner' }]
          ]
        }
      }
    );
    await ctx.answerCbQuery();
  });

  // Commission History
  bot.action('partner_commission', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = PARTNER_TRANSLATIONS[lang] || PARTNER_TRANSLATIONS.en;
    
    const role = await getUserRole(userId);
    const partnerData = await getPartnerData(userId, role);
    
    if (!partnerData) {
      await ctx.reply('❌ Partner data not found');
      await ctx.answerCbQuery();
      return;
    }
    
    const commissions = await getCommissionHistory(partnerData.id);
    const totalCommission = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
    
    let historyText = '';
    if (commissions.length === 0) {
      historyText = t.no_commission;
    } else {
      commissions.forEach(c => {
        const date = new Date(c.created_at).toLocaleDateString();
        historyText += `• ${date}: ETB ${c.amount?.toLocaleString() || 0} (${c.status || 'pending'})\n`;
      });
    }
    
    await ctx.editMessageText(
      t.commission_history
        .replace('{history}', historyText)
        .replace('{total}', totalCommission.toLocaleString()),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 Dashboard', callback_data: 'partner_dashboard' }],
            [{ text: '🔙 Back to Partner Menu', callback_data: 'partner' }]
          ]
        }
      }
    );
    await ctx.answerCbQuery();
  });

  // Partner Status
  bot.action('partner_status', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = PARTNER_TRANSLATIONS[lang] || PARTNER_TRANSLATIONS.en;
    
    const role = await getUserRole(userId);
    const partnerData = await getPartnerData(userId, role);
    
    if (!partnerData) {
      await ctx.reply('❌ Partner data not found');
      await ctx.answerCbQuery();
      return;
    }
    
    const statusText = partnerData.is_approved ? '✅ Approved' : '⏳ Pending Review';
    const roleNames = {
      agent: 'Agent',
      vendor: 'Vendor',
      organization: 'Organization'
    };
    const referrals = await getReferralStats(partnerData.id);
    const commissions = await getCommissionHistory(partnerData.id);
    const totalCommission = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
    
    await ctx.editMessageText(
      t.partner_status
        .replace('{role}', roleNames[role] || role)
        .replace('{status}', statusText)
        .replace('{commission}', totalCommission.toLocaleString())
        .replace('{referrals}', referrals.length),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 Dashboard', callback_data: 'partner_dashboard' }],
            [{ text: '🔙 Back to Partner Menu', callback_data: 'partner' }]
          ]
        }
      }
    );
    await ctx.answerCbQuery();
  });

  // Partner Help
  bot.action('partner_help', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = PARTNER_TRANSLATIONS[lang] || PARTNER_TRANSLATIONS.en;
    
    await ctx.editMessageText(
      t.partner_help,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 Dashboard', callback_data: 'partner_dashboard' }],
            [{ text: '🔙 Back to Partner Menu', callback_data: 'partner' }]
          ]
        }
      }
    );
    await ctx.answerCbQuery();
  });

  // Apply Partner - opens web app for registration
  bot.action(/apply_(.+)/, async (ctx) => {
    const role = ctx.match[1];
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com';
    
    const roleNames = {
      agent: 'Agent',
      vendor: 'Vendor',
      organization: 'Organization'
    };
    
    await ctx.reply(
      `📝 *Apply as ${roleNames[role] || role}*\n\n` +
      `Please complete your application in the web app:\n\n` +
      `🔗 ${appUrl}/register?role=${role}\n\n` +
      `You'll need to provide:\n` +
      `• Personal information\n` +
      `• Business details\n` +
      `• Required documents\n\n` +
      `After submission, admin will review your application.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📝 Open Application', web_app: { url: `${appUrl}/register?role=${role}` } }],
            [{ text: '🔙 Back', callback_data: 'partner' }]
          ]
        }
      }
    );
    await ctx.answerCbQuery();
  });

  // ============================================
  // REFERRAL COMMAND
  // ============================================
  bot.command('referral', async (ctx) => {
    const userId = ctx.from.id;
    const lang = await getUserLanguage(userId);
    const t = PARTNER_TRANSLATIONS[lang] || PARTNER_TRANSLATIONS.en;
    
    const role = await getUserRole(userId);
    
    if (role === 'individual') {
      await ctx.reply(
        '❌ You are not registered as a partner. Use /partner to learn more.',
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    const partnerData = await getPartnerData(userId, role);
    
    if (!partnerData || !partnerData.referral_code) {
      await ctx.reply('❌ Referral code not found. Please contact support.');
      return;
    }
    
    await ctx.reply(
      t.referral_code
        .replace('{code}', partnerData.referral_code)
        .replace('{link}', partnerData.referral_link || 'N/A'),
      {
        parse_mode: 'Markdown'
      }
    );
  });

  // ============================================
  // OTHER COMMANDS (Keep existing)
  // ============================================
  // ... (keep all your existing commands: programs, mytickets, support, winners, howitworks, etc.)

  // ============================================
  // MAIN MENU CALLBACK
  // ============================================
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
  // PROGRAM CALLBACKS (Keep existing)
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

  // ... (keep all other callbacks: merkato_details, city_details, pools_details, support, howitworks, winners, etc.)

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
        winnersText = t.no_winners || 'No recent winners to display. Be the first! 🎯\n\n';
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
        reply_markup: {
          inline_keyboard: [
            [{ text: t.view_merkato, callback_data: 'merkato_details' }],
            [{ text: t.view_city, callback_data: 'city_details' }],
            [{ text: t.view_pools, callback_data: 'pools_details' }],
            [{ text: t.back, callback_data: 'main_menu' }]
          ]
        }
      }
    );
  });

  // ============================================
  // LANGUAGE COMMAND
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
}

export default bot;
