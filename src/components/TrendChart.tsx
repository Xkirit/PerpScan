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
    if (value > 7) return '#00ff88'; // Bright green for highest
    if (value > 5) return '#4ade80'; // Light green
    if (value > 3) return '#22c55e'; // Medium green
    if (value > 1) return '#16a34a'; // Dark green
    if (value > 0) return '#15803d'; // Darker green
    if (value > -3) return '#374151'; // Gray for low negative
    return '#1f2937'; // Dark gray for very low
  } else {
    if (value > 15) return '#00ff88'; // Bright green for very high positive
    if (value > 10) return '#4ade80'; // Light green for high positive
    if (value > 5) return '#22c55e'; // Medium green for positive
    if (value > 0) return '#16a34a'; // Green for small positive
    if (value > -5) return '#ef4444'; // Red for small negative
    if (value > -10) return '#dc2626'; // Dark red for negative
    return '#991b1b'; // Very dark red for very negative
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
      <div className="p-4 border rounded-lg shadow-lg" style={{ backgroundColor: '#2d5a31', borderColor: '#4a7c59' }}>
        <p className="font-semibold" style={{ color: '#ffffff' }}>{label}</p>
        <p className="text-sm" style={{ color: '#ffffff' }}>
          Current Price: ${data.currentPrice.toFixed(6)}
        </p>
        <p className="text-sm" style={{ color: '#ffffff' }}>
          4H Change: {formatPercentage(data.priceChange4h)}
        </p>
        <p className="text-sm" style={{ color: '#ffffff' }}>
          24H Change: {formatPercentage(data.priceChange24h)}
        </p>
        <p className="text-sm" style={{ color: '#ffffff' }}>
          Trend Score: {data.trendScore.toFixed(2)}
        </p>
        <p className="text-sm" style={{ color: '#ffffff' }}>
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
    <div 
      className="p-6 rounded-lg transition-colors backdrop-blur-[2px]" 
      style={{ 
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        backgroundColor: 'rgba(30, 63, 32, 0.1)'
      }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#ffffff' }}>{title}</h3>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#2d5a31" />
            <XAxis 
              dataKey="name" 
              stroke="#ffffff"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="#ffffff"
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