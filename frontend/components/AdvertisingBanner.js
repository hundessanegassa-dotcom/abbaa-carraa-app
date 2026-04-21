import Link from 'next/link';

export default function AdvertisingBanner() {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8 my-4">
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <span className="text-5xl mb-3 block">🎁</span>
            <h3 className="text-2xl font-bold mb-2">Special Promotion!</h3>
            <p className="text-sm opacity-90">Register today and get 10% bonus on your first pool creation</p>
          </div>
          <div className="flex-1">
            <span className="text-5xl mb-3 block">🏆</span>
            <h3 className="text-2xl font-bold mb-2">Winner's Circle</h3>
            <p className="text-sm opacity-90">See our recent winners and their amazing prizes</p>
          </div>
          <div>
            <Link href="/register">
              <button className="bg-white text-purple-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition">
                Claim Offer →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
