'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCwIcon, BarChart3Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OpenInterestData {
  symbol: string;
  openInterest: number;
  openInterestValue: number;
  oiChange24h: number;
  oiChangePercent: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  fundingRate: number;
  timestamp: number;
  whaleRating?: 'mega' | 'large' | 'medium' | 'small';
}

const OpenInterestChart: React.FC = () => {
  const [openInterestData, setOpenInterestData] = useState<OpenInterestData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const fetchOpenInterestData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      console.log('📊 Fetching Open Interest data...');
      
      const tickersResponse = await fetch('https://api.bybit.com/v5/market/tickers?category=linear', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache',
      });

      if (!tickersResponse.ok) {
        throw new Error('Failed to fetch tickers data');
      }

      const tickersData = await tickersResponse.json();
      if (tickersData.retCode !== 0) {
        throw new Error(tickersData.retMsg);
      }

      const allUsdtTickers = tickersData.result.list
        .filter((ticker: any) => ticker.symbol.endsWith('USDT'))
        .map((ticker: any) => {
          const oiValue = parseFloat(ticker.openInterestValue || '0');
          
          // Whale rating based on OI value
          let whaleRating: 'mega' | 'large' | 'medium' | 'small' = 'small';
          if (oiValue > 1000000000) whaleRating = 'mega';      // >$1B
          else if (oiValue > 100000000) whaleRating = 'large';  // >$100M
          else if (oiValue > 10000000) whaleRating = 'medium';  // >$10M
          
          return {
            symbol: ticker.symbol,
            openInterest: parseFloat(ticker.openInterest || '0'),
            openInterestValue: oiValue,
            oiChange24h: parseFloat(ticker.price24hPcnt || '0'),
            oiChangePercent: parseFloat(ticker.price24hPcnt || '0'),
            price: parseFloat(ticker.lastPrice || '0'),
            priceChange24h: parseFloat(ticker.price24hPcnt || '0'),
            volume24h: parseFloat(ticker.turnover24h || '0'),
            fundingRate: parseFloat(ticker.fundingRate || '0'),
            timestamp: Date.now(),
            whaleRating
          };
        })
        .filter((item: OpenInterestData) => item.openInterestValue > 1000000)
        .sort((a: OpenInterestData, b: OpenInterestData) => b.openInterestValue - a.openInterestValue);

      setOpenInterestData(allUsdtTickers.slice(0, 50)); // Top 50 assets
      setLastUpdated(new Date());
      console.log(`📊 Loaded ${allUsdtTickers.length} open interest data points`);

    } catch (error) {
      console.error('❌ Error fetching open interest data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpenInterestData();
  }, [fetchOpenInterestData]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(fetchOpenInterestData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchOpenInterestData]);

  const formatLastUpdated = (date: Date) => {
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2" style={{ color: '#ffffff' }}>
          <BarChart3Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#4a7c59' }} />
          <span className="hidden sm:inline">Open Interest Analysis</span>
          <span className="sm:hidden">OI Analysis</span>
          {loading && <RefreshCwIcon className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" style={{ color: '#4a7c59' }} />}
        </h2>
        <div className="flex items-center gap-2 sm:gap-3">
          {lastUpdated && (
            <div className="text-xs sm:text-sm" style={{ color: '#4a7c59' }}>
              <span className="hidden sm:inline">Last updated: </span>
              {formatLastUpdated(lastUpdated)}
            </div>
          )}
          <Button
            onClick={fetchOpenInterestData}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
          >
            <RefreshCwIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">↻</span>
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div 
          className="p-3 sm:p-4 rounded-lg backdrop-blur-[2px]" 
          style={{ 
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            backgroundColor: 'rgba(30, 63, 32, 0.1)'
          }}
        >
          <div className="text-xs sm:text-sm font-medium truncate" style={{ color: '#ffffff' }}>
            <span className="hidden sm:inline">Total Assets</span>
            <span className="sm:hidden">Assets</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: '#ffffff' }}>
            {openInterestData.length}
          </div>
        </div>
        <div 
          className="p-3 sm:p-4 rounded-lg backdrop-blur-[2px]" 
          style={{ 
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            backgroundColor: 'rgba(30, 63, 32, 0.1)'
          }}
        >
          <div className="text-xs sm:text-sm font-medium truncate" style={{ color: '#ffffff' }}>
            <span className="hidden sm:inline">Mega Whales</span>
            <span className="sm:hidden">Mega</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: '#ffffff' }}>
            {openInterestData.filter(item => item.whaleRating === 'mega').length}
          </div>
        </div>
        <div 
          className="p-3 sm:p-4 rounded-lg backdrop-blur-[2px]" 
          style={{ 
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            backgroundColor: 'rgba(30, 63, 32, 0.1)'
          }}
        >
          <div className="text-xs sm:text-sm font-medium truncate" style={{ color: '#ffffff' }}>
            <span className="hidden sm:inline">Large Whales</span>
            <span className="sm:hidden">Large</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: '#ffffff' }}>
            {openInterestData.filter(item => item.whaleRating === 'large').length}
          </div>
        </div>
        <div 
          className="p-3 sm:p-4 rounded-lg backdrop-blur-[2px]" 
          style={{ 
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            backgroundColor: 'rgba(30, 63, 32, 0.1)'
          }}
        >
          <div className="text-xs sm:text-sm font-medium truncate" style={{ color: '#ffffff' }}>
            <span className="hidden sm:inline">Total OI Value</span>
            <span className="sm:hidden">OI Value</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: '#ffffff' }}>
            ${(openInterestData.reduce((sum, item) => sum + item.openInterestValue, 0) / 1e9).toFixed(1)}B
          </div>
        </div>
      </div>

      {/* Top Open Interest Chart */}
      {openInterestData.length > 0 && (
        <div 
          className="rounded-lg p-4 sm:p-6 backdrop-blur-[2px]" 
          style={{ 
            border: '1px solid rgba(255, 255, 255, 0.2)', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', 
            backgroundColor: 'rgba(30, 63, 32, 0.1)' 
          }}
        >
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: '#ffffff' }}>
            <span className="hidden sm:inline">OI vs Funding Rate</span>
            <span className="sm:hidden">OI Chart</span>
          </h3>
          <div style={{ height: isMobile ? '280px' : '600px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={openInterestData.slice(0, 30)} 
                margin={{ 
                  top: isMobile ? 10 : 20, 
                  right: isMobile ? 10 : 30, 
                  left: isMobile ? 2 : 20, 
                  bottom: isMobile ? 45 : 80 
                }}
              >
                <XAxis 
                  dataKey="symbol" 
                  stroke="#666"
                  className="dark:stroke-gray-400"
                  tick={{ fontSize: isMobile ? 7 : 10 }}
                  angle={isMobile ? -30 : -45}
                  textAnchor="end"
                  height={isMobile ? 45 : 80}
                  tickFormatter={(value) => value.replace('USDT', '')}
                  interval={0}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#666"
                  className="dark:stroke-gray-400"
                  tick={{ fontSize: isMobile ? 7 : 10 }}
                  tickFormatter={(value) => `$${(value / 1e6).toFixed(0)}M`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#666"
                  className="dark:stroke-gray-400"
                  tick={{ fontSize: isMobile ? 7 : 10 }}
                  tickFormatter={(value) => `${value.toFixed(2)}%`}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 backdrop-blur-sm max-w-xs">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">
                                {label?.toString().replace('USDT', '').slice(0, 2)}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                              {label?.toString().replace('USDT', '')}
                            </h4>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-xs text-gray-600 dark:text-gray-400">OI</span>
                              </div>
                              <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                                ${(data.openInterestValue / 1e6).toFixed(1)}M
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-xs text-gray-600 dark:text-gray-400">Funding</span>
                              </div>
                              <span className={`font-bold text-xs ${
                                data.fundingRate > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                              }`}>
                                {(data.fundingRate * 100).toFixed(3)}%
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Price</span>
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                ${data.price?.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="openInterestValue" 
                  fill="#3b82f6" 
                  opacity={0.7}
                  name="Open Interest Value"
                  cursor="pointer"
                  onClick={(data) => {
                    if (data && data.symbol) {
                      window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${data.symbol}.P`, '_blank');
                    }
                  }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="fundingRate" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Funding Rate"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* Chart Legend */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-2 sm:w-4 sm:h-3 bg-blue-500 opacity-70 rounded-sm"></div>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Open Interest</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 sm:w-4 bg-red-500 rounded-full"></div>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Funding Rate</span>
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 italic text-center">
              <span className="hidden sm:inline">Click any bar to open TradingView chart</span>
              <span className="sm:hidden">Tap bars for charts</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenInterestChart; 