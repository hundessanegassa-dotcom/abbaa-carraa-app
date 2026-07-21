// pages/creator/dashboard.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '../../components/DashboardLayout';
import CreatorDashboard from '../../components/CreatorDashboard';
import LoadingSpinner from '../../components/LoadingSpinner';
import NoSSR from '../../components/NoSSR';

export default function CreatorDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState('am');

    useEffect(() => {
        const savedLang = localStorage.getItem('appLanguage');
        if (savedLang === 'am' || savedLang === 'en') {
            setLanguage(savedLang);
        }
        checkUser();
    }, []);

    const toggleLanguage = () => {
        const newLang = language === 'am' ? 'en' : 'am';
        setLanguage(newLang);
        localStorage.setItem('appLanguage', newLang);
    };

    const checkUser = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);

            // Check if user is a creator
            const { data: creator, error: creatorError } = await supabase
                .from('pool_creators')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (creatorError) {
                console.error('Error checking creator status:', creatorError);
            }

            if (!creator) {
                // User is not a creator, redirect to become one
                router.push('/creator/apply');
                return;
            }

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();
            setProfile(profileData);

        } catch (error) {
            console.error('Error checking user:', error);
            toast.error('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullPage message={language === 'am' ? 'በመጫን ላይ...' : 'Loading...'} />;
    }

    return (
        <NoSSR>
            <>
                <Head>
                    <title>{language === 'am' ? 'የፈጣሪ ዳሽቦርድ' : 'Creator Dashboard'} - Abbaa Carraa</title>
                </Head>

                <DashboardLayout
                    title={language === 'am' ? '🏪 የእኔ የፑል መደብር' : '🏪 My Pool Shop'}
                    subtitle={language === 'am' 
                        ? 'ፑሎችዎን ያስተዳድሩ እና ገቢዎን ይከታተሉ'
                        : 'Manage your pools and track earnings'}
                    icon="🏪"
                    bgGradient="from-green-600 to-teal-500"
                    user={user}
                    profile={profile}
                    language={language}
                    toggleLanguage={toggleLanguage}
                >
                    <CreatorDashboard userId={user?.id} language={language} />
                </DashboardLayout>
            </>
        </NoSSR>
    );
}
