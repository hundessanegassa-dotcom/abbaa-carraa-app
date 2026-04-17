import Link from 'next/link';

export default function AgentPending() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h1>
          <p className="text-gray-600 mb-4">
            Thank you for applying to become an Abbaa Carraa agent.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-bold mb-2">📋 What's Next?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✓ Our team will review your application within 24-48 hours</li>
              <li>✓ You will receive an email notification once approved</li>
              <li>✓ After approval, you can start creating listings and prize pools</li>
              <li>✓ You can earn 10% commission on every pool you create</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                Browse Prize Pools
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="border border-green-600 text-green-600 px-6 py-2 rounded-lg hover:bg-green-50">
                Go to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
