'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { BarChart, Bar, ComposedChart, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/lib/api-service';
// Custom SVG Icons - Modern Financial Theme
const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const AlertTriangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendingDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const AlertCircleIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const DollarSignIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

// Alias for backward compatibility
const RefreshCwIcon = RefreshIcon;
import { Button } from '@/components/ui/button';

interface InstitutionalSignal {
  symbol: string;
  type: 'oi_spike' | 'oi_divergence' | 'funding_anomaly' | 'large_liquidation' | 'volume_oi_surge';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  timestamp: number;
  confidence: number;
}

interface OpenInterestData {
  symbol: string;
  openInterest: number;
  openInterestValue: number;
  oiChange24h: number;
  oiChangePercent: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  fundingRate: number;
  timestamp: number;
  // Enhanced tracking
  historicalOI?: number[];
  oiVelocity?: number;
  oiAcceleration?: number;
  abnormalityScore?: number;
  whaleRating?: 'mega' | 'large' | 'medium' | 'small';
  priorityScore?: number;
  volumeCategory?: 'low' | 'medium' | 'high';
  manipulationConfidence?: number;
  // Directional bias data
  longShortRatio?: {
    buyRatio: number;
    sellRatio: number;
    bias: 'bullish' | 'bearish' | 'neutral';
    biasStrength: 'weak' | 'moderate' | 'strong';
    timestamp: number;
    source: 'binance' | 'bybit';
  };
}

// Add the new Suspicion Score to the type
interface OpenInterestDataWithSuspicion extends OpenInterestData {
  suspicion: {
    bullishScore: number;
    bearishScore: number;
    dominantSignal: string;
    signalDetails: string[];
  };
}

// New function to calculate suspicion scores
const calculateSuspicionScore = (coin: OpenInterestData): { bullishScore: number; bearishScore: number; dominantSignal: string; signalDetails: string[] } => {
  let bullishScore = 0;
  let bearishScore = 0;
  const signals: { type: 'bullish' | 'bearish'; message: string; score: number }[] = [];

  const {
    oiChangePercent,
    priceChange24h,
    fundingRate,
    longShortRatio,
    volume24h,
    openInterestValue,
    abnormalityScore = 0,
  } = coin;

  const volumeOiRatio = openInterestValue > 0 ? volume24h / openInterestValue : 0;

  // 1. OI vs Price Divergence (Classic accumulation/distribution signal)
  if (oiChangePercent > 5 && Math.abs(priceChange24h) < 3) {
    const score = oiChangePercent * 1.5;
    signals.push({ type: 'bullish', message: 'Stealth Accumulation', score });
  }
  if (oiChangePercent < -5 && Math.abs(priceChange24h) < 3) {
    const score = Math.abs(oiChangePercent) * 1.5;
    signals.push({ type: 'bearish', message: 'Stealth Distribution', score });
  }

  // 2. Squeeze Potential (Pressure cooker for big moves)
  if (fundingRate > 0.0002 && oiChangePercent > 3) { // High positive funding, longs are paying
    const score = (fundingRate * 10000) * 3 + (longShortRatio?.buyRatio ?? 0.5) * 20;
    signals.push({ type: 'bearish', message: 'Long Squeeze Risk', score });
  }
  if (fundingRate < -0.0002 && oiChangePercent > 3) { // High negative funding, shorts are paying
    const score = Math.abs(fundingRate * 10000) * 3 + (longShortRatio?.sellRatio ?? 0.5) * 20;
    signals.push({ type: 'bullish', message: 'Short Squeeze Risk', score });
  }

  // 3. Absorption / Trapped Traders (Institutions absorbing retail)
  if (longShortRatio) {
    if (longShortRatio.buyRatio > 0.6 && priceChange24h < 0) {
      const score = (longShortRatio.buyRatio - 0.5) * 50 + Math.abs(priceChange24h);
      signals.push({ type: 'bearish', message: 'Longs Trapped', score });
    }
    if (longShortRatio.sellRatio > 0.6 && priceChange24h > 0) {
      const score = (longShortRatio.sellRatio - 0.5) * 50 + priceChange24h;
      signals.push({ type: 'bullish', message: 'Shorts Trapped', score });
    }
  }
  
  // 4. Low Turnover Accumulation
  if (volumeOiRatio > 0 && volumeOiRatio < 2 && oiChangePercent > 3) {
      const score = (4 - volumeOiRatio) * 5 + oiChangePercent;
      signals.push({ type: 'bullish', message: 'Low Turnover Accumulation', score });
  }

  // 5. Statistical Anomaly
  if (abnormalityScore > 2.0) {
      const score = abnormalityScore * 15;
      if(oiChangePercent > 0) {
        signals.push({ type: 'bullish', message: `OI Anomaly (+${oiChangePercent.toFixed(1)}%)`, score });
      } else {
        signals.push({ type: 'bearish', message: `OI Anomaly (${oiChangePercent.toFixed(1)}%)`, score });
      }
  }

  // 6. Unusual Funding vs OI Divergence (New signal replacing whale activity)
  if (Math.abs(fundingRate) > 0.0001 && oiChangePercent > 2) {
    const score = Math.abs(fundingRate * 10000) * 2 + oiChangePercent;
    if (fundingRate > 0 && oiChangePercent > 0) {
      signals.push({ type: 'bearish', message: 'Funding Pressure Build', score });
    } else if (fundingRate < 0 && oiChangePercent > 0) {
      signals.push({ type: 'bullish', message: 'Short Pressure Build', score });
    }
  }
  
  signals.forEach(signal => {
    if(signal.type === 'bullish') bullishScore += signal.score;
    if(signal.type === 'bearish') bearishScore += signal.score;
  });

  const sortedSignals = signals.sort((a,b) => b.score - a.score);
  const dominantSignal = sortedSignals.length > 0 ? sortedSignals[0].message : 'N/A';
  const signalDetails = sortedSignals.map(s => `${s.message} (${s.score.toFixed(0)})`);

  return {
    bullishScore,
    bearishScore,
    dominantSignal,
    signalDetails
  };
};

