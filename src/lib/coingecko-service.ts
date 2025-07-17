// Multi-exchange watchlist service with crypto categories
interface BybitTickerResponse {
  retCode: number;
  retMsg: string;
  result: {
    list: BybitTickerData[];
  };
}

interface BinanceTickerResponse {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

interface BybitTickerData {
  symbol: string;
  lastPrice: string;
  price24hPcnt: string;
  volume24h: string;
  turnover24h: string;
  openInterest: string;
  openInterestValue: string;
  fundingRate: string;
  [key: string]: any;
}

export interface WatchlistCoin {
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  open_interest_value: number;
  funding_rate: number;
  category?: string;
  is_trending?: boolean;
  volume_rank?: number;
  exchange?: string;
}

export interface WatchlistFilters {
  minVolume?: number;
  maxVolume?: number;
  minOpenInterest?: number;
  maxOpenInterest?: number;
  priceChangeMin?: number;
  priceChangeMax?: number;
  minPrice?: number;
  maxPrice?: number;
  excludeStablecoins?: boolean;
  category?: string;
  exchange?: string;
}

export interface CryptoCategory {
  id: string;
  name: string;
  description: string;
  coins: string[]; // Symbol list for this category
}

export type SupportedExchange = 'bybit' | 'binance';

// Crypto category mappings
const CRYPTO_CATEGORIES: CryptoCategory[] = [
  {
    id: 'ai',
    name: 'AI & Big Data',
    description: 'Artificial Intelligence and Machine Learning tokens',
    coins: ['FET', 'OCEAN', 'AGIX', 'TAO', 'RNDR', 'ICP', 'GRT', 'AI', 'ARKM', 'PRIME', 'WLD', 'CTXC', 'ORAI', 'PHALA', 'NMR']
  },
  {
    id: 'modular-bcs',
    name: 'Modular Blockchains',
    description: 'Modular blockchain infrastructure projects',
    coins: ['TIA', 'MANTA', 'DYM', 'ALT', 'SAGA', 'ATOM', 'OSMO', 'JUP', 'AVAIL']
  },
  {
    id: 'depin',
    name: 'DePIN',
    description: 'Decentralized Physical Infrastructure Networks',
    coins: ['HNT', 'MOBILE', 'IOT', 'RNDR', 'FIL', 'AR', 'THETA', 'STORJ', 'ANKR', 'DIMO', 'HONEY']
  },
  {
    id: 'lsd',
    name: 'Liquid Staking',
    description: 'Liquid Staking Derivatives and protocols',
    coins: ['LDO', 'RPL', 'FXS', 'ANKR', 'SWISE', 'SD', 'FIS']
  },
  {
    id: 'defi',
    name: 'DeFi',
    description: 'Decentralized Finance protocols and tokens',
    coins: ['UNI', 'AAVE', 'MKR', 'CRV', 'COMP', 'YFI', 'SUSHI', 'BAL', 'SNX', 'ALPHA', 'CREAM', 'BADGER', '1INCH', 'DPI', 'INDEX']
  },
  {
    id: 'gamefi',
    name: 'GameFi',
    description: 'Gaming and NFT gaming tokens',
    coins: ['AXS', 'SLP', 'SAND', 'MANA', 'ENJ', 'CHR', 'ALICE', 'TLM', 'SKILL', 'DPET', 'GHST', 'REVV', 'SPS', 'DEC', 'GALA']
  },
  {
    id: 'inscriptions',
    name: 'Inscriptions',
    description: 'Ordinals and inscription-based tokens',
    coins: ['ORDI', 'SATS', '1000SATS', 'RATS', 'TURT']
  },
  {
    id: 'meme',
    name: 'Meme Coins',
    description: 'Community-driven meme tokens',
    coins: ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'WIF', 'BONK', 'BRETT', 'POPCAT', 'MEW', 'BOOK', 'MOODENG', 'PENGU', 'FARTCOIN']
  },
  {
    id: 'pow',
    name: 'Proof of Work',
    description: 'Proof of Work mining coins',
    coins: ['BTC', 'LTC', 'BCH', 'BSV', 'ETC', 'ZEC', 'XMR', 'DASH', 'DGB', 'KAS', 'RVN']
  },
  {
    id: 'layer1',
    name: 'Layer 1',
    description: 'Base layer blockchain protocols',
    coins: ['ETH', 'BNB', 'SOL', 'ADA', 'AVAX', 'DOT', 'MATIC', 'ALGO', 'ATOM', 'NEAR', 'FTM', 'LUNA', 'ROSE', 'EGLD', 'HBAR']
  },
  {
    id: 'layer2',
    name: 'Layer 2',
    description: 'Ethereum scaling solutions',
    coins: ['ARB', 'OP', 'MATIC', 'LRC', 'IMX', 'METIS', 'BOBA']
  },
  {
    id: 'adventure-zone',
    name: 'Adventure Zone',
    description: 'High-risk, high-reward experimental tokens',
    coins: ['HYPE', 'VIRTUAL', 'AI16Z', 'PENGU', 'FARTCOIN', 'MOODENG', 'GRASS', 'MOVE', 'USUAL', 'BIO']
  }
];

