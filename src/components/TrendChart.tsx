"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { CoinAnalysis } from '@/types';
import { formatPercentage } from '../lib/utils';

interface TrendChartProps {
  data: CoinAnalysis[];
  title: string;
  dataKey: 'priceChange4h' | 'priceChange24h' | 'trendScore';
}

const getBarColor = (value: number, dataKey: string) => {
  if (dataKey === 'trendScore') {
    if (value > 5) return '#10b981'; // green-500
    if (value > 0) return '#3b82f6'; // blue-500
    if (value > -5) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  } else {
    if (value > 0) return '#10b981'; // green-500
    return '#ef4444'; // red-500
  }
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: CoinAnalysis;
    value: number;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Current Price: ${data.currentPrice.toFixed(6)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          4H Change: {formatPercentage(data.priceChange4h)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          24H Change: {formatPercentage(data.priceChange24h)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Trend Score: {data.trendScore.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Volume Change: {formatPercentage(data.volumeChange4h)}
        </p>
      </div>
    );
  }
  return null;
};

export function TrendChart({ data, title, dataKey }: TrendChartProps) {
  // Take top 10 items for better visualization
  const chartData = data.slice(0, 10).map((item, index) => ({
    ...item,
    name: item.symbol.replace('USDT', ''),
    rank: index + 1
  }));

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-600" />
            <XAxis 
              dataKey="name" 
              stroke="currentColor"
              className="text-gray-500 dark:text-gray-400"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="currentColor"
              className="text-gray-500 dark:text-gray-400"
              fontSize={12}
              tickFormatter={(value) => 
                dataKey === 'trendScore' ? value.toFixed(1) : `${value.toFixed(1)}%`
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey={dataKey} 
              radius={[2, 2, 0, 0]}
              onClick={(data) => {
                if (data && data.symbol) {
                  const symbol = data.symbol.replace('USDT', '');
                  const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=BYBIT:${symbol}USDT.P`;
                  window.open(tradingViewUrl, '_blank');
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry[dataKey], dataKey)} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 