export interface BybitTicker {
  symbol: string;
  lastPrice: string;
  price24hPcnt: string;
  volume24h: string;
  turnover24h: string;
  highPrice24h: string;
  lowPrice24h: string;
}

export interface KlineData {
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface CoinAnalysis {
  symbol: string;
  priceChange24h: number;
  volume24h: number;
  priceChange4h: number;
  volumeChange4h: number;
  priceChange1d: number;
  volumeChange1d: number;
  currentPrice: number;
  trendScore: number;
  rank?: number;
}

export interface AnalysisResult {
  trending: CoinAnalysis[];
  strongest: CoinAnalysis[];
  weakest: CoinAnalysis[];
  timestamp: string;
  totalCoins: number;
}

export interface BybitAPIResponse<T> {
  retCode: number;
  retMsg: string;
  result: {
    list: T[];
    nextPageCursor?: string;
  };
  time: number;
}

export type AnalysisCategory = 'trending' | 'strongest' | 'weakest';

export interface ChartDataPoint {
  timestamp: number;
  price: number;
  volume: number;
}

export interface EngulfingPattern {
  symbol: string;
  type: 'bullish' | 'bearish';
  currentCandle: {
    open: number;
    close: number;
    high: number;
    low: number;
    timestamp: number;
    volume: number;
  };
  previousCandle: {
    open: number;
    close: number;
    high: number;
    low: number;
    timestamp: number;
    volume: number;
  };
  bodyRatio: number;
  priceChange: number; // Percentage change from previous close to current close
}

export interface CandlestickScreenerResult {
  '1h': EngulfingPattern[];
  '4h': EngulfingPattern[];
  '1d': EngulfingPattern[];
  timestamp: string;
  totalScanned: number;
  nextUpdate?: {
    '1h': number;
    '4h': number;
    '1d': number;
  };
  message?: string;
  warning?: string;
  isInitializing?: boolean;
} 