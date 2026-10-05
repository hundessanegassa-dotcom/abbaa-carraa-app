// pages/api/auth/telegram.js - For WebApp auto-login
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { initData, user, telegram_id, username, first_name, last_name } = req.body;

    // Support both user object and top-level fields
    const telegramId = user?.id || telegram_id;
    const tgUsername = user?.username || username || null;
    const tgFirstName = user?.first_name || first_name || '';
    const tgLastName = user?.last_name || last_name || '';

    if (!telegramId) {
      return res.status(400).json({ error: 'Invalid user data: telegram_id required' });
    }

    console.log('📱 Telegram WebApp auth for user:', telegramId);

    // Check if user exists safely using maybeSingle
    let { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (findError) {
      console.error('Error finding user:', findError);
      throw findError;
    }

    if (!profile) {
      console.log('👤 Creating new user from WebApp');
      const fullName = `${tgFirstName} ${tgLastName}`.trim() || 'Telegram User';
      const { data: newUser, error: createError } = await supabase
        .from('profiles')
        .insert({
          telegram_id: telegramId,
          telegram_username: tgUsername,
          full_name: fullName,
          email: `${tgUsername || telegramId}@telegram.user`,
          language: 'en',
          role: 'individual',
          user_type: 'individual',
          agreement_accepted: true,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;
      profile = newUser;
    }

    // Generate session token
    const sessionToken = Buffer.from(JSON.stringify({
      userId: profile.id,
      telegramId: telegramId,
      timestamp: Date.now()
    })).toString('base64');

    console.log('✅ WebApp auth successful for:', profile.id);

    res.status(200).json({
      success: true,
      user: profile,
      sessionToken,
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('❌ Telegram WebApp auth error:', error);
    res.status(500).json({ error: error.message || 'Authentication failed' });
  }
}
