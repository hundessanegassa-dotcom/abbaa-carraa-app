import Link from 'next/link';

export default function CharityBanner() {
  // No localStorage at all – banner always shows unless manually dismissed in this session
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-pink-500 to-red-600 text-white" style={{ minHeight: '44px' }}>
      <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-2">
        <div className="flex items-center gap-1">
          <span className="text-sm">❤️</span>
          <span className="text-sm">💚</span>
          <span className="text-sm">❤️</span>
        </div>
        <div className="text-center text-xs">
          <span className="font-bold">2% of income</span>
          <span> → </span>
          <span>Fighting kidney & heart disease</span>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/about#charity" className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full text-xs">
            Join →
          </Link>
          <button 
            onClick={() => setDismissed(true)} 
            className="text-white/70 hover:text-white text-sm px-1"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
