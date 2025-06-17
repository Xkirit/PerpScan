'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, TooltipProps, ReferenceLine } from 'recharts';
import { CoinAnalysis } from '@/types';
import { RefreshCwIcon, AlertTriangleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  '#000000', '#42d4f4', '#bfef45', '#dcbeff', '#a9a9a9', '#ffb347', '#bada55', '#ff69b4', '#c0c0c0', '#ff6347',
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
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCoins, setSelectedCoins] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [btcChange, setBtcChange] = useState<number | null>(null);
  const [coinLimit, setCoinLimit] = useState<20 | 50 | 100>(20);
  const [filterType, setFilterType] = useState<'trendScore' | 'volume24h'>('trendScore');
  const [rawVolumeData, setRawVolumeData] = useState<{ symbol: string; volume24h: number; rawVolume: number; rawTurnover: number }[]>([]);
  const [hoveredTicker, setHoveredTicker] = useState<string | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Create stable color mapping based on coin symbol
  const getColorForSymbol = useCallback((symbol: string) => {
    // Create a simple hash from the symbol to get consistent color index
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      const char = symbol.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const colorIndex = Math.abs(hash) % chartColors.length;
    return chartColors[colorIndex];
  }, []);

  // Fetch raw volume data from Bybit
  const fetchRawVolumeData = useCallback(async () => {
    try {
      console.log('Fetching raw volume data from Bybit...');
      const response = await fetch('https://api.bybit.com/v5/market/tickers?category=linear', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        console.error('Failed to fetch volume data:', response.status);
        return;
      }

      const data = await response.json();
      if (data.retCode !== 0) {
        console.error('API error:', data.retMsg);
        return;
      }

      console.log('Raw API response sample:', data.result.list.slice(0, 3));

      const volumeData = data.result.list
        .filter((ticker: any) => ticker.symbol.endsWith('USDT'))
        .map((ticker: any) => ({
          symbol: ticker.symbol,
          volume24h: parseFloat(ticker.turnover24h || '0'), // Use turnover24h for USD value
          rawVolume: ticker.volume24h,
          rawTurnover: ticker.turnover24h
        }))
        .sort((a: any, b: any) => b.volume24h - a.volume24h);

      console.log('Top 10 volume coins:', volumeData.slice(0, 10));
      setRawVolumeData(volumeData);
    } catch (error) {
      console.error('Error fetching volume data:', error);
    }
  }, []);

  // Sort and slice coins based on filterType
  const topCoins = useMemo(() => {
    if (filterType === 'volume24h') {
      return rawVolumeData.slice(0, coinLimit);
    }
    
    let sorted = [...data];
    if (filterType === 'trendScore') {
      sorted.sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0));
    }
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
      const bybitInterval = interval === '1d' ? 'D' : '60';
      const points = interval === '1d' ? 30 : 24;
      
      const endTime = Date.now();
      const startTime = endTime - (points * (interval === '1d' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000));
      
      const url = `https://api.bybit.com/v5/market/kline?category=linear&symbol=BTCUSDT&interval=${bybitInterval}&start=${startTime}&end=${endTime}&limit=${points}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        console.error('Failed to fetch BTC data:', response.status);
        return;
      }

      const data = await response.json();
      if (data.retCode !== 0) {
        console.error('API error for BTC:', data.retMsg);
        return;
      }

      const klineData = data.result?.list || [];
      const sortedData = klineData.reverse();
      
      if (sortedData.length > 0) {
        const basePrice = parseFloat(sortedData[0][4]); // First close price
        const lastPrice = parseFloat(sortedData[sortedData.length - 1][4]); // Last close price
        const change = ((lastPrice - basePrice) / basePrice) * 100;
        setBtcChange(change);
      }
    } catch (error) {
      console.error('Error fetching BTC data:', error);
    }
  }, []);

  const fetchHistoricalDataClientSide = useCallback(async (symbols: string[], interval: string) => {
    console.log('Fetching historical data client-side...');
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
          
          const url = `https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=${bybitInterval}&start=${startTime}&end=${endTime}&limit=${points}`;
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            cache: 'no-cache',
          });

          if (!response.ok) {
            console.error(`Failed to fetch client-side data for ${symbol}: ${response.status}`);
            return { symbol, data: [] };
          }

          const data = await response.json();
          if (data.retCode !== 0) {
            console.error(`API error for ${symbol}: ${data.retMsg}`);
            return { symbol, data: [] };
          }

          const klineData = data.result?.list || [];
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
          console.error(`Error fetching data for ${symbol}:`, error);
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
      console.error('Error in fetchHistoricalDataClientSide:', error);
      setError('Failed to fetch historical data');
    }
  }, [coinLimit]);

  const fetchHistoricalData = useCallback(async (symbols: string[], interval: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await fetchHistoricalDataClientSide(symbols, interval);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setError('Failed to fetch data. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchHistoricalDataClientSide]);

  useEffect(() => {
    if (topCoins.length > 0) {
      setSelectedCoins(topCoinSymbols);
      fetchHistoricalData(topCoinSymbols, interval);
    }
  }, [topCoinSymbols, interval, topCoins.length, fetchHistoricalData]);

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
      setTimeout(() => setShouldAnimate(false), 4000);
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
          <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">{`Time: ${label}`}</p>
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
          <h2 className="text-2xl font-bold" style={{ color: '#ffffff' }}>
            Multi-Ticker Price Chart ({interval === '1d' ? '1d' : '4h'} % Change)
          </h2>
          {btcChange !== null && (
            <div 
              className="px-3 py-1 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: btcChange >= 0 ? '#2d5a31' : '#1A1F16',
                color: btcChange >= 0 ? '#ffffff' : '#ffffff'
              }}
            >
              BTC: {formatPercent(btcChange)}
            </div>
          )}
          {error && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full" style={{ backgroundColor: '#1E3F20', color: '#ffffff' }}>
              <AlertTriangleIcon className="w-3 h-3" />
              Error
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={coinLimit}
            onChange={(e) => setCoinLimit(Number(e.target.value) as 20 | 50 | 100)}
            className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            <option value={20}>Top 20 Coins</option>
            <option value={50}>Top 50 Coins</option>
            <option value={100}>Top 100 Coins</option>
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as 'trendScore' | 'volume24h')}
            className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            <option value="trendScore">Trend Score</option>
            <option value="volume24h">24h Volume</option>
          </select>

          <Button
            onClick={refreshData}
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

      {/* Chart */}
      <div className="w-full backdrop-blur-[2.2px]" style={{ height: 'calc(100vh - 250px)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCwIcon className="h-8 w-8 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading historical data...</p>
            </div>
          </div>
        ) : historicalData.length > 0 ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData} margin={{ top: 30, right: 80, left: 10, bottom: 30 }}>
                <XAxis 
                  dataKey="time" 
                  stroke="#666"
                  className="dark:stroke-gray-400"
                  tick={{ fontSize: 12 }}
                  minTickGap={20}
                />
                <YAxis 
                  stroke="#666"
                  className="dark:stroke-gray-400"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatPercent}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Add a horizontal line at 0% */}
                <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" strokeWidth={1} />
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
            <p className="text-gray-500 dark:text-gray-400">No historical data available</p>
          </div>
        )}
      </div>



      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Select coins to display:
        </h3>
        <div className="flex flex-wrap gap-2 overflow-x-auto max-w-full pb-1">
          {topCoins.map((coin, index) => (
            <button
              key={coin.symbol}
              onClick={() => toggleCoin(coin.symbol)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors whitespace-nowrap ${
                selectedCoins.includes(coin.symbol)
                  ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-800 dark:text-blue-200'
                  : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              style={
                selectedCoins.includes(coin.symbol)
                  ? { borderColor: getColorForSymbol(coin.symbol) }
                  : {}
              }
            >
              {coin.symbol}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultiTickerChart; 