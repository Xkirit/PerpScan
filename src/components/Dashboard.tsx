"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { CoinAnalysis } from '@/types';
import { TrendChart } from './TrendChart';
import { DataTable } from './DataTable';
import MultiTickerChart from './MultiTickerChart';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { RefreshCwIcon, TrendingUpIcon, BarChart3Icon, ClockIcon } from 'lucide-react';
import { BybitClientService } from '@/lib/bybit-client-service';

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
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (interval: '4h' | '1d' = chartInterval) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting client-side analysis with interval:', interval);
      const clientService = new BybitClientService();
      const result = await clientService.runCompleteAnalysis(50);
      setData(result);
      setLastUpdated(new Date());
      console.log('Client-side analysis completed successfully');
    } catch (error) {
      console.error('Client-side analysis failed:', error);
      setError('Failed to fetch data. Please check your internet connection and try again.');
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
                    <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-full">
                      Client Mode
                    </span>
                  </p>
                )}
                {data && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {data.totalCoins} coins analyzed
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CandleCountdown />
              <ThemeToggle />
              <Button
                onClick={() => fetchData(chartInterval)}
                disabled={loading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Interval Selector */}
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Analysis Interval:</span>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setChartInterval('4h')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  chartInterval === '4h'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                4H
              </button>
              <button
                onClick={() => setChartInterval('1d')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  chartInterval === '1d'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                1D
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-4">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
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
      </div>

      {/* Main Content */}
      <div className="max-w-[140vh] mx-auto px-8 lg:px-12 py-8">
        {error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-red-900 dark:text-red-300 mb-2">
                Failed to Load Data
              </h3>
              <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={() => fetchData(chartInterval)} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <RefreshCwIcon className="h-12 w-12 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Analyzing Market Data
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Fetching data directly from Bybit API...
            </p>
          </div>
        ) : data ? (
          <>
            {activeTab === 'analysis' && (
              <div className="space-y-8">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Top Gainer</p>
                        <button
                          onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${data.trending[0]?.symbol}.P`, '_blank')}
                          className="text-2xl font-bold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 cursor-pointer underline"
                        >
                          {data.trending[0]?.symbol || 'N/A'}
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          +{data.trending[0]?.priceChange4h.toFixed(2)}% (4h)
                        </p>
                      </div>
                      <TrendingUpIcon className="h-8 w-8 text-green-500" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Highest Volume</p>
                        <button
                          onClick={() => {
                            const highestVol = [...data.trending].sort((a, b) => b.volume24h - a.volume24h)[0];
                            window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${highestVol?.symbol}.P`, '_blank');
                          }}
                          className="text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer underline"
                        >
                          {[...data.trending].sort((a, b) => b.volume24h - a.volume24h)[0]?.symbol || 'N/A'}
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          ${([...data.trending].sort((a, b) => b.volume24h - a.volume24h)[0]?.volume24h / 1000000).toFixed(1)}M vol
                        </p>
                      </div>
                      <BarChart3Icon className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Analyzed</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {data.totalCoins}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Futures pairs
                        </p>
                      </div>
                      <RefreshCwIcon className="h-8 w-8 text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TrendChart data={data.trending} title="Top Trending" dataKey="trendScore" />
                  <TrendChart data={data.strongest} title="Strongest Performers" dataKey="priceChange4h" />
                </div>

                {/* Data Tables */}
                <div className="space-y-6">
                  <DataTable data={data.trending} title="🔥 Trending Coins" category="trending" />
                  <DataTable data={data.strongest} title="💪 Strongest Performers" category="strongest" />
                  <DataTable data={data.weakest} title="📉 Weakest Performers" category="weakest" />
                </div>
              </div>
            )}

            {activeTab === 'chart' && (
              <MultiTickerChart data={allCoins} interval={chartInterval} />
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Dashboard; 