// lib/seatPrograms.js - Single source of truth for seat programs
// Covers the three programs: regular pools, City VIP and Merkato VIP.
// Everything that needs "how many seats does this program have" and
// "which seats are already taken" goes through this file.

import { supabase } from './supabase';

export const TIER_IDS = ['silver', 'gold', 'platinum', 'diamond', 'royal'];

export const TIERS = {
  silver: {
    id: 'silver',
    labelAm: 'ብር',
    labelEn: 'Silver',
    contribution: 100,
    prize: 100000,
    seats: 1200,
    color: 'from-gray-400 to-gray-500',
    badgeColor: 'bg-gray-500',
    icon: '🥈',
    drawSchedule: 'daily',
    tier: 1
  },
  gold: {
    id: 'gold',
    labelAm: 'ወርቅ',
    labelEn: 'Gold',
    contribution: 500,
    prize: 500000,
    seats: 1200,
    color: 'from-yellow-400 to-yellow-600',
    badgeColor: 'bg-yellow-500',
    icon: '🥇',
    drawSchedule: 'daily',
    tier: 2
  },
  platinum: {
    id: 'platinum',
    labelAm: 'ፕላቲኒየም',
    labelEn: 'Platinum',
    contribution: 1000,
    prize: 2000000,
    seats: 2400,
    color: 'from-gray-300 to-blue-400',
    badgeColor: 'bg-blue-500',
    icon: '💎',
    drawSchedule: 'weekly',
    tier: 3
  },
  diamond: {
    id: 'diamond',
    labelAm: 'አልማዝ',
    labelEn: 'Diamond',
    contribution: 2500,
    prize: 5000000,
    seats: 2400,
    color: 'from-blue-400 to-cyan-400',
    badgeColor: 'bg-cyan-500',
    icon: '💠',
    drawSchedule: 'weekly',
    tier: 4
  },
  royal: {
    id: 'royal',
    labelAm: 'ንጉሣዊ',
    labelEn: 'Royal',
    contribution: 5000,
    prize: 10000000,
    seats: 2400,
    color: 'from-purple-500 to-pink-500',
    badgeColor: 'bg-purple-500',
    icon: '👑',
    drawSchedule: 'monthly',
    tier: 5
  }
};

// Daily / weekly / monthly VIP pools (used by /cities/seat and /merkato-seat)
export const VIP_POOLS = {
  daily: {
    id: 'daily',
    labelAm: 'ዕለታዊ',
    labelEn: 'Daily',
    contribution: 500,
    prize: 1000000,
    seats: 2400,
    color: 'from-blue-500 to-blue-700',
    badgeColor: 'bg-blue-500',
    icon: '⭐',
    drawSchedule: 'daily',
    drawDate: 'Every Day at 8:00 PM'
  },
  weekly: {
    id: 'weekly',
    labelAm: 'ሳምንታዊ',
    labelEn: 'Weekly',
    contribution: 2500,
    prize: 10000000,
    seats: 4800,
    color: 'from-green-500 to-green-700',
    badgeColor: 'bg-green-500',
    icon: '🏆',
    drawSchedule: 'weekly',
    drawDate: 'Every Sunday at 6:00 PM'
  },
  monthly: {
    id: 'monthly',
    labelAm: 'ወርሃዊ',
    labelEn: 'Monthly',
    contribution: 5000,
    prize: 40000000,
    seats: 9600,
    color: 'from-orange-500 to-orange-700',
    badgeColor: 'bg-orange-500',
    icon: '👑',
    drawSchedule: 'monthly',
    drawDate: 'Last Day of Month at 8:00 PM'
  }
};

export const PROGRAM_TABLES = {
  regular: 'regular_pool_participants',
  city: 'city_vip_participants',
  merkato: 'merkato_vip_participants'
};

const DRAW_SCHEDULE_TEXT = {
  daily: { en: 'Daily Draw', am: 'ዕለታዊ እጣ' },
  weekly: { en: 'Weekly Draw', am: 'ሳምንታዊ እጣ' },
  monthly: { en: 'Monthly Draw', am: 'ወርሃዊ እጣ' }
};

// Payment statuses that make a seat unavailable to everybody else.
export const OCCUPIED_STATUSES = ['verified', 'pending_verification', 'pending'];

export function getTierConfig(tierId) {
  if (!tierId) return null;
  return TIERS[tierId] || VIP_POOLS[tierId] || null;
}

export function getTierLabel(tierId, language = 'am') {
  const tier = getTierConfig(tierId);
  if (!tier) return tierId || '';
  return language === 'am' ? tier.labelAm : tier.labelEn;
}

