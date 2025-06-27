'use client';

import { Suspense } from 'react';
import FibonacciScanner from '@/components/FibonacciScanner';

export default function FibonacciPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-4 gradient-text">
            🎯 Fibonacci Retracement Scanner
          </h1>
          <p className="text-center text-gray-400 max-w-4xl mx-auto">
            Discover coins approaching the golden ratio (0.618-0.66) fibonacci retracement levels.
          </p>
        </div>



        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-2xl text-blue-400 mb-2">🔄 Loading Scanner...</div>
              <div className="text-gray-400">Initializing fibonacci analysis engine</div>
            </div>
          </div>
        }>
          <FibonacciScanner />
        </Suspense>


      </div>
    </main>
  );
} 