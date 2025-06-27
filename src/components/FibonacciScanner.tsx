'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FibonacciAnalysis, FibRetracementScanResult } from '@/types';

interface ScannerParams {
  minRetracement: number;
  maxRetracement: number;
  requirePocConfluence: boolean;
  limit: number;
  minVolume: number;
}

interface DetailedAnalysisResponse {
  analysis: FibonacciAnalysis;
  metadata: {
    analysisCompleted: string;
    symbol: string;
    interpretation: {
      trend: string;
      retracement: string;
      targetZone: string;
      pocConfluence: string;
      quality: string;
      recommendation: string;
    };
  };
}

interface ScanResultsWithMetadata extends FibRetracementScanResult {
  metadata?: {
    scanCompleted: string;
    parameters: {
      minRetracement: number;
      maxRetracement: number;
      requirePocConfluence: boolean;
      limit: number;
    };
    description: string;
    targetLevels: string;
    strategy: string;
  };
}

const FibonacciScanner: React.FC = () => {
  const [scanResults, setScanResults] = useState<ScanResultsWithMetadata | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<DetailedAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  
  // Scanner parameters
  const [params, setParams] = useState<ScannerParams>({
    minRetracement: 30,
    maxRetracement: 80,
    requirePocConfluence: false,
    limit: 50,
    minVolume: 100000 // $100k minimum volume
  });

  // Auto-refresh interval
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5); // minutes
  const [showWatchlist, setShowWatchlist] = useState(false);

  const runScan = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        minRetracement: params.minRetracement.toString(),
        maxRetracement: params.maxRetracement.toString(),
        requirePocConfluence: params.requirePocConfluence.toString(),
        limit: params.limit.toString(),
        minVolume: params.minVolume.toString()
      });

      const response = await fetch(`/api/fibonacci-scanner?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to scan fibonacci retracements');
      }

      const data = await response.json();
      setScanResults(data);
      setLastScanTime(new Date());
      setSelectedAnalysis(null); // Clear detailed analysis when new scan runs
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error scanning fibonacci retracements:', err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  const getDetailedAnalysis = async (symbol: string) => {
    try {
      const response = await fetch('/api/fibonacci-scanner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get detailed analysis');
      }

      const data: DetailedAnalysisResponse = await response.json();
      setSelectedAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get detailed analysis');
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      runScan();
    }, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, runScan]);

  // Initial scan on component mount
  useEffect(() => {
    runScan();
  }, []);

  const formatPrice = (price: number): string => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 100) return price.toFixed(3);
    return price.toFixed(2);
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(0)}K`;
    return `$${volume.toFixed(0)}`;
  };

  const getQualityColor = (quality: 'high' | 'medium' | 'low'): string => {
    switch (quality) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTrendColor = (trend: 'bullish' | 'bearish'): string => {
    return trend === 'bullish' ? 'text-green-400' : 'text-red-400';
  };

  const generateWatchlistText = (format: 'short' | 'full' = 'short'): string => {
    if (!scanResults?.fibAnalyses || scanResults.fibAnalyses.length === 0) {
      return 'No coins found in current scan';
    }
    
    const symbols = scanResults.fibAnalyses.map(analysis => {
      const symbol = analysis.symbol;
      if (format === 'short') {
        // Remove USDT suffix and add .P for TradingView perpetual format (e.g., BTCUSDT -> BTC.P)
        return symbol.replace('USDT', '') + '.P';
      } else {
        // Keep full symbol name and add .P
        return symbol + '.P';
      }
    });
    
    return symbols.join(',');
  };

  const copyToClipboard = async () => {
    try {
      const watchlistText = generateWatchlistText();
      await navigator.clipboard.writeText(watchlistText);
      alert('Watchlist copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy to clipboard');
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
          🎯 Fibonacci Retracement Scanner
          <span className="ml-2 text-sm text-gray-400 font-normal">
            (0.618-0.66 Golden Zone)
          </span>
        </h2>
        
        {/* Scanner Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Min Retracement %
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={params.minRetracement}
              onChange={(e) => setParams(prev => ({ ...prev, minRetracement: parseInt(e.target.value) || 30 }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Max Retracement %
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={params.maxRetracement}
              onChange={(e) => setParams(prev => ({ ...prev, maxRetracement: parseInt(e.target.value) || 80 }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Min Volume ($)
            </label>
            <input
              type="number"
              min="1000"
              step="10000"
              value={params.minVolume}
              onChange={(e) => setParams(prev => ({ ...prev, minVolume: parseInt(e.target.value) || 100000 }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="100000"
            />
            <div className="text-xs text-gray-400 mt-1">
              ${(params.minVolume / 1000000).toFixed(1)}M min
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Max Coins
            </label>
            <input
              type="number"
              min="10"
              max="200"
              value={params.limit}
              onChange={(e) => setParams(prev => ({ ...prev, limit: parseInt(e.target.value) || 50 }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center text-gray-300">
              <input
                type="checkbox"
                checked={params.requirePocConfluence}
                onChange={(e) => setParams(prev => ({ ...prev, requirePocConfluence: e.target.checked }))}
                className="mr-2"
              />
              Require POC Confluence
            </label>
          </div>
        </div>

        {/* Auto-refresh Controls */}
        <div className="flex items-center space-x-4 mb-4">
          <label className="flex items-center text-gray-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            Auto-refresh
          </label>
          
          {autoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value={1}>1 minute</option>
              <option value={2}>2 minutes</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
            </select>
          )}
        </div>

        {/* Scan Button and Status */}
        <div className="flex items-center space-x-4">
          <button
            onClick={runScan}
            disabled={loading}
            className={`px-6 py-2 rounded font-medium ${
              loading 
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? '🔄 Scanning...' : '🎯 Run Fibonacci Scan'}
          </button>

          {lastScanTime && !loading && (
            <span className="text-sm text-gray-400">
              Last scan: {lastScanTime.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded">
          <p className="text-red-200">❌ {error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-blue-400 text-lg">🔄 Scanning for fibonacci retracements...</div>
          <div className="text-gray-400 text-sm mt-2">
            Analyzing swing points, calculating fibonacci levels, and checking POC confluence...
          </div>
        </div>
      )}

      {/* Results Summary */}
      {scanResults && !loading && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-2xl font-bold text-blue-400">{scanResults.filteredCount}</div>
              <div className="text-sm text-gray-400">Coins Found</div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-2xl font-bold text-gray-300">{scanResults.totalScanned}</div>
              <div className="text-sm text-gray-400">Total Scanned</div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-2xl font-bold text-green-400">{scanResults.scanTime}ms</div>
              <div className="text-sm text-gray-400">Scan Time</div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-2xl font-bold text-yellow-400">
                {scanResults.fibAnalyses.filter(a => a.confluence).length}
              </div>
              <div className="text-sm text-gray-400">With POC Confluence</div>
            </div>
          </div>

          {scanResults.metadata && (
            <div className="bg-gray-800 p-4 rounded mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">Scan Parameters</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <p><span className="text-gray-400">Strategy:</span> {scanResults.metadata.strategy}</p>
                <p><span className="text-gray-400">Target Zone:</span> {scanResults.metadata.targetLevels}</p>
                <p><span className="text-gray-400">Retracement Range:</span> {params.minRetracement}% - {params.maxRetracement}%</p>
                <p><span className="text-gray-400">POC Required:</span> {params.requirePocConfluence ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Table */}
      {scanResults?.fibAnalyses && scanResults.fibAnalyses.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">
              🎯 Fibonacci Retracement Opportunities ({scanResults.fibAnalyses.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWatchlist(!showWatchlist)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm flex items-center gap-2"
              >
                📋 {showWatchlist ? 'Hide' : 'Show'} Watchlist
              </button>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm flex items-center gap-2"
              >
                📄 Copy for TradingView
              </button>
            </div>
          </div>

          {/* Watchlist Display */}
          {showWatchlist && (
            <div className="mb-4 p-4 bg-gray-800 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-3">TradingView Watchlist Formats:</h4>
              
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Short format (BTC.P, ETH.P, etc.):</div>
                  <div className="bg-gray-900 p-3 rounded border font-mono text-sm text-green-400 overflow-x-auto">
                    {generateWatchlistText('short')}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-400 mb-1">Full format (BTCUSDT.P, ETHUSDT.P, etc.):</div>
                  <div className="bg-gray-900 p-3 rounded border font-mono text-sm text-blue-400 overflow-x-auto">
                    {generateWatchlistText('full')}
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-400 mt-3">
                💡 Use "Copy for TradingView" to copy the short format, or manually copy either format above
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300">Symbol</th>
                  <th className="text-left py-3 px-4 text-gray-300">Current Price</th>
                  <th className="text-left py-3 px-4 text-gray-300">Trend</th>
                  <th className="text-left py-3 px-4 text-gray-300">Retracement</th>
                  <th className="text-left py-3 px-4 text-gray-300">Quality</th>

                  <th className="text-left py-3 px-4 text-gray-300">24h Change</th>
                  <th className="text-left py-3 px-4 text-gray-300">Volume</th>
                  <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scanResults.fibAnalyses.map((analysis, index) => (
                  <tr key={analysis.symbol} className="border-b border-gray-800 hover:bg-gray-800">
                    <td className="py-3 px-4">
                      <span className="font-medium text-white">{analysis.symbol}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      ${formatPrice(analysis.currentPrice)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${getTrendColor(analysis.trend)}`}>
                        {analysis.trend.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {analysis.retracePercent.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${getQualityColor(analysis.quality)}`}>
                        {analysis.quality.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={analysis.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {analysis.priceChange24h >= 0 ? '+' : ''}{analysis.priceChange24h.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {formatVolume(analysis.volume24h)}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => getDetailedAnalysis(analysis.symbol)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs"
                      >
                        Analyze
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results */}
      {scanResults && scanResults.fibAnalyses.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg">📊 No fibonacci retracement opportunities found</div>
          <div className="text-gray-500 text-sm mt-2">
            Try adjusting your parameters or check back later
          </div>
        </div>
      )}

      {/* Detailed Analysis Modal/Panel */}
      {selectedAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  📊 Detailed Analysis: {selectedAnalysis.metadata.symbol}
                </h3>
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Analysis Overview */}
                <div className="bg-gray-800 p-4 rounded">
                  <h4 className="text-lg font-semibold text-white mb-3">📈 Analysis Overview</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-400">Trend:</span> <span className={getTrendColor(selectedAnalysis.analysis.trend)}>{selectedAnalysis.metadata.interpretation.trend}</span></p>
                    <p><span className="text-gray-400">Retracement:</span> <span className="text-white">{selectedAnalysis.metadata.interpretation.retracement}</span></p>
                    <p><span className="text-gray-400">Quality:</span> <span className={getQualityColor(selectedAnalysis.analysis.quality)}>{selectedAnalysis.metadata.interpretation.quality}</span></p>
                    <p><span className="text-gray-400">POC Confluence:</span> <span className={selectedAnalysis.analysis.confluence ? 'text-green-400' : 'text-red-400'}>{selectedAnalysis.metadata.interpretation.pocConfluence}</span></p>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-700 rounded">
                    <p className="text-sm font-medium text-white">💡 Recommendation:</p>
                    <p className={`text-sm mt-1 ${selectedAnalysis.analysis.confluence && selectedAnalysis.analysis.quality === 'high' ? 'text-green-400' : selectedAnalysis.analysis.confluence ? 'text-yellow-400' : 'text-red-400'}`}>
                      {selectedAnalysis.metadata.interpretation.recommendation}
                    </p>
                  </div>
                </div>

                {/* Fibonacci Levels */}
                <div className="bg-gray-800 p-4 rounded">
                  <h4 className="text-lg font-semibold text-white mb-3">🎯 Fibonacci Levels</h4>
                  <div className="space-y-2">
                    {selectedAnalysis.analysis.fibLevels.map((level, index) => {
                      const isTargetLevel = selectedAnalysis.analysis.targetLevels.some(t => t.level === level.level);
                      const distance = Math.abs(level.price - selectedAnalysis.analysis.currentPrice) / selectedAnalysis.analysis.currentPrice * 100;
                      
                      return (
                        <div key={index} className={`flex justify-between text-sm p-2 rounded ${isTargetLevel ? 'bg-yellow-900 border border-yellow-600' : 'bg-gray-700'}`}>
                          <span className={`${isTargetLevel ? 'text-yellow-400 font-bold' : 'text-gray-300'}`}>
                            {level.level === 0 ? 'Swing Low' : level.level === 1 ? 'Swing High' : `${(level.level * 100).toFixed(1)}%`}
                            {isTargetLevel && ' 🎯'}
                          </span>
                          <span className="text-white">${formatPrice(level.price)}</span>
                          <span className="text-gray-400">{distance.toFixed(2)}% away</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Swing Points */}
                <div className="bg-gray-800 p-4 rounded">
                  <h4 className="text-lg font-semibold text-white mb-3">⚡ Swing Points</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-green-400 font-medium">Swing High</p>
                      <p className="text-white">${formatPrice(selectedAnalysis.analysis.swingHigh.price)}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(selectedAnalysis.analysis.swingHigh.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-red-400 font-medium">Swing Low</p>
                      <p className="text-white">${formatPrice(selectedAnalysis.analysis.swingLow.price)}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(selectedAnalysis.analysis.swingLow.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Volume Profile */}
                {selectedAnalysis.analysis.pocLevel && (
                  <div className="bg-gray-800 p-4 rounded">
                    <h4 className="text-lg font-semibold text-white mb-3">📊 Volume Profile</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-yellow-400 font-medium">Point of Control (POC)</p>
                        <p className="text-white">${formatPrice(selectedAnalysis.analysis.pocLevel.price)}</p>
                        <p className="text-gray-400 text-xs">
                          {selectedAnalysis.analysis.pocLevel.percentage.toFixed(2)}% of volume
                        </p>
                      </div>
                      <div className="mt-3 p-2 bg-gray-700 rounded">
                        <p className="text-xs text-gray-300">
                          💡 POC represents the price level with highest trading volume, 
                          indicating strong institutional interest and potential support/resistance.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
                >
                  Close Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FibonacciScanner; 