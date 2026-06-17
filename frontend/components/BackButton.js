// components/BackButton.js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function BackButton({ fallbackHref = '/' }) {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Check if there's history to go back
    setCanGoBack(window.history.length > 2);
  }, []);

  const handleClick = () => {
    if (canGoBack) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1 text-sm bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm hover:shadow-md border border-gray-200"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span>Back</span>
    </button>
  );
}
