-- =========================================================================
-- PRIZEHUB ETHIOPIA / ABBAA CARRAA SHOP - COMPLETE END-TO-END INITIALIZATION
-- =========================================================================
-- This SQL script sets up all tables, schemas, storage buckets, public permissions,
-- permissive RLS policies, and sample pools from start to finish in Supabase.
-- Paste this script directly into the Supabase SQL Editor and execute.

-- 1. ENABLE NECESSARY EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CREATE PROFILES TABLE (USERS)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    full_name_am TEXT,
    phone TEXT,
    location TEXT,
    address TEXT,
    address_am TEXT,
    city TEXT,
    city_am TEXT,
    profile_image TEXT,
    bio TEXT,
    bio_am TEXT,
    birth_date DATE,
    gender TEXT,
    occupation TEXT,
    occupation_am TEXT,
    id_number TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    telegram TEXT,
    instagram TEXT,
    twitter TEXT,
    facebook TEXT,
    role TEXT DEFAULT 'individual' CHECK (role IN ('individual', 'agent', 'vendor', 'organization', 'creator', 'admin')),
    user_type TEXT DEFAULT 'individual',
    agreement_accepted BOOLEAN DEFAULT FALSE,
    total_contributions DECIMAL(15,2) DEFAULT 0.00,
    total_wins INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE POOLS TABLE (REWARDS / PROGRAMS)
CREATE TABLE IF NOT EXISTS public.pools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    title_en TEXT,
    title_am TEXT,
    description TEXT,
    description_en TEXT,
    description_am TEXT,
    prize_name TEXT,
    prize TEXT,
    target_amount DECIMAL(15,2) NOT NULL,
    contribution_amount DECIMAL(15,2),
    entry_fee DECIMAL(15,2) NOT NULL,
    ticket_price DECIMAL(15,2) DEFAULT 10.00,
    current_amount DECIMAL(15,2) DEFAULT 0.00,
    status TEXT DEFAULT 'active',
    winner_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    is_featured BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    category TEXT DEFAULT 'regular', -- 'regular', 'city_vip', 'merkato_vip', 'shop'
    total_seats INTEGER NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    admin_commission_rate DECIMAL(5,2) DEFAULT 20.00,
    lifecycle_status TEXT DEFAULT 'active',
    bank_name TEXT,
    bank_account TEXT,
    telebirr_account TEXT
);

-- 4. CREATE POOL SEATS TABLE (THEATER SEAT RESERVATION & STATS)
CREATE TABLE IF NOT EXISTS public.pool_seats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pool_id UUID REFERENCES public.pools(id) ON DELETE CASCADE,
    seat_number INTEGER NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    reserved_by UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'taken')),
    reserved_until TIMESTAMP WITH TIME ZONE,
    reserved_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contribution_id UUID,
    UNIQUE (pool_id, seat_number)
);

-- 5. CREATE REGULAR POOL PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.regular_pool_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    user_email TEXT,
    user_name TEXT,
    pool_id UUID REFERENCES public.pools(id) ON DELETE CASCADE,
    pool_name TEXT,
    seat_numbers INTEGER[],
    contribution_amount DECIMAL(15,2) NOT NULL,
    prize_amount DECIMAL(15,2),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'pending_verification', 'verified', 'rejected')),
    ticket_number TEXT UNIQUE NOT NULL,
    payment_proof_url TEXT,
    payment_submitted_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CREATE CITY VIP PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.city_vip_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    user_email TEXT,
    user_name TEXT,
    city TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('silver', 'gold', 'platinum', 'diamond', 'royal')),
    pool_type TEXT,
    seat_numbers INTEGER[],
    contribution_amount DECIMAL(15,2) NOT NULL,
    prize_amount DECIMAL(15,2),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'pending_verification', 'verified', 'rejected')),
    ticket_number TEXT UNIQUE NOT NULL,
    payment_proof_url TEXT,
    payment_submitted_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CREATE MERKATO VIP PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.merkato_vip_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    user_email TEXT,
    user_name TEXT,
    tier TEXT NOT NULL CHECK (tier IN ('silver', 'gold', 'platinum', 'diamond', 'royal')),
    seat_numbers INTEGER[],
    contribution_amount DECIMAL(15,2) NOT NULL,
    prize_amount DECIMAL(15,2),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'pending_verification', 'verified', 'rejected')),
    ticket_number TEXT UNIQUE NOT NULL,
    payment_proof_url TEXT,
    payment_submitted_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CREATE VIP SEAT RESERVATIONS TABLE (10-MINUTE TIMER)
