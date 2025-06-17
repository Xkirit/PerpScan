'use client';

import React from 'react';

// Custom SVG Icons
const DollarSignIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const BookOpenIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

export default function DocsPage() {
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#0a0e0b' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{ 
                backgroundColor: 'rgba(30, 63, 32, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff'
              }}
            >
              <HomeIcon className="h-4 w-4" />
              Back to Dashboard
            </button>
          </div>
          
                     <h1 className="text-4xl font-bold mb-4 flex items-center gap-3" style={{ color: '#ffffff' }}>
             <BookOpenIcon className="h-8 w-8" style={{ color: '#4a7c59' }} />
             Institutional Activity Tracker Documentation
           </h1>
           <p className="text-lg" style={{ color: '#4a7c59' }}>
             Comprehensive guide to institutional activity detection algorithms and signal interpretation
           </p>
        </div>

        {/* Main Content */}
        <div 
          className="rounded-lg p-8 backdrop-blur-[2px]"
          style={{ 
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            backgroundColor: 'rgba(30, 63, 32, 0.1)'
          }}
        >
                     <h2 className="text-3xl font-bold mb-6 flex items-center gap-3" style={{ color: '#ffffff' }}>
             <DollarSignIcon className="h-8 w-8" style={{ color: '#4a7c59' }} />
             System Documentation
           </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Volume Category Badges */}
            <div 
              className="p-6 rounded-lg"
              style={{ 
                backgroundColor: 'rgba(30, 63, 32, 0.2)',
                border: '1px solid rgba(74, 124, 89, 0.3)'
              }}
            >
                             <h3 className="text-xl font-bold mb-4" style={{ color: '#ffffff' }}>Volume Categories</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-sm rounded font-medium bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200">L</span>
                  <div>
                    <div className="font-bold" style={{ color: '#ffffff' }}>Low Volume</div>
                                         <div className="text-sm" style={{ color: '#4a7c59' }}>Bottom 40% by volume (institutional accumulation)</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-sm rounded font-medium bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">M</span>
                  <div>
                    <div className="font-bold" style={{ color: '#ffffff' }}>Medium Volume</div>
                    <div className="text-sm" style={{ color: '#4a7c59' }}>40-70% range</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-sm rounded font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">H</span>
                  <div>
                    <div className="font-bold" style={{ color: '#ffffff' }}>High Volume</div>
                                         <div className="text-sm" style={{ color: '#4a7c59' }}>Top 30% by volume (high retail activity)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Whale Rating Badges */}
            <div 
              className="p-6 rounded-lg"
              style={{ 
                backgroundColor: 'rgba(30, 63, 32, 0.2)',
                border: '1px solid rgba(74, 124, 89, 0.3)'
              }}
            >
                             <h3 className="text-xl font-bold mb-4" style={{ color: '#ffffff' }}>Position Size Classifications</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-sm rounded font-medium bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200">XL</span>
                  <div>
                                         <div className="font-bold" style={{ color: '#ffffff' }}>Institutional Scale</div>
                    <div className="text-sm" style={{ color: '#4a7c59' }}>$1B+ open interest</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-sm rounded font-medium bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200">L</span>
                  <div>
                                         <div className="font-bold" style={{ color: '#ffffff' }}>Large Institution</div>
                    <div className="text-sm" style={{ color: '#4a7c59' }}>$100M+ open interest</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-sm rounded font-medium bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200">M</span>
                  <div>
                                         <div className="font-bold" style={{ color: '#ffffff' }}>Medium Institution</div>
                    <div className="text-sm" style={{ color: '#4a7c59' }}>$10M+ open interest</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-sm rounded font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">S</span>
                  <div>
                                         <div className="font-bold" style={{ color: '#ffffff' }}>Standard</div>
                    <div className="text-sm" style={{ color: '#4a7c59' }}>Under $10M open interest</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Indicators */}
            <div 
              className="p-6 rounded-lg"
              style={{ 
                backgroundColor: 'rgba(30, 63, 32, 0.2)',
                border: '1px solid rgba(74, 124, 89, 0.3)'
              }}
            >
                             <h3 className="text-xl font-bold mb-4" style={{ color: '#ffffff' }}>Activity Indicators</h3>
               <div className="space-y-3">
                 <div className="flex items-center gap-3">
                   <span className="px-2 py-1 text-sm rounded font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white">ALERT</span>
                   <div>
                     <div className="font-bold" style={{ color: '#ffffff' }}>High Activity Alert</div>
                     <div className="text-sm" style={{ color: '#4a7c59' }}>2.5 standard deviations above normal activity</div>
                   </div>
                 </div>
               </div>
            </div>

            {/* Key Metrics */}
            <div 
              className="p-6 rounded-lg"
              style={{ 
                backgroundColor: 'rgba(30, 63, 32, 0.2)',
                border: '1px solid rgba(74, 124, 89, 0.3)'
              }}
            >
                             <h3 className="text-xl font-bold mb-4" style={{ color: '#ffffff' }}>Key Performance Metrics</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-bold" style={{ color: '#ffffff' }}>Priority Score:</span>
                  <span className="ml-2" style={{ color: '#4a7c59' }}>Combined institutional signal strength</span>
                </div>
                <div>
                  <span className="font-bold" style={{ color: '#ffffff' }}>Volume/OI:</span>
                  <span className="ml-2" style={{ color: '#4a7c59' }}>Turnover ratio (lower = accumulation)</span>
                </div>
                <div>
                  <span className="font-bold" style={{ color: '#ffffff' }}>Abnormality:</span>
                                     <span className="ml-2" style={{ color: '#4a7c59' }}>Statistical deviation from historical norms</span>
                </div>
                <div>
                  <span className="font-bold" style={{ color: '#ffffff' }}>Manipulation:</span>
                                     <span className="ml-2" style={{ color: '#4a7c59' }}>Confidence percentage of institutional involvement</span>
                </div>
              </div>
            </div>

            {/* Detection Criteria */}
            <div 
              className="p-6 rounded-lg"
              style={{ 
                backgroundColor: 'rgba(30, 63, 32, 0.2)',
                border: '1px solid rgba(74, 124, 89, 0.3)'
              }}
            >
                             <h3 className="text-xl font-bold mb-4" style={{ color: '#ffffff' }}>Detection Algorithms</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-bold" style={{ color: '#ffffff' }}>OI Change:</span>
                  <span className="ml-2" style={{ color: '#4a7c59' }}>&gt;5% movement triggers detection</span>
                </div>
                <div>
                  <span className="font-bold" style={{ color: '#ffffff' }}>Statistical:</span>
                                     <span className="ml-2" style={{ color: '#4a7c59' }}>&gt;1.0 standard deviation anomalies</span>
                </div>
                <div>
                  <span className="font-bold" style={{ color: '#ffffff' }}>Volume/OI:</span>
                                     <span className="ml-2" style={{ color: '#4a7c59' }}>&lt;3x ratio indicates institutional accumulation</span>
                </div>
                <div>
                  <span className="font-bold" style={{ color: '#ffffff' }}>Updates:</span>
                  <span className="ml-2" style={{ color: '#4a7c59' }}>Every 10 seconds, smart database replacement</span>
                </div>
              </div>
            </div>

            {/* Best Signals */}
            <div 
              className="p-6 rounded-lg"
              style={{ 
                backgroundColor: 'rgba(30, 63, 32, 0.2)',
                border: '1px solid rgba(74, 124, 89, 0.3)'
              }}
            >
                             <h3 className="text-xl font-bold mb-4" style={{ color: '#ffffff' }}>High-Confidence Signals</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-bold" style={{ color: '#ffffff' }}>Green "L" + High Priority:</span>
                  <span className="ml-2" style={{ color: '#4a7c59' }}>Early institutional accumulation</span>
                </div>
                <div>
                  <span className="font-bold" style={{ color: '#ffffff' }}>Low Volume/OI + OI Growth:</span>
                                     <span className="ml-2" style={{ color: '#4a7c59' }}>Institutional positioning</span>
                </div>
                <div>
                  <span className="font-bold" style={{ color: '#ffffff' }}>High Abnormality + Low Volume:</span>
                                     <span className="ml-2" style={{ color: '#4a7c59' }}>Institutional market entry</span>
                </div>
                <div>
                                     <span className="font-bold" style={{ color: '#ffffff' }}>Alert Badge:</span>
                   <span className="ml-2" style={{ color: '#4a7c59' }}>Extreme statistical deviation from normal patterns</span>
                </div>
              </div>
            </div>

          </div>

          {/* Smart Database Logic - Full Width */}
          <div 
            className="mt-8 p-6 rounded-lg"
            style={{ 
              backgroundColor: 'rgba(30, 63, 32, 0.2)',
              border: '1px solid rgba(74, 124, 89, 0.3)'
            }}
          >
                         <h3 className="text-xl font-bold mb-4" style={{ color: '#ffffff' }}>Database Management System</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-bold" style={{ color: '#ffffff' }}>Add Mode:</span>
                                 <span className="ml-2" style={{ color: '#4a7c59' }}>Database below capacity → Add all qualifying assets</span>
              </div>
              <div>
                <span className="font-bold" style={{ color: '#ffffff' }}>Replace Mode:</span>
                                 <span className="ml-2" style={{ color: '#4a7c59' }}>Database at capacity → Replace only when new asset has higher priority score</span>
              </div>
              <div>
                <span className="font-bold" style={{ color: '#ffffff' }}>Protection:</span>
                                 <span className="ml-2" style={{ color: '#4a7c59' }}>High priority assets are protected from removal</span>
              </div>
              <div>
                <span className="font-bold" style={{ color: '#ffffff' }}>Threshold:</span>
                                 <span className="ml-2" style={{ color: '#4a7c59' }}>New asset priority must exceed minimum existing asset priority</span>
              </div>
            </div>
          </div>

          {/* How to Use Section */}
          <div 
            className="mt-8 p-6 rounded-lg"
            style={{ 
              backgroundColor: 'rgba(30, 63, 32, 0.2)',
              border: '1px solid rgba(74, 124, 89, 0.3)'
            }}
          >
                         <h3 className="text-xl font-bold mb-4" style={{ color: '#ffffff' }}>System Usage Guidelines</h3>
            <div className="space-y-4">
              <div>
                                 <h4 className="font-bold mb-2" style={{ color: '#ffffff' }}>1. Low Volume Asset Analysis</h4>
                 <p style={{ color: '#4a7c59' }}>
                   Assets marked with "L" badges indicate low volume activity. When combined with high priority scores, 
                   these typically represent early institutional accumulation phases preceding broader market awareness.
                 </p>
              </div>
              
              <div>
                                 <h4 className="font-bold mb-2" style={{ color: '#ffffff' }}>2. Statistical Anomaly Monitoring</h4>
                 <p style={{ color: '#4a7c59' }}>
                   High abnormality scores (1.5+ standard deviations) indicate unusual activity compared to historical patterns. 
                   This quantitative approach helps identify institutional capital movements.
                 </p>
              </div>
              
              <div>
                                 <h4 className="font-bold mb-2" style={{ color: '#ffffff' }}>3. Volume to Open Interest Analysis</h4>
                 <p style={{ color: '#4a7c59' }}>
                   Low turnover ratios (&lt;3x) suggest accumulation rather than speculative trading. 
                   This pattern indicates institutional participants building strategic positions.
                 </p>
              </div>
              
              <div>
                                 <h4 className="font-bold mb-2" style={{ color: '#ffffff' }}>4. Priority Score Interpretation</h4>
                 <p style={{ color: '#4a7c59' }}>
                   Scores above 80 indicate high-confidence institutional activity. The system automatically 
                   maintains the top 10 highest priority assets in the database for continuous monitoring.
                 </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
} 