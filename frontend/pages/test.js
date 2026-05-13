export default function Test() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-green-600">Test Page Works</h1>
        <p className="mt-2 text-gray-600">If you see this, the app is loading correctly.</p>
        <div className="mt-4">
          <a href="/dashboard" className="text-blue-600 hover:underline">Go to Dashboard</a>
          <span className="mx-2">|</span>
          <a href="/login" className="text-blue-600 hover:underline">Login</a>
        </div>
      </div>
    </div>
  );
}
