// lib/bot.js - COMPLETE WORKING BOT
import { Telegraf } from 'telegraf';
import { supabase } from './supabase';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN not set. Bot features will not work.');
}

export const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

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
    ]);
    console.log('✅ Bot commands set successfully');
  } catch (error) {
    console.error('❌ Failed to set bot commands:', error);
  }
}

export async function handleBotMessages() {
  if (!bot) return;

  // ============================================
  // START COMMAND
  // ============================================
  bot.start(async (ctx) => {
    const user = ctx.from;
    const name = user.first_name || 'User';
    
    // Save user to database
    try {
      await supabase
        .from('profiles')
        .upsert({
          telegram_id: user.id,
          telegram_username: user.username,
          full_name: `${user.first_name} ${user.last_name || ''}`.trim(),
          email: `${user.username || user.id}@telegram.user`,
          updated_at: new Date().toISOString()
        }, { onConflict: 'telegram_id' });
    } catch (error) {
      console.error('Error saving user:', error);
    }

    const welcomeMessage = 
      `👋 *Welcome to Abbaa Carraa, ${name}!*\n\n` +
      `🏆 *Ethiopia's Premier Prize Platform*\n\n` +
      `🎯 *What You Can Do:*\n` +
      `🏪 Merkato VIP - Win Cash up to 10M ETB\n` +
      `🏙️ City VIP - Win Cash in 94 Cities\n` +
      `🏊 Regular Pools - Win Cars, Houses & More\n\n` +
      `📱 *All actions happen inside the app!*\n\n` +
      `*🔽 Press the button below to get started!*`;

    await ctx.reply(welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Open Abbaa Carraa', web_app: { url: process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com' } }],
          [{ text: '📊 My Tickets', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/dashboard` } }],
          [{ text: '🏪 Merkato VIP', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/merkato-vip` } }],
          [{ text: '🏙️ City VIP', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/cities` } }],
          [{ text: '🏊 Regular Pools', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/listings` } }]
        ]
      }
    });
  });

  // ============================================
  // HELP COMMAND
  // ============================================
  bot.help(async (ctx) => {
    await ctx.reply(
      `📖 *Help & Support*\n\n` +
      `🤖 *Available Commands:*\n` +
      `/start - 🚀 Welcome message\n` +
      `/help - 📖 This help message\n` +
      `/mytickets - 🎫 View your tickets\n` +
      `/programs - 🎯 View available programs\n` +
      `/language - 🌐 Change language\n` +
      `/support - 📞 Contact support\n\n` +
      `📱 *Need Help?*\n` +
      `Contact our support team 24/7\n\n` +
      `💬 Live chat: ${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/contact`,
      { parse_mode: 'Markdown' }
    );
  });

  // ============================================
  // MY TICKETS COMMAND
  // ============================================
  bot.command('mytickets', async (ctx) => {
    const user = ctx.from;
    
    try {
      // Fetch tickets from all programs
      const [merkatoTickets, cityTickets, regularTickets] = await Promise.all([
        supabase
          .from('merkato_vip_participants')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('city_vip_participants')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('regular_pool_participants')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3)
      ]);

      const allTickets = [
        ...(merkatoTickets.data || []),
        ...(cityTickets.data || []),
        ...(regularTickets.data || [])
      ];

      if (allTickets.length === 0) {
        await ctx.reply(
          `📭 *You don't have any tickets yet.*\n\n` +
          `Join a program to get started!\n\n` +
          `🏪 Merkato VIP - Win Cash up to 10M ETB\n` +
          `🏙️ City VIP - Win Cash in 94 Cities\n` +
          `🏊 Regular Pools - Win Cars, Houses & More`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🏪 Merkato VIP', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/merkato-vip` } }],
                [{ text: '🏙️ City VIP', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/cities` } }],
                [{ text: '🏊 Regular Pools', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/listings` } }]
              ]
            }
          }
        );
        return;
      }

      let message = `🎫 *Your Tickets*\n\n`;
      allTickets.slice(0, 5).forEach((t, i) => {
        const programType = t.tier ? 
          (t.pool_type || 'VIP') : 'Regular';
        const status = t.payment_status === 'verified' ? '✅ Verified' : '⏳ Pending';
        message += `${i + 1}. 🏆 ${programType} - `;
        message += `💺 ${t.seat_numbers?.join(', ') || 'N/A'}\n`;
        message += `   Status: ${status}\n`;
        message += `   Ticket: #${t.ticket_number}\n\n`;
      });

      message += `\n📱 View all tickets in the app:`;
      
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 View All Tickets', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/dashboard` } }]
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
    await ctx.reply(
      `🎯 *Available Programs*\n\n` +
      `🏪 *Merkato VIP*\n` +
      `Win Cash up to 10M ETB\n` +
      `4 Tiers: Bronze, Silver, Gold, Platinum\n\n` +
      `🏙️ *City VIP*\n` +
      `Win Cash in 94 Cities\n` +
      `4 Tiers: Bronze, Silver, Gold, Platinum\n\n` +
      `🏊 *Regular Pools*\n` +
      `Win Cars, Houses, Machinery & Electronics\n\n` +
      `💰 *20% Commission* for Agents & Partners\n` +
      `💚 *2% Supports* Kidney & Heart Patients\n\n` +
      `Select a program below:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🏪 Merkato VIP', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/merkato-vip` } }],
            [{ text: '🏙️ City VIP', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/cities` } }],
            [{ text: '🏊 Regular Pools', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/listings` } }]
          ]
        }
      }
    );
  });

  // ============================================
  // LANGUAGE COMMAND
  // ============================================
  bot.command('language', async (ctx) => {
    await ctx.reply(
      '🌐 *Select Your Language*',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🇬🇧 English', callback_data: 'lang_en' },
              { text: '🇪🇹 አማርኛ', callback_data: 'lang_am' }
            ],
            [
              { text: '🌍 Afan Oromo', callback_data: 'lang_om' }
            ]
          ]
        }
      }
    );
  });

  // ============================================
  // LANGUAGE SELECTION CALLBACK
  // ============================================
  bot.action(/lang_(.+)/, async (ctx) => {
    const lang = ctx.match[1];
    try {
      await supabase
        .from('profiles')
        .update({ language: lang })
        .eq('telegram_id', ctx.from.id);
      
      const messages = {
        en: '✅ Language set to English',
        am: '✅ ቋንቋ ወደ አማርኛ ተቀይሯል',
        om: '✅ Afaan Oromotti jijjiirame'
      };
      
      await ctx.reply(messages[lang] || '✅ Language updated');
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Language update error:', error);
      await ctx.reply('⚠️ Failed to update language');
    }
  });

  // ============================================
  // SUPPORT COMMAND
  // ============================================
  bot.command('support', async (ctx) => {
    await ctx.reply(
      `📞 *Contact Support*\n\n` +
      `Our team is here to help you 24/7.\n\n` +
      `📱 *Ways to reach us:*\n` +
      `1. Live Chat: ${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/contact\n` +
      `2. Email: support@abbaacarraa.com\n` +
      `3. Phone: +251 913 277 922\n\n` +
      `💬 *Quick Help:*\n` +
      `• For payment issues: Use /mytickets to check status\n` +
      `• For program info: Use /programs\n` +
      `• For general help: Visit our FAQ page`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💬 Live Chat', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/contact` } }],
            [{ text: '❓ FAQ', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/faq` } }]
          ]
        }
      }
    );
  });

  // ============================================
  // HANDLE TEXT MESSAGES
  // ============================================
  bot.on('text', async (ctx) => {
    const text = ctx.message.text.toLowerCase();
    
    if (text.includes('hello') || text.includes('hi') || text.includes('ሰላም')) {
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
    } else if (text.includes('program') || text.includes('ፕሮግራም')) {
      await ctx.reply(
        `🎯 *Programs*\n\n` +
        `Use /programs to see all available programs.\n` +
        `Or visit the app: ${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}`,
        { parse_mode: 'Markdown' }
      );
    } else {
      // Default response
      await ctx.reply(
        `🤔 I didn't understand that.\n\n` +
        `Try one of these commands:\n` +
        `/start - Welcome message\n` +
        `/help - Help information\n` +
        `/mytickets - View your tickets\n` +
        `/programs - View available programs\n` +
        `/language - Change language\n` +
        `/support - Contact support`,
        { parse_mode: 'Markdown' }
      );
    }
  });
}

export default bot;
