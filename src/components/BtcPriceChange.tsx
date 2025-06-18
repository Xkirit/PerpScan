'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/lib/api-service';

interface BtcPriceChangeProps {
  interval: '4h' | '1d';
}

const BtcPriceChange: React.FC<BtcPriceChangeProps> = ({ interval }) => {
  const [btcChange, setBtcChange] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const fetchBtcChange = useCallback(async () => {
    setLoading(true);
    try {
      const change = await apiService.getBTCPriceChange(interval);
      setBtcChange(change);
    } catch (error) {
      // //console.error('Error fetching BTC data:', error);
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
      <div 
        className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium h-8 sm:h-9 flex items-center" 
        style={{ 
                  backgroundColor: theme === 'dark' ? '#2d5a31' : '#f2f8f3',
        color: theme === 'dark' ? '#4a7c59' : '#64748b'
        }}
      >
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
      className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap h-8 sm:h-9 flex items-center"
      style={{
        backgroundColor: theme === 'dark' 
          ? (btcChange >= 0 ? '#2d5a31' : '#1A1F16')
          : (btcChange >= 0 ? '#16a34a' : '#dc2626'),
        color: theme === 'dark' 
          ? '#ffffff' 
          : '#ffffff'
      }}
    >
      BTC: {formatPercent(btcChange)}
    </div>
  );
};

export default BtcPriceChange; 