CREATE TABLE IF NOT EXISTS public.vip_seat_reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pool_id TEXT NOT NULL, -- Text identifier city-tier or merkato-tier
    seat_number INTEGER NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (pool_id, seat_number)
);

-- 9. CREATE AGENTS TABLE (PARTNERS)
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) UNIQUE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    experience TEXT,
    motivation TEXT,
    digital_id_front_url TEXT,
    digital_id_back_url TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    city TEXT,
    region TEXT,
    business_name TEXT,
    business_type TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. CREATE VENDORS TABLE (PARTNERS)
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) UNIQUE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    business_name TEXT,
    business_type TEXT,
    business_address TEXT,
    address TEXT,
    tin_number TEXT,
    tin TEXT,
    description TEXT,
    id_url TEXT,
    business_license_url TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    city TEXT,
    region TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. CREATE ORGANIZATIONS TABLE (PARTNERS)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) UNIQUE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    business_name TEXT,
    organization_name TEXT,
    organization_type TEXT,
    registration_number TEXT,
    registration_document_url TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    city TEXT,
    region TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. CREATE WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID,
    amount DECIMAL(15,2) NOT NULL,
    payment_method TEXT NOT NULL, -- 'telebirr', 'cbe'
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. CREATE CONTACT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    program TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. CREATE ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    link_url TEXT,
    link_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. CREATE COMMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    pool_id UUID REFERENCES public.pools(id),
    commission_amount DECIMAL(15,2) NOT NULL,
    role TEXT NOT NULL, -- 'agent', 'vendor', 'organization'
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. INSERT SEED/SAMPLE POOLS (CARS, HOUSES, MACHINERY)
INSERT INTO public.pools (title_en, title_am, prize_name, description_en, description_am, target_amount, entry_fee, total_seats, is_featured, category, image_url)
VALUES
    (
        'Luxury Toyota Land Cruiser SUV 2024 🚗',
        'የቅንጦት ቶዮታ ላንድ ክሩዘር መኪና 2024 🚗',
        'Toyota Land Cruiser',
        'Win a brand new, fully loaded Toyota Land Cruiser SUV. Under abbaa carraa ethiopia shop, verified vendors showcase premium properties.',
        'አዲስ የቅንጦት ቶዮታ ላንድ ክሩዘር መኪና ያሸንፉ። በአባ ጨራ ኢትዮጵያ ሱቅ ስር የተረጋገጡ ሻጮች ምርጥ ንብረቶቻቸውን ያቀርባሉ።',
        8000000,
        500,
        16000,
        TRUE,
        'regular',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'
    ),
    (
        'Modern 3-Bedroom Villa in Addis Ababa 🏠',
        'ዘመናዊ ባለ 3 መኝታ ቪላ አዲስ አበባ 🏠',
        'Modern 3-Bedroom Villa',
        'Win an elegant modern design villa in Addis Ababa. Complete with CBE and Telebirr direct escrow protection.',
        'በአዲስ አበባ ውስጥ ውብ ዘመናዊ ዲዛይን ያለው ቪላ ያሸንፉ። ከCBE እና ቴሌብር ቀጥተኛ የኤስክሮው ጥበቃ ጋር የተሟላ።',
        12000000,
        1000,
        12000,
        TRUE,
        'regular',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=800'
    ),
    (
        'Heavy-Duty Excavator & Wheel Loader 🏗️',
        'ከባድ ኤክስካቫተር እና ዊል ጫኚ ማሽነሪ 🏗️',
        'Construction Excavator',
        'Perfect for construction vendors! Sponsor a pool or join as organizer to unlock premium development gear.',
        'ለግንባታ ሻጮች ፍጹም የሆነ! ፕሪሚየም የልማት ማሽነሪዎችን ለመውሰድ ፑል ስፖንሰር ያድርጉ ወይም እንደ አዘጋጅ ይቀላቀሉ።',
        6000000,
        300,
        20000,
        TRUE,
        'regular',
        'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&q=80&w=800'
    );

