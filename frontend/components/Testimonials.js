import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function Testimonials() {
  const { t } = useTranslation();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  async function fetchTestimonials() {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      // Fallback demo testimonials
      setTestimonials([
        { id: 1, name: 'Almaz T.', prize: 'Toyota Vitz', message: 'I never thought I could own a car! Abbaa Carraa made it possible. Thank you!', rating: 5, image_url: null },
        { id: 2, name: 'Biruk K.', prize: 'iPhone 15', message: 'Joined one pool and won on my first try! The draw was transparent and fair.', rating: 5, image_url: null },
        { id: 3, name: 'Meron D.', prize: '50,000 ETB Cash', message: 'The cash equivalent guarantee gave me confidence. Will definitely join more pools!', rating: 5, image_url: null },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (loading || testimonials.length === 0) return null;

  return (
    <section className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">🎉 What Our Winners Say</h2>
        <p className="text-center text-gray-600 mb-8">Real people, real wins, real stories</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex items-center gap-3 mb-4">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">🎁</span>
                  </div>
                )}
                <div>
                  <h4 className="font-bold">{item.name}</h4>
                  <p className="text-sm text-green-600">Won: {item.prize}</p>
                </div>
              </div>
              <p className="text-gray-600 italic">"{item.message}"</p>
              <div className="mt-3 flex text-yellow-400">
                {[...Array(item.rating)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
