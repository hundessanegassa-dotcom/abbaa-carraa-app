// pages/api/auth/telegram-login.js - COMPLETE WITH SUPABASE CHECKS
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

export default async function handler(req, res) {
  console.log('📡 Telegram login API called');
  console.log('📡 Method:', req.method);

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    console.log('❌ Wrong method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ✅ Check if Supabase is configured
  if (!supabase || !isSupabaseConfigured()) {
    console.error('❌ Supabase not configured!');
    return res.status(500).json({ 
      success: false, 
      error: 'Supabase configuration missing' 
    });
  }

  try {
    const { token, telegram_id } = req.body;

    console.log('📡 Token received:', token?.substring(0, 30) + '...');
    console.log('📡 Telegram ID received:', telegram_id);

    if (!token || !telegram_id) {
      console.log('❌ Missing token or telegram_id');
      return res.status(400).json({ 
        success: false,
        error: 'Missing token or telegram_id' 
      });
    }

    // Query the database
    console.log('🔍 Looking up token in database...');
    const { data: tokenData, error: tokenError } = await supabase
      .from('login_tokens')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (tokenError) {
      console.log('❌ Database error:', tokenError);
      return res.status(500).json({ 
        success: false,
        error: 'Database error: ' + tokenError.message 
      });
    }

    if (!tokenData) {
      console.log('❌ Token not found in database');
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token' 
      });
    }

    console.log('✅ Token found:', tokenData);

    // Check expiration
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    console.log('📅 Expires at:', expiresAt);
    console.log('📅 Now:', now);

    if (expiresAt < now) {
      console.log('❌ Token expired');
      await supabase.from('login_tokens').delete().eq('token', token);
      return res.status(401).json({ 
        success: false,
        error: 'Token expired' 
      });
    }

    // Check telegram_id match
    console.log('🔍 Checking telegram_id match...');
    console.log('📌 Token telegram_id:', tokenData.telegram_id);
    console.log('📌 Request telegram_id:', parseInt(telegram_id));

    if (tokenData.telegram_id !== parseInt(telegram_id)) {
      console.log('❌ Telegram ID mismatch');
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token for this user' 
      });
    }

    console.log('✅ All checks passed!');

    // Get or create user
    let { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', parseInt(telegram_id))
      .maybeSingle();

    if (findError) {
      console.log('❌ Error finding user:', findError);
      return res.status(500).json({ 
        success: false,
        error: 'Database error' 
      });
    }

    if (!profile) {
      console.log('👤 Creating new user...');
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
        console.log('❌ Error creating user:', createError);
        return res.status(500).json({ 
          success: false,
          error: 'Failed to create user' 
        });
      }
      profile = newUser;
      console.log('✅ User created:', profile.id);
    } else {
      console.log('👤 Existing user found:', profile.id);
    }

    // Delete the used token
    await supabase.from('login_tokens').delete().eq('token', token);
    console.log('🗑️ Token deleted');

    // Generate session token
    const sessionToken = Buffer.from(JSON.stringify({
      userId: profile.id,
      telegramId: parseInt(telegram_id),
      timestamp: Date.now()
    })).toString('base64');

    console.log('✅ Login successful!');
    console.log('📊 Session token:', sessionToken.substring(0, 30) + '...');

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
    console.error('❌ Unexpected error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error: ' + error.message 
    });
  }
}
