import { APIService } from './api-service';

export interface SimilarityResult {
  symbol: string;
  correlation: number;
  dtw_distance: number;
  similarity_score: number;
  pattern_strength: number;
  price_change_24h: number;
  volume_24h: number;
  current_price: number;
}

export interface ChartSimilarityResponse {
  reference_symbol: string;
  similar_coins: SimilarityResult[];
  total_analyzed: number;
  scan_time: number;
  algorithm_used: 'correlation' | 'dtw' | 'hybrid';
  parameters: {
    min_correlation: number;
    max_dtw_distance: number;
    timeframe: string;
    period_hours: number;
  };
}

export interface SimilarityParameters {
  reference_symbol: string;
  min_correlation?: number;
  max_dtw_distance?: number;
  min_volume?: number;
  limit?: number;
  timeframe?: '1h' | '4h' | '1d';
  period_hours?: number;
  algorithm?: 'correlation' | 'dtw' | 'hybrid';
}

export class ChartSimilarityService {
  private static instance: ChartSimilarityService;
  private apiService: typeof APIService;

  constructor() {
    this.apiService = APIService;
  }

  static getInstance(): ChartSimilarityService {
    if (!ChartSimilarityService.instance) {
      ChartSimilarityService.instance = new ChartSimilarityService();
    }
    return ChartSimilarityService.instance;
  }

  async scanSimilarCharts(params: SimilarityParameters): Promise<ChartSimilarityResponse> {
    const defaultParams = {
      min_correlation: 0.7,
      max_dtw_distance: 100,
      min_volume: 100000,
      limit: 50,
      timeframe: '4h' as const,
      period_hours: 168, // 7 days
      algorithm: 'hybrid' as const,
      ...params
    };

    try {
      const response = await fetch('/api/chart-similarity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultParams)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Chart similarity scan failed:', error);
      throw error;
    }
  }

  calculatePearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sum_x = x.reduce((a, b) => a + b, 0);
    const sum_y = y.reduce((a, b) => a + b, 0);
    const sum_x2 = x.reduce((a, b) => a + b * b, 0);
    const sum_y2 = y.reduce((a, b) => a + b * b, 0);
    const sum_xy = x.reduce((sum, xi, i) => sum + xi * y[i], 0);

    const numerator = n * sum_xy - sum_x * sum_y;
    const denominator = Math.sqrt((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  calculateDTWDistance(x: number[], y: number[]): number {
    const n = x.length;
    const m = y.length;
    
    if (n === 0 || m === 0) return Infinity;

    const dtw: number[][] = Array(n + 1).fill(null).map(() => Array(m + 1).fill(Infinity));
    dtw[0][0] = 0;

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const cost = Math.abs(x[i - 1] - y[j - 1]);
        dtw[i][j] = cost + Math.min(
          dtw[i - 1][j],     // insertion
          dtw[i][j - 1],     // deletion
          dtw[i - 1][j - 1]  // match
        );
      }
    }

    return dtw[n][m];
  }

  normalizePrice(prices: number[]): number[] {
    if (prices.length === 0) return [];
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    
    if (range === 0) return prices.map(() => 0);
    
    return prices.map(price => (price - minPrice) / range);
  }

  calculateSimilarityScore(correlation: number, dtwDistance: number, maxDtw: number = 100): number {
    const normalizedDtw = Math.min(dtwDistance / maxDtw, 1);
    const dtwScore = 1 - normalizedDtw;
    
    const correlationWeight = 0.6;
    const dtwWeight = 0.4;
    
    return (Math.abs(correlation) * correlationWeight) + (dtwScore * dtwWeight);
  }

  async getPopularTradingPairs(): Promise<any[]> {
    try {
      const tickers = await this.apiService.getTickers();
      
      return tickers
        .filter(ticker => 
          ticker.symbol.endsWith('USDT') &&
          parseFloat(ticker.volume24h || '0') > 1000000 // $1M+ volume
        )
        .sort((a, b) => parseFloat(b.volume24h || '0') - parseFloat(a.volume24h || '0'))
        .slice(0, 200); // Top 200 by volume
    } catch (error) {
      console.error('Failed to get popular trading pairs:', error);
      return [];
    }
  }

  formatSimilarityResult(result: SimilarityResult): string {
    return `${result.symbol}: ${(result.similarity_score * 100).toFixed(1)}% similar (r=${result.correlation.toFixed(3)}, dtw=${result.dtw_distance.toFixed(1)})`;
  }

  getSimilarityGrade(score: number): { grade: string; color: string } {
    if (score >= 0.9) return { grade: 'Excellent', color: '#10b981' };
    if (score >= 0.8) return { grade: 'Very High', color: '#059669' };
    if (score >= 0.7) return { grade: 'High', color: '#fbbf24' };
    if (score >= 0.6) return { grade: 'Moderate', color: '#f59e0b' };
    if (score >= 0.5) return { grade: 'Low', color: '#ef4444' };
    return { grade: 'Very Low', color: '#dc2626' };
  }
}

export default ChartSimilarityService;