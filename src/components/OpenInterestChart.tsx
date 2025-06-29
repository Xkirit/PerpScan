'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCwIcon, BarChart3Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/lib/api-service';

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
  const { theme } = useTheme();

  /*
   * Color palette
   * ------------------------------------------------------------
   * We centralize the colors here so light-mode tweaks are easy.
   *  - primaryColor:   main text / titles
   *  - accentColor:    subtle text (borders, axis, etc.)
   *  - bgSoftGreen:    translucent green card bg
   */
  const isDark = theme === 'dark';
  const primaryColor = isDark ? '#ffffff' : '#1f2937';   // gray-900 for light mode
  const accentColor  = isDark ? '#4a7c59' : '#2f4f4f';   // slate-700 for light mode
  const bgSoftGreen  = isDark ? 'rgba(30, 63, 32, 0.1)' : 'rgba(172, 225, 181, 0.15)';

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
      // console.log('📊 Fetching Open Interest data...');
      
      const tickers = await apiService.getUSDTTickers(1000000); // Get USDT tickers with >$1M OI
      
      const allUsdtTickers = tickers.map((ticker: any) => {
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
      });

      setOpenInterestData(allUsdtTickers.slice(0, 50)); // Top 50 assets
      setLastUpdated(new Date());
      // console.log(`📊 Loaded ${allUsdtTickers.length} open interest data points`);

    } catch (error) {
              // //console.error('❌ Error fetching open interest data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpenInterestData();
  }, [fetchOpenInterestData]);

  // Auto-refresh every 5 minutes to match optimization
  useEffect(() => {
    const interval = setInterval(fetchOpenInterestData, 5 * 60 * 1000);
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
        <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2" style={{ color: primaryColor }}>
          <BarChart3Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: accentColor }} />
          <span className="hidden sm:inline">Open Interest Analysis</span>
          <span className="sm:hidden">OI Analysis</span>
          {loading && <RefreshCwIcon className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" style={{ color: accentColor }} />}
        </h2>
        <div className="flex items-center gap-2 sm:gap-3">
          {lastUpdated && (
            <div className="text-xs sm:text-sm" style={{ color: accentColor }}>
              <span className="hidden sm:inline">Last updated: </span>
              {formatLastUpdated(lastUpdated)}
            </div>
          )}
          <Button
            onClick={fetchOpenInterestData}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 min-h-0"
          >
            <RefreshCwIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div 
          className="p-3 sm:p-4 rounded-lg backdrop-blur-[2px]" 
          style={{ 
            border: `1px solid ${accentColor}`,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            backgroundColor: bgSoftGreen
          }}
        >
          <div className="text-xs sm:text-sm font-medium truncate" style={{ color: primaryColor }}>
            <span className="hidden sm:inline">Total Assets</span>
            <span className="sm:hidden">Assets</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: primaryColor }}>
            {openInterestData.length}
          </div>
        </div>
        <div 
          className="p-3 sm:p-4 rounded-lg backdrop-blur-[2px]" 
          style={{ 
            border: `1px solid ${accentColor}`,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            backgroundColor: bgSoftGreen
          }}
        >
          <div className="text-xs sm:text-sm font-medium truncate" style={{ color: primaryColor }}>
            <span className="hidden sm:inline">Mega Whales</span>
            <span className="sm:hidden">Mega</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: primaryColor }}>
            {openInterestData.filter(item => item.whaleRating === 'mega').length}
          </div>
        </div>
        <div 
          className="p-3 sm:p-4 rounded-lg backdrop-blur-[2px]" 
          style={{ 
            border: `1px solid ${accentColor}`,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            backgroundColor: bgSoftGreen
          }}
        >
          <div className="text-xs sm:text-sm font-medium truncate" style={{ color: primaryColor }}>
            <span className="hidden sm:inline">Large Whales</span>
            <span className="sm:hidden">Large</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: primaryColor }}>
            {openInterestData.filter(item => item.whaleRating === 'large').length}
          </div>
        </div>
        <div 
          className="p-3 sm:p-4 rounded-lg backdrop-blur-[2px]" 
          style={{ 
            border: `1px solid ${accentColor}`,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            backgroundColor: bgSoftGreen
          }}
        >
          <div className="text-xs sm:text-sm font-medium truncate" style={{ color: primaryColor }}>
            <span className="hidden sm:inline">Total OI Value</span>
            <span className="sm:hidden">OI Value</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: primaryColor }}>
            ${(openInterestData.reduce((sum, item) => sum + item.openInterestValue, 0) / 1e9).toFixed(1)}B
          </div>
        </div>
      </div>

      {/* Top Open Interest Chart */}
      {openInterestData.length > 0 && (
        <div 
          className="rounded-lg p-4 sm:p-6 backdrop-blur-[2px]" 
          style={{ 
            border: `1px solid ${accentColor}`, 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', 
            backgroundColor: bgSoftGreen 
          }}
        >
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: primaryColor }}>
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
                  stroke={accentColor}
                  tick={{ fontSize: isMobile ? 7 : 10 }}
                  angle={isMobile ? -30 : -45}
                  textAnchor="end"
                  height={isMobile ? 45 : 80}
                  tickFormatter={(value) => value.replace('USDT', '')}
                  interval={0}
                />
                <YAxis 
                  yAxisId="left"
                  stroke={accentColor}
                  tick={{ fontSize: isMobile ? 7 : 10 }}
                  tickFormatter={(value) => `$${(value / 1e6).toFixed(0)}M`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke={accentColor}
                  tick={{ fontSize: isMobile ? 7 : 10 }}
                  tickFormatter={(value) => `${(value * 100).toFixed(3)}%`}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg shadow-lg p-3 backdrop-blur-sm max-w-xs" style={{
                          backgroundColor: bgSoftGreen,
                          border: `1px solid ${accentColor}`
                        }}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                              <span className="font-bold text-xs" style={{ color: accentColor }}>
                                {label?.toString().replace('USDT', '').slice(0, 2)}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm" style={{ color: primaryColor }}>
                              {label?.toString().replace('USDT', '')}
                            </h4>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-xs" style={{ color: accentColor }}>OI</span>
                              </div>
                              <span className="font-bold text-xs" style={{ color: accentColor }}>
                                ${(data.openInterestValue / 1e6).toFixed(1)}M
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-xs" style={{ color: accentColor }}>Funding</span>
                              </div>
                              <span className="font-bold text-xs" style={{ 
                                color: data.fundingRate > 0 
                                  ? (isDark ? '#ef4444' : '#dc2626')  // red for positive funding
                                  : (isDark ? '#16a34a' : '#15803d')  // green for negative funding
                              }}>
                                {(data.fundingRate * 100).toFixed(3)}%
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between pt-1 border-t" style={{ 
                              borderColor: accentColor 
                            }}>
                              <span className="text-xs" style={{ color: accentColor }}>Price</span>
                              <span className="text-xs font-medium" style={{ color: primaryColor }}>
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t" style={{ 
            borderColor: accentColor 
          }}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-2 sm:w-4 sm:h-3 bg-blue-500 opacity-70 rounded-sm"></div>
              <span className="text-xs sm:text-sm" style={{ color: accentColor }}>Open Interest</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 sm:w-4 bg-red-500 rounded-full"></div>
              <span className="text-xs sm:text-sm" style={{ color: accentColor }}>Funding Rate</span>
            </div>
            <div className="text-[10px] sm:text-xs italic text-center" style={{ color: accentColor }}>
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