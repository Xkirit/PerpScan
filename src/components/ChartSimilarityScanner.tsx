'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, SearchIcon, TargetIcon, ZapIcon, BarChart2Icon } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { ChartSimilarityResponse, SimilarityResult, SimilarityParameters } from '@/lib/chart-similarity-service';

interface ScannerParams {
  reference_symbol: string;
  min_correlation: number;
  max_dtw_distance: number;
  min_volume: number;
  limit: number;
  timeframe: '1h' | '4h' | '1d';
  algorithm: 'correlation' | 'dtw' | 'hybrid';
}

const formatVolume = (volume: number): string => {
  if (volume >= 1000000000) {
    return (volume / 1000000000).toFixed(1) + 'B';
  } else if (volume >= 1000000) {
    return (volume / 1000000).toFixed(1) + 'M';
  } else if (volume >= 1000) {
    return (volume / 1000).toFixed(1) + 'K';
  } else {
    return volume.toFixed(0);
  }
};

const formatPrice = (price: number): string => {
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(3);
  return price.toFixed(2);
};

const getSimilarityColor = (score: number): string => {
  if (score >= 0.9) return '#10b981'; // Green
  if (score >= 0.8) return '#059669'; // Dark green
  if (score >= 0.7) return '#fbbf24'; // Yellow
  if (score >= 0.6) return '#f59e0b'; // Orange
  if (score >= 0.5) return '#ef4444'; // Red
  return '#dc2626'; // Dark red
};

const getSimilarityGrade = (score: number): string => {
  if (score >= 0.9) return 'Excellent';
  if (score >= 0.8) return 'Very High';
  if (score >= 0.7) return 'High';
  if (score >= 0.6) return 'Moderate';
  if (score >= 0.5) return 'Low';
  return 'Very Low';
};

