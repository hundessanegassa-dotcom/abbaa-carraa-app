{/* Shareable Links for Pools */}
<div className="bg-white rounded-lg shadow p-6 mb-8">
  <h2 className="text-xl font-bold mb-4">📱 Share Your Pools</h2>
  <p className="text-gray-600 mb-4">Share your pools via WhatsApp or copy the link to promote on social media.</p>
  <div className="flex flex-wrap gap-4">
    {recentPools.slice(0, 3).map(pool => (
      <div key={pool.id} className="border rounded-lg p-4 text-center w-48">
        <p className="text-sm font-semibold truncate">{pool.prize_name}</p>
        <p className="text-xs text-gray-500 mb-2">ETB {pool.contribution_amount}/entry</p>
        <button
          onClick={() => setSelectedPoolForQR(selectedPoolForQR === pool.id ? null : pool.id)}
          className="w-full bg-gray-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-700 mb-2"
        >
          {selectedPoolForQR === pool.id ? 'Hide Link' : 'Show Share Link'}
        </button>
        {selectedPoolForQR === pool.id && (
          <div className="mt-3 p-2 bg-gray-100 rounded text-center">
            <p className="text-xs text-gray-600 break-all">
              {`${window.location.origin}/pools/${pool.id}`}
            </p>
            <button
              onClick={() => {
                const poolUrl = `${window.location.origin}/pools/${pool.id}`;
                navigator.clipboard.writeText(poolUrl);
                alert('Link copied!');
              }}
              className="mt-2 bg-green-600 text-white px-2 py-1 rounded text-xs w-full"
            >
              Copy Link
            </button>
          </div>
        )}
        <button
          onClick={() => {
            const poolUrl = `${window.location.origin}/pools/${pool.id}`;
            const text = `🎁 Join my pool to win ${pool.prize_name}! Only ETB ${pool.contribution_amount} to enter. Let's win together!`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + poolUrl)}`, '_blank');
          }}
          className="w-full bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700"
        >
          Share via WhatsApp
        </button>
      </div>
    ))}
  </div>
</div>