// Memoized ticker component to prevent unnecessary re-renders
const TickerCard = memo(({ coin, theme }: { coin: OpenInterestDataWithSuspicion; theme: string }) => {
  const { suspicion } = coin;
  const totalScore = suspicion.bullishScore + suspicion.bearishScore;
  const bullRatio = totalScore > 0 ? (suspicion.bullishScore / totalScore) * 100 : 50;
  
  const dominantSentiment = suspicion.bullishScore > suspicion.bearishScore ? 'bullish' : 'bearish';

  const colorScheme = dominantSentiment === 'bullish' ? {
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  } : {
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  };
  
  return (
    <CardContainer className="inter-var h-full">
      <CardBody 
        className="relative group/card hover:shadow-2xl rounded-xl p-4 border cursor-pointer h-full w-full flex flex-col transform transition-all duration-300 hover:scale-[1.02]"
        onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${coin.symbol}.P`, '_blank')}
        style={{ 
          background: colorScheme.background,
          border: colorScheme.border,
          boxShadow: colorScheme.boxShadow,
          minHeight: '280px'
        }}
      >
        <CardItem translateZ="50" className="relative z-10 w-full flex-1 flex flex-col">
          {/* Header section with consistent spacing */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <CardItem translateZ="60" rotateX={5} rotateY={5}>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl border border-white/20 flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={`https://assets.coincap.io/assets/icons/${coin.symbol.replace('USDT', '').toLowerCase()}@2x.png`}
                    alt={coin.symbol.replace('USDT', '')}
                    className="w-7 h-7 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<span class="font-bold text-sm text-blue-600 dark:text-blue-400">${coin.symbol.replace('USDT', '').slice(0, 2)}</span>`;
                      }
                    }}
                  />
                </div>
              </CardItem>
              <div className="min-w-0 flex-1">
                <CardItem translateZ="50">
                  <h3 className="font-bold text-xl truncate" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
                    {coin.symbol.replace('USDT', '')}
                  </h3>
                </CardItem>
                <CardItem translateZ="40">
                  <div className="text-xs opacity-70 mt-1" style={{ color: theme === 'dark' ? '#4a7c59' : '#3c5d47' }}>
                    {new Date(coin.timestamp).toLocaleTimeString()}
                  </div>
                </CardItem>
              </div>
            </div>
          </div>

          {/* Dominant Signal Badge */}
          <CardItem translateZ="60" className="mb-4">
            <div className={`inline-block px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              dominantSentiment === 'bullish' 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {suspicion.dominantSignal}
            </div>
          </CardItem>
          
          {/* Main metrics with consistent spacing */}
          <CardItem translateZ="40" className="mb-4 flex-1">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-80" style={{ color: theme === 'dark' ? '#4a7c59' : '#3c5d47' }}>
                  OI Value:
                </span>
                <span className="font-bold text-sm" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
                  {coin.openInterestValue > 1e9 
                    ? `$${(coin.openInterestValue / 1e9).toFixed(2)}B` 
                    : `$${(coin.openInterestValue / 1e6).toFixed(1)}M`
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-80" style={{ color: theme === 'dark' ? '#4a7c59' : '#3c5d47' }}>
                  OI Change (24h):
                </span>
                <span className={`font-bold text-sm transition-colors duration-200 ${
                  coin.oiChangePercent > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {`${coin.oiChangePercent > 0 ? '+' : ''}${coin.oiChangePercent.toFixed(1)}%`}
                </span>
              </div>
              {coin.longShortRatio && (
                <div className="flex justify-between items-center">
                  <span className="text-xs opacity-80" style={{ color: theme === 'dark' ? '#4a7c59' : '#3c5d47' }}>
                    L/S Ratio:
                  </span>
                  <span className={`font-bold text-sm transition-colors duration-200 ${
                    coin.longShortRatio.buyRatio > coin.longShortRatio.sellRatio
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}>
                    {coin.longShortRatio.buyRatio > coin.longShortRatio.sellRatio ? 'L' : 'S'}
                    {' '}
                    {(Math.max(coin.longShortRatio.buyRatio, coin.longShortRatio.sellRatio) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </CardItem>
          
          {/* Suspicion Score visualization */}
          <CardItem translateZ="30" className="mt-auto">
            <div className="w-full bg-gray-200 dark:bg-gray-700/50 rounded-full h-3 relative overflow-hidden border border-gray-500/20 mb-3">
              <div 
                className="bg-green-500 h-full transition-all duration-700 ease-out" 
                style={{ width: `${bullRatio}%` }}>
              </div>
              <div 
                className="bg-red-500 h-full absolute top-0 right-0 transition-all duration-700 ease-out"
                style={{ width: `${100 - bullRatio}%` }}>
              </div>
            </div>
            <div className="flex justify-between text-xs mb-3">
              <span className="font-medium text-green-400 transition-opacity duration-200">
                Bull: {suspicion.bullishScore.toFixed(0)}
              </span>
              <span className="font-medium text-red-400 transition-opacity duration-200">
                Bear: {suspicion.bearishScore.toFixed(0)}
              </span>
            </div>
            <div 
              className="text-center text-xs font-medium py-2 px-3 rounded border transition-all duration-200"
              style={{
                backgroundColor: dominantSentiment === 'bullish' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderColor: dominantSentiment === 'bullish' ? 'rgba(22, 163, 74, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                color: dominantSentiment === 'bullish' ? 'rgb(34, 197, 94)' : 'rgb(248, 113, 113)'
              }}
            >
              {dominantSentiment.toUpperCase()} SIGNAL
            </div>
          </CardItem>
        </CardItem>
      </CardBody>
    </CardContainer>
  );
}, (prevProps, nextProps) => {
  // More relaxed comparison function for smoother updates
  const prev = prevProps.coin;
  const next = nextProps.coin;
  
  // Always re-render if symbol changes or theme changes
  if (prev.symbol !== next.symbol || prevProps.theme !== nextProps.theme) {
    return false;
  }
  
  // Check for significant changes in key values
  const bullScoreDiff = Math.abs(prev.suspicion.bullishScore - next.suspicion.bullishScore);
  const bearScoreDiff = Math.abs(prev.suspicion.bearishScore - next.suspicion.bearishScore);
  const oiChangeDiff = Math.abs(prev.oiChangePercent - next.oiChangePercent);
  
  // Re-render if there are significant changes (threshold of 5 points for scores, 1% for OI change)
  if (bullScoreDiff >= 5 || bearScoreDiff >= 5 || oiChangeDiff >= 1) {
    return false;
  }
  
  // Check if dominant signal changed
  if (prev.suspicion.dominantSignal !== next.suspicion.dominantSignal) {
    return false;
  }
  
  // Check if L/S ratio changed significantly
  if (prev.longShortRatio?.buyRatio !== next.longShortRatio?.buyRatio) {
    return false;
  }
  
  // No significant changes, skip re-render
  return true;
});

TickerCard.displayName = 'TickerCard';

const InstitutionalActivity: React.FC = () => {
  const { theme } = useTheme();
  const [openInterestData, setOpenInterestData] = useState<OpenInterestData[]>([]);
  const [loading, setLoading] = useState(false);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [historicalOIData, setHistoricalOIData] = useState<Map<string, number[]>>(new Map());
  const [suspiciousMovements, setSuspiciousMovements] = useState<OpenInterestDataWithSuspicion[]>([]);
  const [countdown, setCountdown] = useState<string>('Soon');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [dbLastUpdated, setDbLastUpdated] = useState<Date | null>(null);

  // Redis read caching to reduce redundant operations
  const [lastRedisRead, setLastRedisRead] = useState<number>(0);
  const [cachedFlows, setCachedFlows] = useState<OpenInterestDataWithSuspicion[]>([]);
  const [redisReadInProgress, setRedisReadInProgress] = useState(false);

  // Enhanced L/S ratio fetching with Binance as primary source (91% coverage vs Bybit's 30%)
  const getLongShortRatio = async (symbol: string, priority: 'high' | 'medium' | 'low'): Promise<{
    buyRatio: number;
    sellRatio: number;
    bias: 'bullish' | 'bearish' | 'neutral';
    biasStrength: 'weak' | 'moderate' | 'strong';
    timestamp: number;
    source: 'binance' | 'bybit';
  } | null> => {
    // Skip API calls for low priority coins to reduce requests
    if (priority === 'low') {
      return null;
    }
    
    // 🚀 PRIMARY SOURCE: Binance (91% coverage - 3x better than Bybit)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout (increased for Vercel)
      
      const binanceResponse = await fetch(
        `/api/binance-ls-ratio?symbol=${symbol}&period=1h&limit=1`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (binanceResponse.ok) {
        const binanceData = await binanceResponse.json();
        
        // Check if the response indicates a fallback is needed
        if (binanceData.fallback || binanceData.error) {
          // Binance API is unavailable (451 error or other issues), skip to Bybit
          throw new Error('Binance API unavailable');
        }
        
        if (binanceData && binanceData.length > 0) {
          const latestData = binanceData[0];
          const longRatio = parseFloat(latestData.longShortRatio);
          
          // Binance returns longShortRatio, convert to individual ratios
          // longShortRatio = longAccount / shortAccount
          // If longShortRatio = 2.0, it means 2:1 ratio (67% long, 33% short)
          const totalRatio = longRatio + 1;
          const buyRatio = longRatio / totalRatio;
          const sellRatio = 1 / totalRatio;
          
          // Calculate directional bias
          const ratioDiff = buyRatio - sellRatio;
          let bias: 'bullish' | 'bearish' | 'neutral' = 'neutral';
          let biasStrength: 'weak' | 'moderate' | 'strong' = 'weak';
          
          if (Math.abs(ratioDiff) > 0.15) {
            biasStrength = 'strong';
          } else if (Math.abs(ratioDiff) > 0.08) {
            biasStrength = 'moderate';
          }
          
          if (buyRatio > 0.55) {
            bias = 'bullish';
          } else if (sellRatio > 0.55) {
            bias = 'bearish';
          }
          
          return {
            buyRatio,
            sellRatio,
            bias,
            biasStrength,
            timestamp: parseInt(latestData.timestamp),
            source: 'binance'
          };
        }
      }
    } catch (error) {
      // Silent fallback to Bybit - expected behavior for geographic restrictions
      if (error instanceof Error && error.name !== 'AbortError') {
        // Only log non-timeout errors for debugging
        console.debug(`Binance API fallback for ${symbol}: ${error.message}`);
      }
    }
    
    // 🟡 SECONDARY SOURCE: Bybit (backup) - Use internal API route
    try {
      const bybitResponse = await fetch(`/api/account-ratio?symbol=${symbol}&period=1h&limit=1`);
      if (bybitResponse.ok) {
        const bybitData = await bybitResponse.json();
        if (bybitData.success && bybitData.data && bybitData.data.list && bybitData.data.list.length > 0) {
          const latestData = bybitData.data.list[0];
          const buyRatio = parseFloat(latestData.buyRatio);
          const sellRatio = parseFloat(latestData.sellRatio);

          const ratioDiff = buyRatio - sellRatio;
          let bias: 'bullish' | 'bearish' | 'neutral' = 'neutral';
          let biasStrength: 'weak' | 'moderate' | 'strong' = 'weak';

          if (Math.abs(ratioDiff) > 0.15) biasStrength = 'strong';
          else if (Math.abs(ratioDiff) > 0.08) biasStrength = 'moderate';
          
          if (buyRatio > 0.55) bias = 'bullish';
          else if (sellRatio > 0.55) bias = 'bearish';

          return { buyRatio, sellRatio, bias, biasStrength, timestamp: Date.now(), source: 'bybit' };
        }
      }
    } catch(e) {
      // Both failed
    }
    
    return null;
  };

  const get24hOIChange = async (symbol: string): Promise<number | null> => {
    try {
      const response = await fetch(`/api/historical-oi?symbol=${symbol}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.oldOpenInterestValue;
    } catch (error) {
      console.error(`Failed to fetch 24h OI for ${symbol}`, error);
      return null;
    }
  };

  // Load institutional flows from Redis with intelligent caching to reduce redundant reads
  const loadInstitutionalFlows = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    const now = Date.now();
    const timeSinceLastRead = now - lastRedisRead;
    
    // Use cached data if:
    // 1. Not forcing refresh AND
    // 2. Data is less than 2 minutes old AND  
    // 3. We have cached data AND
    // 4. No read is currently in progress
    if (!forceRefresh && 
        timeSinceLastRead < 2 * 60 * 1000 && 
        cachedFlows.length > 0 && 
        !redisReadInProgress) {
      // Use cached data - no Redis call needed
      setSuspiciousMovements(cachedFlows);
      return;
    }

    // Prevent multiple simultaneous Redis reads
    if (redisReadInProgress) {
      return;
    }

    try {
      setRedisReadInProgress(true);
      
      // Add timestamp to prevent HTTP caching issues (but reduce Redis load)
      const timestamp = now;
      const response = await fetch(`/api/institutional-flows?t=${timestamp}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.flows) {
          const newFlows = data.flows as OpenInterestDataWithSuspicion[];
          
          // Update flows with fresh data and ensure manipulation confidence is calculated
          const freshFlows = newFlows.map(flow => ({
            ...flow,
            timestamp: timestamp,
            suspicion: flow.suspicion || calculateSuspicionScore(flow)
          }));
          
          // Update both state and cache
          setSuspiciousMovements(freshFlows);
          setCachedFlows(freshFlows);
          setLastRedisRead(now);
          
          if (data.lastUpdated) {
            setDbLastUpdated(new Date(data.lastUpdated));
          }
        }
      } else {
        // On error, use cached data if available
        if (cachedFlows.length > 0) {
          setSuspiciousMovements(cachedFlows);
        }
      }
    } catch (error) {
      // On error, use cached data if available  
      if (cachedFlows.length > 0) {
        setSuspiciousMovements(cachedFlows);
      }
    } finally {
      setRedisReadInProgress(false);
    }
  }, [lastRedisRead, cachedFlows, redisReadInProgress]);

  // Save institutional flows to Redis with enhanced metadata
  const saveInstitutionalFlows = useCallback(async (flows: OpenInterestDataWithSuspicion[]): Promise<void> => {
    try {
      const response = await fetch('/api/institutional-flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          flows: flows.slice(0, 16), // Save top 16 highest score coins
          replaceMode: true, // Always replace the DB with the new top coins
          maxFlows: 16, 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDbLastUpdated(new Date(data.lastUpdated));
          
          // Invalidate cache since we just wrote new data to Redis
          setLastRedisRead(0); // Force next read to bypass cache
          setCachedFlows([]); // Clear cached data
        }
      }
    } catch (error) {
      // //console.error('Error saving institutional flows to Redis:', error);
    }
  }, []);

  // Enhanced OI tracking with real 24h historical data from Bybit API
  const fetchOpenInterestData = useCallback(async (): Promise<void> => {
    // Show loading UI for both first load and manual refresh
    setLoading(true);
    if (isFirstLoad) {
      setLoadingProgress(0);
      setLoadingMessage('Fetching market data...');
    } else {
      setLoadingMessage('Refreshing market analysis...');
    }
    try {
      // Scanning Bybit futures for institutional flows
      
      // Get ALL tickers data (includes OI, funding, volume) from API service
      const allTickers = await apiService.getTickers();
      
      if (!allTickers || allTickers.length === 0) {
        throw new Error('No ticker data received from API');
      }

      if (isFirstLoad) {
        setLoadingProgress(20);
        setLoadingMessage('Processing market data...');
      }

      // Filter to top volume USDT pairs - optimized for faster loading
      const topUsdtTickers = allTickers
        .filter((ticker: any) => ticker.symbol.endsWith('USDT') && parseFloat(ticker.openInterestValue || '0') > 1000000) // >$1M OI (raised threshold for speed)
        .sort((a: any, b: any) => parseFloat(b.openInterestValue) - parseFloat(a.openInterestValue))
        .slice(0, 200); // Top 200 by OI value for reduced API load

    
      if (isFirstLoad) {
        setLoadingProgress(40);
        setLoadingMessage(`Analyzing ${topUsdtTickers.length} assets...`);
      }
      
      // Process tickers with optimized batch processing - reduced concurrency
      
             // Process in smaller batches to reduce server load and improve stability
       const batchSize = 10;
       const allUsdtTickers: OpenInterestData[] = [];
       
       for (let i = 0; i < topUsdtTickers.length; i += batchSize) {
         const batch = topUsdtTickers.slice(i, i + batchSize);
         const batchResults = await Promise.all(
           batch.map(async (ticker: any, batchIndex: number) => {
             const index = i + batchIndex;
             const symbol = ticker.symbol;
             const currentOI = parseFloat(ticker.openInterest || '0');
             const oiValue = parseFloat(ticker.openInterestValue || '0');
             
             // Keep local historical data for velocity calculations (scan-to-scan changes)
             const historical = historicalOIData.get(symbol) || [];
             const newHistorical = [...historical.slice(-19), currentOI]; // Keep last 20 data points
             
             // Prioritized API calls - reduce requests for stability
             let realOIChange = 0; // This will be percentage change
             let realOIChangeAbsolute = 0; // This will be absolute change
             let longShortData = null;
             const priority = index < 20 ? 'high' : index < 60 ? 'medium' : 'low'; // Reduced priority ranges for fewer API calls
             
             // Fetch both OI change and long/short ratio for top coins only
             if (index < 80) { // Increased from 50 to 80 to accommodate 16 display coins
               const [oldOIValue, lsData] = await Promise.all([
                 get24hOIChange(symbol),
                 getLongShortRatio(symbol, priority)
               ]);
               
               // Calculate 24h change if we have historical data
               if (oldOIValue !== null && oldOIValue > 0) {
                 realOIChangeAbsolute = currentOI - oldOIValue;
                 realOIChange = (realOIChangeAbsolute / oldOIValue) * 100;
               }
               
               longShortData = lsData;
               
               // L/S data fetching completed silently
             }
             
             // For all coins: Use local historical data as fallback (much faster)
             if (realOIChange === 0 && historical.length > 0) {
               const previousOI = historical[historical.length - 1];
               if (previousOI > 0) {
                 realOIChangeAbsolute = currentOI - previousOI;
                 realOIChange = (realOIChangeAbsolute / previousOI) * 100;
               }
             }
             
             // Calculate scan-to-scan velocity (different from 24h change)
             let scanOIChange = 0;
             if (historical.length > 0) {
               const previousOI = historical[historical.length - 1];
               if (previousOI > 0) {
                 scanOIChange = ((currentOI - previousOI) / previousOI) * 100;
               }
             }
             
             const oiVelocity = historical.length > 1 ? currentOI - historical[historical.length - 1] : 0;
             const oiAcceleration = historical.length > 2 ? 
               (historical[historical.length - 1] - historical[historical.length - 2]) - 
               (historical[historical.length - 2] - (historical[historical.length - 3] || historical[historical.length - 2])) : 0;
             
             // Improved abnormality score calculation - more stable with minimum data requirements
             let abnormalityScore = 0;
             if (historical.length >= 10) { // Require more data points for stability
               // Use rolling window for more stable statistics
               const recentData = historical.slice(-15); // Last 15 data points
               const mean = recentData.reduce((sum, val) => sum + val, 0) / recentData.length;
               const variance = recentData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentData.length;
               const stdDev = Math.sqrt(variance);
               
               // Only calculate if we have meaningful standard deviation
               if (stdDev > mean * 0.01) { // Minimum 1% of mean for meaningful std dev
                 abnormalityScore = Math.abs(currentOI - mean) / stdDev;
                 // Cap abnormality score to prevent extreme values
                 abnormalityScore = Math.min(abnormalityScore, 10);
               }
             }
             
             // Whale rating based on OI value
             let whaleRating: 'mega' | 'large' | 'medium' | 'small' = 'small';
             if (oiValue > 1000000000) whaleRating = 'mega';      // >$1B
             else if (oiValue > 100000000) whaleRating = 'large';  // >$100M
             else if (oiValue > 10000000) whaleRating = 'medium';  // >$10M
             
             // Update historical data
             historicalOIData.set(symbol, newHistorical);
             
             return {
               symbol,
               openInterest: currentOI,
               openInterestValue: oiValue,
               oiChange24h: realOIChangeAbsolute, // Absolute change in OI
               oiChangePercent: realOIChange, // Percentage change in OI
               price: parseFloat(ticker.lastPrice || '0'),
               priceChange24h: parseFloat(ticker.price24hPcnt || '0'),
               volume24h: parseFloat(ticker.turnover24h || '0'),
               fundingRate: parseFloat(ticker.fundingRate || '0'),
               timestamp: Date.now(),
               historicalOI: newHistorical,
               oiVelocity,
               oiAcceleration,
               abnormalityScore,
               whaleRating,
               longShortRatio: longShortData || undefined
             };
           })
         );
         
         allUsdtTickers.push(...batchResults);
         
         // Larger delay between batches to reduce API pressure
         if (i + batchSize < topUsdtTickers.length) {
           await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay (doubled)
         }
       }

      if (isFirstLoad) {
        setLoadingProgress(70);
        setLoadingMessage('Calculating suspicion scores...');
      }
      
      // Update historical data map
      setHistoricalOIData(new Map(historicalOIData));

      // ** NEW ALGORITHM LOGIC **
      const scoredAssets: OpenInterestDataWithSuspicion[] = allUsdtTickers.map(coin => ({
        ...coin,
        suspicion: calculateSuspicionScore(coin),
      }));

      // Filter for coins with a minimum score to be considered
      const filteredAssets = scoredAssets.filter(
        coin => (coin.suspicion.bullishScore + coin.suspicion.bearishScore) > 20
      );

      // Sort by the highest score (either bullish or bearish)
      const sortedBySuspicion = filteredAssets.sort((a, b) => {
        const scoreA = Math.max(a.suspicion.bullishScore, a.suspicion.bearishScore);
        const scoreB = Math.max(b.suspicion.bullishScore, b.suspicion.bearishScore);
        return scoreB - scoreA;
      });

      // Update the main display list
      setSuspiciousMovements(sortedBySuspicion);
      
      // 🎯 SMART TRACKER: Update Redis DB every 5 minutes
      const lastEdgeUpdate = localStorage.getItem('lastEdgeDetectorUpdate');
      const shouldUpdateEdgeDetector = !lastEdgeUpdate || (Date.now() - parseInt(lastEdgeUpdate)) > 5 * 60 * 1000;
      
      if (shouldUpdateEdgeDetector && sortedBySuspicion.length > 0) {
        // Save the top 16 coins to Redis
        await saveInstitutionalFlows(sortedBySuspicion);
        localStorage.setItem('lastEdgeDetectorUpdate', Date.now().toString());
      }
      
      setOpenInterestData(allUsdtTickers); // Keep full data for other potential uses
      
      // 🎯 REDIS FRONTEND UPDATE - Load latest data from store after database update
      if (shouldUpdateEdgeDetector) {
        // Wait a moment for database update to complete, then load fresh data
        setTimeout(async () => {
          await loadInstitutionalFlows(true); // Force refresh after database update
        }, 500); // 500ms delay to ensure database update is complete
      } else {
        // Regular refresh - use cache if available
        await loadInstitutionalFlows(false); // Use cached data if recent enough
      }
      
      
      if (isFirstLoad) {
        setLoadingProgress(100);
        setLoadingMessage('Scan complete!');
      }
      
      const scanCompleteTime = new Date();
      setLastUpdated(scanCompleteTime);
      // Scan completed successfully

      // Mark first load as complete
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }

    } catch (error) {
      console.error('❌ Error in advanced OI scanning:', error);
      
      // On error during scanning, try to load existing data from Redis
      try {
        await loadInstitutionalFlows(true);
      } catch (redisError) {
        console.warn('Failed to load data from Redis:', redisError);
      }
      
      // Set loading message to indicate error
      if (isFirstLoad) {
        setLoadingMessage('Error occurred, retrying...');
      }
    } finally {
      // Always hide loading after operation completes
      setLoading(false);
    }
  }, [historicalOIData, isFirstLoad, saveInstitutionalFlows, loadInstitutionalFlows]);

  // Initial load from Redis and then fetch new data
  useEffect(() => {
    // Starting Smart Money Tracker - loading from Redis first
    
    // Load existing data from Redis immediately (force refresh on initial load)
    loadInstitutionalFlows(true).then(() => {
      // Database coins loaded, starting fresh scan
      // Then start fresh scan
      fetchOpenInterestData();
    });
  }, []);  // Remove dependencies to prevent re-initialization loops

  // Auto-refresh institutional data every 5 minutes - reduced frequency for API optimization
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const scheduleNextScan = () => {
      timeoutId = setTimeout(() => {
        // Starting scheduled rescan
        fetchOpenInterestData().then(() => {
          scheduleNextScan(); // Schedule next scan after this one completes
        });
      }, 5 * 60 * 1000); // 5 minutes (300 seconds)
    };

    // Only schedule if we have data (meaning initial scan completed)
    if (openInterestData.length > 0) {
      scheduleNextScan();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [openInterestData.length, fetchOpenInterestData]); // Trigger when data is first loaded

  const formatLastUpdated = (date: Date) => {
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Live countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      if (!lastUpdated) {
        setCountdown('Soon');
        return;
      }
      
      const nextUpdate = new Date(lastUpdated.getTime() + 5 * 60 * 1000); // 5 minutes
      const now = new Date();
      
      if (nextUpdate <= now) {
        setCountdown('Now');
        return;
      }
      
      const timeDiff = nextUpdate.getTime() - now.getTime();
      const minutes = Math.floor(timeDiff / (60 * 1000));
      const seconds = Math.floor((timeDiff % (60 * 1000)) / 1000);
      
      if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
          <AlertCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: theme === 'dark' ? '#4a7c59' : '#3c5d47' }} />
          <span className="hidden sm:inline">Big Move Detector</span>
          <span className="sm:hidden">Move Detector</span>
        </h2>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="text-xs sm:text-sm" style={{ color: theme === 'dark' ? '#4a7c59' : '#3c5d47' }}>
              <span className="hidden sm:inline">Last updated: </span>
              {formatLastUpdated(lastUpdated)}
            </div>
          )}
        </div>
      </div>

      {/* Signal Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div 
          className="p-3 sm:p-4 rounded-lg backdrop-blur-[3px]" 
          style={{ 
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            backgroundColor: 'rgba(30, 63, 32, 0.1)'
          }}
        >
          <div className="text-xs sm:text-sm font-medium truncate" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
            <span className="hidden sm:inline">Total Suspicion Value</span>
            <span className="sm:hidden">Suspicion</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
            ${suspiciousMovements.reduce((sum, coin) => sum + coin.openInterestValue, 0) > 1e9 
              ? `${(suspiciousMovements.reduce((sum, coin) => sum + coin.openInterestValue, 0) / 1e9).toFixed(1)}B`
              : `${(suspiciousMovements.reduce((sum, coin) => sum + coin.openInterestValue, 0) / 1e6).toFixed(0)}M`
            }
          </div>
        </div>
        <div 
          className="p-3 sm:p-4 rounded-lg backdrop-blur-[3px]" 
          style={{ 
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            backgroundColor: 'rgba(30, 63, 32, 0.1)'
          }}
        >
          <div className="text-xs sm:text-sm font-medium truncate" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
            <span className="hidden sm:inline">High-Conviction Alerts</span>
            <span className="sm:hidden">Alerts</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
            {suspiciousMovements.filter(coin => (coin.suspicion.bullishScore + coin.suspicion.bearishScore) > 80).length}
          </div>
        </div>
        <div 
          className="p-3 sm:p-4 rounded-lg backdrop-blur-[3px]" 
          style={{ 
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            backgroundColor: 'rgba(30, 63, 32, 0.1)'
          }}
        >
          <div className="text-xs sm:text-sm font-medium truncate" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
            <span className="hidden sm:inline">Bullish Signals</span>
            <span className="sm:hidden">Bullish</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: 'rgb(34, 197, 94)' }}>
            {suspiciousMovements.filter(coin => coin.suspicion.bullishScore > coin.suspicion.bearishScore).length}
          </div>
        </div>
        <div 
          className="p-3 sm:p-4 rounded-lg backdrop-blur-[3px]" 
          style={{ 
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            backgroundColor: 'rgba(30, 63, 32, 0.1)'
          }}
        >
          <div className="text-xs sm:text-sm font-medium truncate" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
            <span className="hidden sm:inline">Bearish Signals</span>
            <span className="sm:hidden">Bearish</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: 'rgb(248, 113, 113)' }}>
            {suspiciousMovements.filter(coin => coin.suspicion.bearishScore > coin.suspicion.bullishScore).length}
          </div>
        </div>
      </div>

      {/* 🚀 SMART MONEY TRACKER - Institutional Flow Detection */}
      <div className="min-h-[600px] sm:min-h-[800px] rounded-lg border-2 p-4 sm:p-6 backdrop-blur-[2.5px]" style={{  borderColor: '#2d5a31', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
          <h3 className="text-lg sm:text-2xl font-bold flex items-center gap-2 sm:gap-3" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
            <span className="hidden sm:inline">BIG MOVE DETECTOR</span>
            <span className="sm:hidden">DETECTOR</span>
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-green-800 dark:text-green-500 px-2 sm:px-3 py-1 rounded-full">
              <div className="relative w-3 h-3 flex items-center justify-center">
                <div className="absolute w-3 h-3 bg-green-500/30 rounded-full animate-ping"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <span className="hidden sm:inline">LIVE</span>
              <span className="sm:hidden">LIVE</span>
            </div>
          </div>
        </div>
        
        {suspiciousMovements.length > 0 ? (
          <>

            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-6 max-h-full overflow-y-auto py-4 sm:py-6 px-1 sm:px-2 overflow-x-hidden">
              {suspiciousMovements.map((coin, index) => (
                <TickerCard key={coin.symbol} coin={coin} theme={theme} />
              ))}
            </div>
          </>
        ) : isFirstLoad ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 animate-spin" style={{ color: '#4a7c59' }}>
                <RefreshCwIcon className="h-16 w-16" />
              </div>
            </div>
            <h4 className="text-xl font-bold mb-4" style={{ color: '#ffffff' }}>
              {loadingMessage}
            </h4>
            
            {/* Progress Bar */}
            <div className="w-full max-w-md mx-auto mb-4">
              <div className="rounded-full h-3 overflow-hidden" style={{ backgroundColor: 'rgba(74, 124, 89, 0.2)' }}>
                <div 
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${loadingProgress}%`,
                    background: 'linear-gradient(90deg, #4a7c59 0%, #2d5a31 100%)'
                  }}
                ></div>
              </div>
              <div className="text-sm mt-2" style={{ color: '#4a7c59' }}>
                {loadingProgress}% Complete
              </div>
            </div>
            
            <p className="text-sm" style={{ color: '#4a7c59' }}>
              Analyzing top 200 assets for precursors to large moves.
            </p>
          </div>
        ) : !isFirstLoad && !loading ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🔍</div>
            <h4 className="text-2xl font-bold mb-4" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
              No Signals Found
            </h4>
            <p className="text-lg mb-4" style={{ color: '#4a7c59' }}>
              No assets currently meet the criteria for a high-conviction move.
            </p>
            <div className="rounded-lg p-4 max-w-md mx-auto mb-4" style={{ backgroundColor: 'rgba(74, 124, 89, 0.2)', border: '1px solid rgba(74, 124, 89, 0.3)' }}>
              <p className="text-sm font-medium mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>
                💾 Database Status: Empty
              </p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <span style={{ color: '#4a7c59' }}>
                  ⏰ Next scan: <strong>{countdown}</strong>
                </span>
                <span style={{ color: '#4a7c59' }}>
                  📊 Monitoring: <strong>{openInterestData.length}</strong> assets
                </span>
              </div>
              {dbLastUpdated && (
                <div className="mt-2 text-xs" style={{ color: '#4a7c59' }}>
                  Last DB update: {dbLastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
            <p className="text-xs" style={{ color: '#4a7c59' }}>
              Detection thresholds: &gt;20 total suspicion score (Max 16 coins)
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 animate-spin" style={{ color: '#4a7c59' }}>
                <RefreshCwIcon className="h-16 w-16" />
              </div>
            </div>
            <h4 className="text-xl font-bold mb-4" style={{ color: '#ffffff' }}>
              {loadingMessage}
            </h4>
            
            {/* Progress Bar */}
            <div className="w-full max-w-md mx-auto mb-4">
              <div className="rounded-full h-3 overflow-hidden" style={{ backgroundColor: 'rgba(74, 124, 89, 0.2)' }}>
                <div 
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${loadingProgress}%`,
                    background: 'linear-gradient(90deg, #4a7c59 0%, #2d5a31 100%)'
                  }}
                ></div>
              </div>
              <div className="text-sm mt-2" style={{ color: '#4a7c59' }}>
                {loadingProgress}% Complete
              </div>
            </div>
            
            <p className="text-sm" style={{ color: '#4a7c59' }}>
              Analyzing top 200 assets for precursors to large moves.
            </p>
          </div>
        )}
      </div>

      {/* Live Signals section removed as it's now integrated */}
    </div>
  );
};

export default InstitutionalActivity; 