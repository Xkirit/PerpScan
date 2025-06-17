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
      const response = await fetch(`/api/btc-price?interval=${interval}`, {
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

      const result = await response.json();
      
      if (!result.success) {
        console.error('API error for BTC:', result.error);
        return;
      }

      setBtcChange(result.data.priceChange);
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
      <div className="px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium" style={{ backgroundColor: '#2d5a31', color: '#4a7c59' }}>
        <span className="hidden sm:inline">Loading...</span>
        <span className="sm:hidden">...</span>
      </div>
    );
  }

  if (btcChange === null) {
    return null;
  }

  return (
    <div 
      className="px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap"
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