import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-green-400">Abbaa Carraa</h3>
            <p className="text-gray-400 text-sm">
              A community-driven prize platform built for fairness, transparency, and empowerment.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-400 hover:text-green-400">Home</Link></li>
              <li><Link href="/listings" className="text-gray-400 hover:text-green-400">Prizes</Link></li>
              <li><Link href="/winners" className="text-gray-400 hover:text-green-400">Winners</Link></li>
              <li><Link href="/create-pool" className="text-gray-400 hover:text-green-400">Create Pool</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faq" className="text-gray-400 hover:text-green-400">FAQ</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-green-400">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-green-400">Contact</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-green-400">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-green-400">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Developer Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Developer</h3>
            <p className="text-gray-400 text-sm">Negassa Hundessa</p>
            <p className="text-gray-400 text-sm">📍 Ambo, Ethiopia</p>
            <p className="text-gray-400 text-sm">📞 0930330323</p>
            <p className="text-gray-400 text-sm">✉️ hundessanegassa@gmail.com</p>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Abbaa Carraa. All rights reserved.</p>
          <p className="mt-1">Built with ❤️ by Negassa Hundessa</p>
        </div>
      </div>
    </footer>
  );
}
