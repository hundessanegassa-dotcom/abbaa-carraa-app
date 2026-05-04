import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Testimonials() {
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
      
      if (data && data.length > 0) {
        setTestimonials(data);
      } else {
        // Fallback demo testimonials
        setTestimonials([
          { id: 1, name: 'Almaz T.', prize: 'Toyota Vitz', message: 'I never thought I could own a car! Abbaa Carraa made it possible. Thank you!', rating: 5 },
          { id: 2, name: 'Biruk K.', prize: 'iPhone 15', message: 'Joined one pool and won on my first try! The draw was transparent and fair.', rating: 5 },
          { id: 3, name: 'Meron D.', prize: '50,000 ETB Cash', message: 'The cash equivalent guarantee gave me confidence. Will definitely join more pools!', rating: 5 },
        ]);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || testimonials.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            🎉 What Our Winners Say
          </h2>
          <p className="text-gray-500 text-lg">Real people, real wins, real stories</p>
          <div className="w-24 h-1 bg-green-500 mx-auto mt-4 rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-4">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-full object-cover border-2 border-green-500" />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl text-white">🎁</span>
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">{item.name}</h4>
                  <p className="text-green-600 text-sm font-semibold">🏆 Won: {item.prize}</p>
                </div>
              </div>
              <p className="text-gray-600 italic leading-relaxed">"{item.message}"</p>
              <div className="mt-4 flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-lg">{i < item.rating ? '★' : '☆'}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
