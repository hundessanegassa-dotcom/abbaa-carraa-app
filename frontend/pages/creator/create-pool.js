// pages/creator/create-pool.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import NoSSR from '../../components/NoSSR';

export default function CreatePool() {
    const router = useRouter();
    const [language, setLanguage] = useState('am');
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [creator, setCreator] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        prize_name: '',
        description: '',
        target_amount: '',
        entry_fee: '',
        start_date: '',
        end_date: '',
        draw_date: '',
        category: 'general',
        prize_image: null,
        image_preview: null,
        terms_accepted: false
    });

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
            const { data: creatorData, error: creatorError } = await supabase
                .from('pool_creators')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (creatorError) {
                console.error('Error checking creator:', creatorError);
            }

            if (!creatorData) {
                toast.error(language === 'am' 
                    ? 'እባክዎ መጀመሪያ እንደ ፈጣሪ ይመዝገቡ' 
                    : 'Please register as a creator first');
                router.push('/creator/apply');
                return;
            }

            setCreator(creatorData);

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

    const handleInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'file') {
            const file = files[0];
            if (file) {
                setFormData(prev => ({
                    ...prev,
                    prize_image: file,
                    image_preview: URL.createObjectURL(file)
                }));
            }
        } else if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Validate form
            if (!formData.prize_name || !formData.target_amount || !formData.entry_fee) {
                toast.error(language === 'am' ? 'እባክዎ ሁሉንም አስፈላጊ መረጃዎች ይሙሉ' : 'Please fill in all required fields');
                setSubmitting(false);
                return;
            }

            if (!formData.terms_accepted) {
                toast.error(language === 'am' ? 'ውሎችን መቀበል አለብዎት' : 'You must accept the terms');
                setSubmitting(false);
                return;
            }

            // Upload image if provided
            let imageUrl = null;
            if (formData.prize_image) {
                const fileExt = formData.prize_image.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('pool-images')
                    .upload(`community-pools/${fileName}`, formData.prize_image);

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('pool-images')
                        .getPublicUrl(`community-pools/${fileName}`);
                    imageUrl = publicUrl;
                }
            }

            // Create pool
            const poolData = {
                creator_id: creator.id,
                is_community_pool: true,
                prize_name: formData.prize_name,
                description: formData.description,
                target_amount: parseFloat(formData.target_amount),
                entry_fee: parseFloat(formData.entry_fee),
                prize_image: imageUrl,
                category: formData.category,
                status: 'active',
                lifecycle_status: 'pending_approval',
                is_approved: false,
                start_date: formData.start_date || new Date().toISOString(),
                end_date: formData.end_date,
                draw_date: formData.draw_date,
                platform_fee_percentage: 10,
                total_collected: 0,
                current_participants: 0
            };

            const { data: pool, error: poolError } = await supabase
                .from('pools')
                .insert(poolData)
                .select()
                .single();

            if (poolError) {
                console.error('Pool creation error:', poolError);
                toast.error(language === 'am' ? 'ፑል መፍጠር አልተቻለም' : 'Failed to create pool');
                setSubmitting(false);
                return;
            }

            // Log activity
            await supabase
                .from('pool_activity_logs')
                .insert({
                    pool_id: pool.id,
                    creator_id: creator.id,
                    action: 'created',
                    details: { 
                        prize_name: formData.prize_name,
                        target_amount: formData.target_amount,
                        entry_fee: formData.entry_fee
                    }
                });

            // Add to approval queue
            await supabase
                .from('pool_approval_queue')
                .insert({
                    pool_id: pool.id,
                    creator_id: creator.id,
                    status: 'pending'
                });

            toast.success(language === 'am' 
                ? '✅ ፑል ተፈጥሯል! ለማጽደቅ ለአስተዳዳሪዎች ተልኳል' 
                : '✅ Pool created! Submitted for admin approval');

            router.push('/creator/dashboard');

        } catch (error) {
            console.error('Error creating pool:', error);
            toast.error(language === 'am' ? 'ፑል መፍጠር አልተቻለም' : 'Failed to create pool');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullPage message={language === 'am' ? 'በመጫን ላይ...' : 'Loading...'} />;
    }

    return (
        <NoSSR>
            <>
                <Head>
                    <title>{language === 'am' ? 'አዲስ ፑል ፍጠር' : 'Create New Pool'} - Abbaa Carraa</title>
                </Head>

                <DashboardLayout
                    title={language === 'am' ? '🚀 አዲስ የእጣ ፑል ፍጠር' : '🚀 Create New Prize Pool'}
                    subtitle={language === 'am' 
                        ? 'የራስዎን ፑል ይፍጠሩ እና 10% ኮሚሽን ያግኙ'
                        : 'Create your own pool and earn 10% commission'}
                    icon="🚀"
                    bgGradient="from-green-600 to-teal-500"
                    user={user}
                    profile={profile}
                    language={language}
                    toggleLanguage={toggleLanguage}
                >
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                            {/* Info Banner */}
                            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 mb-6 border border-green-200">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">💡</span>
                                    <div>
                                        <h4 className="font-bold text-green-800">
                                            {language === 'am' ? 'እንዴት እንደሚሰራ' : 'How It Works'}
                                        </h4>
                                        <ul className="text-sm text-green-700 space-y-1 mt-1">
                                            <li>✅ {language === 'am' ? 'ፑልዎን ይፍጠሩ - ሽልማት፣ የመግቢያ ክፍያ እና መቀመጫዎችን ይምረጡ' : 'Create your pool - set prize, entry fee, and seats'}</li>
                                            <li>✅ {language === 'am' ? 'ሰዎች ይቀላቀሉ - ተሳታፊዎች መቀመጫ ይገዛሉ' : 'People join - participants buy seats'}</li>
                                            <li>✅ {language === 'am' ? '10% ኮሚሽን - ከጠቅላላ ስብስብ 10% ያገኛሉ' : '10% commission - earn from total collection'}</li>
                                            <li>✅ {language === 'am' ? 'እጣ ይወስዱ - የፑልዎን አሸናፊ ይሳሉ' : 'Draw the winner - select the winner of your pool'}</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Prize Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === 'am' ? '🏆 የሽልማት ስም' : '🏆 Prize Name'} *
                                    </label>
                                    <input
                                        type="text"
                                        name="prize_name"
                                        value={formData.prize_name}
                                        onChange={handleInputChange}
                                        placeholder={language === 'am' ? 'ለምሳሌ: አዲስ መኪና' : 'Example: New Car'}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === 'am' ? '📝 መግለጫ' : '📝 Description'}
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                        placeholder={language === 'am' ? 'ስለ ሽልማት ይግለጹ...' : 'Describe the prize...'}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                {/* Target Amount & Entry Fee */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {language === 'am' ? '💰 ጠቅላላ ሽልማት (ETB)' : '💰 Prize Amount (ETB)'} *
                                        </label>
                                        <input
                                            type="number"
                                            name="target_amount"
                                            value={formData.target_amount}
                                            onChange={handleInputChange}
                                            placeholder="50000"
                                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                                            required
                                            min="100"
                                            step="100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {language === 'am' ? '🎫 የመግቢያ ክፍያ (ETB)' : '🎫 Entry Fee (ETB)'} *
                                        </label>
                                        <input
                                            type="number"
                                            name="entry_fee"
                                            value={formData.entry_fee}
                                            onChange={handleInputChange}
                                            placeholder="100"
                                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                                            required
                                            min="10"
                                            step="10"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            {language === 'am' 
                                                ? `በግምት ${formData.target_amount && formData.entry_fee ? Math.floor(parseFloat(formData.target_amount) * 1.2 / parseFloat(formData.entry_fee)) : '?'} መቀመጫዎች`
                                                : `Approximately ${formData.target_amount && formData.entry_fee ? Math.floor(parseFloat(formData.target_amount) * 1.2 / parseFloat(formData.entry_fee)) : '?'} seats`}
                                        </p>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {language === 'am' ? '📅 የመጀመሪያ ቀን' : '📅 Start Date'}
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="start_date"
                                            value={formData.start_date}
                                            onChange={handleInputChange}
                                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {language === 'am' ? '📅 የማብቂያ ቀን' : '📅 End Date'}
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="end_date"
                                            value={formData.end_date}
                                            onChange={handleInputChange}
                                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                </div>

                                {/* Draw Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === 'am' ? '🎯 የእጣ ቀን' : '🎯 Draw Date'}
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="draw_date"
                                        value={formData.draw_date}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                {/* Prize Image */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === 'am' ? '🖼️ የሽልማት ምስል' : '🖼️ Prize Image'}
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="file"
                                            name="prize_image"
                                            accept="image/*"
                                            onChange={handleInputChange}
                                            className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                                        />
                                        {formData.image_preview && (
                                            <div className="w-16 h-16 rounded-lg overflow-hidden border">
                                                <img src={formData.image_preview} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {language === 'am' ? 'ከፍተኛ 5MB (JPEG, PNG)' : 'Max 5MB (JPEG, PNG)'}
                                    </p>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {language === 'am' ? '📂 ምድብ' : '📂 Category'}
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="general">{language === 'am' ? 'አጠቃላይ' : 'General'}</option>
                                        <option value="cars">{language === 'am' ? 'መኪናዎች' : 'Cars'}</option>
                                        <option value="houses">{language === 'am' ? 'ቤቶች' : 'Houses'}</option>
                                        <option value="electronics">{language === 'am' ? 'ኤሌክትሮኒክስ' : 'Electronics'}</option>
                                        <option value="machinery">{language === 'am' ? 'ማሽነሪ' : 'Machinery'}</option>
                                        <option value="cash">{language === 'am' ? 'ጥሬ ገንዘብ' : 'Cash'}</option>
                                    </select>
                                </div>

                                {/* Terms */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            name="terms_accepted"
                                            checked={formData.terms_accepted}
                                            onChange={handleInputChange}
                                            className="mt-1"
                                        />
                                        <div>
                                            <label className="text-sm text-gray-700 font-medium">
                                                {language === 'am' ? 'ውሎችን ተቀብያለሁ' : 'I accept the terms'}
                                            </label>
                                            <p className="text-xs text-gray-500">
                                                {language === 'am' 
                                                    ? '10% ኮሚሽን ከጠቅላላ ስብስብ ላይ ለመድረክ እንደሚከፈል ተስማምቻለሁ'
                                                    : 'I agree to pay 10% commission from total collection to the platform'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white py-3 rounded-xl font-bold text-lg transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            {language === 'am' ? 'በሂደት ላይ...' : 'Processing...'}
                                        </div>
                                    ) : (
                                        language === 'am' ? '🚀 ፑል ፍጠር' : '🚀 Create Pool'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </DashboardLayout>
            </>
        </NoSSR>
    );
}
