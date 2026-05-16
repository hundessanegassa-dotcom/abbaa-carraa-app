import { useRouter } from 'next/router';
import Link from 'next/link';

export default function BackButton({ fallbackHref = '/dashboard' }) {
  const router = useRouter();
  const handleBack = () => {
    if (window.history.length > 2) router.back();
    else router.push(fallbackHref);
  };
  return (
    <button onClick={handleBack} className="text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1">
      ← Back
    </button>
  );
}
