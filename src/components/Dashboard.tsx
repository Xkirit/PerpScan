"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { CoinAnalysis } from '@/types';
import { TrendChart } from './TrendChart';
import { DataTable } from './DataTable';
import MultiTickerChart from './MultiTickerChart';
import InstitutionalActivity from './InstitutionalActivity';
import OpenInterestChart from './OpenInterestChart';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { RefreshCwIcon, TrendingUpIcon, BarChart3Icon, ClockIcon, ArrowDownIcon, ArrowUpIcon, EyeIcon } from 'lucide-react';
import { BybitClientService } from '@/lib/bybit-client-service';
import BtcPriceChange from './BtcPriceChange';
import LiquidGlass from 'liquid-glass-react';

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
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ backgroundColor: '#2d5a31', borderColor: '#4a7c59' }}>
      <ClockIcon className="h-4 w-4" style={{ color: '#ffffff' }} />
      <div className="text-sm">
        <span className="font-medium" style={{ color: '#ffffff' }}>Next 4H Close:</span>
        <span className="ml-2 font-mono" style={{ color: '#ffffff' }}>{timeLeft}</span>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'chart' | 'institutional' | 'openinterest'>('analysis');
  const [chartInterval, setChartInterval] = useState<'4h' | '1d'>('4h');
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (interval: '4h' | '1d' = chartInterval) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Starting client-side analysis with interval:', interval);
      const clientService = new BybitClientService();
      const result = await clientService.runCompleteAnalysis(50, interval);
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
    },
    {
      id: 'institutional' as const,
      label: 'Institutional Activity',
      icon: EyeIcon
    },
    {
      id: 'openinterest' as const,
      label: 'Open Interest',
      icon: BarChart3Icon
    }
  ];

  // Get all coins for the chart (trending coins)
  const allCoins = data?.trending || [];

  return (
    <div
      className="min-h-screen transition-colors relative"
      style={{
        backgroundColor: '#0F1411',
        backgroundImage: `
          linear-gradient(rgba(26, 31, 22, 0.8) 1px, transparent 1px),
          linear-gradient(90deg, rgba(26, 31, 22, 0.8) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}
    >
      {/* Header */}
      <div className="shadow-sm border-b relative z-10" style={{ backgroundColor: '#15321a', borderColor: '#2d5a31' }}>
        <div className="max-w-[140vh] mx-auto px-8 lg:px-12 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#ffffff' }}>
                Bybit Futures Analyzer
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
                {lastUpdated && (
                  <p className="text-sm" style={{ color: '#4a7c59' }}>
                    Last updated: {formatLastUpdated(lastUpdated)}
                    <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full" style={{ backgroundColor: '#2d5a31', color: '#ffffff' }}>
                      Client Mode
                    </span>
                  </p>
                )}
                {data && (
                  <p className="text-xs" style={{ color: '#4a7c59' }}>
                    {data.totalCoins} coins analyzed
                  </p>
                )}
              </div>
            </div>
           

            <div className="flex items-center gap-3">
              <BtcPriceChange interval={chartInterval} />
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
            <span className="text-sm font-medium" style={{ color: '#4a7c59' }}>Analysis Interval:</span>
            <div className="flex rounded-lg p-1" style={{ backgroundColor: '#0F1411' }}>
              <button
                onClick={() => setChartInterval('4h')}
                className="px-3 py-1 text-sm rounded-md transition-colors"
                style={{
                  backgroundColor: chartInterval === '4h' ? '#2d5a31' : 'transparent',
                  color: chartInterval === '4h' ? '#ffffff' : '#4a7c59'
                }}
              >
                4H
              </button>
              <button
                onClick={() => setChartInterval('1d')}
                className="px-3 py-1 text-sm rounded-md transition-colors"
                style={{
                  backgroundColor: chartInterval === '1d' ? '#2d5a31' : 'transparent',
                  color: chartInterval === '1d' ? '#ffffff' : '#4a7c59'
                }}
              >
                1D
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-4">
            <div className="border-b" style={{ borderColor: '#2d5a31' }}>
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors"
                      style={{
                        borderColor: activeTab === tab.id ? '#ffffff' : 'transparent',
                        color: activeTab === tab.id ? '#ffffff' : '#4a7c59'
                      }}
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
      <div className="max-w-[140vh] mx-auto px-8 lg:px-12 py-8 relative z-10">
        {error ? (
          <div className="text-center py-12">
            <div
              className="rounded-lg p-6"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
            >
              <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>
                Failed to Load Data
              </h3>
              <p className="mb-4" style={{ color: '#4a7c59' }}>{error}</p>
              <Button onClick={() => fetchData(chartInterval)} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <RefreshCwIcon className="h-12 w-12 animate-spin mx-auto" style={{ color: '#4a7c59' }} />
            <h3 className="mt-4 text-lg font-medium" style={{ color: '#ffffff' }}>
              Analyzing Market Data
            </h3>
            <p className="mt-2" style={{ color: '#4a7c59' }}>
              Fetching data directly from Bybit API...
            </p>
          </div>
        ) : data ? (
          <>
            {activeTab === 'analysis' && (
              <div className="space-y-8">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div
                    className="rounded-lg p-6 backdrop-blur-[2px]"
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      backgroundColor: 'rgba(30, 63, 32, 0.1)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#4a7c59' }}>Top Trending</p>
                        <button
                          onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${data.trending[0]?.symbol}.P`, '_blank')}
                          className="text-2xl font-bold cursor-pointer underline hover:opacity-80"
                          style={{ color: '#ffffff' }}
                        >
                          {data.trending[0]?.symbol.replace('USDT', '') || 'N/A'}
                        </button>
                        <p className="text-xs" style={{ color: '#4a7c59' }}>
                          Score: {data.trending[0]?.trendScore.toFixed(2) || 'N/A'}
                        </p>
                      </div>
                      <TrendingUpIcon className="h-8 w-8" style={{ color: '#4a7c59' }} />
                    </div>
                  </div>

                  <div
                    className="rounded-lg p-6 backdrop-blur-[2px]"
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      backgroundColor: 'rgba(30, 63, 32, 0.1)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#4a7c59' }}>Top Gainer</p>
                        <button
                          onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${data.strongest[0]?.symbol}.P`, '_blank')}
                          className="text-2xl font-bold cursor-pointer underline hover:opacity-80"
                          style={{ color: '#ffffff' }}
                        >
                          {data.strongest[0]?.symbol.replace('USDT', '') || 'N/A'}
                        </button>
                        <p className="text-xs" style={{ color: '#4a7c59' }}>
                          +{chartInterval === '4h'
                            ? data.strongest[0]?.priceChange4h.toFixed(2)
                            : data.strongest[0]?.priceChange24h.toFixed(2)
                          }% ({chartInterval})
                        </p>
                      </div>
                      <ArrowUpIcon className="h-8 w-8" style={{ color: '#4a7c59' }} />
                    </div>
                  </div>

                  <div
                    className="rounded-lg p-6 backdrop-blur-[2px]"
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      backgroundColor: 'rgba(30, 63, 32, 0.1)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#4a7c59' }}>Top Loser</p>
                        <button
                          onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${data.weakest[0]?.symbol}.P`, '_blank')}
                          className="text-2xl font-bold cursor-pointer underline hover:opacity-80"
                          style={{ color: '#ffffff' }}
                        >
                          {data.weakest[0]?.symbol.replace('USDT', '') || 'N/A'}
                        </button>
                        <p className="text-xs" style={{ color: '#4a7c59' }}>
                          {chartInterval === '4h'
                            ? data.weakest[0]?.priceChange4h.toFixed(2)
                            : data.weakest[0]?.priceChange24h.toFixed(2)
                          }% ({chartInterval})
                        </p>
                      </div>
                      <ArrowDownIcon className="h-8 w-8" style={{ color: '#4a7c59' }} />
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <TrendChart data={data.trending} title="Top Trending" dataKey="trendScore" />
                  <TrendChart
                    data={data.strongest}
                    title="Strongest Performers"
                    dataKey={chartInterval === '4h' ? 'priceChange4h' : 'priceChange24h'}
                  />
                  <TrendChart
                    data={data.weakest}
                    title="Weakest Performers"
                    dataKey={chartInterval === '4h' ? 'priceChange4h' : 'priceChange24h'}
                  />
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

            {activeTab === 'institutional' && (
              <InstitutionalActivity />
            )}

            {activeTab === 'openinterest' && (
              <OpenInterestChart />
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Dashboard; 