export function getDrawScheduleText(tierId, language = 'am') {
  const tier = getTierConfig(tierId);
  const schedule = tier?.drawSchedule || 'daily';
  const text = DRAW_SCHEDULE_TEXT[schedule] || DRAW_SCHEDULE_TEXT.daily;
  return language === 'am' ? text.am : text.en;
}

// Total seats of a regular pool: explicit column first, otherwise derived from
// the collection target (prize + 20% commission) divided by the entry fee.
export function getRegularPoolSeats(pool) {
  if (!pool) return 0;
  const explicit = Number(pool.total_seats);
  if (Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit);

  const entryFee = Number(pool.entry_fee || pool.ticket_price) || 0;
  const target = Number(pool.target_amount || pool.prize_amount) || 0;
  if (!entryFee || !target) return 0;
  return Math.max(1, Math.floor((target * 1.2) / entryFee));
}

/**
 * Resolve everything the seat map needs for a program.
 * Returns { programType, tierId, city, poolId, table, totalSeats, entryFee,
 *           prize, label, reservationKey }.
 */
export function resolveProgram({ programType, tierId, city, pool, poolId, entryFee, totalSeats, prize } = {}) {
  const type = programType || (pool || poolId ? 'regular' : 'city');
  const tier = getTierConfig(tierId);

  const resolvedSeats =
    Number(totalSeats) > 0
      ? Math.floor(Number(totalSeats))
      : type === 'regular'
        ? getRegularPoolSeats(pool)
        : tier?.seats || 0;

  const resolvedFee =
    Number(entryFee) > 0
      ? Number(entryFee)
      : type === 'regular'
        ? Number(pool?.entry_fee || pool?.ticket_price) || 0
        : tier?.contribution || 0;

  const resolvedPrize =
    Number(prize) > 0
      ? Number(prize)
      : type === 'regular'
        ? Number(pool?.target_amount || pool?.prize_amount) || 0
        : tier?.prize || 0;

  const id = poolId || pool?.id || null;
  const citySlug = city ? String(city).trim() : null;

  return {
    programType: type,
    tierId: tierId || null,
    city: citySlug,
    poolId: id,
    table: PROGRAM_TABLES[type] || PROGRAM_TABLES.regular,
    totalSeats: resolvedSeats,
    entryFee: resolvedFee,
    prize: resolvedPrize,
    label:
      type === 'regular'
        ? pool?.prize_name || 'Regular Pool'
        : type === 'merkato'
          ? 'Merkato VIP'
          : `${citySlug || 'City'} VIP`,
    reservationKey:
      type === 'regular'
        ? `regular_${id || 'unknown'}`
        : `${type}_${citySlug ? `${citySlug}_` : ''}${tierId || 'default'}`
  };
}

function matchesProgramKey(row, tierId) {
  if (!tierId) return true;
  return row.pool_type === tierId || row.tier === tierId;
}

function sameCity(row, city) {
  if (!city) return true;
  const a = String(row.city || '').trim().toLowerCase();
  const b = String(city).trim().toLowerCase();
  return a === b || a.replace(/-/g, ' ') === b.replace(/-/g, ' ');
}

function toSeatNumbers(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : String(value).split(',');
  return list
    .map(n => parseInt(n, 10))
    .filter(n => Number.isFinite(n) && n > 0);
}

/**
 * Seats that are already taken by somebody (any user) for this program.
 * Never throws: on any query problem it returns an empty list plus the error
 * so the caller can warn the user instead of silently showing a broken map.
 */
/**
 * Seats that are already taken by somebody else for this program: confirmed
 * bookings plus seats another user is currently holding.
 * Never throws: on any query problem it returns an empty list plus the error
 * so the caller can warn the user instead of silently showing a broken map.
 */
