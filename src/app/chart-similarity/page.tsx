'use client';

import { Suspense } from 'react';
import ChartSimilarityScanner from '@/components/ChartSimilarityScanner';

export default function ChartSimilarityPage() {
  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            📊 Chart Similarity Scanner
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">
            Find coins with similar chart patterns using advanced correlation analysis and Dynamic Time Warping (DTW) algorithms.
            Perfect for identifying trading opportunities with similar market behavior.
          </p>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-2xl mb-2">🔄 Loading Scanner...</div>
              <div className="text-gray-500">Initializing pattern analysis engine...</div>
            </div>
          </div>
        }>
          <ChartSimilarityScanner />
        </Suspense>
      </div>
    </main>
  );
}