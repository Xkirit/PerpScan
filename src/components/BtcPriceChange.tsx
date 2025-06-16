'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface BtcPriceChangeProps {
  interval: '4h' | '1d';
}

const BtcPriceChange: React.FC<BtcPriceChangeProps> = ({ interval }) => {
  const [btcChange, setBtcChange] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBtcChange = useCallback(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [interval]);

  useEffect(() => {
    fetchBtcChange();
  }, [fetchBtcChange]);

  const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: '#2d5a31', color: '#4a7c59' }}>
        Loading...
      </div>
    );
  }

  if (btcChange === null) {
    return null;
  }

  return (
    <div 
      className="px-3 py-1 rounded-lg text-sm font-medium"
      style={{
        backgroundColor: btcChange >= 0 ? '#2d5a31' : '#1A1F16',
        color: btcChange >= 0 ? '#ffffff' : '#ffffff'
      }}
    >
      BTC: {formatPercent(btcChange)}
    </div>
  );
};

export default BtcPriceChange; 