// pages/api/auth/telegram.js
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { initData, user } = req.body;

    if (!user || !user.id) {
      return res.status(400).json({ error: 'Invalid user data' });
    }

    const { data: existingUser, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', user.id)
      .single();

    let profile;

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    if (!existingUser) {
      const { data: newUser, error: createError } = await supabase
        .from('profiles')
        .insert({
          telegram_id: user.id,
          telegram_username: user.username || null,
          full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Telegram User',
          email: `${user.username || user.id}@telegram.user`,
          language: 'en',
          phone: user.phone_number || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;
      profile = newUser;
    } else {
      const { data: updatedUser, error: updateError } = await supabase
        .from('profiles')
        .update({
          telegram_username: user.username || null,
          full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Telegram User',
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      profile = updatedUser;
    }

    const sessionToken = Buffer.from(JSON.stringify({
      userId: profile.id,
      telegramId: user.id,
      timestamp: Date.now()
    })).toString('base64');

    res.status(200).json({
      success: true,
      user: profile,
      sessionToken,
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('Telegram auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
