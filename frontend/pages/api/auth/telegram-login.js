// pages/api/auth/telegram-login.js
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  // ✅ Enable CORS for this endpoint
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, telegram_id } = req.body;

    console.log('📱 Telegram login attempt:', { token: token?.substring(0, 20), telegram_id });

    if (!token || !telegram_id) {
      console.log('❌ Missing token or telegram_id');
      return res.status(400).json({ error: 'Missing token or telegram_id' });
    }

    // ✅ Verify the token
    const { data: tokenData, error: tokenError } = await supabase
      .from('login_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      console.log('❌ Invalid token:', tokenError?.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // ✅ Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      console.log('❌ Token expired');
      await supabase.from('login_tokens').delete().eq('token', token);
      return res.status(401).json({ error: 'Token expired' });
    }

    // ✅ Check if telegram_id matches
    if (tokenData.telegram_id !== parseInt(telegram_id)) {
      console.log('❌ Telegram ID mismatch:', tokenData.telegram_id, telegram_id);
      return res.status(401).json({ error: 'Invalid token for this user' });
    }

    console.log('✅ Token verified for user:', telegram_id);

    // ✅ Get or create user profile
    let { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', parseInt(telegram_id))
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('❌ Database error:', findError);
      throw findError;
    }

    if (!profile) {
      console.log('👤 Creating new user for telegram_id:', telegram_id);
      
      const { data: newUser, error: createError } = await supabase
        .from('profiles')
        .insert({
          telegram_id: parseInt(telegram_id),
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

      if (createError) {
        console.error('❌ Failed to create user:', createError);
        throw createError;
      }
      profile = newUser;
      console.log('✅ User created:', profile.id);
    } else {
      console.log('👤 Existing user found:', profile.id);
      // ✅ Update user info
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          telegram_username: tokenData.username || profile.telegram_username,
          full_name: tokenData.first_name || profile.full_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('❌ Failed to update user:', updateError);
      }
    }

    // ✅ Delete the used token
    await supabase.from('login_tokens').delete().eq('token', token);
    console.log('🗑️ Token deleted');

    // ✅ Generate session token
    const sessionToken = Buffer.from(JSON.stringify({
      userId: profile.id,
      telegramId: parseInt(telegram_id),
      timestamp: Date.now()
    })).toString('base64');

    console.log('✅ Login successful for user:', profile.id);

    res.status(200).json({
      success: true,
      user: {
        id: profile.id,
        telegram_id: profile.telegram_id,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role
      },
      sessionToken,
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('❌ Telegram login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Authentication failed: ' + error.message 
    });
  }
}
