'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, TooltipProps } from 'recharts';
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

const MultiTickerChart: React.FC<MultiTickerChartProps> = ({ data, interval }) => {
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCoins, setSelectedCoins] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Take top 20 coins by default
  const topCoins = useMemo(() => data.slice(0, 20), [data]);
  const topCoinSymbols = useMemo(() => topCoins.map(coin => coin.symbol), [topCoins]);

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

      const historicalPromises = symbols.slice(0, 10).map(async (symbol: string) => { // Limit to 10 for client-side
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
          
          // Calculate percentage changes from the first price
          const basePrice = parseFloat(sortedData[0]?.[4] || '0'); // close price
          
          const percentageData = sortedData.map((point: string[]) => ({
            timestamp: parseInt(point[0]),
            percentage: basePrice > 0 ? ((parseFloat(point[4]) - basePrice) / basePrice) * 100 : 0
          }));

          return { symbol, data: percentageData };
        } catch (error) {
          console.error(`Client-side error fetching data for ${symbol}:`, error);
          return { symbol, data: [] };
        }
      });

      const allHistoricalData = await Promise.all(historicalPromises);

      // Transform data into chart format
      const timePoints = new Set<number>();
      allHistoricalData.forEach(({ data }) => {
        data.forEach((point: { timestamp: number; percentage: number }) => {
          timePoints.add(point.timestamp);
        });
      });

      const sortedTimePoints = Array.from(timePoints).sort((a, b) => a - b);

      const chartData: HistoricalDataPoint[] = sortedTimePoints.map(timestamp => {
        const dataPoint: HistoricalDataPoint = {
          timestamp,
          time: new Date(timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        };

        allHistoricalData.forEach(({ symbol, data }) => {
          const pointAtTime = data.find((d: { timestamp: number; percentage: number }) => d.timestamp === timestamp);
          if (pointAtTime) {
            dataPoint[symbol] = pointAtTime.percentage;
          }
        });

        return dataPoint;
      });

      setHistoricalData(chartData);
      console.log('Client-side historical data loaded successfully');
    } catch (error) {
      console.error('Client-side historical data failed:', error);
      setError('Failed to load historical data');
    }
  }, []);

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

  const toggleCoin = (symbol: string) => {
    const newSelected = selectedCoins.includes(symbol)
      ? selectedCoins.filter(s => s !== symbol)
      : [...selectedCoins, symbol];
    setSelectedCoins(newSelected);
  };

  const refreshData = () => {
    fetchHistoricalData(topCoins.map(coin => coin.symbol), interval);
  };

  const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const CustomTooltip = (props: TooltipProps<number, string>) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">{`Time: ${label}`}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${formatPercent(entry.value || 0)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Multi-Ticker Price Chart ({interval === '1d' ? '1d' : '4h'} % Change)
          </h2>
          {error && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs rounded-full">
              <AlertTriangleIcon className="w-3 h-3" />
              Error
            </span>
          )}
        </div>
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

      {/* Coin selector - scrollable if many */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Select coins to display (showing top 20 by trend score):
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
                  ? { borderColor: chartColors[index % chartColors.length] }
                  : {}
              }
            >
              {coin.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full" style={{ height: 'calc(100vh - 250px)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCwIcon className="h-8 w-8 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading historical data...</p>
            </div>
          </div>
        ) : historicalData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData} margin={{ top: 30, right: 40, left: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" className="dark:stroke-gray-700" />
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
              <Legend verticalAlign="top" height={36} wrapperStyle={{ overflowX: 'auto', maxWidth: '90vw' }} />
              {/* Add a horizontal line at 0% */}
              <Line
                dataKey={() => 0}
                stroke="#6b7280"
                strokeWidth={1}
                strokeDasharray="2 2"
                dot={false}
                connectNulls={false}
                name="0% baseline"
                legendType="none"
              />
              {selectedCoins.map((symbol, index) => (
                <Line
                  key={symbol}
                  type="monotone"
                  dataKey={symbol}
                  stroke={chartColors[index % chartColors.length]}
                  strokeWidth={2.5}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">No historical data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiTickerChart; 