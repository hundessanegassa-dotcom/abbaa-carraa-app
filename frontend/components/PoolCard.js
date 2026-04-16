import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function PoolCard({ pool, featured = false }) {
  const progress = (pool.current_amount / pool.target_amount) * 100;

  return (
    <div className={`card ${featured ? 'ring-2 ring-green-500' : ''}`}>
      {featured && (
        <div className="bg-green-600 text-white text-center py-1 text-sm font-semibold">
          Featured Pool
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{pool.prize_name}</h3>
        <p className="text-gray-600 mb-4">{pool.description}</p>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="font-semibold">Target:</span>
            <span>ETB {pool.target_amount?.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="font-semibold">Contribution:</span>
            <span>ETB {pool.contribution_amount?.toLocaleString()}</span>
          </div>
        </div>
        
        <Link href={`/pools/${pool.id}`}>
          <button className="btn-primary w-full mt-6">
            Join Pool
          </button>
        </Link>
      </div>
    </div>
  );
}
