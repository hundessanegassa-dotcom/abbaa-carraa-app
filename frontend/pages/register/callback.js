import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function RegisterCallback() {
  const router = useRouter();

  useEffect(() => {
    // This page just processes the callback and redirects
    // The main register.js useEffect will handle the profile creation
    router.replace('/register');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  );
}
