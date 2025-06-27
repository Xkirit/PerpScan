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

export interface FibonacciLevel {
  level: number; // 0.236, 0.382, 0.5, 0.618, 0.786, etc.
  price: number;
  distance: number; // distance from current price in %
  type: 'support' | 'resistance';
}

export interface FibonacciAnalysis {
  symbol: string;
  trend: 'bullish' | 'bearish';
  swingHigh: {
    price: number;
    timestamp: number;
    index: number;
  };
  swingLow: {
    price: number;
    timestamp: number;
    index: number;
  };
  currentPrice: number;
  fibLevels: FibonacciLevel[];
  targetLevels: FibonacciLevel[]; // 0.618-0.66 range for retracement
  pocLevel?: VolumeProfileLevel;
  confluence: boolean; // true if fib level aligns with POC
  quality: 'high' | 'medium' | 'low'; // based on swing strength and volume
  retracePercent: number; // how much it has already retraced
  priceChange24h: number;
  volume24h: number;
  timestamp: number;
}

export interface VolumeProfileLevel {
  price: number;
  volume: number;
  percentage: number; // percentage of total volume at this level
  isPOC: boolean; // Point of Control - highest volume level
  isVAH?: boolean; // Value Area High
  isVAL?: boolean; // Value Area Low
}

export interface VolumeProfile {
  symbol: string;
  timeframe: string;
  startTime: number;
  endTime: number;
  levels: VolumeProfileLevel[];
  poc: VolumeProfileLevel;
  valueAreaHigh: VolumeProfileLevel;
  valueAreaLow: VolumeProfileLevel;
  totalVolume: number;
}

export interface SwingPoint {
  type: 'high' | 'low';
  price: number;
  timestamp: number;
  index: number;
  strength: number; // 1-10 based on how significant the swing is
  volume: number;
}

export interface FibRetracementScanResult {
  fibAnalyses: FibonacciAnalysis[];
  totalScanned: number;
  filteredCount: number;
  scanTime: number;
  criteria: {
    minRetracement: number;
    maxRetracement: number;
    requiredFibLevel: number[];
    pocConfluence: boolean;
  };
} 