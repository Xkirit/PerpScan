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
import { RefreshCwIcon, TrendingUpIcon, BarChart3Icon, ClockIcon, ArrowDownIcon, ArrowUpIcon, EyeIcon, ChartCandlestick, UserIcon, ListIcon } from 'lucide-react';
import BtcPriceChange from './BtcPriceChange';
import { BybitClientService } from '@/lib/bybit-client-service';
import { useTheme } from '@/contexts/ThemeContext';
import CandlestickScreenerV2 from './CandlestickScreenerV2';
import WatchlistsManager from './WatchlistsManager';
import TraderChatBot from './Traderchatbot';
import { useRouter, usePathname } from 'next/navigation';


interface AnalysisResult {
  trending: CoinAnalysis[];
  strongest: CoinAnalysis[];
  weakest: CoinAnalysis[];
  timestamp: string;
  totalCoins: number;
}

// Countdown Timer Component
const CandleCountdown: React.FC = () => {
  const [timeLeft1h, setTimeLeft1h] = useState<string>('');
  const [timeLeft4h, setTimeLeft4h] = useState<string>('');
  const [timeLeft1d, setTimeLeft1d] = useState<string>('');
  const [showExpanded, setShowExpanded] = useState<boolean>(false);
  const { theme } = useTheme();

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentHour = now.getUTCHours();
      const currentMinute = now.getUTCMinutes();

      // 1 Hour countdown - next hour
      const next1h = new Date(now);
      next1h.setUTCHours(currentHour + 1, 0, 0, 0);
      const timeDiff1h = next1h.getTime() - now.getTime();
      
      if (timeDiff1h > 0) {
        const minutes = Math.floor((timeDiff1h % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff1h % (1000 * 60)) / 1000);
        setTimeLeft1h(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft1h('00:00');
      }

      // 4 Hour countdown - Find next 4-hour candle close (00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC)
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

      const timeDiff4h = nextCandle.getTime() - now.getTime();

      if (timeDiff4h > 0) {
        const hours = Math.floor(timeDiff4h / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff4h % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff4h % (1000 * 60)) / 1000);

        setTimeLeft4h(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft4h('00:00:00');
      }

      // 1 Day countdown - next midnight UTC
      const next1d = new Date(now);
      next1d.setUTCDate(next1d.getUTCDate() + 1);
      next1d.setUTCHours(0, 0, 0, 0);
      const timeDiff1d = next1d.getTime() - now.getTime();

      if (timeDiff1d > 0) {
        const hours = Math.floor(timeDiff1d / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff1d % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff1d % (1000 * 60)) / 1000);

        setTimeLeft1d(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft1d('00:00:00');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Main countdown display */}
      <div 
        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg border h-8 sm:h-9 cursor-pointer hover:opacity-80 transition-opacity"
        style={{ 
          backgroundColor: theme === 'dark' ? '#1E3F20' : '#c6e4cd',
          borderColor: theme === 'dark' ? '#4a7c59' : '#76ba94'
        }}
        onMouseEnter={() => setShowExpanded(true)}
        onMouseLeave={() => setShowExpanded(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowExpanded(!showExpanded);
        }}
      >
        <ClockIcon 
          className="h-3 w-3 sm:h-4 sm:w-4" 
          style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }} 
        />
        <div className="text-xs sm:text-sm">
          <span 
            className="font-medium" 
            style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
          >
            <span className="hidden sm:inline">4H Close:</span>
            <span className="sm:hidden">4H:</span>
          </span>
          <span 
            className="ml-1 sm:ml-2 font-mono" 
            style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
          >
            {timeLeft4h}
          </span>
        </div>
      </div>

      {/* Expanded dropdown */}
      {showExpanded && (
        <div 
          className="absolute top-full left-0 mt-2 z-[60] rounded-lg border shadow-xl p-3 min-w-[190px] bg-opacity-95 backdrop-blur-sm"
          style={{ 
            backgroundColor: theme === 'dark' ? '#1A1F16' : '#ffffff',
            borderColor: theme === 'dark' ? '#4a7c59' : '#76ba94',
            boxShadow: theme === 'dark' 
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)' 
              : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
          onMouseEnter={() => setShowExpanded(true)}
          onMouseLeave={() => setShowExpanded(false)}
        >
          <div className="space-y-2">
            {/* 1 Hour */}
            <div className="flex items-center justify-between">
              <span 
                className="text-xs font-medium"
                style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
              >
                1H Close:
              </span>
              <span 
                className="text-xs font-mono"
                style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
              >
                {timeLeft1h}
              </span>
            </div>

            {/* 4 Hour */}
            <div className="flex items-center justify-between">
              <span 
                className="text-xs font-medium"
                style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
              >
                4H Close:
              </span>
              <span 
                className="text-xs font-mono"
                style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
              >
                {timeLeft4h}
              </span>
            </div>

            {/* 1 Day */}
            <div className="flex items-center justify-between">
              <span 
                className="text-xs font-medium"
                style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
              >
                1D Close:
              </span>
              <span 
                className="text-xs font-mono"
                style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
              >
                {timeLeft1d}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<
    'analysis' | 'chart' | 'institutional' | 'openinterest' | 'candlestick' | 'watchlists' | 'chat'
  >('analysis');
  const [chartInterval, setChartInterval] = useState<'4h' | '1d'>('4h');
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const fetchData = useCallback(async (interval: '4h' | '1d' = chartInterval) => {
    setLoading(true);
    setError(null);

    try {
      // console.log('Starting client-side analysis with interval:', interval);
      const clientService = new BybitClientService();
      const result = await clientService.runCompleteAnalysis(50, interval);
      setData(result);
      setLastUpdated(new Date());
      // console.log('Client-side analysis completed successfully');
    } catch (error) {
              // //console.error('Client-side analysis failed:', error);
      setError('Failed to fetch data. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [chartInterval]);

  useEffect(() => {
    // console.log('Dashboard useEffect triggered with interval:', chartInterval);
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
      icon: TrendingUpIcon,
      param: 'trendanalysis'
    },
    {
      id: 'chart' as const,
      label: 'Multi-Ticker Chart',
      icon: BarChart3Icon,
      param: 'multiticker'
    },
    {
      id: 'institutional' as const,
      label: 'Institutional Activity',
      icon: EyeIcon,
      param: 'institutional'
    },
    {
      id: 'openinterest' as const,
      label: 'Open Interest',
      icon: BarChart3Icon,
      param: 'openinterest'
    },
    {
      id: 'candlestick' as const,
      label: 'Candlestick Screener',
      icon: ChartCandlestick,
      param: 'candlestick'
    },
    {
      id: 'watchlists' as const,
      label: 'Watchlists',
      icon: ListIcon,
      param: 'watchlists'
    },
    // {
    //   id: 'chat' as const,
    //   label: 'Chat',
    //   icon: UserIcon,
    //   param: 'chat'
    // },
  ];

  // Set active tab based on URL search params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    
    if (tab) {
      const currentTab = tabs.find(t => t.param === tab);
      if (currentTab) {
        setActiveTab(currentTab.id);
      }
    } else {
      setActiveTab('analysis');
    }
  }, [pathname]);

  const handleTabClick = (tabId: typeof activeTab, param: string) => {
    setActiveTab(tabId);
    if (tabId === 'analysis') {
      router.push('/');
    } else {
      router.push(`/?tab=${param}`);
    }
  };


  return (
    <div className="min-h-screen relative bg-background">
      {/* Fixed Background Grid */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundColor: theme === 'dark' ? '#0F1411' : '#f2f8f3',
          backgroundImage: theme === 'dark' ? `
            linear-gradient(rgba(26, 31, 22, 0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26, 31, 22, 0.8) 1px, transparent 1px)
          ` : `
            linear-gradient(rgba(198, 228, 205, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(198, 228, 205, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Scrollable Content */}
      <div
        className="relative z-10 min-h-screen transition-colors scrollbar-hide"
        style={{
          overflowY: 'auto',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none' // Internet Explorer and Edge
        }}
      >
      {/* Header */}
              <div 
                className="shadow-sm border-b relative z-10" 
                style={{ 
                  backgroundColor: theme === 'dark' ? '#122817' : '#e5f3e7', 
                  borderColor: theme === 'dark' ? '#2d5a31' : '#b0d7b8' 
                }}
              >
        <div className="max-w-[140vh] mx-auto px-4 sm:px-6 lg:px-12 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <img 
                src="/logo.svg" 
                alt="PerpFlow" 
                className="h-14 sm:h-15 md:h-17 lg:h-20 w-auto"
                style={{ 
                  filter: 'brightness(1.4) drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.8))',
                  transform: 'scaleY(0.92)'
                }}
              />
            </div>
           
            <div className="flex items-center py-1 gap-2 sm:gap-3 overflow-x-wrap z-12">
              <BtcPriceChange interval={chartInterval} />
              <CandleCountdown /> 
              <ThemeToggle />
              <Button
                onClick={() => fetchData(chartInterval)}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-0 sm:py-2 whitespace-nowrap h-8 sm:h-9 text-xs sm:text-sm min-h-0"
              >
                <RefreshCwIcon className={`h-4 w-4 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Interval Selector */}
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span 
              className="text-xs sm:text-sm font-medium" 
              style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
            >
              Analysis Interval:
            </span>
            <div 
              className="flex rounded-lg p-1 w-max" 
              style={{ backgroundColor: theme === 'dark' ? '#0F1411' : '#f2f8f3' }}
            >
              <button
                onClick={() => setChartInterval('4h')}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors"
                style={{
                  backgroundColor: chartInterval === '4h' 
                    ? (theme === 'dark' ? '#2d5a31' : '#b0d7b8') 
                    : 'transparent',
                  color: chartInterval === '4h' 
                    ? (theme === 'dark' ? '#ffffff' : '#1A1F16') 
                    : (theme === 'dark' ? '#4a7c59' : '#76ba94')
                }}
              >
                4H
              </button>
              <button
                onClick={() => setChartInterval('1d')}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors"
                style={{
                  backgroundColor: chartInterval === '1d' 
                    ? (theme === 'dark' ? '#2d5a31' : '#b0d7b8') 
                    : 'transparent',
                  color: chartInterval === '1d' 
                    ? (theme === 'dark' ? '#ffffff' : '#1A1F16') 
                    : (theme === 'dark' ? '#4a7c59' : '#76ba94')
                }}
              >
                1D
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-3 sm:mt-4">
            <div 
              className="border-b" 
              style={{ borderColor: theme === 'dark' ? '#2d5a31' : '#b0d7b8' }}
            >
              <nav className="-mb-px flex space-x-2 sm:space-x-6 md:space-x-8 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id, tab.param)}
                      className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap"
                      style={{
                        borderColor: activeTab === tab.id 
                          ? (theme === 'dark' ? '#ffffff' : '#1A1F16') 
                          : 'transparent',
                        color: activeTab === tab.id 
                          ? (theme === 'dark' ? '#ffffff' : '#1A1F16') 
                          : (theme === 'dark' ? '#4a7c59' : '#76ba94')
                      }}
                    >
                      {Icon && <Icon className="hidden sm:block h-3 w-3 sm:h-4 sm:w-4" />}
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">
                        {tab.id === 'analysis' ? 'Analysis' : 
                         tab.id === 'chart' ? 'Chart' : 
                         tab.id === 'institutional' ? 'Institutional' : 
                        //  tab.id === 'openinterest' ? 'OI' :
                         tab.id === 'watchlists' ? 'Lists' :
                         // tab.id === 'chat' ? 'Chat' :
                         'Patterns'
                         }
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[140vh] mx-auto px-8 lg:px-12 py-8 relative z-10 min-h-[90vh]">
        {error ? (
          <div className="text-center py-12">
            <div
              className="rounded-lg p-6"
              style={{
                border: theme === 'dark' 
                  ? '1px solid rgba(255, 255, 255, 0.2)' 
                  : '1px solid #b0d7b8',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                backgroundColor: theme === 'dark' ? 'transparent' : '#f0f7f1'
              }}
            >
              <h3 
                className="text-lg font-medium mb-2" 
                style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
              >
                Failed to Load Data
              </h3>
              <p 
                className="mb-4" 
                style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
              >
                {error}
              </p>
              <Button onClick={() => fetchData(chartInterval)} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <RefreshCwIcon 
              className="h-12 w-12 animate-spin mx-auto" 
              style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }} 
            />
            <h3 
              className="mt-4 text-lg font-medium" 
              style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
            >
              Analyzing Market Data
            </h3>
            <p 
              className="mt-2" 
              style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
            >
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
                  className="rounded-lg p-6 backdrop-blur-[3px]"
                  style={{
                    border: theme === 'dark' 
                      ? '1px solid rgba(255, 255, 255, 0.2)' 
                      : '1px solid #b0d7b8',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    backgroundColor: theme === 'dark' 
                      ? 'rgba(30, 63, 32, 0.1)' 
                      : '#f0f7f1'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p 
                        className="text-sm font-medium" 
                        style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
                      >
                        Top Trending
                      </p>
                      <button
                        onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${data.trending[0]?.symbol}.P`, '_blank')}
                        className="text-2xl font-bold cursor-pointer  hover:opacity-80"
                        style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
                      >
                        {data.trending[0]?.symbol.replace('USDT', '') || 'N/A'}
                      </button>
                      <p 
                        className="text-xs" 
                        style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
                      >
                        Score: {data.trending[0]?.trendScore.toFixed(2) || 'N/A'}
                      </p>
                    </div>
                    <TrendingUpIcon 
                      className="h-8 w-8" 
                      style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }} 
                    />
                  </div>
                </div>

                <div
                  className="rounded-lg p-6 backdrop-blur-[3px]"
                  style={{
                    border: theme === 'dark' 
                      ? '1px solid rgba(255, 255, 255, 0.2)' 
                      : '1px solid #b0d7b8',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    backgroundColor: theme === 'dark' 
                      ? 'rgba(30, 63, 32, 0.1)' 
                      : '#f0f7f1'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p 
                        className="text-sm font-medium" 
                        style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
                      >
                        Top Gainer
                      </p>
                      <button
                        onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${data.strongest[0]?.symbol}.P`, '_blank')}
                        className="text-2xl font-bold cursor-pointer  hover:opacity-80"
                        style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
                      >
                        {data.strongest[0]?.symbol.replace('USDT', '') || 'N/A'}
                      </button>
                      <p 
                        className="text-xs" 
                        style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
                      >
                        +{chartInterval === '4h'
                          ? data.strongest[0]?.priceChange4h.toFixed(2)
                          : data.strongest[0]?.priceChange24h.toFixed(2)
                        }% ({chartInterval})
                      </p>
                    </div>
                    <ArrowUpIcon 
                      className="h-8 w-8" 
                      style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }} 
                    />
                  </div>
                </div>

                <div
                  className="rounded-lg p-6 backdrop-blur-[3px]"
                  style={{
                    border: theme === 'dark' 
                      ? '1px solid rgba(255, 255, 255, 0.2)' 
                      : '1px solid #b0d7b8',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    backgroundColor: theme === 'dark' 
                      ? 'rgba(30, 63, 32, 0.1)' 
                      : '#f0f7f1'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p 
                        className="text-sm font-medium" 
                        style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
                      >
                        Top Loser
                      </p>
                      <button
                        onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${data.weakest[0]?.symbol}.P`, '_blank')}
                        className="text-2xl font-bold cursor-pointer  hover:opacity-80"
                        style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
                      >
                        {data.weakest[0]?.symbol.replace('USDT', '') || 'N/A'}
                      </button>
                      <p 
                        className="text-xs" 
                        style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
                      >
                        {chartInterval === '4h'
                          ? data.weakest[0]?.priceChange4h.toFixed(2)
                          : data.weakest[0]?.priceChange24h.toFixed(2)
                        }% ({chartInterval})
                      </p>
                    </div>
                    <ArrowDownIcon 
                      className="h-8 w-8" 
                      style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }} 
                    />
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
                <DataTable data={data.weakest} title="Weakest Performers" category="weakest" />
              </div>
            </div>

            {/* Other tabs - These maintain state when switching */}
            <div className={activeTab === 'chart' ? 'block' : 'hidden'}>
              <MultiTickerChart data={data.trending} interval={chartInterval} />
            </div>

            <div className={activeTab === 'institutional' ? 'block' : 'hidden'}>
              <InstitutionalActivity />
            </div>

            {/* <div className={activeTab === 'openinterest' ? 'block' : 'hidden'}>
              <OpenInterestChart />
            </div> */}

            <div className={activeTab === 'candlestick' ? 'block' : 'hidden'}>
              <CandlestickScreenerV2 />
            </div>

            <div className={activeTab === 'watchlists' ? 'block' : 'hidden'}>
              <WatchlistsManager />
            </div>

            {/* <div className={activeTab === 'chat' ? 'block' : 'hidden'}>
              <TraderChatBot />
            </div> */}
          </>
        ) : null}
      </div>

        {/* Enhanced Footer */}
        {data && !loading && (
          <footer 
            className="mt-16 py-8 border-t backdrop-blur-[4px]" 
            style={{ 
              borderColor: theme === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : '#b0d7b8',
              backgroundColor: theme === 'dark' 
                ? 'rgba(30, 63, 32, 0.1)' 
                : '#f2f8f3'
            }}
          >
            <div className="max-w-[140vh] items-center justify-between px-12 mx-auto">
          <div className="relative w-full flex flex-col md:flex-row items-center gap-8">
            
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
            <div className="flex items-center gap-3 mx-auto md:absolute md:left-1/2 md:-translate-x-1/2">
              <button 
                onClick={() => window.open('/docs', '_blank')}
                className="text-xs hover:opacity-80 transition-opacity"
                style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8' }}
              >
                Docs
              </button>
              <button 
                onClick={() => window.open('https://www.bybit.com', '_blank')}
                className="text-xs hover:opacity-80 transition-opacity"
                style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8' }}
              >
                Bybit
              </button>
               <button 
                onClick={() => window.open('https://www.tradingview.com', '_blank')}
                className="text-xs hover:opacity-80 transition-opacity"
                style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8' }}
              >
                TradingView
              </button>
              
            </div>

            {/* Right Section - Social Icons */}
            <div className="flex items-center justify-center gap-4 md:ml-auto">
             

              {/* Twitter */}
              <button 
                onClick={() => window.open('https://twitter.com', '_blank')}
                className="p-2 rounded-lg hover:opacity-80 transition-all duration-200 hover:scale-110 flex items-center justify-center"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9' }}
                title="Twitter"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="currentColor" 
                  style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#64748b' }} 
                  viewBox="0 0 24 24"
                >
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </button>

              {/* Discord */}
              <button 
                onClick={() => window.open('https://discord.com', '_blank')}
                className="p-2 rounded-lg hover:opacity-80 transition-all duration-200 hover:scale-110 flex items-center justify-center"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9' }}
                title="Discord"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="currentColor" 
                  style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#64748b' }} 
                  viewBox="0 0 24 24"
                >
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0190 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9460 2.4189-2.1568 2.4189Z"/>
                </svg>
              </button>

              {/* Telegram */}
              <button 
                onClick={() => window.open('https://telegram.org', '_blank')}
                className="p-2 rounded-lg hover:opacity-80 transition-all duration-200 hover:scale-110 flex items-center justify-center"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9' }}
                title="Telegram"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="currentColor" 
                  style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#64748b' }} 
                  viewBox="0 0 24 24"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div 
            className="mt-6 pt-4 border-t text-center mx-auto px-4" 
            style={{ borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9' }}
          >
            <p 
              className="text-xs" 
              style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : '#94a3b8' }}
            >
              © 2025 PerpFlow. Advanced analytics platform.
            </p>
          </div>
        </div>
      </footer>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 