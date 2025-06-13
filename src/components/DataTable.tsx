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
      return <TrendingUpIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    case 'strongest':
      return <ArrowUpIcon className="w-5 h-5 text-green-600 dark:text-green-400" />;
    case 'weakest':
      return <ArrowDownIcon className="w-5 h-5 text-red-600 dark:text-red-400" />;
    default:
      return <TrendingUpIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'trending':
      return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
    case 'strongest':
      return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
    case 'weakest':
      return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
    default:
      return 'border-l-gray-500 bg-gray-50 dark:bg-gray-700/20';
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
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors`}>
      <div className={`px-6 py-4 border-l-4 ${getCategoryColor(category)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getCategoryIcon(category)}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
              {data.length} coins
            </span>
          </div>
          {data.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
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
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                4H Change
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                24H Change
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Volume Change
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Trend Score
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                24H Volume
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {displayData.map((coin, index) => (
              <tr key={coin.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      #{coin.rank || index + 1}
                    </span>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div 
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer transition-colors"
                      onClick={() => {
                        const symbol = coin.symbol.replace('USDT', '');
                        const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=BYBIT:${symbol}USDT.P`;
                        window.open(tradingViewUrl, '_blank');
                      }}
                      title={`Open ${coin.symbol} chart on TradingView`}
                    >
                      {coin.symbol.replace('USDT', '')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 ml-1">USDT</div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-900 dark:text-gray-100 font-mono">
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
                  <div className="text-sm text-gray-500 dark:text-gray-400">
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
          <div className="text-gray-500 dark:text-gray-400">No data available</div>
        </div>
      )}
    </div>
  );
} 