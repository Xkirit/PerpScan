"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, SearchIcon } from 'lucide-react';
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
  message?: string;
  warning?: string;
  isInitializing?: boolean;
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
  
  // Get the base symbol (remove USDT)
  const baseSymbol = pattern.symbol.replace('USDT', '').toLowerCase();
  
  // Primary logo URL using CryptoIcons (more reliable for ticker symbols)
  const logoUrl = `https://cryptoicons.org/api/icon/${baseSymbol}/32`;
  
  // Fallback logo URL using alternative service
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
      {/* Glass shimmer effect */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${
            isBullish 
              ? 'rgba(16, 185, 129, 0.1) 0%, transparent 50%, rgba(16, 185, 129, 0.05) 100%'
              : 'rgba(248, 113, 113, 0.1) 0%, transparent 50%, rgba(248, 113, 113, 0.05) 100%'
          })`
        }}
              />
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
                    // Show a generic crypto icon as final fallback
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
          <span 
            style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
          >
            Type:
          </span>
          <span 
            className="font-medium"
            style={{ color: isBullish ? '#10b981' : '#f87171' }}
          >
            {pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span 
            style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
          >
            Body Ratio:
          </span>
          <span 
            className="font-medium"
            style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
          >
            {pattern.bodyRatio != null ? pattern.bodyRatio.toFixed(2) : '1.00'}x
          </span>
        </div>
        
        <div className="flex justify-between">
          <span 
            style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
          >
            Change:
          </span>
          <span 
            className="font-medium"
            style={{ color: priceChange >= 0 ? '#10b981' : '#f87171' }}
          >
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span 
            style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
          >
            Volume:
          </span>
          <span 
            className="font-medium"
            style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
          >
            {formatVolume(pattern.currentCandle.volume)}
          </span>
        </div>
      </div>
      </div>
    </div>
  );
};

type SortBy = 'bodyRatio' | 'volume' | 'priceChange';

// Timeframe column component
const TimeframeColumn: React.FC<{ 
  title: string; 
  patterns: EngulfingPattern[]; 
  theme: 'light' | 'dark';
  loading: boolean;
  sortBy: SortBy;
}> = ({ title, patterns, theme, loading, sortBy }) => {
  
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
        <h3 
          className="text-sm sm:text-md lg:text-xl font-bold mb-1 sm:mb-2 flex items-center justify-between gap-10 sm:gap-2"
          style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
        >
          <span className="truncate">{title}</span>
          <div className="flex items-center justify-between gap-1 flex-shrink-0">
            {loading ? (
              <span 
                className="text-xs font-normal px-1 sm:px-1.5 lg:px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: theme === 'dark' ? '#2d5a31' : '#b0d7b8',
                  color: theme === 'dark' ? '#ffffff' : '#1A1F16'
                }}
              >
                ...
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
        </h3>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="space-y-2 sm:space-y-3 h-full overflow-y-auto">
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
          <div className="h-full py-2 overflow-y-auto space-y-1.5 sm:space-y-2 lg:space-y-4 pr-1 px-1">
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

const CandlestickScreener: React.FC = () => {
  const [data, setData] = useState<ScreenerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [globalSortBy, setGlobalSortBy] = useState<SortBy>('bodyRatio');
  const { theme } = useTheme();

  const fetchData = useCallback(async (force: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const url = force ? '/api/candlestick-screener?force=true' : '/api/candlestick-screener';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ScreenerResult = await response.json();
      setData(result);
      setLastUpdated(new Date());
      
      // If this is the first load and data is initializing, show a helpful message
      if (result.isInitializing) {
        console.log('📊 Candlestick patterns are being computed for the first time...');
      }
    } catch (error) {
      console.error('Failed to fetch candlestick screener data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchData(false);
  }, [fetchData]);

  const handleForceRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => fetchData(false), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

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
          <h3 
            className="text-lg font-medium mb-2" 
            style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
          >
            Failed to Load Candlestick Screener
          </h3>
          <p 
            className="mb-4 text-sm" 
            style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
          >
            {error}
          </p>
          <Button onClick={handleForceRefresh} variant="outline">
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
            className="text-xl sm:text-2xl font-bold"
            style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
          >
            Candlestick Screener
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
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-1 px-2 sm:px-3 min-h-0"
          >
            <RefreshCwIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-xs sm:text-sm">Refresh</span>
          </Button>
          
          <Button
            onClick={handleForceRefresh}
            disabled={loading}
            variant="default"
            className="flex items-center gap-1 px-2 sm:px-3 min-h-0"
          >
            <SearchIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-pulse' : ''}`} />
            <span className="text-xs sm:text-sm">Scan Now</span>
          </Button>
        </div>
      </div>

      {/* Summary Stats & Sorting */}
      {data && !loading && (
        <div
          className="rounded-lg py-4"
          
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <span 
                className="text-xs sm:text-sm"
                style={{ color: theme === 'dark' ? '#3d6549' : '#5a9c76' }}
              >
                Sort by:
              </span>
              <select
                value={globalSortBy}
                onChange={(e) => setGlobalSortBy(e.target.value as SortBy)}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md border focus:outline-none backdrop-blur-[1px] flex-1 sm:flex-none"
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
            {/* <span 
              className="text-xs sm:text-sm text-center sm:text-right"
              style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
            >
              <span className="hidden sm:inline">Total patterns found: </span>
              <span className="sm:hidden">Patterns: </span>
              {data['1h'].length + data['4h'].length + data['1d'].length}
            </span> */}
          </div>
        </div>
      )}

      {/* Timeframe Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 h-[150vh] sm:h-[92vh] lg:h-[60vh] xl:h-[65vh]">
        <TimeframeColumn
          title="1 Hour"
          patterns={data?.['1h'] || []}
          theme={theme}
          loading={loading}
          sortBy={globalSortBy}
        />
        <TimeframeColumn
          title="4 Hour"
          patterns={data?.['4h'] || []}
          theme={theme}
          loading={loading}
          sortBy={globalSortBy}
        />
        <TimeframeColumn
          title="1 Day"
          patterns={data?.['1d'] || []}
          theme={theme}
          loading={loading}
          sortBy={globalSortBy}
        />
      </div>
    </div>
  );
};

export default CandlestickScreener; 