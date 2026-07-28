// lib/tiktok.js
import { supabase } from './supabase';

// Track conversion events
export const trackTikTokEvent = (eventName, properties = {}) => {
  if (typeof window !== 'undefined' && window.ttq) {
    window.ttq.track(eventName, properties);
  }
};

// Track referral conversion
export const trackReferralConversion = async (referralCode, userId) => {
  try {
    // Update referral status
    const { data, error } = await supabase
      .from('tiktok_referrals')
      .update({ 
        status: 'converted', 
        converted_at: new Date().toISOString(),
        referred_id: userId 
      })
      .eq('referral_code', referralCode)
      .select()
      .single();

    if (error) throw error;

    // Track TikTok event
    trackTikTokEvent('CompleteRegistration', {
      referral_code: referralCode,
      content_id: 'referral_signup'
    });

    // Update influencer stats
    if (data.referrer_id) {
      await updateInfluencerStats(data.referrer_id);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Referral conversion error:', error);
    return { success: false, error: error.message };
  }
};

// Update influencer performance stats
export const updateInfluencerStats = async (influencerId) => {
  try {
    const { data: referrals } = await supabase
      .from('tiktok_referrals')
      .select('*')
      .eq('referrer_id', influencerId);

    const totalReferrals = referrals?.length || 0;
    const totalConversions = referrals?.filter(r => r.status === 'converted').length || 0;

    const { error } = await supabase
      .from('influencer_performance')
      .upsert({
        influencer_id: influencerId,
        total_referrals: totalReferrals,
        total_conversions: totalConversions,
        total_commission: totalConversions * 10, // Example: 10 ETB per conversion
        last_synced_at: new Date().toISOString()
      }, { onConflict: 'influencer_id' });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating influencer stats:', error);
    return { success: false, error: error.message };
  }
};

// Generate referral code
export const generateReferralCode = (userId) => {
  return `TIK${userId.substring(0, 8)}${Date.now().toString(36).toUpperCase()}`;
};

// Create referral
export const createReferral = async (referrerId, tiktokUsername, campaignId) => {
  try {
    const referralCode = generateReferralCode(referrerId);
    
    const { data, error } = await supabase
      .from('tiktok_referrals')
      .insert({
        referrer_id: referrerId,
        tiktok_username: tiktokUsername,
        campaign_id: campaignId,
        referral_code: referralCode,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Track TikTok event
    trackTikTokEvent('InitiateCheckout', {
      referral_code: referralCode,
      content_id: 'referral_created'
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error creating referral:', error);
    return { success: false, error: error.message };
  }
};
