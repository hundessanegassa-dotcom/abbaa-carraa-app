-- Seat selection + payment verification schema (idempotent).
-- Run in the Supabase SQL editor. Safe to re-run: everything is IF NOT EXISTS
-- and no existing column or row is modified.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Regular pools
-- ---------------------------------------------------------------------------
ALTER TABLE public.pools ADD COLUMN IF NOT EXISTS total_seats INTEGER;
ALTER TABLE public.pools ADD COLUMN IF NOT EXISTS entry_fee DECIMAL(12,2);

CREATE TABLE IF NOT EXISTS public.pool_seats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pool_id UUID NOT NULL,
    seat_number INTEGER NOT NULL,
    status TEXT DEFAULT 'available',      -- available | reserved | taken
    user_id UUID,
    reserved_by UUID,
    reserved_at TIMESTAMPTZ,
    reserved_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (pool_id, seat_number)
);

-- ---------------------------------------------------------------------------
-- Short lived seat holds for City VIP / Merkato VIP
-- pool_id holds the program key, e.g. city_Adama_gold or merkato_daily
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vip_seat_reservations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pool_id TEXT NOT NULL,
    seat_number INTEGER NOT NULL,
    user_id UUID NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (pool_id, seat_number)
);

CREATE INDEX IF NOT EXISTS vip_seat_reservations_expiry_idx
    ON public.vip_seat_reservations (pool_id, expires_at);

-- ---------------------------------------------------------------------------
-- Participants (one row per booking)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.regular_pool_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_email TEXT,
    user_name TEXT,
    pool_id UUID,
    pool_name TEXT,
    seat_numbers INTEGER[] DEFAULT '{}',
    contribution_amount DECIMAL(12,2),
    prize_amount DECIMAL(14,2),
    payment_status TEXT DEFAULT 'pending',   -- pending | pending_verification | verified | rejected
    payment_proof_url TEXT,
    payment_submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    ticket_number TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.city_vip_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_email TEXT,
    user_name TEXT,
    city TEXT,
    tier TEXT,
    pool_type TEXT,
    seat_numbers INTEGER[] DEFAULT '{}',
    contribution_amount DECIMAL(12,2),
    prize_amount DECIMAL(14,2),
    payment_status TEXT DEFAULT 'pending',
    payment_proof_url TEXT,
    payment_submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    ticket_number TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.merkato_vip_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_email TEXT,
    user_name TEXT,
    city TEXT DEFAULT 'Merkato',
    tier TEXT,
    pool_type TEXT,
    seat_numbers INTEGER[] DEFAULT '{}',
    contribution_amount DECIMAL(12,2),
    prize_amount DECIMAL(14,2),
    payment_status TEXT DEFAULT 'pending',
    payment_proof_url TEXT,
    payment_submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    ticket_number TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Columns added over time - safe on existing deployments.
ALTER TABLE public.city_vip_participants ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE public.city_vip_participants ADD COLUMN IF NOT EXISTS pool_type TEXT;
ALTER TABLE public.merkato_vip_participants ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE public.merkato_vip_participants ADD COLUMN IF NOT EXISTS pool_type TEXT;

DO $$
DECLARE
    participant_table TEXT;
BEGIN
    FOREACH participant_table IN ARRAY ARRAY[
        'regular_pool_participants',
        'city_vip_participants',
        'merkato_vip_participants'
    ] LOOP
        EXECUTE format(
            'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS payment_proof_url TEXT', participant_table);
        EXECUTE format(
            'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS payment_submitted_at TIMESTAMPTZ', participant_table);
        EXECUTE format(
            'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ', participant_table);
        EXECUTE format(
            'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS verified_by UUID', participant_table);
        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS %I ON public.%I (payment_status)',
            participant_table || '_payment_status_idx', participant_table);
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Admin inbox for submitted payment screenshots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT,
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Storage bucket for the payment screenshots uploaded inside the app
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
          AND policyname = 'Authenticated users upload payment proofs'
    ) THEN
        CREATE POLICY "Authenticated users upload payment proofs"
            ON storage.objects FOR INSERT TO authenticated
            WITH CHECK (bucket_id = 'payment-proofs');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
          AND policyname = 'Payment proofs are readable'
    ) THEN
        CREATE POLICY "Payment proofs are readable"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'payment-proofs');
    END IF;
END $$;
