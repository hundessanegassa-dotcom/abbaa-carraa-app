-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT UNIQUE,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'agent', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_contributions DECIMAL(10,2) DEFAULT 0,
    total_wins INTEGER DEFAULT 0
);

-- Pools table
CREATE TABLE IF NOT EXISTS public.pools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    prize_name TEXT NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    contribution_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'active',
    winner_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_featured BOOLEAN DEFAULT FALSE
);

-- Contributions table
CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    pool_id UUID REFERENCES public.pools(id) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample pools
INSERT INTO public.pools (name, description, prize_name, target_amount, contribution_amount, is_featured)
VALUES 
    ('Toyota Vitz 2015', 'Win a reliable Toyota Vitz in excellent condition', 'Toyota Vitz 2015', 500000, 1000, TRUE),
    ('Block Making Machine', 'Industrial block making machine for construction', 'QT4-25 Block Machine', 300000, 500, TRUE),
    ('Dell XPS Laptop', 'Premium laptop for professionals and students', 'Dell XPS 15', 150000, 250, FALSE);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Anyone can view active pools" ON public.pools FOR SELECT USING (status = 'active');
CREATE POLICY "Users can view own contributions" ON public.contributions FOR SELECT USING (auth.uid() = user_id);