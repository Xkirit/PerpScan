'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { multiExchangeWatchlistService, WatchlistCoin, WatchlistFilters, SupportedExchange } from '@/lib/coingecko-service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DownloadIcon, 
  TrendingUpIcon, 
  TrendingDownIcon,
  FilterIcon,
  RefreshCwIcon,
  ListIcon,
  DollarSignIcon,
  BarChart3Icon,
  StarIcon,
  ActivityIcon,
  PercentIcon,
  ChevronDownIcon
} from 'lucide-react';

interface WatchlistCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  fetchData: (exchange: SupportedExchange, limit: number) => Promise<WatchlistCoin[]>;
}

const WatchlistsManager: React.FC = () => {
  const { theme } = useTheme();
  const [activeCategory, setActiveCategory] = useState<string>('trending');
  const [selectedExchange, setSelectedExchange] = useState<SupportedExchange>('bybit');
  const [coinCount, setCoinCount] = useState<number>(50);
  const [coins, setCoins] = useState<WatchlistCoin[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<WatchlistCoin[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<WatchlistFilters>({ excludeStablecoins: true });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'market' | 'crypto'>('market');

  const coinCountOptions = [20, 50, 100, 150, 200];

  // Get available exchanges and categories
  const supportedExchanges = multiExchangeWatchlistService.getSupportedExchanges();
  const cryptoCategories = multiExchangeWatchlistService.getCategories();

  const watchlistCategories: WatchlistCategory[] = React.useMemo(() => [
    {
      id: 'trending',
      name: 'Trending',
      description: 'High volume + price action combo',
      icon: TrendingUpIcon,
      fetchData: (exchange, limit) => multiExchangeWatchlistService.getExchange(exchange).getTrendingCoins(limit),
    },
    {
      id: 'gainers',
      name: 'Top Gainers',
      description: 'Biggest 24h price increases',
      icon: TrendingUpIcon,
      fetchData: (exchange, limit) => multiExchangeWatchlistService.getExchange(exchange).getTopGainers(limit),
    },
    {
      id: 'losers',
      name: 'Top Losers',
      description: 'Biggest 24h price decreases',
      icon: TrendingDownIcon,
      fetchData: (exchange, limit) => multiExchangeWatchlistService.getExchange(exchange).getTopLosers(limit),
    },
    {
      id: 'volume',
      name: 'High Volume',
      description: 'Most actively traded pairs',
      icon: BarChart3Icon,
      fetchData: (exchange, limit) => multiExchangeWatchlistService.getExchange(exchange).getCoinsByVolume(limit),
    },
    {
      id: 'open_interest',
      name: 'Open Interest',
      description: 'Highest futures open interest',
      icon: ActivityIcon,
      fetchData: (exchange, limit) => multiExchangeWatchlistService.getExchange(exchange).getCoinsByOpenInterest(limit),
    },
    {
      id: 'funding_high',
      name: 'High Funding',
      description: 'Highest funding rates (bullish)',
      icon: PercentIcon,
      fetchData: (exchange, limit) => multiExchangeWatchlistService.getExchange(exchange).getCoinsByFundingRate(limit, 'highest'),
    },
  ], []);

  // Fetch data when category, exchange, or count changes
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let data: WatchlistCoin[] = [];
      
      // Check if it's a crypto category
      const cryptoCategory = cryptoCategories.find(cat => cat.id === activeCategory);
      if (cryptoCategory) {
        data = await multiExchangeWatchlistService.getCoinsByCategory(activeCategory, selectedExchange, coinCount);
      } else {
        // Use traditional category (trending, gainers, etc.)
        const category = watchlistCategories.find(cat => cat.id === activeCategory);
        if (category) {
          data = await category.fetchData(selectedExchange, coinCount);
        }
      }
      
      setCoins(data);
    } catch (error) {
      console.error('Failed to fetch watchlist data:', error);
      setCoins([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, selectedExchange, coinCount, cryptoCategories, watchlistCategories]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Apply filters when coins or filters change
  useEffect(() => {
    const filtered = multiExchangeWatchlistService.filterCoins(coins, filters);
    setFilteredCoins(filtered);
  }, [coins, filters]);

  // Download watchlist as text file
  const downloadWatchlist = (includeSuffix: boolean) => {
    if (filteredCoins.length === 0) return;

    const suffix = includeSuffix ? 'USDT.P' : 'USDT';
    const content = filteredCoins
      .map(coin => coin.symbol + suffix)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeCategory}_${selectedExchange}_${coinCount}_${includeSuffix ? 'perp' : 'spot'}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPercentage = (num: number): string => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 
            className="text-xl sm:text-2xl font-bold flex items-center gap-2" 
            style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
          >
            <ListIcon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }} />
            Multi-Exchange Watchlists
          </h2>
          <p 
            className="text-sm mt-1" 
            style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
          >
            Generate watchlists by category and exchange for TradingView.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <FilterIcon className="h-4 w-4" />
            Filters
          </Button>
          <Button
            onClick={fetchData}
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

      {/* Main Controls */}
      <div 
        className="rounded-lg p-6 backdrop-blur-[3px]" 
        style={{ 
          border: theme === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.2)' 
            : '1px solid #b0d7b8',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          backgroundColor: theme === 'dark' 
            ? 'rgba(30, 63, 32, 0.1)' 
            : '#f0f7f1'
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Exchange Selector */}
          <div>
            <label 
              className="block text-sm font-medium mb-2" 
              style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
            >
              Exchange:
            </label>
            <div className="relative">
              <select
                value={selectedExchange}
                onChange={(e) => setSelectedExchange(e.target.value as SupportedExchange)}
                className="w-full px-3 py-2 rounded-md text-sm appearance-none pr-8"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#ffffff',
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #b0d7b8',
                  color: theme === 'dark' ? '#ffffff' : '#1A1F16'
                }}
              >
                {supportedExchanges.map((exchange) => (
                  <option 
                    key={exchange.id} 
                    value={exchange.id}
                    style={{
                      backgroundColor: theme === 'dark' ? '#1A1F16' : '#ffffff',
                      color: theme === 'dark' ? '#ffffff' : '#1A1F16'
                    }}
                  >
                    {exchange.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" 
                style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }} />
            </div>
          </div>

          {/* Category Type Selector */}
          <div>
            <label 
              className="block text-sm font-medium mb-2" 
              style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
            >
              Category Type:
            </label>
            <div className="flex gap-2 mb-2">
              <Button
                variant={viewMode === 'market' ? 'outline' : 'default'}
                className="flex items-center gap-2 text-xs px-4 py-2 flex-1"
                style={{
                  backgroundColor: theme === 'dark' ? '#2d5a31' : '#b0d7b8',
                  borderColor: theme === 'dark' ? '#4a7c59' : '#76ba94',
                  color: theme === 'dark' ? '#ffffff' : '#1A1F16'
                }}
                onClick={() => setViewMode('market')}
                size="sm"
              >
                Market Trends
              </Button>
              <Button
                variant={viewMode === 'crypto' ? 'outline' : 'default'}
                className="flex items-center gap-2 text-xs px-4 py-2 flex-1"
                style={{
                  backgroundColor: theme === 'dark' ? '#2d5a31' : '#b0d7b8',
                  borderColor: theme === 'dark' ? '#4a7c59' : '#76ba94',
                  color: theme === 'dark' ? '#ffffff' : '#1A1F16'
                }}
                onClick={() => setViewMode('crypto')}
                size="sm"
              >
                Crypto Sectors
              </Button>
            </div>
          </div>

          {/* Category Selector */}
          <div className="lg:col-span-2">
            <label 
  
  
  className="block text-sm font-medium mb-2" 
              style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
            >
              Category:
            </label>
            {viewMode === 'market' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {watchlistCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? 'default' : 'outline'}
                    onClick={() => setActiveCategory(category.id)}
                    className="flex items-center gap-2 text-sm justify-start p-3 h-auto"
                    style={{
                      backgroundColor: activeCategory === category.id 
                        ? (theme === 'dark' ? '#2d5a31' : '#b0d7b8')
                        : (theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#ffffff'),
                      borderColor: activeCategory === category.id
                        ? (theme === 'dark' ? '#4a7c59' : '#76ba94')
                        : (theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#b0d7b8'),
                      color: activeCategory === category.id
                        ? (theme === 'dark' ? '#ffffff' : '#1A1F16')
                        : (theme === 'dark' ? '#4a7c59' : '#76ba94')
                    }}
                  >
                    <category.icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{category.name}</span>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="relative">
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-sm appearance-none pr-8"
                  style={{
                    backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#ffffff',
                    border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #b0d7b8',
                    color: theme === 'dark' ? '#ffffff' : '#1A1F16'
                  }}
                >
                  {cryptoCategories.map((category) => (
                    <option 
                      key={category.id} 
                      value={category.id}
                      style={{
                        backgroundColor: theme === 'dark' ? '#1A1F16' : '#ffffff',
                        color: theme === 'dark' ? '#ffffff' : '#1A1F16'
                      }}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" 
                  style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }} />
              </div>
            )}
          </div>

          {/* Coin Count Selector */}
          <div>
            <label 
              className="block text-sm font-medium mb-2" 
              style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
            >
              Count:
            </label>
            <div className="relative">
              <select
                value={coinCount}
                onChange={(e) => setCoinCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md text-sm appearance-none pr-8"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#ffffff',
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #b0d7b8',
                  color: theme === 'dark' ? '#ffffff' : '#1A1F16'
                }}
              >
                {coinCountOptions.map((count) => (
                  <option 
                    key={count} 
                    value={count}
                    style={{
                      backgroundColor: theme === 'dark' ? '#1A1F16' : '#ffffff',
                      color: theme === 'dark' ? '#ffffff' : '#1A1F16'
                    }}
                  >
                    {count} coins
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" 
                style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }} />
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <label 
              className="block text-sm font-medium mb-2" 
              style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
            >
              Download:
            </label>
            <div className="flex gap-2">
              <Button
                onClick={() => downloadWatchlist(false)}
                disabled={loading || filteredCoins.length === 0}
                className="flex items-center gap-2 text-xs px-4 py-2 flex-1"
                size="sm"
                style={{
                  backgroundColor: theme === 'dark' ? '#2d5a31' : '#b0d7b8',
                  borderColor: theme === 'dark' ? '#4a7c59' : '#76ba94',
                  color: theme === 'dark' ? '#ffffff' : '#1A1F16'
                }}
              >
                <DownloadIcon className="h-4 w-4" />
                Spot
              </Button>
              <Button
                onClick={() => downloadWatchlist(true)}
                disabled={loading || filteredCoins.length === 0}
                className="flex items-center gap-2 text-xs px-4 py-2 flex-1"
                size="sm"
                style={{
                  backgroundColor: theme === 'dark' ? '#2d5a31' : '#b0d7b8',
                  borderColor: theme === 'dark' ? '#4a7c59' : '#76ba94',
                  color: theme === 'dark' ? '#ffffff' : '#1A1F16'
                }}
              >
                <DownloadIcon className="h-4 w-4" />
                Perp
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Description */}
      {/* {(cryptoCategories.find(cat => cat.id === activeCategory) || watchlistCategories.find(cat => cat.id === activeCategory)) && (
        <div 
          className="rounded-lg p-3"
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(74, 124, 89, 0.1)' : 'rgba(74, 124, 89, 0.05)',
            border: theme === 'dark' ? '1px solid rgba(74, 124, 89, 0.3)' : '1px solid rgba(74, 124, 89, 0.2)'
          }}
        >
          <p 
            className="text-sm text-center"
            style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
          >
            {cryptoCategories.find(cat => cat.id === activeCategory)?.description || 
             watchlistCategories.find(cat => cat.id === activeCategory)?.description}
          </p>
        </div>
      )} */}

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div 
          className="rounded-lg p-4"
          style={{
            border: theme === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.2)' 
              : '1px solid #b0d7b8',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            backgroundColor: theme === 'dark' 
              ? 'rgba(30, 63, 32, 0.1)' 
              : '#f0f7f1'
          }}
        >
          <h3 
            className="font-semibold mb-3 flex items-center gap-2"
            style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
          >
            <FilterIcon className="h-4 w-4" />
            Advanced Filters
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
                Min Volume (USD)
              </label>
              <input
                type="number"
                placeholder="e.g., 1000000"
                className="w-full px-3 py-2 rounded-md text-sm"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#ffffff',
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #b0d7b8',
                  color: theme === 'dark' ? '#ffffff' : '#1A1F16'
                }}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  minVolume: e.target.value ? Number(e.target.value) : undefined 
                }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
                Min Price Change 24h (%)
              </label>
              <input
                type="number"
                placeholder="e.g., 5"
                step="0.1"
                className="w-full px-3 py-2 rounded-md text-sm"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#ffffff',
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #b0d7b8',
                  color: theme === 'dark' ? '#ffffff' : '#1A1F16'
                }}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  priceChangeMin: e.target.value ? Number(e.target.value) : undefined 
                }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
                Min Price (USD)
              </label>
              <input
                type="number"
                placeholder="e.g., 0.01"
                step="0.01"
                className="w-full px-3 py-2 rounded-md text-sm"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#ffffff',
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #b0d7b8',
                  color: theme === 'dark' ? '#ffffff' : '#1A1F16'
                }}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  minPrice: e.target.value ? Number(e.target.value) : undefined 
                }))}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => setFilters({ excludeStablecoins: true })}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          <div className="mt-3 text-sm" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
            {filteredCoins.length} coins match your criteria
          </div>
        </div>
      )}

      {/* Results */}
      <div 
        className="rounded-lg p-6 backdrop-blur-[3px]"
        style={{ 
          border: theme === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.2)' 
            : '1px solid #b0d7b8',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          backgroundColor: theme === 'dark' 
            ? 'rgba(30, 63, 32, 0.1)' 
            : '#f0f7f1'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 
              className="font-semibold flex items-center gap-2"
              style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
            >
              Results ({filteredCoins.length} coins)
            </h3>
            <p className="text-sm" style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
              {loading ? 'Loading...' : `${activeCategory} • ${selectedExchange} • ${coinCount} requested`}
            </p>
          </div>
        </div>

        {/* Coins Preview */}
        {loading ? (
          <div className="text-center py-8">
            <RefreshCwIcon 
              className="h-8 w-8 animate-spin mx-auto mb-2" 
              style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }} 
            />
            <p style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
              Loading {selectedExchange} data...
            </p>
          </div>
        ) : filteredCoins.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 max-h-96 overflow-y-auto">
            {filteredCoins.slice(0, 50).map((coin, index) => {
              const isPositive = coin.price_change_percentage_24h >= 0;
              const baseSymbol = coin.symbol.toLowerCase();
              const logoUrl = `https://cryptoicons.org/api/icon/${baseSymbol}/32`;
              const fallbackLogoUrl = `https://assets.coincap.io/assets/icons/${baseSymbol}@2x.png`;
              const priceChange = coin.price_change_percentage_24h;

              const handleClick = () => {
                window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${coin.symbol}USDT.P`, '_blank');
              };

              return (
                <div
                  key={coin.symbol}
                  className="p-2 sm:p-3 rounded-xl cursor-pointer hover:scale-[1.01] transition-all duration-300 ease-out border backdrop-blur-xl touch-manipulation flex-shrink-0 hover:shadow-lg relative overflow-hidden group z-20"
                  style={{
                    backgroundColor: theme === 'dark' 
                      ? (isPositive ? 'rgba(6, 78, 59, 0.4)' : 'rgba(69, 10, 10, 0.4)')
                      : (isPositive ? 'rgba(236, 253, 245, 0.95)' : 'rgba(254, 242, 242, 0.95)'),
                    borderColor: theme === 'dark'
                      ? (isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(248, 113, 113, 0.3)')
                      : (isPositive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(248, 113, 113, 0.4)'),
                    boxShadow: theme === 'dark'
                      ? `0 4px 16px -4px ${isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(248, 113, 113, 0.1)'}`
                      : `0 2px 8px -2px ${isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(248, 113, 113, 0.15)'}` 
                  }}
                  onClick={handleClick}
                >
                  <div 
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${isPositive ? 'rgba(16, 185, 129, 0.1) 0%, transparent 50%, rgba(16, 185, 129, 0.05) 100%' : 'rgba(248, 113, 113, 0.1) 0%, transparent 50%, rgba(248, 113, 113, 0.05) 100%'})`
                    }}
                  />
                  <div className="relative z-30">
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0">
                          <img 
                            src={logoUrl}
                            alt={`${baseSymbol} logo`}
                            className="h-full w-full rounded-full object-cover"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              if (img.src === logoUrl) {
                                img.src = fallbackLogoUrl;
                              } else {
                                // Generate SVG data URL for fallback
                                const letter = baseSymbol.charAt(0).toUpperCase();
                                const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="16" fill="url(#grad)"/><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#667eea;stop-opacity:1" /><stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" /></linearGradient></defs><text x="16" y="20" font-size="14" font-weight="bold" text-anchor="middle" fill="white" dy=".3em">${letter}</text></svg>`;
                                img.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
                              }
                            }}
                          />
                        </div>
                        <span 
                          className="font-bold text-sm sm:text-lg truncate"
                          style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}
                        >
                          {coin.symbol}
                        </span>
                      </div>
                      {isPositive ? (
                        <TrendingUpIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
                      ) : (
                        <TrendingDownIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
                      )}
                    </div>
                  
                    <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>Volume:</span>
                        <span className="font-medium" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
                          {formatNumber(coin.total_volume)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>Change:</span>
                        <span className="font-medium" style={{ color: priceChange >= 0 ? '#10b981' : '#f87171' }}>
                          {formatPercentage(priceChange)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>Price:</span>
                        <span className="font-medium" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
                          ${coin.current_price.toFixed(coin.current_price < 1 ? 6 : 2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredCoins.length > 50 && (
              <div 
                className="p-3 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
                  border: `2px dashed ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(176, 215, 184, 0.4)'}`
                }}
              >
                <span 
                  className="text-sm"
                  style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}
                >
                  +{filteredCoins.length - 50} more coins
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p style={{ color: theme === 'dark' ? '#4a7c59' : '#76ba94' }}>
              No coins found for this category. Try selecting a different category or exchange.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchlistsManager; 