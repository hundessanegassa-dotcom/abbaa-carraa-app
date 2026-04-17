import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SocialFooter() {
  const [socialLinks, setSocialLinks] = useState([]);

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  async function fetchSocialLinks() {
    const { data } = await supabase
      .from('social_links')
      .select('*')
      .eq('is_active', true);
    
    if (data) setSocialLinks(data);
  }

  const icons = {
    telegram: '📱',
    facebook: '📘',
    twitter: '🐦',
    instagram: '📷',
    linkedin: '🔗'
  };

  return (
    <div className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold">Abbaa Carraa</h3>
            <p className="text-gray-400 text-sm">Community-driven prize platform</p>
          </div>
          
          <div className="flex space-x-4">
            {socialLinks.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl hover:text-green-400 transition"
                aria-label={link.platform}
              >
                {icons[link.platform] || '🔗'}
              </a>
            ))}
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-6 pt-6 text-center text-gray-400 text-sm">
          <p>&copy; 2024 Abbaa Carraa. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-2">
            <a href="/terms" className="hover:text-green-400">Terms</a>
            <a href="/privacy" className="hover:text-green-400">Privacy</a>
            <a href="/about" className="hover:text-green-400">About</a>
            <a href="/contact" className="hover:text-green-400">Contact</a>
          </div>
        </div>
      </div>
    </div>
  );
}
