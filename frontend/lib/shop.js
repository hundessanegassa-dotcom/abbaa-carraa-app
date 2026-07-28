// lib/shop.js
import { supabase } from './supabase';

// Create a shop
export const createShop = async (shopData) => {
  try {
    const {
      ownerId,
      shopName,
      shopUsername,
      description,
      prizeType,
      prizeValue,
      prizeDescription,
      city,
      category,
      shopImageUrl
    } = shopData;

    // Check if username is taken
    const { data: existing } = await supabase
      .from('shops')
      .select('id')
      .eq('shop_username', shopUsername)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'Username already taken' };
    }

    const { data, error } = await supabase
      .from('shops')
      .insert({
        owner_id: ownerId,
        shop_name: shopName,
        shop_username: shopUsername,
        description,
        prize_type: prizeType,
        prize_value: prizeValue,
        prize_description: prizeDescription,
        city,
        category,
        shop_image_url: shopImageUrl,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error creating shop:', error);
    return { success: false, error: error.message };
  }
};

// Get shop by username
export const getShopByUsername = async (username) => {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*, profiles!owner_id(full_name, email, phone)')
      .eq('shop_username', username)
      .eq('status', 'active')
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Join a shop
export const joinShop = async (shopId, userId) => {
  try {
    // Check if already joined
    const { data: existing } = await supabase
      .from('shop_participants')
      .select('id')
      .eq('shop_id', shopId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'Already joined this shop' };
    }

    const { data, error } = await supabase
      .from('shop_participants')
      .insert({
        shop_id: shopId,
        user_id: userId,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    // Update shop participant count
    await supabase.rpc('increment_shop_participants', { shop_id: shopId });

    return { success: true, data };
  } catch (error) {
    console.error('Error joining shop:', error);
    return { success: false, error: error.message };
  }
};

// Generate shop ticket
export const generateShopTicket = async (shopId, userId, amount, seatNumber) => {
  try {
    const ticketNumber = `SHOP-${shopId.substring(0, 8)}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const { data, error } = await supabase
      .from('shop_tickets')
      .insert({
        shop_id: shopId,
        user_id: userId,
        ticket_number: ticketNumber,
        seat_number: seatNumber,
        contribution_amount: amount,
        payment_status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error generating ticket:', error);
    return { success: false, error: error.message };
  }
};

// Share shop link
export const shareShopLink = (shopUsername) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  return `${baseUrl}/shops/${shopUsername}`;
};
