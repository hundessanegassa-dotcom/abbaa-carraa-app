import Link from 'next/link';

export default function Custom500() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-red-600 mb-4">500</h1>
        <h2 className="text-2xl font-semibold mb-4">Server-side error occurred</h2>
        <p className="text-gray-500 mb-6">Something went wrong on our end. Please try again later.</p>
        <Link href="/" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
          Go back home
        </Link>
      </div>
    </div>
  );
}
