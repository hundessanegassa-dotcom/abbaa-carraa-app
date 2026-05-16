export default function LoadingSpinner({ fullPage = false, message = 'Loading...' }) {
  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-3 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
      <span className="ml-3 text-gray-500">{message}</span>
    </div>
  );
}