abstract class ExchangeService {
  abstract getName(): string;
  abstract getAllTickers(): Promise<WatchlistCoin[]>;
  abstract getTrendingCoins(limit: number): Promise<WatchlistCoin[]>;
  abstract getTopGainers(limit: number): Promise<WatchlistCoin[]>;
  abstract getTopLosers(limit: number): Promise<WatchlistCoin[]>;
  abstract getCoinsByVolume(limit: number): Promise<WatchlistCoin[]>;
  abstract getCoinsByOpenInterest(limit: number): Promise<WatchlistCoin[]>;
  abstract getCoinsByFundingRate(limit: number, type: 'highest' | 'lowest'): Promise<WatchlistCoin[]>;
}

class BybitService extends ExchangeService {
  private baseUrl = 'https://api.bybit.com';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 60 * 1000;

  private stablecoins = [
    'USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD', 'USDD', 'FRAX',
    'LUSD', 'sUSD', 'USDP', 'GUSD', 'HUSD', 'OUSD', 'UST', 'USTC'
  ];

  getName(): string {
    return 'Bybit';
  }

  private async makeRequest<T>(endpoint: string, useCache: boolean = true): Promise<T> {
    const cacheKey = endpoint;
    
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; PerpFlow/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (useCache) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }
      
      return data;
    } catch (error) {
      console.warn(`Bybit API error for ${endpoint}:`, error);
      
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!.data;
      }
      
      throw error;
    }
  }

  async getAllTickers(): Promise<WatchlistCoin[]> {
    try {
      const response: BybitTickerResponse = await this.makeRequest('/v5/market/tickers?category=linear');
      
      if (response.retCode !== 0) {
        throw new Error(`API Error: ${response.retMsg}`);
      }

      const tickers = response.result?.list || [];
      
      return tickers
        .filter(ticker => ticker.symbol.endsWith('USDT'))
        .map(ticker => this.mapTickerToWatchlistCoin(ticker))
        .filter(coin => this.isValidCoin(coin));
    } catch (error) {
      console.error('Failed to fetch Bybit tickers:', error);
      return [];
    }
  }

  private mapTickerToWatchlistCoin(ticker: BybitTickerData): WatchlistCoin {
    const baseSymbol = ticker.symbol.replace('USDT', '');
    
    return {
      symbol: baseSymbol,
      name: baseSymbol,
      current_price: parseFloat(ticker.lastPrice || '0'),
      market_cap: parseFloat(ticker.openInterestValue || '0'),
      total_volume: parseFloat(ticker.turnover24h || '0'),
      price_change_percentage_24h: parseFloat(ticker.price24hPcnt || '0') * 100,
      open_interest_value: parseFloat(ticker.openInterestValue || '0'),
      funding_rate: parseFloat(ticker.fundingRate || '0') * 100,
      exchange: 'bybit',
    };
  }

  private isValidCoin(coin: WatchlistCoin): boolean {
    if (this.stablecoins.includes(coin.symbol)) return false;
    if (coin.total_volume <= 0 || coin.current_price <= 0) return false;
    if (coin.symbol.includes('TEST') || coin.symbol.length < 2) return false;
    return true;
  }

  async getTrendingCoins(limit: number = 50): Promise<WatchlistCoin[]> {
    try {
      const allCoins = await this.getAllTickers();
      
      const trending = allCoins
        .map(coin => ({
          ...coin,
          trending_score: this.calculateTrendingScore(coin),
          is_trending: true,
        }))
        .sort((a, b) => b.trending_score - a.trending_score)
        .slice(0, limit);

      return trending;
    } catch (error) {
      console.error('Failed to fetch trending coins:', error);
      return [];
    }
  }

  private calculateTrendingScore(coin: WatchlistCoin): number {
    const volumeScore = Math.log10(coin.total_volume + 1);
    const priceChangeScore = Math.abs(coin.price_change_percentage_24h) * 0.1;
    const oiScore = Math.log10(coin.open_interest_value + 1) * 0.5;
    
    return volumeScore + priceChangeScore + oiScore;
  }

  async getTopGainers(limit: number = 50): Promise<WatchlistCoin[]> {
    try {
      const allCoins = await this.getAllTickers();
      
      return allCoins
        .filter(coin => coin.price_change_percentage_24h > 0)
        .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch top gainers:', error);
      return [];
    }
  }

  async getTopLosers(limit: number = 50): Promise<WatchlistCoin[]> {
    try {
      const allCoins = await this.getAllTickers();
      
      return allCoins
        .filter(coin => coin.price_change_percentage_24h < 0)
        .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch top losers:', error);
      return [];
    }
  }

  async getCoinsByVolume(limit: number = 50): Promise<WatchlistCoin[]> {
    try {
      const allCoins = await this.getAllTickers();
      
      return allCoins
        .sort((a, b) => b.total_volume - a.total_volume)
        .map((coin, index) => ({ ...coin, volume_rank: index + 1 }))
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch coins by volume:', error);
      return [];
    }
  }

  async getCoinsByOpenInterest(limit: number = 50): Promise<WatchlistCoin[]> {
    try {
      const allCoins = await this.getAllTickers();
      
      return allCoins
        .filter(coin => coin.open_interest_value > 0)
        .sort((a, b) => b.open_interest_value - a.open_interest_value)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch coins by open interest:', error);
      return [];
    }
  }

  async getCoinsByFundingRate(limit: number = 50, type: 'highest' | 'lowest' = 'highest'): Promise<WatchlistCoin[]> {
    try {
      const allCoins = await this.getAllTickers();
      
      const sorted = allCoins.sort((a, b) => {
        return type === 'highest' 
          ? b.funding_rate - a.funding_rate
          : a.funding_rate - b.funding_rate;
      });
      
      return sorted.slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch coins by funding rate:', error);
      return [];
    }
  }
}

