// components/AdminSkeleton.js
export default function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="bg-gray-200 h-32"></div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-gray-200 h-24 rounded-xl"></div>
          ))}
        </div>
        <div className="mt-8 bg-gray-200 h-64 rounded-xl"></div>
      </div>
    </div>
  );
}