// Individual similarity card component
const SimilarityCard: React.FC<{ result: SimilarityResult; theme: 'light' | 'dark' }> = ({ result, theme }) => {
  const handleSymbolClick = () => {
    window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${result.symbol}.P`, '_blank');
  };

  const similarityColor = getSimilarityColor(result.similarity_score);
  const grade = getSimilarityGrade(result.similarity_score);
  const baseSymbol = result.symbol.replace('USDT', '').toLowerCase();
  const logoUrl = `https://cryptoicons.org/api/icon/${baseSymbol}/32`;
  const fallbackLogoUrl = `https://assets.coincap.io/assets/icons/${baseSymbol}@2x.png`;

  return (
    <div
      className="p-3 rounded-xl cursor-pointer hover:scale-[1.01] transition-all duration-300 ease-out border backdrop-blur-xl touch-manipulation hover:shadow-lg relative overflow-hidden group"
      style={{
        backgroundColor: theme === 'dark' 
          ? 'rgba(30, 63, 32, 0.6)' 
          : 'rgba(240, 247, 241, 0.9)',
        borderColor: theme === 'dark'
          ? 'rgba(255, 255, 255, 0.15)'
          : 'rgba(176, 215, 184, 0.8)',
        boxShadow: theme === 'dark'
          ? '0 4px 16px -4px rgba(0, 0, 0, 0.3)'
          : '0 2px 8px -2px rgba(0, 0, 0, 0.1)'
      }}
      onClick={handleSymbolClick}
    >
      {/* Glass shimmer effect */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${similarityColor}20 0%, transparent 50%, ${similarityColor}10 100%)`
        }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative h-6 w-6 flex-shrink-0">
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
              className="font-bold text-lg truncate"
              style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
            >
              {result.symbol.replace('USDT', '')}
            </span>
          </div>
          <TargetIcon className="h-5 w-5 flex-shrink-0" style={{ color: similarityColor }} />
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>Similarity:</span>
            <span className="font-bold" style={{ color: similarityColor }}>
              {(result.similarity_score * 100).toFixed(1)}%
            </span>
          </div>
          
          <div className="flex justify-between">
            <span style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>Grade:</span>
            <span className="font-medium" style={{ color: similarityColor }}>
              {grade}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>Correlation:</span>
            <span className="font-medium" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
              {result.correlation.toFixed(3)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>Price:</span>
            <span className="font-medium" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
              ${formatPrice(result.current_price)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>24h Change:</span>
            <span className="font-medium" style={{ color: result.price_change_24h >= 0 ? '#10b981' : '#f87171' }}>
              {result.price_change_24h >= 0 ? '+' : ''}{result.price_change_24h.toFixed(2)}%
            </span>
          </div>
          
          <div className="flex justify-between">
            <span style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>Volume:</span>
            <span className="font-medium" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
              ${formatVolume(result.volume_24h)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChartSimilarityScanner: React.FC = () => {
  const [data, setData] = useState<ChartSimilarityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { theme } = useTheme();

  const [params, setParams] = useState<ScannerParams>({
    reference_symbol: 'BTCUSDT',
    min_correlation: 0.7,
    max_dtw_distance: 100,
    min_volume: 1000000,
    limit: 30,
    timeframe: '4h',
    algorithm: 'hybrid'
  });

  const runScan = useCallback(async () => {
    if (!params.reference_symbol.trim()) {
      setError('Please enter a reference symbol');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Starting chart similarity scan...', params);
      
      const response = await fetch('/api/chart-similarity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ChartSimilarityResponse = await response.json();
      setData(result);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Failed to scan chart similarity:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const handleRefresh = useCallback(() => {
    runScan();
  }, [runScan]);

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
          className="rounded-xl p-6 max-w-md mx-auto backdrop-blur-[4px]"
          style={{
            border: theme === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.15)' 
              : '1px solid rgba(176, 215, 184, 0.8)',
            boxShadow: theme === 'dark'
              ? '0 8px 32px -8px rgba(0, 0, 0, 0.4), 0 4px 16px -4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 4px 16px -4px rgba(0, 0, 0, 0.1), 0 2px 8px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
            backgroundColor: theme === 'dark' ? 'rgba(30, 63, 32, 0.08)' : 'rgba(240, 247, 241, 0.7)'
          }}
        >
          <h3 className="text-lg font-medium mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
            Failed to Load Chart Similarity Scanner
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
            <BarChart2Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: theme === 'dark' ? '#4a7c59' : '#2f4f4f'}} />
            Chart Similarity Scanner
          </h2>
          <p 
            className="text-xs sm:text-sm mt-1"
            style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
          >
            Find coins with similar chart patterns
            {lastUpdated && (
              <>
                <span className="hidden sm:inline"> • Last scan: {formatLastUpdated(lastUpdated)}</span>
                <span className="sm:hidden block text-xs mt-1">Scanned: {formatLastUpdated(lastUpdated)}</span>
              </>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 px-2 sm:px-3"
          >
            <RefreshCwIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-xs sm:text-sm">Scan</span>
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div
        className="rounded-xl p-4 backdrop-blur-[4px]"
        style={{
          border: theme === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.1)' 
            : '1px solid rgba(176, 215, 184, 0.6)',
          boxShadow: theme === 'dark'
            ? '0 4px 16px -4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : '0 2px 8px -2px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          backgroundColor: theme === 'dark' 
            ? 'rgba(30, 63, 32, 0.05)' 
            : 'rgba(240, 247, 241, 0.6)'
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
              Reference Symbol
            </label>
            <input
              type="text"
              value={params.reference_symbol}
              onChange={(e) => setParams(prev => ({ ...prev, reference_symbol: e.target.value.toUpperCase() }))}
              placeholder="BTCUSDT"
              className="w-full px-3 py-2 rounded-md border text-sm focus:outline-none backdrop-blur-[1px]"
              style={{
                borderColor: theme === 'dark' ? '#4a7c59' : '#76ba94',
                backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                color: theme === 'dark' ? '#ffffff' : '#1A1F16'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
              Min Correlation
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={params.min_correlation}
              onChange={(e) => setParams(prev => ({ ...prev, min_correlation: parseFloat(e.target.value) || 0.7 }))}
              className="w-full px-3 py-2 rounded-md border text-sm focus:outline-none"
              style={{
                borderColor: theme === 'dark' ? '#4a7c59' : '#76ba94',
                backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                color: theme === 'dark' ? '#ffffff' : '#1A1F16'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
              Timeframe
            </label>
            <select
              value={params.timeframe}
              onChange={(e) => setParams(prev => ({ ...prev, timeframe: e.target.value as '1h' | '4h' | '1d' }))}
              className="w-full px-3 py-2 rounded-md border text-sm focus:outline-none"
              style={{
                borderColor: theme === 'dark' ? '#4a7c59' : '#76ba94',
                backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                color: theme === 'dark' ? '#ffffff' : '#1A1F16'
              }}
            >
              <option value="1h">1 Hour</option>
              <option value="4h">4 Hour</option>
              <option value="1d">1 Day</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
              Algorithm
            </label>
            <select
              value={params.algorithm}
              onChange={(e) => setParams(prev => ({ ...prev, algorithm: e.target.value as 'correlation' | 'dtw' | 'hybrid' }))}
              className="w-full px-3 py-2 rounded-md border text-sm focus:outline-none"
              style={{
                borderColor: theme === 'dark' ? '#4a7c59' : '#76ba94',
                backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                color: theme === 'dark' ? '#ffffff' : '#1A1F16'
              }}
            >
              <option value="correlation">Correlation</option>
              <option value="dtw">DTW Distance</option>
              <option value="hybrid">Hybrid (Recommended)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
              Min Volume ($)
            </label>
            <input
              type="number"
              min="100000"
              step="100000"
              value={params.min_volume}
              onChange={(e) => setParams(prev => ({ ...prev, min_volume: parseInt(e.target.value) || 1000000 }))}
              className="w-full px-3 py-2 rounded-md border text-sm focus:outline-none"
              style={{
                borderColor: theme === 'dark' ? '#4a7c59' : '#76ba94',
                backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                color: theme === 'dark' ? '#ffffff' : '#1A1F16'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
              Max DTW Distance
            </label>
            <input
              type="number"
              min="50"
              max="500"
              value={params.max_dtw_distance}
              onChange={(e) => setParams(prev => ({ ...prev, max_dtw_distance: parseInt(e.target.value) || 100 }))}
              className="w-full px-3 py-2 rounded-md border text-sm focus:outline-none"
              style={{
                borderColor: theme === 'dark' ? '#4a7c59' : '#76ba94',
                backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                color: theme === 'dark' ? '#ffffff' : '#1A1F16'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
              Results Limit
            </label>
            <input
              type="number"
              min="10"
              max="100"
              value={params.limit}
              onChange={(e) => setParams(prev => ({ ...prev, limit: parseInt(e.target.value) || 30 }))}
              className="w-full px-3 py-2 rounded-md border text-sm focus:outline-none"
              style={{
                borderColor: theme === 'dark' ? '#4a7c59' : '#76ba94',
                backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                color: theme === 'dark' ? '#ffffff' : '#1A1F16'
              }}
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg backdrop-blur-[4px]"
               style={{
                 backgroundColor: theme === 'dark' ? 'rgba(30, 63, 32, 0.3)' : 'rgba(240, 247, 241, 0.8)',
                 border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(176, 215, 184, 0.6)'
               }}>
            <RefreshCwIcon className="h-5 w-5 animate-spin" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }} />
            <span style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
              Analyzing chart patterns for {params.reference_symbol}...
            </span>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {data && !loading && (
        <div
          className="rounded-xl p-4 backdrop-blur-[4px] mb-4"
          style={{
            border: theme === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.1)' 
              : '1px solid rgba(176, 215, 184, 0.6)',
            backgroundColor: theme === 'dark' 
              ? 'rgba(30, 63, 32, 0.05)' 
              : 'rgba(240, 247, 241, 0.6)'
          }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
                {data.similar_coins.length}
              </div>
              <div className="text-sm" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
                Similar Charts
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
                {data.total_analyzed}
              </div>
              <div className="text-sm" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
                Total Analyzed
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
                {Math.round(data.scan_time / 1000)}s
              </div>
              <div className="text-sm" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
                Scan Time
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
                {data.algorithm_used.toUpperCase()}
              </div>
              <div className="text-sm" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
                Algorithm
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {data && data.similar_coins.length > 0 && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.similar_coins.map((result, index) => (
            <SimilarityCard 
              key={`${result.symbol}-${index}`} 
              result={result} 
              theme={theme}
            />
          ))}
        </div>
      )}

      {/* No Results */}
      {data && data.similar_coins.length === 0 && !loading && (
        <div className="text-center py-8">
          <div 
            className="text-lg font-medium mb-2"
            style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
          >
            No similar charts found
          </div>
          <div 
            className="text-sm"
            style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
          >
            Try adjusting your parameters or selecting a different reference symbol
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartSimilarityScanner;