'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, TooltipProps, ReferenceLine } from 'recharts';
import { CoinAnalysis } from '@/types';
import { RefreshCwIcon, AlertTriangleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/lib/api-service';

// -----------------------------------------------------------------------------
//  ⚙️  Design-system colour palette (centralises light / dark colours)
// -----------------------------------------------------------------------------
//  - primaryColor  : main foreground headings / body
//  - accentColor   : muted accents (borders, captions, axis labels)
//  - bgSoftGreen   : translucent green card background
// -----------------------------------------------------------------------------
const usePalette = (theme: string) => {
  const isDark = theme === 'dark';
  return {
    isDark,
    primaryColor: isDark ? '#ffffff' : '#1f2937',      // gray-900
    accentColor : isDark ? '#4a7c59' : '#2f4f4f',      // slate-700
    accentStroke: isDark ? '#666666' : '#76ba94',      // axis & strokes
    bgSoftGreen : isDark ? 'rgba(30,63,32,0.10)' : 'rgba(172,225,181,0.15)'
  };
};

interface HistoricalDataPoint {
  timestamp: number;
  time: string;
  [symbol: string]: number | string;
}



interface MultiTickerChartProps {
  data: CoinAnalysis[];
  interval: string;
}

// Visually distinct color palette
const chartColors = [
  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
  '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080',
  '#42d4f4', '#bfef45', '#dcbeff', '#a9a9a9', '#ffb347', '#bada55', '#ff69b4', '#c0c0c0', '#ff6347',
];

// Custom component to render labels at the end of lines
const CustomLineLabels = ({ selectedCoins, historicalData, chartColors }: {
  selectedCoins: string[];
  historicalData: any[];
  chartColors: string[];
}) => {
  if (!historicalData.length) return null;

  const lastDataPoint = historicalData[historicalData.length - 1];

  return (
    <g>
      {selectedCoins.map((symbol, index) => {
        const value = lastDataPoint?.[symbol];
        if (typeof value === 'number' && !isNaN(value)) {
          return (
            <text
              key={`label-${symbol}`}
              x="98%"
              y={`${50 - (value * 1.5)}%`}
              fill={chartColors[index % chartColors.length]}
              fontSize="11"
              fontWeight="600"
              textAnchor="start"
              dominantBaseline="middle"
              style={{ cursor: 'pointer' }}
              onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${symbol}.P`, '_blank')}
            >
              {symbol.replace('USDT', '')}
            </text>
          );
        }
        return null;
      })}
    </g>
  );
};

const MultiTickerChart: React.FC<MultiTickerChartProps> = ({ data, interval }) => {
  const { theme } = useTheme();
  const palette = usePalette(theme);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCoins, setSelectedCoins] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [btcChange, setBtcChange] = useState<number | null>(null);
  const [coinLimit, setCoinLimit] = useState<10 | 20 | 50 | 100>(20);
  const [filterType, setFilterType] = useState<'trendScore' | 'volume24h' | 'custom'>('trendScore');
  const [rawVolumeData, setRawVolumeData] = useState<{ symbol: string; volume24h: number; rawVolume: number; rawTurnover: number }[]>([]);
  const [hoveredTicker, setHoveredTicker] = useState<string | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ---------------------------------------------------------------------
  // Unique colour assignment — avoids duplicates & excludes black.
  // ---------------------------------------------------------------------
  const colorMapRef = useRef<Record<string, string>>({});
  const nextColorIndexRef = useRef(0);

  const getColorForSymbol = useCallback((symbol: string) => {
    if (!colorMapRef.current[symbol]) {
      if (nextColorIndexRef.current < chartColors.length) {
        // use next unused palette colour
        colorMapRef.current[symbol] = chartColors[nextColorIndexRef.current];
      } else {
        // fallback: generate HSL colour so we never duplicate nor hit black
        const hue = (nextColorIndexRef.current * 37) % 360;
        colorMapRef.current[symbol] = `hsl(${hue} 70% 50%)`;
      }
      nextColorIndexRef.current += 1;
    }
    return colorMapRef.current[symbol];
  }, []);

  // Track screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // Check on mount
    checkScreenSize();

    // Add event listener for resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch raw volume data from consolidated API service
  const fetchRawVolumeData = useCallback(async () => {
    try {
      // console.log('Fetching raw volume data from API service...');
      const tickers = await apiService.getTickers();
      
      const volumeData = tickers
        .filter((ticker: any) => ticker.symbol.endsWith('USDT'))
        .map((ticker: any) => ({
          symbol: ticker.symbol,
          volume24h: parseFloat(ticker.turnover24h || '0'), // Use turnover24h for USD value
          rawVolume: ticker.volume24h,
          rawTurnover: ticker.turnover24h
        }))
        .sort((a: any, b: any) => b.volume24h - a.volume24h);

      // console.log('Top 10 volume coins:', volumeData.slice(0, 10));
      setRawVolumeData(volumeData);
    } catch (error) {
      // //console.error('Error fetching volume data:', error);
    }
  }, []);

  // Sort and slice coins based on filterType
  const topCoins = useMemo(() => {
    if (filterType === 'volume24h') {
      return rawVolumeData.slice(0, coinLimit);
    }
    if (filterType === 'custom') {
      // Always provide up to the top 100 alphabetical coins to choose from, ignoring coinLimit
      return [...data].sort((a, b) => a.symbol.localeCompare(b.symbol)).slice(0, 100);
    }
    
    let sorted = [...data];
    // trendScore path
    sorted.sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0));
    return sorted.slice(0, coinLimit);
  }, [data, coinLimit, filterType, rawVolumeData]);

  const topCoinSymbols = useMemo(() => topCoins.map(coin => coin.symbol), [topCoins]);

  // Fetch raw volume data when filter type changes to volume
  useEffect(() => {
    if (filterType === 'volume24h') {
      fetchRawVolumeData();
    }
  }, [filterType, fetchRawVolumeData]);

  const fetchBtcChange = useCallback(async (interval: string) => {
    try {
      const change = await apiService.getBTCPriceChange(interval as '4h' | '1d');
      setBtcChange(change);
    } catch (error) {
      // //console.error('Error fetching BTC data:', error);
    }
  }, []);

  const fetchHistoricalDataClientSide = useCallback(async (symbols: string[], interval: string) => {
          // console.log('Fetching historical data client-side...');
    setError(null);
    
    try {
      // Determine Bybit interval and number of points
      let bybitInterval = '60'; // 1 hour
      let points = 24; // 24 hours
      if (interval === '1d') {
        bybitInterval = 'D';
        points = 30; // 30 days
      }

      const historicalPromises = symbols.slice(0, coinLimit).map(async (symbol: string) => {
        try {
          const endTime = Date.now();
          const startTime = endTime - (points * (interval === '1d' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000));
          
          const klineData = await apiService.getKlineData(symbol, bybitInterval, points, startTime, endTime);
          const sortedData = klineData.reverse(); // Chronological order
          
          // Always calculate price changes, regardless of filter type
          const basePrice = parseFloat(sortedData[0]?.[4] || '0'); // close price
          
          const percentageData = sortedData.map((point: string[]) => ({
            timestamp: parseInt(point[0]),
            percentage: basePrice > 0 ? ((parseFloat(point[4]) - basePrice) / basePrice) * 100 : 0
          }));

          return {
            symbol,
            data: percentageData
          };
        } catch (error) {
                      // //console.error(`Error fetching data for ${symbol}:`, error);
          return { symbol, data: [] };
        }
      });

      const results = await Promise.all(historicalPromises);
      const validResults = results.filter(result => result.data.length > 0);

      if (validResults.length === 0) {
        setError('No valid data available for the selected coins');
        return;
      }

      // Transform data for the chart
      const timePoints = new Set<number>();
      validResults.forEach(({ data }) => {
        data.forEach((point: { timestamp: number; percentage: number }) => {
          timePoints.add(point.timestamp);
        });
      });

      const sortedTimePoints = Array.from(timePoints).sort((a, b) => a - b);

      const transformedData = sortedTimePoints.map(timestamp => {
        const point: HistoricalDataPoint = { 
          timestamp,
          time: new Date(timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        };
        validResults.forEach(({ symbol, data }) => {
          const matchingPoint = data.find((p: { timestamp: number; percentage: number }) => p.timestamp === timestamp);
          if (matchingPoint) {
            point[symbol] = matchingPoint.percentage;
          }
        });
        return point;
      });

      setHistoricalData(transformedData);
    } catch (error) {
              // //console.error('Error in fetchHistoricalDataClientSide:', error);
      setError('Failed to fetch historical data');
    }
  }, [coinLimit]);

  const fetchHistoricalData = useCallback(async (symbols: string[], interval: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await fetchHistoricalDataClientSide(symbols, interval);
    } catch (error) {
              // //console.error('Error fetching historical data:', error);
      setError('Failed to fetch data. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchHistoricalDataClientSide]);

  // Auto-select only for non-custom filters
  useEffect(() => {
    if (filterType !== 'custom' && topCoins.length > 0) {
      setSelectedCoins(topCoinSymbols);
      fetchHistoricalData(topCoinSymbols, interval);
    }
  }, [filterType, topCoinSymbols, interval, topCoins.length, fetchHistoricalData]);

  // Reset selections when entering custom mode
  useEffect(() => {
    if (filterType === 'custom') {
      setSelectedCoins([]);
      setHistoricalData([]);
    }
  }, [filterType]);

  // Fetch whenever custom selections change
  useEffect(() => {
    if (filterType === 'custom' && selectedCoins.length > 0) {
      fetchHistoricalData(selectedCoins, interval);
    }
  }, [filterType, selectedCoins, interval, fetchHistoricalData]);

  // Trigger animations when parameters change (filterType, coinLimit, interval)
  useEffect(() => {
    // Skip animation on initial mount (handled by the mount useEffect)
    if (historicalData.length > 0) {
      setShouldAnimate(true);
      const timeout = setTimeout(() => setShouldAnimate(false), 4000);
      return () => clearTimeout(timeout);
    }
  }, [filterType, coinLimit, interval]); // Trigger when these parameters change

  useEffect(() => {
    fetchBtcChange(interval);
  }, [interval, fetchBtcChange]);

  // Enable animations on initial component mount (page refresh)
  useEffect(() => {
    setShouldAnimate(true);
    const timeout = setTimeout(() => setShouldAnimate(false), 4000); // Match animation duration + buffer
    return () => clearTimeout(timeout);
  }, []); // ✅ only on first mount
  
  const refreshData = () => {
    // Reset animation state first
    setShouldAnimate(false);
    
    // Fetch new data
    fetchHistoricalData(topCoins.map(coin => coin.symbol), interval);
    
    // Enable animation after a brief delay to ensure data is loaded
    setTimeout(() => {
      setShouldAnimate(true);
      // Disable animation after it completes
      setTimeout(() => setShouldAnimate(false), 6000);
    }, 100);
  };

  const toggleCoin = (symbol: string) => {
    const newSelected = selectedCoins.includes(symbol)
      ? selectedCoins.filter(s => s !== symbol)
      : [...selectedCoins, symbol];
    setSelectedCoins(newSelected);
  };

  

  const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const CustomTooltip = (props: TooltipProps<number, string>) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length && hoveredTicker) {
      // Only show tooltip when a specific ticker line is being hovered
      const activePayload = payload.find(item => item.dataKey === hoveredTicker);
      if (activePayload && activePayload.dataKey) {
        return (
          <div 
            className="p-3 border rounded-lg shadow-lg"
            style={{
              backgroundColor: palette.bgSoftGreen,
              borderColor: palette.accentColor
            }}
          >
            <p 
              className="text-sm" 
              style={{ color: palette.primaryColor }}
            >{`Time: ${label}`}</p>
            <p style={{ color: activePayload.color }} className="text-sm font-medium">
              {`${(activePayload.dataKey as string).replace('USDT', '')}: ${formatPercent(activePayload.value || 0)}`}
            </p>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-2xl font-bold" style={{ color: palette.primaryColor }}>
            <span className="hidden sm:inline">Multi-Ticker Price Chart ({interval === '1d' ? '1d' : '4h'} % Change)</span>
            <span className="sm:hidden">Chart ({interval === '1d' ? '1d' : '4h'}%)</span>
          </h2>
          {btcChange !== null && (
            <div 
              className="px-3 py-1 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: theme === 'dark' 
                  ? (btcChange >= 0 ? '#2d5a31' : '#1A1F16')
                  : (btcChange >= 0 ? '#16a34a' : '#dc2626'),
                color: theme === 'dark' ? '#ffffff' : '#ffffff'
              }}
            >
              BTC: {formatPercent(btcChange)}
            </div>
          )}
          {error && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full" style={{ 
              backgroundColor: theme === 'dark' ? '#1E3F20' : '#c6e4cd', 
              color: theme === 'dark' ? '#ffffff' : '#1A1F16' 
            }}>
              <AlertTriangleIcon className="w-3 h-3" />
              Error
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <select
            value={coinLimit}
            onChange={(e) => setCoinLimit(Number(e.target.value) as 10 | 20 | 50 | 100)}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md border focus:outline-none focus:ring-2 bg-transparent backdrop-blur-[3px]"
            style={{
              borderColor: theme === 'dark' ? '#2d5a31' : palette.accentColor,
              color: palette.primaryColor
            }}
          >
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
            <option value={100}>Top 100</option>
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as 'trendScore' | 'volume24h' | 'custom')}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md border focus:outline-none focus:ring-2 bg-transparent backdrop-blur-[3px]"
            style={{
              borderColor: theme === 'dark' ? '#2d5a31' : palette.accentColor,
              color: palette.primaryColor
            }}
          >
            <option value="trendScore">Trend</option>
            <option value="volume24h">Volume</option>
            <option value="custom">Custom</option>
          </select>

          <Button
            onClick={refreshData}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2 min-h-0"
          >
            <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full backdrop-blur-[2.2px]" style={{ height: 'calc(100vh - 250px)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCwIcon className="h-8 w-8 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
              <p className="mt-2" style={{ color: palette.accentColor }}>Loading historical data...</p>
            </div>
          </div>
        ) : historicalData.length > 0 ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData} margin={{ 
                top: 30, 
                right: isMobile ? 60 : 80, 
                left: isMobile ? 5 : 10, 
                bottom: isMobile ? 40 : 30 
              }}>
                <XAxis 
                  dataKey="time" 
                  stroke={palette.accentStroke}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  minTickGap={isMobile ? 15 : 20}
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  height={isMobile ? 50 : 30}
                  interval={isMobile ? 1 : 0}
                />
                <YAxis 
                  stroke={palette.accentStroke}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  tickFormatter={formatPercent}
                  domain={['dataMin - 2', 'dataMax + 2']}
                  width={isMobile ? 45 : 60}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Add a horizontal line at 0% */}
                <ReferenceLine y={0} stroke={palette.accentStroke} strokeDasharray="2 2" strokeWidth={1} />
                {selectedCoins.map((symbol, index) => (
                  <Line
                    key={symbol}
                    type="monotone"
                    dataKey={symbol}
                    stroke={getColorForSymbol(symbol)}
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={shouldAnimate}
                    animationBegin={shouldAnimate ? index * 100 : 0}
                    animationDuration={shouldAnimate ? 1200 : 0}
                    animationEasing="ease-in-out"
                    onMouseEnter={() => setHoveredTicker(symbol)}
                    onMouseLeave={() => setHoveredTicker(null)}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            
            {/* Overlay labels positioned at the end of lines */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              height: '100%',
              width: '80px',
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              paddingTop: '30px',
              paddingBottom: '30px'
            }}>
              {selectedCoins.map((symbol, index) => {
                const lastDataPoint = historicalData[historicalData.length - 1];
                const value = lastDataPoint?.[symbol];
                if (typeof value === 'number' && !isNaN(value)) {
                  // Calculate position based on the value relative to the chart range
                  const numericValues = historicalData.flatMap(d => 
                    selectedCoins.map(s => {
                      const val = d[s];
                      return typeof val === 'number' && !isNaN(val) ? val : null;
                    }).filter((v): v is number => v !== null)
                  );
                  
                  const minVal = Math.min(...numericValues);
                  const maxVal = Math.max(...numericValues);
                  const range = maxVal - minVal;
                  const normalizedValue = range > 0 ? (value - minVal) / range : 0.5;
                  const topPosition = `${(1 - normalizedValue) * 80 + 10}%`;

                  return (
                    <div
                      key={`overlay-label-${symbol}`}
                      style={{
                        position: 'absolute',
                        top: topPosition,
                        right: '5px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: getColorForSymbol(symbol),
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                        transform: 'translateY(-50%)',
                        whiteSpace: 'nowrap'
                      }}
                      onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${symbol}.P`, '_blank')}
                    >
                      {symbol.replace('USDT', '')}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: palette.accentColor }}>No historical data available</p>
          </div>
        )}
      </div>



      <div className="space-y-1 sm:space-y-2">
        <h3 className="text-xs sm:text-sm font-medium" style={{ color: palette.accentColor }}>
          <span className="hidden sm:inline">Select coins to display:</span>
          <span className="sm:hidden">Select coins:</span>
        </h3>
        <div className="flex flex-wrap gap-1 sm:gap-2 overflow-x-auto max-w-full pb-1">
          {topCoins.map((coin, index) => (
            <button
              key={coin.symbol}
              onClick={() => toggleCoin(coin.symbol)}
              className={`px-0.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs rounded-full sm:rounded-full border-[1px] transition-colors whitespace-nowrap font-medium ${
                selectedCoins.includes(coin.symbol)
                  ? 'border-current'
                  : theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
              style={
                selectedCoins.includes(coin.symbol)
                  ? { 
                      borderColor: getColorForSymbol(coin.symbol),
                      backgroundColor: palette.bgSoftGreen,
                      color: palette.primaryColor
                    }
                  : {}
              }
            >
              <span className="hidden sm:inline">{coin.symbol}</span>
              <span className="sm:hidden">{coin.symbol.replace('USDT', '')}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultiTickerChart; 