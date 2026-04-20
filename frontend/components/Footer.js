import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-12 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-3">Abbaa Carraa</h3>
            <p className="text-gray-400 text-sm">Community-driven prize and contribution platform</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-white">FAQ</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-white">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Developer</h3>
            <p className="text-gray-400 text-sm">Negassa Hundessa</p>
            <p className="text-gray-400 text-sm">📍 Ambo, Ethiopia</p>
            <p className="text-gray-400 text-sm">📞 0930330323</p>
            <p className="text-gray-400 text-sm">✉️ hundessanegassa@gmail.com</p>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-6 pt-4 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Abbaa Carraa. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