export async function fetchTakenSeats(program, userId = null) {
  if (!supabase) return { seats: [], error: new Error('Supabase not configured') };

  const { programType, table, tierId, city, poolId } = program;
  const taken = new Set();

  try {
    const holds = await fetchActiveHolds(program, userId);
    holds.forEach(seat => taken.add(seat));

    if (programType === 'regular') {
      const [seatRows, participantRows] = await Promise.all([
        supabase.from('pool_seats').select('seat_number, status').eq('pool_id', poolId),
        supabase.from(table).select('seat_numbers, payment_status').eq('pool_id', poolId)
      ]);

      (seatRows.data || [])
        .filter(row => row.status === 'taken')
        .forEach(row => {
          const seat = parseInt(row.seat_number, 10);
          if (Number.isFinite(seat)) taken.add(seat);
        });

      (participantRows.data || [])
        .filter(row => OCCUPIED_STATUSES.includes(row.payment_status))
        .forEach(row => toSeatNumbers(row.seat_numbers).forEach(seat => taken.add(seat)));

      const error = seatRows.error && participantRows.error ? participantRows.error : null;
      return { seats: [...taken].sort((a, b) => a - b), error };
    }

    // City VIP / Merkato VIP: participants carry the seats, and the program is
    // identified by pool_type (older rows) or tier (newer rows).
    let query = supabase.from(table).select('seat_numbers, payment_status, pool_type, tier, city');
    if (city && programType === 'city') query = query.ilike('city', String(city).trim());

    let { data, error } = await query;

    if (error) {
      // Older deployments may not have the tier column yet.
      const retry = await supabase.from(table).select('seat_numbers, payment_status, pool_type, city');
      data = retry.data;
      error = retry.error;
    }

    if (error) return { seats: [...taken].sort((a, b) => a - b), error };

    (data || [])
      .filter(row => OCCUPIED_STATUSES.includes(row.payment_status))
      .filter(row => matchesProgramKey(row, tierId))
      .filter(row => (programType === 'city' ? sameCity(row, city) : true))
      .forEach(row => toSeatNumbers(row.seat_numbers).forEach(seat => taken.add(seat)));

    return { seats: [...taken].sort((a, b) => a - b), error: null };
  } catch (err) {
    return { seats: [], error: err };
  }
}

// Seats another user is holding while they complete their payment.
async function fetchActiveHolds(program, userId) {
  const { data, error } = await supabase
    .from('vip_seat_reservations')
    .select('seat_number, user_id, expires_at')
    .eq('pool_id', program.reservationKey)
    .gt('expires_at', new Date().toISOString());

  if (error) return [];

  return (data || [])
    .filter(row => !userId || row.user_id !== userId)
    .map(row => parseInt(row.seat_number, 10))
    .filter(seat => Number.isFinite(seat));
}

export const RESERVATION_MINUTES = 10;

/**
 * Hold seats for the current user while they pay. Holds are best effort: when
 * the reservation table is missing the selection still works, and the seats are
 * claimed for real when the participant row is created.
 */
export async function reserveSeats(program, userId, seatNumbers) {
  if (!supabase || !userId || seatNumbers.length === 0) return { ok: true, persisted: false };

  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000).toISOString();
  const rows = seatNumbers.map(seat => ({
    pool_id: program.reservationKey,
    seat_number: seat,
    user_id: userId,
    expires_at: expiresAt,
    created_at: new Date().toISOString()
  }));

  try {
    const { error } = await supabase.from('vip_seat_reservations').insert(rows);
    if (!error) return { ok: true, persisted: true };

    if (error.code !== '23505') {
      // Table missing or any other problem: do not block the booking.
      return { ok: true, persisted: false, error };
    }

    // Somebody holds one of these seats - unless the hold is ours or expired.
    const { data: existing } = await supabase
      .from('vip_seat_reservations')
      .select('seat_number, user_id, expires_at')
      .eq('pool_id', program.reservationKey)
      .in('seat_number', seatNumbers);

    const now = Date.now();
    const blocked = (existing || []).filter(
      row => row.user_id !== userId && new Date(row.expires_at).getTime() > now
    );
    if (blocked.length > 0) return { ok: false, persisted: false, error };

    const stale = (existing || []).map(row => row.seat_number);
    if (stale.length > 0) {
      await supabase
        .from('vip_seat_reservations')
        .delete()
        .eq('pool_id', program.reservationKey)
        .in('seat_number', stale);
      const retry = await supabase.from('vip_seat_reservations').insert(rows);
      return { ok: !retry.error, persisted: !retry.error, error: retry.error || null };
    }

    return { ok: true, persisted: false, error };
  } catch (err) {
    return { ok: true, persisted: false, error: err };
  }
}

export async function releaseSeats(program, userId, seatNumbers = null) {
  if (!supabase || !userId) return;

  try {
    let query = supabase
      .from('vip_seat_reservations')
      .delete()
      .eq('pool_id', program.reservationKey)
      .eq('user_id', userId);

    if (seatNumbers?.length) query = query.in('seat_number', seatNumbers);
    await query;
  } catch (err) {
    console.error('Failed to release seats:', err);
  }
}

export async function fetchOwnReservations(program, userId) {
  if (!supabase || !userId) return [];

  try {
    const { data } = await supabase
      .from('vip_seat_reservations')
      .select('seat_number')
      .eq('pool_id', program.reservationKey)
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString());
    return toSeatNumbers((data || []).map(row => row.seat_number));
  } catch (err) {
    return [];
  }
}

export function buildTicketNumber(program) {
  const prefix =
    program.programType === 'merkato'
      ? 'MK'
      : program.programType === 'city'
        ? 'CT'
        : 'POOL';
  const tierPart = program.tierId ? `-${String(program.tierId).toUpperCase()}` : '';
  return `${prefix}${tierPart}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
