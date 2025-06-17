"use client";

import { CoinAnalysis } from '@/types';
import { formatPercentage, formatPrice, formatVolume } from '../lib/utils';
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useState } from 'react';

interface DataTableProps {
  data: CoinAnalysis[];
  title: string;
  category: 'trending' | 'strongest' | 'weakest';
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'trending':
      return <TrendingUpIcon className="w-5 h-5" style={{ color: '#4a7c59' }} />;
    case 'strongest':
      return <ArrowUpIcon className="w-5 h-5" style={{ color: '#ffffff' }} />;
    case 'weakest':
      return <ArrowDownIcon className="w-5 h-5" style={{ color: '#4a7c59' }} />;
    default:
      return <TrendingUpIcon className="w-5 h-5" style={{ color: '#4a7c59' }} />;
  }
};

const getCategoryColor = (category: string) => {
  const baseStyle = { backgroundColor: '#15321a' };
  switch (category) {
    case 'trending':
      return { ...baseStyle, borderLeftColor: '#4a7c59' };
    case 'strongest':
      return { ...baseStyle, borderLeftColor: '#ffffff' };
    case 'weakest':
      return { ...baseStyle, borderLeftColor: '#4a7c59' };
    default:
      return { ...baseStyle, borderLeftColor: '#4a7c59' };
  }
};

// Enhanced utility functions for dark mode
const getPerformanceColorDark = (value: number): string => {
  if (value > 0) return 'text-green-600 dark:text-green-400'
  if (value < 0) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
}

const getPerformanceBgColorDark = (value: number): string => {
  if (value > 0) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
  if (value < 0) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
  return 'bg-gray-50 dark:bg-gray-700/20 border-gray-200 dark:border-gray-600'
}

export function DataTable({ data, title, category }: DataTableProps) {
  const [showAll, setShowAll] = useState(false);
  const displayData = showAll ? data : data.slice(0, 10);

  return (
    <div 
      className="rounded-lg overflow-hidden transition-colors backdrop-blur-[4px]" 
      style={{ 
        border: '0.5px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        backgroundColor: 'rgba(30, 63, 32, 0.1)'
      }}
    >
      <div className="px-3 sm:px-6 py-2 sm:py-4" style={getCategoryColor(category)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-2">
            {getCategoryIcon(category)}
            <h3 className="text-sm sm:text-lg font-semibold" style={{ color: '#ffffff' }}>{title}</h3>
            
          </div>
          {data.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm transition-colors"
              style={{ color: '#6ca37f', opacity:"50" }}
            >
              {showAll ? (
                <>
                  <ChevronUpIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Show Less</span>
                  <span className="sm:hidden">Less</span>
                </>
              ) : (
                <>
                  <ChevronDownIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Show All ({data.length})</span>
                  <span className="sm:hidden">All</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      <div className={`overflow-x-auto ${showAll ? 'max-h-[1000px] overflow-y-scroll scrollbar-hide' : ''}`}>
        <table className="w-full min-w-[300px] sm:min-w-[600px]">
          <thead className="sticky top-0" style={{ backgroundColor: '#091a0c', borderBottom: '0.5px solid #2d5a31' }}>
            <tr>
              <th className="px-2 sm:px-6 py-1.5 sm:py-3 text-left text-xs font-medium uppercase tracking-tight sm:tracking-wider" style={{ color: '#ffffff' }}>
                <span className="hidden sm:inline">Rank</span>
                <span className="sm:hidden">#</span>
              </th>
              <th className="px-0 sm:px-6 py-1.5 sm:py-3 text-left text-xs font-medium uppercase tracking-tight sm:tracking-wider" style={{ color: '#ffffff' }}>
                Symbol
              </th>
              <th className=" sm:px-6 py-1.5 sm:py-3 text-right text-xs font-medium uppercase tracking-tight sm:tracking-wider" style={{ color: '#ffffff' }}>
                Price
              </th>
              <th className="hidden sm:table-cell px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#ffffff' }}>
                4H Change
              </th>
              <th className="px-3 sm:px-6 py-1.5 sm:py-3 text-right text-xs font-medium uppercase tracking-tight sm:tracking-wider" style={{ color: '#ffffff' }}>
                <span className="hidden sm:inline">24H Change</span>
                <span className="sm:hidden">24H</span>
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#ffffff' }}>
                Volume Change
              </th>
                             <th className="hidden sm:table-cell px-6 py-1.5 sm:py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#ffffff' }}>
                 Trend Score
               </th>
              <th className="hidden lg:table-cell px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#ffffff' }}>
                24H Volume
              </th>
            </tr>
          </thead>
          <tbody style={{ borderColor: '#2d5a31' }}>
            {displayData.map((coin, index) => (
              <tr 
                key={coin.symbol} 
                className="transition-colors hover:opacity-80"
                style={{ 
                  borderBottom: index < displayData.length - 1 ? '0.8px solid rgba(45, 90, 49, 0.3)' : 'none'
                }}
              >
                <td className="px-1 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-xs font-medium" style={{ color: '#ffffff' }}>
                      #{coin.rank || index + 1}
                    </span>
                  </div>
                </td>
                
                <td className="px-1 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div 
                      className="text-xs sm:text-sm font-medium cursor-pointer transition-colors truncate"
                      style={{ color: '#ffffff' }}
                      onClick={() => {
                        const symbol = coin.symbol.replace('USDT', '');
                        const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=BYBIT:${symbol}USDT.P`;
                        window.open(tradingViewUrl, '_blank');
                      }}
                      title={`Open ${coin.symbol} chart on TradingView`}
                    >
                      {coin.symbol.replace('USDT', '')}
                    </div>
                  </div>
                </td>
                
                <td className="px-1 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right">
                  <div className="text-xs font-mono" style={{ color: '#ffffff' }}>
                    {formatPrice(coin.currentPrice)}
                  </div>
                </td>
                
                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm font-medium ${getPerformanceColorDark(coin.priceChange4h)}`}>
                    {formatPercentage(coin.priceChange4h)}
                  </div>
                </td>
                
                <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right">
                  <div className={`text-xs font-medium ${getPerformanceColorDark(coin.priceChange24h)}`}>
                    {formatPercentage(coin.priceChange24h)}
                  </div>
                </td>
                
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm ${getPerformanceColorDark(coin.volumeChange4h)}`}>
                    {formatPercentage(coin.volumeChange4h)}
                  </div>
                </td>
                
                <td className="hidden sm:table-cell px-6 py-2 sm:py-4 whitespace-nowrap text-right">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPerformanceColorDark(coin.trendScore)}`}>
                    {coin.trendScore.toFixed(2)}
                  </div>
                </td>
                
                <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm" style={{ color: '#4a7c59' }}>
                    {formatVolume(coin.volume24h)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {displayData.length === 0 && (
        <div className="px-4 sm:px-6 py-6 sm:py-12 text-center">
          <div className="text-sm" style={{ color: '#4a7c59' }}>No data available</div>
        </div>
      )}
    </div>
  );
} 