class BinanceService extends ExchangeService {
  private baseUrl = 'https://api.binance.com';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 60 * 1000;

  private stablecoins = [
    'USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD', 'USDD', 'FRAX',
    'LUSD', 'sUSD', 'USDP', 'GUSD', 'HUSD', 'OUSD', 'UST', 'USTC'
  ];

  getName(): string {
    return 'Binance';
  }

  private async makeRequest<T>(endpoint: string, useCache: boolean = true): Promise<T> {
    const cacheKey = endpoint;
    
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; PerpFlow/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (useCache) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }
      
      return data;
    } catch (error) {
      console.warn(`Binance API error for ${endpoint}:`, error);
      
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!.data;
      }
      
      throw error;
    }
  }

  async getAllTickers(): Promise<WatchlistCoin[]> {
    try {
      const response: BinanceTickerResponse[] = await this.makeRequest('/api/v3/ticker/24hr');
      
      return response
        .filter(ticker => ticker.symbol.endsWith('USDT'))
        .map(ticker => this.mapTickerToWatchlistCoin(ticker))
        .filter(coin => this.isValidCoin(coin));
    } catch (error) {
      console.error('Failed to fetch Binance tickers:', error);
      return [];
    }
  }

  private mapTickerToWatchlistCoin(ticker: BinanceTickerResponse): WatchlistCoin {
    const baseSymbol = ticker.symbol.replace('USDT', '');
    
    return {
      symbol: baseSymbol,
      name: baseSymbol,
      current_price: parseFloat(ticker.lastPrice || '0'),
      market_cap: parseFloat(ticker.quoteVolume || '0'), // Using quote volume as proxy
      total_volume: parseFloat(ticker.quoteVolume || '0'),
      price_change_percentage_24h: parseFloat(ticker.priceChangePercent || '0'),
      open_interest_value: 0, // Binance spot doesn't have OI
      funding_rate: 0, // Binance spot doesn't have funding
      exchange: 'binance',
    };
  }

  private isValidCoin(coin: WatchlistCoin): boolean {
    if (this.stablecoins.includes(coin.symbol)) return false;
    if (coin.total_volume <= 0 || coin.current_price <= 0) return false;
    if (coin.symbol.includes('TEST') || coin.symbol.length < 2) return false;
    return true;
  }

  async getTrendingCoins(limit: number = 50): Promise<WatchlistCoin[]> {
    try {
      const allCoins = await this.getAllTickers();
      
      const trending = allCoins
        .map(coin => ({
          ...coin,
          trending_score: this.calculateTrendingScore(coin),
          is_trending: true,
        }))
        .sort((a, b) => b.trending_score - a.trending_score)
        .slice(0, limit);

      return trending;
    } catch (error) {
      console.error('Failed to fetch trending coins:', error);
      return [];
    }
  }

  private calculateTrendingScore(coin: WatchlistCoin): number {
    const volumeScore = Math.log10(coin.total_volume + 1);
    const priceChangeScore = Math.abs(coin.price_change_percentage_24h) * 0.1;
    
    return volumeScore + priceChangeScore;
  }

  async getTopGainers(limit: number = 50): Promise<WatchlistCoin[]> {
    try {
      const allCoins = await this.getAllTickers();
      
      return allCoins
        .filter(coin => coin.price_change_percentage_24h > 0)
        .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch top gainers:', error);
      return [];
    }
  }

  async getTopLosers(limit: number = 50): Promise<WatchlistCoin[]> {
    try {
      const allCoins = await this.getAllTickers();
      
      return allCoins
        .filter(coin => coin.price_change_percentage_24h < 0)
        .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch top losers:', error);
      return [];
    }
  }

  async getCoinsByVolume(limit: number = 50): Promise<WatchlistCoin[]> {
    try {
      const allCoins = await this.getAllTickers();
      
      return allCoins
        .sort((a, b) => b.total_volume - a.total_volume)
        .map((coin, index) => ({ ...coin, volume_rank: index + 1 }))
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch coins by volume:', error);
      return [];
    }
  }

  async getCoinsByOpenInterest(limit: number = 50): Promise<WatchlistCoin[]> {
    // Binance spot doesn't have open interest, return volume-based list
    return this.getCoinsByVolume(limit);
  }

  async getCoinsByFundingRate(limit: number = 50, type: 'highest' | 'lowest' = 'highest'): Promise<WatchlistCoin[]> {
    // Binance spot doesn't have funding rates, return gainers/losers instead
    return type === 'highest' ? this.getTopGainers(limit) : this.getTopLosers(limit);
  }
}

