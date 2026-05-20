import { useRouter } from 'next/router';
import Link from 'next/link';

export default function MobileHeader({ title }) {
  const router = useRouter();
  const showBackButton = router.pathname !== '/';

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {showBackButton && (
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <Link href="/" className="flex items-center gap-1">
          <span className="text-2xl">🎁</span>
          <span className="font-bold text-lg text-green-600 hidden sm:inline">Abbaa Carraa</span>
        </Link>
      </div>
      
      <div className="text-base font-semibold text-gray-800 truncate max-w-[180px] sm:max-w-[250px]">
        {title}
      </div>
      
      <div className="w-10" />
    </div>
  );
}
