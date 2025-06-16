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
  const baseStyle = { backgroundColor: '#2d5a31' };
  switch (category) {
    case 'trending':
      return { ...baseStyle, borderLeftColor: '#4a7c59', borderLeftWidth: '4px' };
    case 'strongest':
      return { ...baseStyle, borderLeftColor: '#ffffff', borderLeftWidth: '4px' };
    case 'weakest':
      return { ...baseStyle, borderLeftColor: '#4a7c59', borderLeftWidth: '4px' };
    default:
      return { ...baseStyle, borderLeftColor: '#4a7c59', borderLeftWidth: '4px' };
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
      className="rounded-lg overflow-hidden transition-colors backdrop-blur-[2px]" 
      style={{ 
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        backgroundColor: 'rgba(30, 63, 32, 0.1)'
      }}
    >
      <div className="px-6 py-4" style={getCategoryColor(category)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getCategoryIcon(category)}
            <h3 className="text-lg font-semibold" style={{ color: '#ffffff' }}>{title}</h3>
            <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: '#1E3F20', color: '#ffffff' }}>
              {data.length} coins
            </span>
          </div>
          {data.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1 px-3 py-1 text-sm transition-colors"
              style={{ color: '#4a7c59' }}
            >
              {showAll ? (
                <>
                  <ChevronUpIcon className="w-4 h-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDownIcon className="w-4 h-4" />
                  Show All ({data.length})
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      <div className={`overflow-x-auto ${showAll ? 'max-h-96 overflow-y-auto' : ''}`}>
        <table className="w-full">
          <thead className="border-b sticky top-0" style={{ backgroundColor: '#4a7c59', borderColor: '#2d5a31' }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#ffffff' }}>
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#ffffff' }}>
                Symbol
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#ffffff' }}>
                Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#ffffff' }}>
                4H Change
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#ffffff' }}>
                24H Change
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#ffffff' }}>
                Volume Change
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#ffffff' }}>
                Trend Score
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#ffffff' }}>
                24H Volume
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: '#2d5a31' }}>
            {displayData.map((coin, index) => (
              <tr key={coin.symbol} className="transition-colors hover:opacity-80">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                      #{coin.rank || index + 1}
                    </span>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div 
                      className="text-sm font-medium cursor-pointer transition-colors"
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
                    <div className="text-xs ml-1" style={{ color: '#4a7c59' }}>USDT</div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-mono" style={{ color: '#ffffff' }}>
                    {formatPrice(coin.currentPrice)}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm font-medium ${getPerformanceColorDark(coin.priceChange4h)}`}>
                    {formatPercentage(coin.priceChange4h)}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm ${getPerformanceColorDark(coin.priceChange24h)}`}>
                    {formatPercentage(coin.priceChange24h)}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm ${getPerformanceColorDark(coin.volumeChange4h)}`}>
                    {formatPercentage(coin.volumeChange4h)}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPerformanceBgColorDark(coin.trendScore)} ${getPerformanceColorDark(coin.trendScore)}`}>
                    {coin.trendScore.toFixed(2)}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right">
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
        <div className="px-6 py-12 text-center">
          <div style={{ color: '#4a7c59' }}>No data available</div>
        </div>
      )}
    </div>
  );
} 