class MultiExchangeWatchlistService {
  private exchanges: Map<SupportedExchange, ExchangeService> = new Map();

  constructor() {
    this.exchanges.set('bybit', new BybitService());
    this.exchanges.set('binance', new BinanceService());
  }

  getExchange(exchange: SupportedExchange): ExchangeService {
    const service = this.exchanges.get(exchange);
    if (!service) {
      throw new Error(`Exchange ${exchange} not supported`);
    }
    return service;
  }

  getSupportedExchanges(): { id: SupportedExchange; name: string }[] {
    return Array.from(this.exchanges.entries()).map(([id, service]) => ({
      id,
      name: service.getName()
    }));
  }

  getCategories(): CryptoCategory[] {
    return CRYPTO_CATEGORIES;
  }

  async getCoinsByCategory(category: string, exchange: SupportedExchange, limit: number = 50): Promise<WatchlistCoin[]> {
    try {
      const categoryData = CRYPTO_CATEGORIES.find(cat => cat.id === category);
      if (!categoryData) {
        throw new Error(`Category ${category} not found`);
      }

      const exchangeService = this.getExchange(exchange);
      const allCoins = await exchangeService.getAllTickers();
      
      // Filter coins by category
      const categoryCoins = allCoins
        .filter(coin => categoryData.coins.includes(coin.symbol))
        .map(coin => ({ ...coin, category: categoryData.name }))
        .sort((a, b) => b.total_volume - a.total_volume)
        .slice(0, limit);

      return categoryCoins;
    } catch (error) {
      console.error(`Failed to fetch ${category} coins:`, error);
      return [];
    }
  }

  filterCoins(coins: WatchlistCoin[], filters: WatchlistFilters): WatchlistCoin[] {
    return coins.filter(coin => {
      if (filters.minVolume && coin.total_volume < filters.minVolume) return false;
      if (filters.maxVolume && coin.total_volume > filters.maxVolume) return false;
      if (filters.minOpenInterest && coin.open_interest_value < filters.minOpenInterest) return false;
      if (filters.maxOpenInterest && coin.open_interest_value > filters.maxOpenInterest) return false;
      if (filters.priceChangeMin && coin.price_change_percentage_24h < filters.priceChangeMin) return false;
      if (filters.priceChangeMax && coin.price_change_percentage_24h > filters.priceChangeMax) return false;
      if (filters.minPrice && coin.current_price < filters.minPrice) return false;
      if (filters.maxPrice && coin.current_price > filters.maxPrice) return false;
      if (filters.category && coin.category !== filters.category) return false;
      if (filters.exchange && coin.exchange !== filters.exchange) return false;
      
      return true;
    });
  }

  clearCache(): void {
    this.exchanges.forEach(exchange => {
      if (exchange instanceof BybitService || exchange instanceof BinanceService) {
        (exchange as any).cache?.clear();
      }
    });
  }
}

// Export singleton instance
export const multiExchangeWatchlistService = new MultiExchangeWatchlistService();
export default multiExchangeWatchlistService; 