// pages/api/auth/telegram-login.js
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, telegram_id } = req.body;

    if (!token || !telegram_id) {
      return res.status(400).json({ error: 'Missing token or telegram_id' });
    }

    // Verify the token
    const { data: tokenData, error: tokenError } = await supabase
      .from('login_tokens')
      .select('*')
      .eq('token', token)
      .eq('telegram_id', telegram_id)
      .single();

    if (tokenError || !tokenData) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      await supabase.from('login_tokens').delete().eq('token', token);
      return res.status(401).json({ error: 'Token expired' });
    }

    // Get user profile
    const { data: existingUser, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', telegram_id)
      .single();

    let profile;

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    if (!existingUser) {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('profiles')
        .insert({
          telegram_id: telegram_id,
          telegram_username: tokenData.username || null,
          full_name: tokenData.first_name || 'Telegram User',
          email: `${telegram_id}@telegram.user`,
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
    } else {
      profile = existingUser;
    }

    // Delete the used token
    await supabase.from('login_tokens').delete().eq('token', token);

    // Generate session token
    const sessionToken = Buffer.from(JSON.stringify({
      userId: profile.id,
      telegramId: telegram_id,
      timestamp: Date.now()
    })).toString('base64');

    res.status(200).json({
      success: true,
      user: profile,
      sessionToken,
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('Telegram login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
