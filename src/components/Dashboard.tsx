"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { CoinAnalysis } from '@/types';
import { TrendChart } from './TrendChart';
import { DataTable } from './DataTable';
import MultiTickerChart from './MultiTickerChart';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { RefreshCwIcon, TrendingUpIcon, BarChart3Icon, ClockIcon } from 'lucide-react';

interface AnalysisResult {
  trending: CoinAnalysis[];
  strongest: CoinAnalysis[];
  weakest: CoinAnalysis[];
  timestamp: string;
  totalCoins: number;
}

// Countdown Timer Component
const CandleCountdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentHour = now.getUTCHours();
      
      // Find next 4-hour candle close (00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC)
      const candleHours = [0, 4, 8, 12, 16, 20];
      let nextCandleHour = candleHours.find(hour => hour > currentHour);
      
      // If no hour found today, use first hour of next day
      if (!nextCandleHour) {
        nextCandleHour = 0;
      }
      
      const nextCandle = new Date(now);
      nextCandle.setUTCHours(nextCandleHour, 0, 0, 0);
      
      // If next candle is tomorrow
      if (nextCandleHour === 0 && currentHour >= 20) {
        nextCandle.setUTCDate(nextCandle.getUTCDate() + 1);
      }
      
      const timeDiff = nextCandle.getTime() - now.getTime();
      
      if (timeDiff > 0) {
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft('00:00:00');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-700">
      <ClockIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <div className="text-sm">
        <span className="text-blue-600 dark:text-blue-400 font-medium">Next 4H Close:</span>
        <span className="ml-2 font-mono text-blue-800 dark:text-blue-300">{timeLeft}</span>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'chart'>('analysis');
  const [chartInterval, setChartInterval] = useState<'4h' | '1d'>('4h');

  const fetchData = useCallback(async (interval: '4h' | '1d' = chartInterval) => {
    setLoading(true);
    try {
      console.log('Starting fetch request to /api/analyze with interval:', interval);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: 50, interval }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('Fetch response received:', response.status, response.statusText);

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Error:', response.status, errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response received:', responseText);
        throw new Error('Server returned non-JSON response');
      }

      const result = await response.json();
      console.log('API result received:', result.success ? 'Success' : 'Failed', result.data ? `${result.data.totalCoins} coins` : 'No data');
      
      if (result.success && result.data) {
        setData(result.data);
        setLastUpdated(new Date());
        console.log('Data updated successfully');
      } else {
        console.error('API Error:', result.error);
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('Request timed out after 60 seconds');
        } else {
          console.error('Error details:', error.message);
        }
      }
      // You could add a toast notification here or set an error state
    } finally {
      setLoading(false);
    }
  }, [chartInterval]);

  useEffect(() => {
    console.log('Dashboard useEffect triggered with interval:', chartInterval);
    fetchData(chartInterval);
  }, [chartInterval, fetchData]);

  const formatLastUpdated = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const tabs = [
    {
      id: 'analysis' as const,
      label: 'Trend Analysis',
      icon: TrendingUpIcon
    },
    {
      id: 'chart' as const,
      label: 'Multi-Ticker Chart',
      icon: BarChart3Icon
    }
  ];

  // Get all coins for the chart (trending coins)
  const allCoins = data?.trending || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-[140vh] mx-auto px-8 lg:px-12 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Bybit Futures Analyzer
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
                {lastUpdated && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Last updated: {formatLastUpdated(lastUpdated)}
                  </p>
                )}
                {data && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {data.totalCoins} coins analyzed
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <CandleCountdown />
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Button
                  onClick={() => fetchData(chartInterval)}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Updating...' : 'Refresh Data'}
                </Button>
              </div>
            </div>
          </div>

          {/* Interval Selector - always visible */}
          <div className="flex items-center gap-2 mt-6 mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Interval:</span>
            <button
              className={`px-3 py-1 rounded-l-full border border-r-0 ${chartInterval === '4h' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} transition-colors`}
              onClick={() => setChartInterval('4h')}
            >
              4h
            </button>
            <button
              className={`px-3 py-1 rounded-r-full border ${chartInterval === '1d' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} transition-colors`}
              onClick={() => setChartInterval('1d')}
            >
              1d
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mt-2 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[140vh] mx-auto px-8 lg:px-12 py-6">
        {loading && !data ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCwIcon className="h-8 w-8 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
              <p className="mt-2 text-gray-600 dark:text-gray-400">Analyzing market data...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'analysis' && data && (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div 
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all"
                    onClick={() => {
                      if (data.trending[0]?.symbol) {
                        const symbol = data.trending[0].symbol.replace('USDT', '');
                        const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=BYBIT:${symbol}USDT.P`;
                        window.open(tradingViewUrl, '_blank');
                      }
                    }}
                    title={`Open ${data.trending[0]?.symbol || ''} chart on TradingView`}
                  >
                    <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-2">Top Trending</h3>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {data.trending[0]?.symbol.replace('USDT', '') || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Score: {data.trending[0]?.trendScore.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                  
                  <div 
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all"
                    onClick={() => {
                      if (data.strongest[0]?.symbol) {
                        const symbol = data.strongest[0].symbol.replace('USDT', '');
                        const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=BYBIT:${symbol}USDT.P`;
                        window.open(tradingViewUrl, '_blank');
                      }
                    }}
                    title={`Open ${data.strongest[0]?.symbol || ''} chart on TradingView`}
                  >
                    <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-2">Biggest Gainer</h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {data.strongest[0]?.symbol.replace('USDT', '') || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      +{data.strongest[0]?.priceChange4h.toFixed(2) || 'N/A'}%
                    </p>
                  </div>
                  
                  <div 
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all"
                    onClick={() => {
                      if (data.weakest[0]?.symbol) {
                        const symbol = data.weakest[0].symbol.replace('USDT', '');
                        const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=BYBIT:${symbol}USDT.P`;
                        window.open(tradingViewUrl, '_blank');
                      }
                    }}
                    title={`Open ${data.weakest[0]?.symbol || ''} chart on TradingView`}
                  >
                    <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-2">Biggest Loser</h3>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {data.weakest[0]?.symbol.replace('USDT', '') || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {data.weakest[0]?.priceChange4h.toFixed(2) || 'N/A'}%
                    </p>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <TrendChart 
                    data={data.trending.slice(0, 10)} 
                    title="🔥 Trending Coins (Trend Score)"
                    dataKey="trendScore"
                  />
                  <TrendChart 
                    data={data.strongest.slice(0, 10)} 
                    title="📈 Strongest Performers (4H)"
                    dataKey="priceChange4h"
                  />
                  <TrendChart 
                    data={data.weakest.slice(0, 10)} 
                    title="📉 Weakest Performers (4H)"
                    dataKey="priceChange4h"
                  />
                </div>

                {/* Data Tables */}
                <div className="space-y-8">
                  <DataTable 
                    data={data.trending} 
                    title="🔥 Trending Coins (Past 4 Hours)"
                    category="trending"
                  />
                  
                  <DataTable 
                    data={data.strongest} 
                    title="📈 Strongest Performers (Past 4 Hours)"
                    category="strongest"
                  />
                  
                  <DataTable 
                    data={data.weakest} 
                    title="📉 Weakest Performers (Past 4 Hours)"
                    category="weakest"
                  />
                </div>
              </div>
            )}

            {activeTab === 'chart' && (
              <div>
                {allCoins.length > 0 ? (
                  <MultiTickerChart data={allCoins} interval={chartInterval === '1d' ? 'D' : '4h'} />
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      No data available. Please refresh to load market data.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 