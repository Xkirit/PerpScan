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
        <span className="font-medium" style={{ color: '#ffffff' }}>4H Close:</span>
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
      className="min-h-screen transition-colors relative scrollbar-hide"
      style={{
        backgroundColor: '#0F1411',
        backgroundImage: `
          linear-gradient(rgba(26, 31, 22, 0.8) 1px, transparent 1px),
          linear-gradient(90deg, rgba(26, 31, 22, 0.8) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        overflowY: 'scroll', // Force scrollbar to always be present
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none' // Internet Explorer and Edge
      }}
    >
      {/* Header */}
      <div className="shadow-sm border-b relative z-10" style={{ backgroundColor: '#15321a', borderColor: '#2d5a31' }}>
        <div className="max-w-[140vh] mx-auto px-8 lg:px-12 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <img 
                src="/logo.svg" 
                alt="PerpFlow" 
                className="h-20 w-auto"
                style={{ 
                  filter: 'brightness(1.2)',
                  transform: 'scaleY(0.92)'
                }}
              />
              {/* <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
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
              </div> */}
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
              Consulting the crypto crystal ball..
            </p>
          </div>
        ) : data ? (
          <>
            {/* Trend Analysis Tab - Only this tab reloads when switching back */}
            <div className={`space-y-8 ${activeTab === 'analysis' ? 'block' : 'hidden'}`}>
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
                        className="text-2xl font-bold cursor-pointer  hover:opacity-80"
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
                        className="text-2xl font-bold cursor-pointer  hover:opacity-80"
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
                        className="text-2xl font-bold cursor-pointer  hover:opacity-80"
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
                <DataTable data={data.trending} title="Trending Coins" category="trending" />
                <DataTable data={data.strongest} title="Strongest Performers" category="strongest" />
                <DataTable data={data.weakest} title="📉 Weakest Performers" category="weakest" />
              </div>
            </div>

            {/* Other tabs - These maintain state when switching */}
            <div className={activeTab === 'chart' ? 'block' : 'hidden'}>
              <MultiTickerChart data={allCoins} interval={chartInterval} />
            </div>

            <div className={activeTab === 'institutional' ? 'block' : 'hidden'}>
              <InstitutionalActivity />
            </div>

            <div className={activeTab === 'openinterest' ? 'block' : 'hidden'}>
              <OpenInterestChart />
            </div>
          </>
        ) : null}
      </div>

                      {/* Enhanced Footer */}
        {data && !loading && (
          <footer className="mt-16 py-8 border-t backdrop-blur-[2px]" style={{ 
            borderColor: 'rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(30, 63, 32, 0.1)'
          }}>
            <div className="max-w-[140vh] items-center justify-center px-12 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            
            {/* Left Section - Brand & Description */}
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.svg" 
                  alt="PerpFlow" 
                  className="h-6 w-auto opacity-60"
                />
              </div>
            </div>

            {/* Center Section - Quick Links */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.open('https://docs.bybit.com/v5/intro', '_blank')}
                className="text-xs hover:opacity-80 transition-opacity"
                style={{ color: 'rgba(255, 255, 255, 0.5)' }}
              >
                API Docs
              </button>
              <button 
                onClick={() => window.open('https://www.bybit.com', '_blank')}
                className="text-xs hover:opacity-80 transition-opacity"
                style={{ color: 'rgba(255, 255, 255, 0.5)' }}
              >
                Bybit
              </button>
               <button 
                onClick={() => window.open('https://www.tradingview.com', '_blank')}
                className="text-xs hover:opacity-80 transition-opacity"
                style={{ color: 'rgba(255, 255, 255, 0.5)' }}
              >
                TradingView
              </button>
              
            </div>

            {/* Right Section - Social Icons */}
            <div className="flex items-center gap-4">
              {/* GitHub */}
              <button 
                onClick={() => window.open('https://github.com', '_blank')}
                className="p-2 rounded-lg hover:opacity-80 transition-all duration-200 hover:scale-110"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                title="GitHub"
              >
                <svg className="w-4 h-4" fill="currentColor" style={{ color: 'rgba(255, 255, 255, 0.6)' }} viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </button>

              {/* Twitter */}
              <button 
                onClick={() => window.open('https://twitter.com', '_blank')}
                className="p-2 rounded-lg hover:opacity-80 transition-all duration-200 hover:scale-110"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                title="Twitter"
              >
                <svg className="w-4 h-4" fill="currentColor" style={{ color: 'rgba(255, 255, 255, 0.6)' }} viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </button>

              {/* Discord */}
              <button 
                onClick={() => window.open('https://discord.com', '_blank')}
                className="p-2 rounded-lg hover:opacity-80 transition-all duration-200 hover:scale-110"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                title="Discord"
              >
                <svg className="w-4 h-4" fill="currentColor" style={{ color: 'rgba(255, 255, 255, 0.6)' }} viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0190 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9460 2.4189-2.1568 2.4189Z"/>
                </svg>
              </button>

              {/* Telegram */}
              <button 
                onClick={() => window.open('https://telegram.org', '_blank')}
                className="p-2 rounded-lg hover:opacity-80 transition-all duration-200 hover:scale-110"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                title="Telegram"
              >
                <svg className="w-4 h-4" fill="currentColor" style={{ color: 'rgba(255, 255, 255, 0.6)' }} viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="mt-6 pt-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Left Section - Empty spacer to match brand section above */}
              <div className="flex flex-col items-center md:items-start gap-2">
                <div className="opacity-0">
                  <div className="flex items-center gap-3">
                    <img 
                      src="/logo.svg" 
                      alt="PerpFlow" 
                      className="h-6 w-auto opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* Center Section - Copyright text aligned with quick links above */}
              <div className="flex items-center">
                <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                  © 2025 PerpFlow. Advanced perpetual futures analytics platform.
                </p>
              </div>

              {/* Right Section - Empty spacer to match social icons above */}
              <div className="flex items-center gap-4 opacity-0">
                <div className="p-2 rounded-lg">
                  <div className="w-4 h-4"></div>
                </div>
                <div className="p-2 rounded-lg">
                  <div className="w-4 h-4"></div>
                </div>
                <div className="p-2 rounded-lg">
                  <div className="w-4 h-4"></div>
                </div>
                <div className="p-2 rounded-lg">
                  <div className="w-4 h-4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
        )}
    </div>
  );
};

export default Dashboard; 