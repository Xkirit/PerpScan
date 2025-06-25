"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, SearchIcon, BarChart3Icon, ZapIcon, ClockIcon } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '@/contexts/ThemeContext';

interface EngulfingPattern {
  symbol: string;
  type: 'bullish' | 'bearish';
  currentCandle: {
    open: number;
    close: number;
    high: number;
    low: number;
    timestamp: number;
    volume: number;
  };
  previousCandle: {
    open: number;
    close: number;
    high: number;
    low: number;
    timestamp: number;
    volume: number;
  };
  bodyRatio: number;
  priceChange: number;
}

interface ScreenerResult {
  '1h': EngulfingPattern[];
  '4h': EngulfingPattern[];
  '1d': EngulfingPattern[];
  timestamp: string;
  totalScanned: number;
  nextUpdate?: {
    '1h': number;
    '4h': number;
    '1d': number;
  };
}

// Helper function to format volume
const formatVolume = (volume: number): string => {
  if (volume >= 1000000) {
    return (volume / 1000000).toFixed(1) + 'M';
  } else if (volume >= 1000) {
    return (volume / 1000).toFixed(1) + 'K';
  } else {
    return volume.toFixed(0);
  }
};

// Individual pattern card component
const PatternCard: React.FC<{ pattern: EngulfingPattern; theme: 'light' | 'dark' }> = ({ pattern, theme }) => {
  const handleSymbolClick = () => {
    window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${pattern.symbol}.P`, '_blank');
  };

  const isBullish = pattern.type === 'bullish';
  const priceChange = pattern.priceChange || ((pattern.currentCandle.close - pattern.previousCandle.close) / pattern.previousCandle.close) * 100;
  
  const baseSymbol = pattern.symbol.replace('USDT', '').toLowerCase();
  const logoUrl = `https://cryptoicons.org/api/icon/${baseSymbol}/32`;
  const fallbackLogoUrl = `https://assets.coincap.io/assets/icons/${baseSymbol}@2x.png`;

  return (
    <div
      className="p-2 sm:p-3 rounded-xl cursor-pointer hover:scale-[1.01] transition-all duration-300 ease-out border backdrop-blur-xl touch-manipulation flex-shrink-0 hover:shadow-lg relative overflow-hidden group z-20"
      style={{
        backgroundColor: theme === 'dark' 
          ? (isBullish ? 'rgba(6, 78, 59, 0.4)' : 'rgba(69, 10, 10, 0.4)')
          : (isBullish ? 'rgba(236, 253, 245, 0.95)' : 'rgba(254, 242, 242, 0.95)'),
        borderColor: theme === 'dark'
          ? (isBullish ? 'rgba(16, 185, 129, 0.3)' : 'rgba(248, 113, 113, 0.3)')
          : (isBullish ? 'rgba(16, 185, 129, 0.4)' : 'rgba(248, 113, 113, 0.4)'),
        boxShadow: theme === 'dark'
          ? `0 4px 16px -4px ${isBullish ? 'rgba(16, 185, 129, 0.1)' : 'rgba(248, 113, 113, 0.1)'}`
          : `0 2px 8px -2px ${isBullish ? 'rgba(16, 185, 129, 0.15)' : 'rgba(248, 113, 113, 0.15)'}`
      }}
      onClick={handleSymbolClick}
    >
      <div className="relative z-30">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0">
              <img 
                src={logoUrl}
                alt={`${baseSymbol} logo`}
                className="h-full w-full rounded-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (img.src === logoUrl) {
                    img.src = fallbackLogoUrl;
                  } else {
                    const parent = img.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="h-full w-full rounded-full flex items-center justify-center text-xs font-bold" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                          ${baseSymbol.charAt(0).toUpperCase()}
                        </div>
                      `;
                    }
                  }
                }}
              />
            </div>
            <span 
              className="font-bold text-sm sm:text-lg truncate"
              style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
            >
              {pattern.symbol.replace('USDT', '')}
            </span>
          </div>
          {isBullish ? (
            <TrendingUpIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
          ) : (
            <TrendingDownIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
          )}
        </div>
      
        <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
          <div className="flex justify-between">
            <span style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>Type:</span>
            <span className="font-medium" style={{ color: isBullish ? '#10b981' : '#f87171' }}>
              {pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>Body Ratio:</span>
            <span className="font-medium" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
              {pattern.bodyRatio != null ? pattern.bodyRatio.toFixed(2) : '1.00'}x
            </span>
          </div>
          
          <div className="flex justify-between">
            <span style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>Change:</span>
            <span className="font-medium" style={{ color: priceChange >= 0 ? '#10b981' : '#f87171' }}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
          
          <div className="flex justify-between">
            <span style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>Volume:</span>
            <span className="font-medium" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
              {formatVolume(pattern.currentCandle.volume)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

type SortBy = 'bodyRatio' | 'volume' | 'priceChange';

// Timeframe column component with individual scan button
const TimeframeColumn: React.FC<{ 
  title: string; 
  timeframe: '1h' | '4h' | '1d';
  patterns: EngulfingPattern[]; 
  theme: 'light' | 'dark';
  loading: boolean;
  sortBy: SortBy;
  onScan: (timeframe: '1h' | '4h' | '1d') => void;
  isScanning: boolean;
}> = ({ title, timeframe, patterns, theme, loading, sortBy, onScan, isScanning }) => {
  
  // Sort patterns based on selected criteria
  const sortedPatterns = React.useMemo(() => {
    if (!patterns || patterns.length === 0) return [];
    
    return [...patterns].sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return b.currentCandle.volume - a.currentCandle.volume;
        case 'priceChange':
          return Math.abs(b.priceChange) - Math.abs(a.priceChange);
        case 'bodyRatio':
        default:
          return b.bodyRatio - a.bodyRatio;
      }
    });
  }, [patterns, sortBy]);

  return (
    <div
      className="rounded-lg p-3 sm:p-5 lg:p-6 backdrop-blur-[3px] flex flex-col h-full overflow-hidden"
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
      <div className="mb-2 sm:mb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 
            className="text-sm sm:text-md lg:text-xl font-bold flex items-center gap-2"
            style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
          >
            <span className="truncate">{title}</span>
          </h3>
          
          {/* Individual scan button */}
          <Button
            onClick={() => onScan(timeframe)}
            disabled={loading || isScanning}
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
          >
            {isScanning ? (
              <RefreshCwIcon className="h-3 w-3 animate-spin" />
            ) : (
              <SearchIcon className="h-3 w-3" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between gap-1 flex-shrink-0">
          {loading || isScanning ? (
            <span 
              className="text-xs font-normal px-1 sm:px-1.5 lg:px-2 py-0.5 rounded-full"
              style={{ 
                backgroundColor: theme === 'dark' ? '#2d5a31' : '#b0d7b8',
                color: theme === 'dark' ? '#ffffff' : '#1A1F16'
              }}
            >
              {isScanning ? 'Scanning...' : 'Loading...'}
            </span>
          ) : (
            <>
              {(() => {
                const bullishCount = patterns.filter(p => p.type === 'bullish').length;
                const bearishCount = patterns.filter(p => p.type === 'bearish').length;
                return (
                  <>
                    {bullishCount > 0 && (
                      <span 
                        className="text-xs font-normal px-1 sm:px-1.5 py-0.5 rounded-md"
                        style={{ 
                          backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(236, 253, 245, 0.8)',
                          color: '#10b981'
                        }}
                      >
                        {bullishCount}
                      </span>
                    )}
                    {bearishCount > 0 && (
                      <span 
                        className="text-xs font-normal px-1 sm:px-1.5 py-0.5 rounded-lg"
                        style={{ 
                          backgroundColor: theme === 'dark' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(254, 242, 242, 0.8)',
                          color: '#f87171'
                        }}
                      >
                        {bearishCount}
                      </span>
                    )}
                    {patterns.length === 0 && (
                      <span 
                        className="text-xs font-normal px-1 sm:px-1.5 lg:px-2 py-0.5 rounded-full"
                        style={{ 
                          backgroundColor: theme === 'dark' ? '#2d5a31' : '#b0d7b8',
                          color: theme === 'dark' ? '#ffffff' : '#1A1F16'
                        }}
                      >
                        0
                      </span>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {loading || isScanning ? (
          <div className="space-y-2 sm:space-y-3 h-full" >
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 sm:h-20 rounded-lg animate-pulse"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }}
              />
            ))}
          </div>
        ) : (
          <div className="h-full py-2 overflow-y-auto space-y-1.5 sm:space-y-2 lg:space-y-4 pr-1 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {patterns.length === 0 ? (
              <div 
                className="text-center py-6 sm:py-8 text-xs sm:text-sm"
                style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
              >
                No engulfing patterns found
              </div>
            ) : (
              sortedPatterns.map((pattern, index) => (
                <PatternCard 
                  key={`${pattern.symbol}-${index}`} 
                  pattern={pattern} 
                  theme={theme}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CandlestickScreenerV2: React.FC = () => {
  const [data, setData] = useState<ScreenerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [globalSortBy, setGlobalSortBy] = useState<SortBy>('bodyRatio');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '4h' | '1d'>('1h');
  const [scanningTimeframes, setScanningTimeframes] = useState<Set<'1h' | '4h' | '1d'>>(new Set());
  const [autoScanning, setAutoScanning] = useState<boolean>(true);
  const { theme } = useTheme();



  // Fetch cached data from screener endpoint
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/candlestick-screener');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ScreenerResult = await response.json();
      setData(result);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Failed to fetch candlestick screener data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Scan individual timeframe
  const scanTimeframe = useCallback(async (timeframe: '1h' | '4h' | '1d') => {
    setScanningTimeframes(prev => new Set(prev).add(timeframe));
    setError(null);

    try {
      console.log(`🔄 Scanning ${timeframe} timeframe...`);
      
      const response = await fetch('/api/candlestick-compute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer default-secret'
        },
        body: JSON.stringify({
          timeframe,
          force: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ ${timeframe} scan completed: ${result.patternsFound} patterns found`);
        
        // Refresh data to show updated results
        await fetchData();
      } else {
        throw new Error(result.error || 'Scan failed');
      }
      
    } catch (error) {
      console.error(`❌ Failed to scan ${timeframe}:`, error);
      setError(`Failed to scan ${timeframe}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setScanningTimeframes(prev => {
        const newSet = new Set(prev);
        newSet.delete(timeframe);
        return newSet;
      });
    }
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Check if it's time to auto-scan based on candle close times
  const checkAutoScanTrigger = useCallback(async () => {
    if (!autoScanning) return;
    
    const now = new Date();
    const currentMinute = now.getUTCMinutes();
    const currentHour = now.getUTCHours();
    
    // Check if we're at the start of a new candle (first 2 minutes)
    const isNewCandle = currentMinute <= 2;
    
    if (isNewCandle) {
      const timeframesToScan: Array<'1h' | '4h' | '1d'> = [];
      
      // Always scan 1h at every hour
      timeframesToScan.push('1h');
      
      // Scan 4h at 0, 4, 8, 12, 16, 20 UTC
      if (currentHour % 4 === 0) {
        timeframesToScan.push('4h');
      }
      
      // Scan 1d at 0 UTC (start of new day)
      if (currentHour === 0) {
        timeframesToScan.push('1d');
      }
      
      // Trigger scans for the appropriate timeframes
      for (const timeframe of timeframesToScan) {
        // Check if we're not already scanning this timeframe
        if (!scanningTimeframes.has(timeframe)) {
          console.log(`🕒 Auto-triggering ${timeframe} scan at candle close`);
          await scanTimeframe(timeframe);
          // Small delay between auto-scans
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
  }, [autoScanning, scanningTimeframes, scanTimeframe]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 5 minutes
    const dataInterval = setInterval(() => fetchData(), 5 * 60 * 1000);
    
    // Check for auto-scan triggers every minute
    const autoScanInterval = setInterval(checkAutoScanTrigger, 60 * 1000);
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(autoScanInterval);
    };
  }, [fetchData, checkAutoScanTrigger]);

  const formatLastUpdated = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div
          className="rounded-lg p-6 max-w-md mx-auto"
          style={{
            border: theme === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.2)' 
              : '1px solid #b0d7b8',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            backgroundColor: theme === 'dark' ? 'rgba(30, 63, 32, 0.1)' : '#f0f7f1'
          }}
        >
          <h3 className="text-lg font-medium mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
            Failed to Load Candlestick Screener
          </h3>
          <p className="mb-4 text-sm" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
            {error}
          </p>
          <Button onClick={handleRefresh} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-[60vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1">
          <h2 
            className="text-xl sm:text-2xl font-bold flex items-center gap-2"
            style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
          >
            <BarChart3Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: theme === 'dark' ? '#4a7c59' : '#2f4f4f'}} />
            Candlestick Screener
            {autoScanning && (
              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                AUTO
              </span>
            )}
          </h2>
          <p 
            className="text-xs sm:text-sm mt-1"
            style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
          >
            <span className="hidden sm:inline">Engulfing patterns across timeframes</span>
            <span className="sm:hidden">Engulfing patterns</span>
            {lastUpdated && (
              <>
                <span className="hidden sm:inline"> • Last updated: {formatLastUpdated(lastUpdated)}</span>
                <span className="sm:hidden block text-xs mt-1">Updated: {formatLastUpdated(lastUpdated)}</span>
              </>
            )}
          </p>
          

        </div>
        
        <div className="flex gap-2">
          {/* Auto-scan toggle */}
          <Button
            onClick={() => setAutoScanning(!autoScanning)}
            variant={autoScanning ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-1 px-2 sm:px-3 min-h-full"
          >
            <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">
              {autoScanning ? 'Auto: ON' : 'Auto: OFF'}
            </span>
          </Button>
          
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-1 px-2 sm:px-3 min-h-0"
          >
            <RefreshCwIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-xs sm:text-sm">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Controls */}
      {data && !loading && (
        <div
          className="rounded-lg p-3 sm:p-4 mb-4"
          
          
        >

          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Mobile Timeframe Selector */}
              <div className="flex items-center gap-2 sm:hidden">
                <span className="text-xs" style={{ color: theme === 'dark' ? '#3d6549' : '#5a9c76' }}>
                  Timeframe:
                </span>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value as '1h' | '4h' | '1d')}
                  className="px-2 py-1 text-xs rounded-md border focus:outline-none backdrop-blur-[1px] min-w-0 w-auto"
                  style={{
                    borderColor: theme === 'dark' ? '#4a7c59' : '#76ba94',
                    color: theme === 'dark' ? '#ffffff' : '#1A1F16'
                  }}
                >
                  <option value="1h">1 Hour</option>
                  <option value="4h">4 Hour</option>
                  <option value="1d">1 Day</option>
                </select>
              </div>
               
              {/* Sort By Selector */}
              <div className="flex items-center">
                <span className="text-xs sm:text-sm" style={{ color: theme === 'dark' ? '#3d6549' : '#5a9c76' }}>
                  Sort by:
                </span>
                <select
                  value={globalSortBy}
                  onChange={(e) => setGlobalSortBy(e.target.value as SortBy)}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md border focus:outline-none backdrop-blur-[1px] min-w-0 w-auto"
                  style={{
                    borderColor: theme === 'dark' ? '#4a7c59' : '#76ba94',
                    color: theme === 'dark' ? '#ffffff' : '#1A1F16'
                  }}
                >
                  <option value="bodyRatio">Body Ratio</option>
                  <option value="volume">Volume</option>
                  <option value="priceChange">Price Change</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeframe Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 h-[100vh] sm:h-[92vh] lg:h-[60vh] xl:h-[65vh]">
        {/* Mobile: Show only selected timeframe */}
        <div className="lg:hidden max-h-[100vh]">
          <TimeframeColumn
            title={selectedTimeframe === '1h' ? '1 Hour' : selectedTimeframe === '4h' ? '4 Hour' : '1 Day'}
            timeframe={selectedTimeframe}
            patterns={data?.[selectedTimeframe] || []}
            theme={theme}
            loading={loading}
            sortBy={globalSortBy}
            onScan={scanTimeframe}
            isScanning={scanningTimeframes.has(selectedTimeframe)}
          />
        </div>
        
        {/* Desktop: Show all timeframes */}
        <div className="hidden lg:contents">
          <TimeframeColumn
            title="1 Hour"
            timeframe="1h"
            patterns={data?.['1h'] || []}
            theme={theme}
            loading={loading}
            sortBy={globalSortBy}
            onScan={scanTimeframe}
            isScanning={scanningTimeframes.has('1h')}
          />
          <TimeframeColumn
            title="4 Hour"
            timeframe="4h"
            patterns={data?.['4h'] || []}
            theme={theme}
            loading={loading}
            sortBy={globalSortBy}
            onScan={scanTimeframe}
            isScanning={scanningTimeframes.has('4h')}
          />
          <TimeframeColumn
            title="1 Day"
            timeframe="1d"
            patterns={data?.['1d'] || []}
            theme={theme}
            loading={loading}
            sortBy={globalSortBy}
            onScan={scanTimeframe}
            isScanning={scanningTimeframes.has('1d')}
          />
        </div>
      </div>
    </div>
  );
};

export default CandlestickScreenerV2; 