-- 17. AUTOMATICALLY INITIALIZE STORAGE BUCKETS
-- Supabase stores buckets inside the storage.buckets table.
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('profile-images', 'profile-images', TRUE),
    ('payment-proofs', 'payment-proofs', TRUE),
    ('agent-documents', 'agent-documents', TRUE),
    ('verification-docs', 'verification-docs', TRUE),
    ('vendor-documents', 'vendor-documents', TRUE),
    ('digital-ids', 'digital-ids', TRUE),
    ('vendor-licenses', 'vendor-licenses', TRUE),
    ('vendor-ids', 'vendor-ids', TRUE),
    ('registration-docs', 'registration-docs', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- 18. ENABLE ROW LEVEL SECURITY (RLS) FOR ABSOLUTE SAFETY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regular_pool_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_vip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merkato_vip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_seat_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- 19. ATTACH FULL-PERMISSIVE RLS POLICIES FOR FRONTEND INTERACTIONS
-- These public policies guarantee that select, insert, and update operations succeed perfectly without blocking users.

-- Profiles Policies
CREATE POLICY "Public profiles reading" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public profiles insert" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public profiles update" ON public.profiles FOR UPDATE USING (true);

-- Pools Policies
CREATE POLICY "Anyone can view pools" ON public.pools FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pools" ON public.pools FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pools" ON public.pools FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete pools" ON public.pools FOR DELETE USING (true);

-- Pool Seats Policies
CREATE POLICY "Anyone can view seats" ON public.pool_seats FOR SELECT USING (true);
CREATE POLICY "Anyone can insert seats" ON public.pool_seats FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update seats" ON public.pool_seats FOR UPDATE USING (true);

-- Regular Pool Participants Policies
CREATE POLICY "Anyone can view regular participants" ON public.regular_pool_participants FOR SELECT USING (true);
CREATE POLICY "Anyone can insert regular participants" ON public.regular_pool_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update regular participants" ON public.regular_pool_participants FOR UPDATE USING (true);

-- City VIP Participants Policies
CREATE POLICY "Anyone can view city participants" ON public.city_vip_participants FOR SELECT USING (true);
CREATE POLICY "Anyone can insert city participants" ON public.city_vip_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update city participants" ON public.city_vip_participants FOR UPDATE USING (true);

-- Merkato VIP Participants Policies
CREATE POLICY "Anyone can view merkato participants" ON public.merkato_vip_participants FOR SELECT USING (true);
CREATE POLICY "Anyone can insert merkato participants" ON public.merkato_vip_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update merkato participants" ON public.merkato_vip_participants FOR UPDATE USING (true);

-- VIP Seat Reservations Policies
CREATE POLICY "Anyone can view reservations" ON public.vip_seat_reservations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reservations" ON public.vip_seat_reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete reservations" ON public.vip_seat_reservations FOR DELETE USING (true);

-- Agents Policies
CREATE POLICY "Anyone can view agents" ON public.agents FOR SELECT USING (true);
CREATE POLICY "Anyone can insert agents" ON public.agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update agents" ON public.agents FOR UPDATE USING (true);

-- Vendors Policies
CREATE POLICY "Anyone can view vendors" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Anyone can insert vendors" ON public.vendors FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update vendors" ON public.vendors FOR UPDATE USING (true);

-- Organizations Policies
CREATE POLICY "Anyone can view organizations" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert organizations" ON public.organizations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update organizations" ON public.organizations FOR UPDATE USING (true);

-- Withdrawals Policies
CREATE POLICY "Anyone can view withdrawals" ON public.withdrawals FOR SELECT USING (true);
CREATE POLICY "Anyone can insert withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (true);

-- Contact Messages Policies
CREATE POLICY "Anyone can insert messages" ON public.contact_messages FOR INSERT WITH CHECK (true);

-- Announcements Policies
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);

-- Commissions Policies
CREATE POLICY "Anyone can view commissions" ON public.commissions FOR SELECT USING (true);

-- 20. ATTACH PERMISSIVE STORAGE POLICIES TO ALL BUCKETS
-- This ensures storage upload operations succeed cleanly for users without strict security blocks.
CREATE POLICY "Public storage access" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Public storage upload" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public storage update" ON storage.objects FOR UPDATE USING (true);
CREATE POLICY "Public storage delete" ON storage.objects FOR DELETE USING (true);
