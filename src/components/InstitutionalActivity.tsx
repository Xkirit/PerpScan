'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { BarChart, Bar, ComposedChart, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card';
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
  };
}

// Priority scoring function for low volume institutional activity detection with directional bias
const calculatePriorityScore = (item: OpenInterestData, lowVolumeThreshold: number, mediumVolumeThreshold: number): number => {
  let score = 0;
  const abnormality = item.abnormalityScore || 0;
  const oiChange = Math.abs(item.oiChangePercent);
  const volumeOiRatio = item.volume24h / item.openInterestValue;
  
  // Volume category bonus (lower volume = higher priority)
  if (item.volume24h < lowVolumeThreshold) {
    score += 50; // High bonus for low volume
  } else if (item.volume24h < mediumVolumeThreshold) {
    score += 25; // Medium bonus for medium volume
  }
  
  // Abnormality score bonus
  score += abnormality * 15;
  
  // OI change bonus
  score += oiChange * 2;
  
  // Low turnover bonus (accumulation signal)
  if (volumeOiRatio < 2) score += 30;
  else if (volumeOiRatio < 3) score += 15;
  
  // Whale bonus
  if (item.whaleRating === 'mega') score += 40;
  else if (item.whaleRating === 'large') score += 25;
  else if (item.whaleRating === 'medium') score += 10;
  
  // Directional bias bonus - smart money moves WITH clear bias
  if (item.longShortRatio) {
    const bias = item.longShortRatio.bias;
    const strength = item.longShortRatio.biasStrength;
    
    // Strong directional bias indicates institutional positioning
    if (strength === 'strong') {
      score += 25; // High bonus for strong directional moves
    } else if (strength === 'moderate') {
      score += 15; // Medium bonus for moderate directional moves
    }
    
    // Additional bonus if OI increase aligns with funding pressure direction
    if (oiChange > 5) {
      if ((bias === 'bullish' && item.fundingRate > 0) || 
          (bias === 'bearish' && item.fundingRate < 0)) {
        score += 20; // Confirmation bonus when directional bias aligns with funding
      }
    }
  }
  
  return score;
};

// Manipulation confidence calculator for edge detectionƒ
// Memoized ticker component to prevent unnecessary re-renders
const TickerCard = memo(({ coin, index }: { coin: OpenInterestData; index: number }) => {
  // Enhanced directional bias determination using long/short ratio
  const hasDirectionalData = coin.longShortRatio;
  const directionalBias = hasDirectionalData ? coin.longShortRatio?.bias : null;
  const biasStrength = hasDirectionalData ? coin.longShortRatio?.biasStrength : null;
  
  // Determine overall sentiment combining OI change and long/short bias
  const oiChange = coin.oiChangePercent;
  const isBullish = directionalBias === 'bullish' || (directionalBias === 'neutral' && oiChange > 0);
  const isBearish = directionalBias === 'bearish' || (directionalBias === 'neutral' && oiChange < 0);
  const isNeutral = directionalBias === 'neutral' && Math.abs(oiChange) < 0.1;
  
  // Enhanced color scheme based on directional bias and sentiment
  const colorScheme = isNeutral ? {
    background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.2) 0%, rgba(107, 114, 128, 0.1) 100%)',
    border: '1px solid rgba(107, 114, 128, 0.3)',
    boxShadow: '0 4px 6px -1px rgba(107, 114, 128, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  } : isBullish ? {
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  } : isBearish ? {
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  } : {
    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(147, 51, 234, 0.1) 100%)',
    border: '1px solid rgba(147, 51, 234, 0.3)',
    boxShadow: '0 4px 6px -1px rgba(147, 51, 234, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  };

  return (
    <CardContainer className="inter-var">
            <CardBody 
        className="relative group/card hover:shadow-2xl rounded-xl p-2 sm:p-3 md:p-4 border cursor-pointer h-full w-full"
        onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${coin.symbol}.P`, '_blank')}
        style={{ 
          background: colorScheme.background,
          border: colorScheme.border,
          boxShadow: colorScheme.boxShadow
        }}
      >
        
        <CardItem translateZ="50" className="relative z-10 w-full">
          <div className="flex items-start justify-between mb-2 sm:mb-4 md:mb-6 w-full">
             <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <CardItem translateZ="60" rotateX={5} rotateY={5}>
                <div className="relative">
                                     <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl border border-white/20 flex items-center justify-center shadow-lg overflow-hidden">
                    <img 
                      src={`https://assets.coincap.io/assets/icons/${coin.symbol.replace('USDT', '').toLowerCase()}@2x.png`}
                      alt={coin.symbol.replace('USDT', '')}
                      className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 object-contain"
                      onError={(e) => {
                        // Fallback to letters if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="font-bold text-sm sm:text-lg text-blue-600 dark:text-blue-400">${coin.symbol.replace('USDT', '').slice(0, 2)}</span>`;
                        }
                      }}
                    />
                  </div>
                </div>
              </CardItem>
              <div>
                <CardItem translateZ="50">
                  <span className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white">
                    {coin.symbol.replace('USDT', '')}
                  </span>
                </CardItem>
                                  <CardItem translateZ="40">
                   <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                     <span className="hidden sm:inline">Detected </span>
                     {new Date(coin.timestamp).toLocaleTimeString()}
                   </div>
                 </CardItem>
              </div>
            </div>
            <CardItem translateZ="60">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <span className={`px-1 sm:px-1.5 py-0.5 text-xs rounded font-medium ${
                  coin.volumeCategory === 'low' ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' :
                  coin.volumeCategory === 'medium' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200' :
                  'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {coin.volumeCategory === 'low' ? 'L' : coin.volumeCategory === 'medium' ? 'M' : 'H'}
                </span>
                <span className={`px-1 sm:px-1.5 py-0.5 text-xs rounded font-medium ${
                  coin.whaleRating === 'mega' ? 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200' :
                  coin.whaleRating === 'large' ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' :
                  coin.whaleRating === 'medium' ? 'bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200' :
                  'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {coin.whaleRating === 'mega' ? 'XL' : coin.whaleRating === 'large' ? 'L' : coin.whaleRating === 'medium' ? 'M' : 'S'}
                </span>
                {(coin.abnormalityScore || 0) > 2.5 && (
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-1 sm:px-1.5 py-0.5 text-xs rounded font-medium animate-pulse">
                    🚀
                  </span>
                )}
              </div>
            </CardItem>
          </div>
          
          {/* Main metrics */}
          <CardItem translateZ="40">
            <div className="space-y-1 sm:space-y-1.5 md:space-y-2 text-xs sm:text-sm mb-1.5 sm:mb-2 md:mb-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">OI Value:</span>
                <span className="font-bold text-sm sm:text-lg">
                  {coin.openInterestValue > 1e9 
                    ? `$${(coin.openInterestValue / 1e9).toFixed(2)}B` 
                    : `$${(coin.openInterestValue / 1e6).toFixed(1)}M`
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">OI Change:</span>
                <span className={`font-bold text-sm sm:text-lg ${
                  Math.abs(coin.oiChangePercent) < 0.1 ? 'text-gray-500 dark:text-gray-400' :
                  coin.oiChangePercent > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(coin.oiChangePercent) < 0.1 ? 'Building...' : 
                   `${coin.oiChangePercent > 0 ? '+' : ''}${coin.oiChangePercent.toFixed(1)}%`}
                </span>
              </div>

            </div>
          </CardItem>
          
          {/* Advanced metrics */}
          <CardItem translateZ="30">
            <div className="grid grid-cols-2 gap-1 sm:gap-1.5 md:gap-2 text-xs sm:text-sm mb-1.5 sm:mb-2">
              <div className="bg-green-100 dark:bg-green-900/20 p-1 sm:p-1.5 md:p-2 rounded-lg">
                <div className="text-green-600 dark:text-green-400 text-[9px] sm:text-[10px] mb-0.5 sm:mb-1">Priority Score</div>
                <div className="font-bold text-xs sm:text-sm text-green-800 dark:text-green-300">
                  {(coin.priorityScore || 0).toFixed(0)}
                </div>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/20 p-1 sm:p-1.5 md:p-2 rounded-lg">
                <div className="text-blue-600 dark:text-blue-400 text-[9px] sm:text-[10px] mb-0.5 sm:mb-1">Volume/OI</div>
                <div className="font-bold text-xs sm:text-sm text-blue-800 dark:text-blue-300">
                  {(coin.volume24h / coin.openInterestValue).toFixed(1)}x
                </div>
              </div>
              <div className="bg-red-100 dark:bg-red-900/20 p-1 sm:p-1.5 md:p-2 rounded-lg">
                <div className="text-red-600 dark:text-red-400 text-[9px] sm:text-[10px] mb-0.5 sm:mb-1">Abnormality</div>
                <div className="font-bold text-xs sm:text-sm text-red-800 dark:text-red-300">
                  {(coin.abnormalityScore || 0).toFixed(1)}
                </div>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/20 p-1 sm:p-1.5 md:p-2 rounded-lg">
                <div className="text-purple-600 dark:text-purple-400 text-[9px] sm:text-[10px] mb-0.5 sm:mb-1">
                  <span className="hidden sm:inline">24h Volume</span>
                  <span className="sm:hidden">Volume</span>
                </div>
                <div className="font-bold text-xs sm:text-sm text-purple-800 dark:text-purple-300">
                  ${(coin.volume24h / 1e6).toFixed(1)}M
                </div>
              </div>
              <div className="bg-green-100 dark:bg-green-900/20 p-1 sm:p-1.5 md:p-2 rounded-lg">
                <div className="text-green-600 dark:text-green-400 text-[9px] sm:text-[10px] mb-0.5 sm:mb-1">Manipulation</div>
                <div className="font-bold text-xs sm:text-sm text-green-800 dark:text-green-300">
                  {(coin.manipulationConfidence || 0).toFixed(0)}%
                </div>
              </div>
              {hasDirectionalData && (
                <div className={`p-1 sm:p-1.5 md:p-2 rounded-lg ${
                  directionalBias === 'bullish' ? 'bg-green-100 dark:bg-green-900/20' :
                  directionalBias === 'bearish' ? 'bg-red-100 dark:bg-red-900/20' :
                  'bg-gray-100 dark:bg-gray-900/20'
                }`}>
                  <div className={`text-[9px] sm:text-[10px] mb-0.5 sm:mb-1 ${
                    directionalBias === 'bullish' ? 'text-green-600 dark:text-green-400' :
                    directionalBias === 'bearish' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    L/S Bias
                  </div>
                  
                  <div className="text-xs sm:text-sm mt-0.5 sm:mt-1 flex items-center gap-1">
                    <span className="text-green-600 font-bold">
                      {coin.longShortRatio ? `${(coin.longShortRatio.buyRatio * 100).toFixed(0)}%` : ''}
                    </span>
                    <span className="text-gray-500">/</span>
                    <span className="text-red-600 font-bold">
                      {coin.longShortRatio ? `${(coin.longShortRatio.sellRatio * 100).toFixed(0)}%` : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardItem>
          
          {/* Time indicator */}
          <CardItem translateZ="20">
            <div className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 text-center">
              <span className="hidden sm:inline">Last seen: </span>
              {new Date(coin.timestamp).toLocaleTimeString()}
            </div>
          </CardItem>
        </CardItem>
      </CardBody>
    </CardContainer>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if key display data changed
  const prev = prevProps.coin;
  const next = nextProps.coin;
  
  // If it's the same symbol, check if display-relevant data changed
  if (prev.symbol !== next.symbol) return false;
  
  // Round values to avoid re-rendering on tiny changes
  const prevPriority = Math.round(prev.priorityScore || 0);
  const nextPriority = Math.round(next.priorityScore || 0);
  const prevOI = Math.round(prev.oiChangePercent * 10) / 10; // 1 decimal place
  const nextOI = Math.round(next.oiChangePercent * 10) / 10;
  const prevValue = Math.round(prev.openInterestValue / 1000000); // Round to millions
  const nextValue = Math.round(next.openInterestValue / 1000000);
  const prevAbnormality = Math.round((prev.abnormalityScore || 0) * 10) / 10;
  const nextAbnormality = Math.round((next.abnormalityScore || 0) * 10) / 10;
  const prevConfidence = Math.round(prev.manipulationConfidence || 0);
  const nextConfidence = Math.round(next.manipulationConfidence || 0);
  
  // Compare long/short ratio data
  const prevLongRatio = prev.longShortRatio ? Math.round(prev.longShortRatio.buyRatio * 100) : null;
  const nextLongRatio = next.longShortRatio ? Math.round(next.longShortRatio.buyRatio * 100) : null;
  const prevBias = prev.longShortRatio?.bias || null;
  const nextBias = next.longShortRatio?.bias || null;
  
  // Only re-render if rounded values actually changed
  return (
    prevPriority === nextPriority &&
    prevOI === nextOI &&
    prevValue === nextValue &&
    prevAbnormality === nextAbnormality &&
    prevConfidence === nextConfidence &&
    prev.whaleRating === next.whaleRating &&
    prev.volumeCategory === next.volumeCategory &&
    prevLongRatio === nextLongRatio &&
    prevBias === nextBias
  );
});

TickerCard.displayName = 'TickerCard';

const calculateManipulationConfidence = (item: OpenInterestData): number => {
  let confidence = 0;
  const abnormality = item.abnormalityScore || 0;
  const oiChange = Math.abs(item.oiChangePercent);
  const volumeOiRatio = item.volume24h / item.openInterestValue;
  
  // Statistical anomaly confidence
  if (abnormality > 3) confidence += 40;
  else if (abnormality > 2) confidence += 25;
  else if (abnormality > 1.5) confidence += 15;
  
  // OI movement confidence
  if (oiChange > 20) confidence += 30;
  else if (oiChange > 15) confidence += 20;
  else if (oiChange > 10) confidence += 10;
  
  // Low turnover manipulation signal
  if (volumeOiRatio < 1.5) confidence += 25;
  else if (volumeOiRatio < 2) confidence += 15;
  
  // Whale activity confidence
  if (item.whaleRating === 'mega') confidence += 20;
  else if (item.whaleRating === 'large') confidence += 15;
  
  // Directional bias manipulation indicators
  if (item.longShortRatio) {
    const bias = item.longShortRatio.bias;
    const strength = item.longShortRatio.biasStrength;
    
    // Strong directional bias with large OI moves suggests coordinated activity
    if (strength === 'strong' && oiChange > 10) {
      confidence += 20; // High confidence for strong bias + large OI moves
    } else if (strength === 'moderate' && oiChange > 15) {
      confidence += 15; // Medium confidence for moderate bias + very large OI moves
    }
    
    // Extreme long/short ratio imbalance indicates potential manipulation
    const extremeRatio = Math.max(item.longShortRatio.buyRatio, item.longShortRatio.sellRatio);
    if (extremeRatio > 0.7) {
      confidence += 15; // Very skewed positioning suggests institutional coordination
    } else if (extremeRatio > 0.6) {
      confidence += 10; // Moderately skewed positioning
    }
  }
  
  return Math.min(99, confidence);
};

// Smart database replacement logic - only replace when truly warranted
const shouldReplaceDbCoins = (currentDbCoins: OpenInterestData[], newCoins: OpenInterestData[]): {
  shouldReplace: boolean;
  coinsToReplace: OpenInterestData[];
  minDbPriority: number;
  maxNewPriority: number;
} => {  
  if (currentDbCoins.length < 10) {
    return {
      shouldReplace: true,
      coinsToReplace: newCoins,
      minDbPriority: 0,
      maxNewPriority: Math.max(...newCoins.map(c => c.priorityScore || 0))
    };
  }
  
  const minDbPriority = Math.min(...currentDbCoins.map(coin => coin.priorityScore || 0));
  const maxNewPriority = Math.max(...newCoins.map(c => c.priorityScore || 0));
  const coinsToReplace = newCoins.filter(newCoin => (newCoin.priorityScore || 0) > minDbPriority);
  
  return {
    shouldReplace: coinsToReplace.length > 0,
    coinsToReplace,
    minDbPriority,
    maxNewPriority
  };
};

const InstitutionalActivity: React.FC = () => {
  const [openInterestData, setOpenInterestData] = useState<OpenInterestData[]>([]);
  const [institutionalSignals, setInstitutionalSignals] = useState<InstitutionalSignal[]>([]);
  const [whaleSignals, setWhaleSignals] = useState<InstitutionalSignal[]>([]);
  const [squeezeSignals, setSqueezeSignals] = useState<InstitutionalSignal[]>([]);
  const [anomalySignals, setAnomalySignals] = useState<InstitutionalSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [historicalOIData, setHistoricalOIData] = useState<Map<string, number[]>>(new Map());
  const [suspiciousMovements, setSuspiciousMovements] = useState<OpenInterestData[]>([]);
  const [countdown, setCountdown] = useState<string>('Soon');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [dbLastUpdated, setDbLastUpdated] = useState<Date | null>(null);

  // Fetch long/short ratio data for directional bias analysis
  const getLongShortRatio = async (symbol: string, priority: 'high' | 'medium' | 'low'): Promise<{
    buyRatio: number;
    sellRatio: number;
    bias: 'bullish' | 'bearish' | 'neutral';
    biasStrength: 'weak' | 'moderate' | 'strong';
    timestamp: number;
  } | null> => {
    // Skip API calls for low priority coins to reduce requests
    if (priority === 'low') {
      return null;
    }
    
    try {
      // Get current timestamp for recent data
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000); // 1 hour ago
      
      // Shorter timeout for stability
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const response = await fetch(
        `https://api.bybit.com/v5/market/account-ratio?category=linear&symbol=${symbol}&period=1h&limit=1&startTime=${oneHourAgo}&endTime=${now}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return null; // Silent fallback
      }
      
      const data = await response.json();
      if (data.retCode !== 0 || !data.result?.list?.length) {
        return null;
      }
      
      const latestData = data.result.list[0];
      const buyRatio = parseFloat(latestData.buyRatio);
      const sellRatio = parseFloat(latestData.sellRatio);
      
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
        timestamp: parseInt(latestData.timestamp)
      };
      
    } catch (error) {
      return null; // Silent fallback for stability
    }
  };

  // Optimized 24h OI change calculation with reduced API calls
  const get24hOIChange = async (symbol: string, currentOI: number, priority: 'high' | 'medium' | 'low'): Promise<number> => {
    // Skip API calls for low priority coins to reduce requests
    if (priority === 'low') {
      return 0;
    }
    
    try {
      const now = Date.now();
      const yesterday = now - (24 * 60 * 60 * 1000);
      
      // Shorter timeout for stability
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const response = await fetch(
        `/api/bybit-oi-history?symbol=${symbol}&startTime=${yesterday}&endTime=${now}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return 0; // Silent fallback
      }
      
      const data = await response.json();
      if (data.message || !data.result?.list?.length) {
        return 0;
      }
      
      const oldestOI = parseFloat(data.result.list[data.result.list.length - 1].openInterest);
      
      if (oldestOI > 0) {
        const change = ((currentOI - oldestOI) / oldestOI) * 100;
        return change;
      }
      
      return 0;
    } catch (error) {
      return 0; // Silent fallback for stability
    }
  };

  // Load institutional flows from Edge Config Store with improved data freshness
  const loadInstitutionalFlows = useCallback(async (): Promise<void> => {
    try {
      // Add timestamp to prevent caching issues
      const timestamp = Date.now();
      const response = await fetch(`/api/institutional-flows?t=${timestamp}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.flows) {
          // Always update data to ensure freshness, but optimize re-renders
          const newFlows = data.flows as OpenInterestData[];
          
          // Update flows with fresh data and current timestamp
          const freshFlows = newFlows.map(flow => ({
            ...flow,
            timestamp: timestamp // Ensure fresh timestamp
          }));
          
          setSuspiciousMovements(freshFlows);
          console.log(`📊 Refreshed ${freshFlows.length} institutional flows from Edge Config Store`);
          
          if (data.lastUpdated) {
            setDbLastUpdated(new Date(data.lastUpdated));
            console.log(`🕒 Database last updated: ${new Date(data.lastUpdated).toLocaleTimeString()}`);
          }
        }
      } else {
        console.warn('Failed to load institutional flows:', response.status);
      }
    } catch (error) {
      console.error('Error loading institutional flows from Edge Config Store:', error);
    }
  }, []); // Remove dependency to prevent unnecessary re-renders

  // Save institutional flows to Edge Config Store with enhanced metadata
  const saveInstitutionalFlows = useCallback(async (flows: OpenInterestData[], replaceMode: boolean = false): Promise<void> => {
    try {
      const response = await fetch('/api/institutional-flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          flows,
          replaceMode, // Whether to use strict priority-based replacement
          maxFlows: 10, // Enforce 10 coin limit
          currentDbSize: suspiciousMovements.length // Current database size for context
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log(`💾 Saved ${data.totalFlows} flows to Edge Config Store (${data.addedCount} new, ${data.updatedCount} updated, ${data.removedCount} removed)`);
          if (data.priorityReplacement) {
            console.log(`🎯 Priority-based replacement active: Maintaining top ${data.maxFlows} highest priority flows`);
          }
          if (data.protectedCoins && data.protectedCoins.length > 0) {
            console.log(`🛡️ Protected coins (higher priority): ${data.protectedCoins.join(', ')}`);
          }
          setDbLastUpdated(new Date(data.lastUpdated));
        }
      }
    } catch (error) {
      console.error('Error saving institutional flows to Edge Config Store:', error);
    }
  }, [suspiciousMovements.length]);

  // Enhanced OI tracking with real 24h historical data from Bybit API
  const fetchOpenInterestData = useCallback(async (): Promise<void> => {
    // Show loading UI for both first load and manual refresh
    setLoading(true);
    if (isFirstLoad) {
      setLoadingProgress(0);
      setLoadingMessage('Fetching market data...');
    } else {
      setLoadingMessage('Refreshing institutional flows...');
    }
    try {
      console.log('🔍 Scanning Bybit futures for institutional flows...');
      
      // Get ALL tickers data (includes OI, funding, volume)
      const tickersResponse = await fetch('https://api.bybit.com/v5/market/tickers?category=linear', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache',
      });

      if (!tickersResponse.ok) {
        throw new Error('Failed to fetch tickers data');
      }

      if (isFirstLoad) {
        setLoadingProgress(20);
        setLoadingMessage('Processing market data...');
      }

      const tickersData = await tickersResponse.json();
      if (tickersData.retCode !== 0) {
        throw new Error(tickersData.retMsg);
      }

      // Filter to top volume USDT pairs - optimized for faster loading
      const topUsdtTickers = tickersData.result.list
        .filter((ticker: any) => ticker.symbol.endsWith('USDT') && parseFloat(ticker.openInterestValue || '0') > 1000000) // >$1M OI (raised threshold for speed)
        .sort((a: any, b: any) => parseFloat(b.openInterestValue) - parseFloat(a.openInterestValue))
        .slice(0, 200); // Top 200 by OI value for broader monitoring

    
      if (isFirstLoad) {
        setLoadingProgress(40);
        setLoadingMessage(`Analyzing ${topUsdtTickers.length} institutional flows...`);
      }
      
      // Process tickers with optimized batch processing - reduced concurrency
      console.log(`⚡ Processing ${topUsdtTickers.length} tickers with stable batch loading...`);
      
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
             let realOIChange = 0;
             let longShortData = null;
             const priority = index < 20 ? 'high' : index < 100 ? 'medium' : 'low';
             
             // Fetch both OI change and long/short ratio for top coins
             if (index < 50) { // Only top 50 coins get real API data
               [realOIChange, longShortData] = await Promise.all([
                 get24hOIChange(symbol, currentOI, priority),
                 getLongShortRatio(symbol, priority)
               ]);
             }
             
             // For all coins: Use local historical data as primary source (much faster)
             if (realOIChange === 0 && historical.length > 0) {
               const previousOI = historical[historical.length - 1];
               if (previousOI > 0) {
                 realOIChange = ((currentOI - previousOI) / previousOI) * 100;
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
               oiChange24h: realOIChange, // Real 24h change from Bybit API
               oiChangePercent: realOIChange, // Use real 24h change
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
               longShortRatio: longShortData
             };
           })
         );
         
         allUsdtTickers.push(...batchResults);
         
         // Small delay between batches to prevent overwhelming the server
         if (i + batchSize < topUsdtTickers.length) {
           await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
         }
       }

      if (isFirstLoad) {
        setLoadingProgress(70);
        setLoadingMessage('Detecting smart money patterns...');
      }
      
      // Update historical data map
      setHistoricalOIData(new Map(historicalOIData));
      
      // Sort by OI value and abnormality
      const sortedByValue = [...allUsdtTickers].sort((a, b) => b.openInterestValue - a.openInterestValue);
      
      // 🎯 FOCUS ON LOW VOLUME + INSTITUTIONAL ACTIVITY (Quality over Quantity)
      const now = Date.now();
      
      // Calculate volume percentiles to identify low volume coins
      const volumes = allUsdtTickers.map((t: OpenInterestData) => t.volume24h).sort((a: number, b: number) => a - b);
      const lowVolumeThreshold = volumes[Math.floor(volumes.length * 0.4)]; // Bottom 40% volume
      const mediumVolumeThreshold = volumes[Math.floor(volumes.length * 0.7)]; // Bottom 70% volume
      
      const currentSuspicious = [...allUsdtTickers]
        .filter(item => {
          const isLowVolume = item.volume24h < lowVolumeThreshold;
          const isMediumVolume = item.volume24h < mediumVolumeThreshold;
          const abnormality = item.abnormalityScore || 0;
          const oiChange = Math.abs(item.oiChangePercent);
          const volumeOiRatio = item.volume24h / item.openInterestValue;
          
          // 🚨 CRITICAL: Only show coins with ACTUAL OI movement (not building data)
          const hasRealOIData = oiChange >= 0.1; // Must have meaningful OI change data
          
          if (!hasRealOIData) {
            return false; // Skip coins still building historical data
          }
          
          // 🔥 TEMPORARY DEBUG: Lower thresholds to see if any coins get detected
          console.log(`🔍 Checking ${item.symbol}: OI change ${oiChange.toFixed(2)}%, abnormality ${abnormality.toFixed(2)}, whale ${item.whaleRating}, volume category ${item.volumeCategory}`);
          
          // 🎯 HIGH PRIORITY: Dramatic OI changes (the main focus)
          if (oiChange > 10) { // Lowered from 15 to 10
            console.log(`✅ ${item.symbol} qualifies: Dramatic OI change (${oiChange.toFixed(2)}%)`);
            return true;
          }
          
          // 🔥 MEDIUM-HIGH PRIORITY: Significant OI changes with supporting signals
          if (oiChange > 5 && ( // Lowered from 8 to 5
            abnormality > 0.5 || // Lowered from 1.0 to 0.5
            volumeOiRatio < 3 || // Increased from 2 to 3
            (item.whaleRating === 'mega' || item.whaleRating === 'large') // Whale activity
          )) {
            console.log(`✅ ${item.symbol} qualifies: Significant OI change with supporting signals`);
            return true;
          }
          
          // 🎯 MEDIUM PRIORITY: Moderate OI changes in low volume (institutional stealth)
          if (isLowVolume && oiChange > 3 && ( // Lowered from 5 to 3
            abnormality > 0.5 || // Lowered from 0.8 to 0.5
            volumeOiRatio < 4 // Increased from 3 to 4
          )) {
            console.log(`✅ ${item.symbol} qualifies: Low volume stealth accumulation`);
            return true;
          }
          
          // 🐋 WHALE PRIORITY: Large whales with any meaningful OI movement
          if ((item.whaleRating === 'mega' || item.whaleRating === 'large') && oiChange > 2) { // Lowered from 3 to 2
            console.log(`✅ ${item.symbol} qualifies: Whale activity`);
            return true;
          }
          
          // 📊 STATISTICAL PRIORITY: Extreme statistical anomalies even with smaller OI changes
          if (abnormality > 1.5 && oiChange > 1) { // Lowered thresholds
            console.log(`✅ ${item.symbol} qualifies: Statistical anomaly`);
            return true;
          }
          
          return false;
        })
                 .map(item => ({
           ...item,
           // Add priority scoring for better sorting
           priorityScore: calculatePriorityScore(item, lowVolumeThreshold, mediumVolumeThreshold),
           volumeCategory: item.volume24h < lowVolumeThreshold ? 'low' as const : 
                          item.volume24h < mediumVolumeThreshold ? 'medium' as const : 'high' as const
         }));
      
            // 🎯 SMART TRACKER: Update every 10 seconds to match scan frequency
      const lastEdgeUpdate = localStorage.getItem('lastEdgeDetectorUpdate');
      const shouldUpdateEdgeDetector = !lastEdgeUpdate || (now - parseInt(lastEdgeUpdate)) > 10 * 1000; // Match scan frequency
      
      if (shouldUpdateEdgeDetector) {
        console.log('🎯 UPDATING SMART TRACKER - Finding top 10 highest priority coins...');
        
        // Get all coins that meet threshold criteria
        const qualifyingCoins = currentSuspicious
          .filter(item => {
            // STRICT CRITERIA for institutional detection - MUST have real OI movement
            const abnormality = item.abnormalityScore || 0;
            const oiChange = Math.abs(item.oiChangePercent);
            const volumeOiRatio = item.volume24h / item.openInterestValue;
            const priorityScore = item.priorityScore || 0;
            
            // Must have actual OI change data (not building)
            if (oiChange < 0.1) return false;
            
            // Include coins with significant institutional activity
            return (
              oiChange > 5 || // Significant OI movement
              (abnormality > 1.0 && oiChange > 3) || // Statistical anomaly + moderate OI movement
              (volumeOiRatio < 3.0 && oiChange > 2) || // Low turnover + moderate OI movement
              (priorityScore > 50 && oiChange > 2) || // High priority + any meaningful OI movement
              (item.whaleRating === 'mega' && oiChange > 2) || // Mega whale activity
              (item.whaleRating === 'large' && oiChange > 3) || // Large whale activity
              (item.whaleRating === 'medium' && oiChange > 5) // Medium whale activity
            );
          })
          .map(item => ({
            ...item,
            timestamp: now,
            manipulationConfidence: calculateManipulationConfidence(item)
          }))
          .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)); // Sort by priority score descending
        
        // 🎯 SMART PRIORITY-BASED EDGE CONFIG STORE LOGIC
        console.log(`🎯 Processing ${qualifyingCoins.length} qualifying coins for Edge Config Store...`);
        
                if (qualifyingCoins.length > 0) {
           // Get current database coins to implement smart replacement logic
           const currentDbCoins = suspiciousMovements;
           const replacementAnalysis = shouldReplaceDbCoins(currentDbCoins, qualifyingCoins);
           
           if (replacementAnalysis.shouldReplace) {
             const isAtLimit = currentDbCoins.length >= 10;
             await saveInstitutionalFlows(qualifyingCoins, isAtLimit);
             
             if (isAtLimit) {
               console.log(`🔄 Smart replacement: ${replacementAnalysis.coinsToReplace.length} coins qualify to replace lower priority coins`);
               console.log(`📊 Priority comparison: Min DB: ${replacementAnalysis.minDbPriority.toFixed(0)}, Max New: ${replacementAnalysis.maxNewPriority.toFixed(0)}`);
               console.log(`🎯 Replacement candidates: ${replacementAnalysis.coinsToReplace.map(c => `${c.symbol}(${(c.priorityScore || 0).toFixed(0)})`).join(', ')}`);
               
               // Show which coins are being protected
               const protectedCoins = currentDbCoins
                 .filter(coin => (coin.priorityScore || 0) >= replacementAnalysis.maxNewPriority)
                 .map(coin => `${coin.symbol}(${(coin.priorityScore || 0).toFixed(0)})`);
               if (protectedCoins.length > 0) {
                 console.log(`🛡️ Protected coins (higher priority): ${protectedCoins.join(', ')}`);
               }
             } else {
               console.log(`📈 Database has space: Added ${qualifyingCoins.length} qualifying flows to Edge Config Store`);
             }
           } else {
             console.log(`✋ No replacement warranted: All current DB coins have higher priority than new candidates`);
             console.log(`📊 Priority gap: Min DB: ${replacementAnalysis.minDbPriority.toFixed(0)}, Max New: ${replacementAnalysis.maxNewPriority.toFixed(0)}`);
           }
        } else {
          console.log('📊 No coins currently match institutional criteria - maintaining existing flows in Edge Config Store');
        }
        
        localStorage.setItem('lastEdgeDetectorUpdate', now.toString());
              } else {
          console.log('🚀 Smart Money Tracker: Waiting for next 10-second update cycle...');
        }
      
      setOpenInterestData(sortedByValue.slice(0, 200)); // Increased to 200 for broader monitoring
      
      // 🎯 EDGE CONFIG STORE FRONTEND UPDATE - Load latest data from store after database update
      if (shouldUpdateEdgeDetector) {
        // Wait a moment for database update to complete, then load fresh data
        setTimeout(async () => {
          await loadInstitutionalFlows();
        }, 500); // 500ms delay to ensure database update is complete
      } else {
        // Regular refresh without waiting
        await loadInstitutionalFlows();
      }
      
      console.log(`📊 Processed ${allUsdtTickers.length} USDT tickers`);
      
      // Count how many coins have meaningful OI change data
      const coinsWithOIData = allUsdtTickers.filter((t: OpenInterestData) => Math.abs(t.oiChangePercent) >= 0.1).length;
      const coinsWithDramaticChanges = allUsdtTickers.filter((t: OpenInterestData) => Math.abs(t.oiChangePercent) > 10).length;
      const coinsWithExtremeChanges = allUsdtTickers.filter((t: OpenInterestData) => Math.abs(t.oiChangePercent) > 20).length;
      
      console.log(`📊 Real 24h OI Data: ${coinsWithOIData}/${allUsdtTickers.length} coins have meaningful 24h OI changes (${((coinsWithOIData/allUsdtTickers.length)*100).toFixed(1)}%)`);
      console.log(`🎯 Dramatic 24h OI Changes: ${coinsWithDramaticChanges} coins >10%, ${coinsWithExtremeChanges} coins >20%`);
      console.log(`🔍 Found ${currentSuspicious.length} coins with significant 24h OI movements from TOP 200 assets`);
      console.log(`🚀 Smart Money Tracker: Edge Config Store will maintain top 10 highest priority flows`);
      
      if (isFirstLoad) {
        setLoadingProgress(90);
        setLoadingMessage('Generating institutional signals...');
      }
      
      // Enhanced institutional signal detection - run on every scan for real-time signals
      setSignalsLoading(true);
      detectAdvancedInstitutionalActivity(allUsdtTickers);
      setSignalsLoading(false);
      
      if (isFirstLoad) {
        setLoadingProgress(100);
        setLoadingMessage('Scan complete!');
      }
      
      const scanCompleteTime = new Date();
      setLastUpdated(scanCompleteTime);
      console.log(`✅ Smart Money Tracker scan completed at ${scanCompleteTime.toLocaleTimeString()}`);
      console.log(`📊 Next scan scheduled in 10 seconds at ${new Date(scanCompleteTime.getTime() + 10 * 1000).toLocaleTimeString()}`);

      // Mark first load as complete
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }

    } catch (error) {
      console.error('❌ Error in advanced OI scanning:', error);
    } finally {
      // Always hide loading after operation completes
      setLoading(false);
    }
  }, [historicalOIData, isFirstLoad, saveInstitutionalFlows, loadInstitutionalFlows]);

  // 🚀 ADVANCED INSTITUTIONAL EDGE DETECTION - Spots moves before they're obvious
  const detectAdvancedInstitutionalActivity = useCallback((oiData: OpenInterestData[]) => {
    const whaleSignals: InstitutionalSignal[] = [];
    const squeezeSignals: InstitutionalSignal[] = [];
    const anomalySignals: InstitutionalSignal[] = [];
    const now = Date.now();
    
    console.log('🔬 Running advanced institutional detection algorithms...');

    oiData.forEach((coin) => {
      const abnormality = coin.abnormalityScore || 0;
      const oiChange = coin.oiChangePercent;
      const oiVelocity = coin.oiVelocity || 0;
      const oiAcceleration = coin.oiAcceleration || 0;
      
      // 1. 🎯 STATISTICAL ANOMALY DETECTION (More stable with higher thresholds)
      if (abnormality > 1.5 && coin.openInterestValue > 5000000) { // Higher threshold for stability, minimum OI value
        anomalySignals.push({
          symbol: coin.symbol,
          type: 'oi_spike',
          severity: abnormality > 4.0 ? 'critical' : abnormality > 2.5 ? 'high' : 'medium',
          message: `Statistical OI anomaly: ${abnormality.toFixed(1)}σ deviation (${coin.whaleRating?.toUpperCase()})`,
          value: abnormality,
          timestamp: now,
          confidence: Math.min(95, 60 + abnormality * 6) // More conservative confidence
        });
      }
      
      // 2. 🚀 VELOCITY & ACCELERATION DETECTION (Early whale entry detection)
      if (Math.abs(oiVelocity) > coin.openInterest * 0.05 && coin.openInterestValue > 1000000) { // Lowered thresholds
        anomalySignals.push({
          symbol: coin.symbol,
          type: 'oi_spike',
          severity: Math.abs(oiVelocity) > coin.openInterest * 0.2 ? 'critical' : 'high',
          message: `Rapid OI buildup: ${oiVelocity > 0 ? '+' : ''}${((oiVelocity/coin.openInterest)*100).toFixed(1)}% velocity`,
          value: (oiVelocity/coin.openInterest)*100,
          timestamp: now,
          confidence: Math.min(92, 60 + Math.abs(oiVelocity/coin.openInterest)*200)
        });
      }
      
      // 3. 🎢 ACCELERATION PATTERNS (Institutional momentum detection)
      if (Math.abs(oiAcceleration) > coin.openInterest * 0.02 && coin.openInterestValue > 5000000) { // Lowered thresholds
        anomalySignals.push({
          symbol: coin.symbol,
          type: 'oi_spike',
          severity: Math.abs(oiAcceleration) > coin.openInterest * 0.1 ? 'high' : 'medium',
          message: `OI acceleration: ${oiAcceleration > 0 ? 'Accelerating' : 'Decelerating'} institutional flow`,
          value: (oiAcceleration/coin.openInterest)*100,
          timestamp: now,
          confidence: Math.min(88, 50 + Math.abs(oiAcceleration/coin.openInterest)*150)
        });
      }

      // 4. 🔥 DIRECTIONAL BIAS DETECTION (Smart money positioning)
      if (coin.longShortRatio) {
        const { bias, biasStrength, buyRatio, sellRatio } = coin.longShortRatio;
        const extremeRatio = Math.max(buyRatio, sellRatio);
        
        // Strong directional bias with significant OI changes
        if (biasStrength === 'strong' && oiChange > 5) {
          anomalySignals.push({
            symbol: coin.symbol,
            type: 'oi_spike',
            severity: extremeRatio > 0.7 ? 'critical' : 'high',
            message: `Strong ${bias} bias: ${(extremeRatio * 100).toFixed(0)}% positioning with ${oiChange.toFixed(1)}% OI change`,
            value: extremeRatio,
            timestamp: now,
            confidence: Math.min(96, 70 + (extremeRatio - 0.5) * 100)
          });
        }
        
        // Divergence between directional bias and funding rate (manipulation signal)
        if (biasStrength !== 'weak' && Math.abs(coin.fundingRate) > 0.0001) {
          const fundingBullish = coin.fundingRate > 0;
          const biasBullish = bias === 'bullish';
          
          if (fundingBullish !== biasBullish && oiChange > 3) {
            anomalySignals.push({
              symbol: coin.symbol,
              type: 'oi_divergence',
              severity: 'high',
              message: `Bias/Funding divergence: ${bias} bias vs ${fundingBullish ? 'long' : 'short'} funding pressure`,
              value: Math.abs(coin.fundingRate * 10000),
              timestamp: now,
              confidence: Math.min(92, 60 + extremeRatio * 40)
            });
          }
        }
      }
      
      // 5. 🔥 STEALTH ACCUMULATION (OI growing faster than price)
      const oiPriceDivergence = Math.abs(oiChange - coin.priceChange24h);
      if (oiChange > 2 && coin.priceChange24h < 5 && oiPriceDivergence > 3) { // Lowered thresholds
        anomalySignals.push({
          symbol: coin.symbol,
          type: 'oi_divergence',
          severity: oiPriceDivergence > 15 ? 'critical' : 'high',
          message: `Stealth accumulation: OI +${oiChange.toFixed(1)}% while price only +${coin.priceChange24h.toFixed(1)}%`,
          value: oiPriceDivergence,
          timestamp: now,
          confidence: Math.min(95, 65 + oiPriceDivergence * 2)
        });
      }
      
      // 5. 🐋 MEGA WHALE DETECTION (Extreme OI concentrations)
      if (coin.whaleRating === 'mega' || coin.whaleRating === 'large' || coin.openInterestValue > 10000000) { // Lowered threshold for better detection
        whaleSignals.push({
          symbol: coin.symbol,
          type: 'large_liquidation',
          severity: 'critical',
          message: `$${(coin.openInterestValue / 1e9).toFixed(2)}B open interest`,
          value: coin.openInterestValue / 1e9,
          timestamp: now,
          confidence: 99
        });
      }
      
      // 6. ⚡ FUNDING RATE PRESSURE COOKER
      const fundingExtreme = Math.abs(coin.fundingRate * 100);
      if (fundingExtreme > 0.01) { // >0.01% is pressure (lowered threshold for better detection)
        squeezeSignals.push({
          symbol: coin.symbol,
          type: 'funding_anomaly',
          severity: fundingExtreme > 0.15 ? 'critical' : 'high',
          message: `${(coin.fundingRate * 100).toFixed(3)}% (${coin.fundingRate > 0 ? 'Shorts squeezed' : 'Longs squeezed'})`,
          value: fundingExtreme,
          timestamp: now,
          confidence: Math.min(94, 55 + fundingExtreme * 200)
        });
      }
      
      // 7. 💨 VOLUME-OI EXPLOSION (Smart money moving fast)
      const volumeOiRatio = coin.volume24h / coin.openInterestValue;
      if (volumeOiRatio > 5 && coin.openInterestValue > 1000000) { // Lowered thresholds for better detection
        anomalySignals.push({
          symbol: coin.symbol,
          type: 'volume_oi_surge',
          severity: volumeOiRatio > 15 ? 'critical' : volumeOiRatio > 12 ? 'high' : 'medium',
          message: `Volume explosion: ${volumeOiRatio.toFixed(1)}x OI turnover (Smart money active)`,
          value: volumeOiRatio,
          timestamp: now,
          confidence: Math.min(89, 40 + volumeOiRatio * 4)
        });
      }
    });

    // 🧠 ADVANCED SORTING: Prioritize by confidence, severity, and whale size
    const sortSignals = (signals: InstitutionalSignal[]) => signals.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      
      const confidenceDiff = b.confidence - a.confidence;
      if (confidenceDiff !== 0) return confidenceDiff;
      
      // Prioritize larger OI values as tie-breaker
      const aOI = oiData.find(d => d.symbol === a.symbol)?.openInterestValue || 0;
      const bOI = oiData.find(d => d.symbol === b.symbol)?.openInterestValue || 0;
      return bOI - aOI;
    });

    const sortedWhaleSignals = sortSignals(whaleSignals).slice(0, 10);
    const sortedSqueezeSignals = sortSignals(squeezeSignals).slice(0, 10);
    const sortedAnomalySignals = sortSignals(anomalySignals).slice(0, 10);
    const allSignals = [...sortedWhaleSignals, ...sortedSqueezeSignals, ...sortedAnomalySignals];

    setWhaleSignals(sortedWhaleSignals);
    setSqueezeSignals(sortedSqueezeSignals);
    setAnomalySignals(sortedAnomalySignals);
    setInstitutionalSignals(allSignals.slice(0, 25)); // Top 25 high-confidence signals
    
    console.log(`🎯 Detected ${allSignals.length} institutional signals (${allSignals.filter(s => s.severity === 'critical').length} critical)`);
    console.log(`🐋 Whale: ${sortedWhaleSignals.length}, ⚡ Squeeze: ${sortedSqueezeSignals.length}, 📊 Anomaly: ${sortedAnomalySignals.length}`);
  }, []);

  // Initial load from Edge Config Store and then fetch new data
  useEffect(() => {
    console.log('🚀 Starting Smart Money Tracker - loading from Edge Config Store first...');
    
    // Load existing data from Edge Config Store immediately
    loadInstitutionalFlows().then(() => {
      console.log('📊 Database coins loaded, starting fresh scan...');
      // Then start fresh scan
      fetchOpenInterestData();
    });
  }, []);  // Remove dependencies to prevent re-initialization loops

  // Auto-refresh institutional data every 10 seconds - continuous scanning
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const scheduleNextScan = () => {
      timeoutId = setTimeout(() => {
        console.log('🔄 Starting scheduled 10-second Smart Money Tracker rescan...');
        fetchOpenInterestData().then(() => {
          scheduleNextScan(); // Schedule next scan after this one completes
        });
      }, 10 * 1000); // 10 seconds
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
      
      const nextUpdate = new Date(lastUpdated.getTime() + 10 * 1000);
      const now = new Date();
      
      if (nextUpdate <= now) {
        setCountdown('Now');
        return;
      }
      
      const timeDiff = nextUpdate.getTime() - now.getTime();
      const seconds = Math.floor(timeDiff / 1000);
      
      setCountdown(`${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Enhanced signal sentiment detection using directional bias
  const getSignalSentiment = (signal: InstitutionalSignal): 'bullish' | 'bearish' | 'neutral' => {
    // Extract directional bias from message if available
    if (signal.message.includes('bullish bias')) {
      return 'bullish';
    }
    if (signal.message.includes('bearish bias')) {
      return 'bearish';
    }
    
    // Whale activity - generally bullish when accumulating
    if (signal.type === 'large_liquidation') {
      return 'bullish'; // Large OI usually indicates accumulation
    }
    
    // Funding rate analysis
    if (signal.type === 'funding_anomaly') {
      // Extract funding rate from message to determine direction
      if (signal.message.includes('Shorts squeezed')) {
        return 'bullish'; // Shorts being squeezed = bullish
      } else if (signal.message.includes('Longs squeezed')) {
        return 'bearish'; // Longs being squeezed = bearish
      }
    }
    
    // OI and volume analysis with directional bias consideration
    if (signal.type === 'oi_spike' || signal.type === 'volume_oi_surge') {
      // Check for directional bias indicators in message
      if (signal.message.includes('Strong bullish') || signal.message.includes('bullish bias')) {
        return 'bullish';
      }
      if (signal.message.includes('Strong bearish') || signal.message.includes('bearish bias')) {
        return 'bearish';
      }
      
      // Check if it's accumulation (stealth) or aggressive buying
      if (signal.message.includes('Stealth accumulation') || 
          signal.message.includes('Rapid OI buildup') ||
          signal.message.includes('Volume explosion')) {
        return 'bullish'; // Accumulation patterns are generally bullish
      }
      if (signal.message.includes('Decelerating')) {
        return 'bearish'; // Decelerating flow could be bearish
      }
      return 'bullish'; // Default OI increases to bullish
    }
    
    // Divergence analysis with bias consideration
    if (signal.type === 'oi_divergence') {
      // Check for bias/funding divergence
      if (signal.message.includes('Bias/Funding divergence')) {
        if (signal.message.includes('bullish bias')) {
          return 'bullish'; // Bullish bias despite contrary funding
        }
        if (signal.message.includes('bearish bias')) {
          return 'bearish'; // Bearish bias despite contrary funding
        }
      }
      return 'bullish'; // Default OI growing faster than price = accumulation = bullish
    }
    
    return 'neutral';
  };

  const getSentimentColors = (sentiment: 'bullish' | 'bearish' | 'neutral', baseColor: string) => {
    if (sentiment === 'bullish') {
      return {
        bg: 'bg-green-50 dark:bg-green-900/10',
        border: 'border-green-500',
        text: 'text-green-900 dark:text-green-300',
        badge: 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
      };
    } else if (sentiment === 'bearish') {
      return {
        bg: 'bg-red-50 dark:bg-red-900/10',
        border: 'border-red-500',
        text: 'text-red-900 dark:text-red-300',
        badge: 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
      };
    } else {
      // Neutral - use base color
      const colorMap: { [key: string]: any } = {
        purple: {
          bg: 'bg-purple-50 dark:bg-purple-900/10',
          border: 'border-purple-500',
          text: 'text-purple-900 dark:text-purple-300',
          badge: 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200'
        },
        orange: {
          bg: 'bg-orange-50 dark:bg-orange-900/10',
          border: 'border-orange-500',
          text: 'text-orange-900 dark:text-orange-300',
          badge: 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200'
        },
        blue: {
          bg: 'bg-blue-50 dark:bg-blue-900/10',
          border: 'border-blue-500',
          text: 'text-blue-900 dark:text-blue-300',
          badge: 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
        }
      };
      return colorMap[baseColor] || colorMap.blue;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: '#ffffff' }}>
          <AlertCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#4a7c59' }} />
          <span className="hidden sm:inline">Institutional Activity Detection</span>
          <span className="sm:hidden">Institutional Activity</span>
        </h2>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
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
          <div className="text-xs sm:text-sm font-medium truncate" style={{ color: '#ffffff' }}>
            <span className="hidden sm:inline">Institutional Inflows</span>
            <span className="sm:hidden">Inflows</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: '#ffffff' }}>
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
          <div className="text-xs sm:text-sm font-medium truncate" style={{ color: '#ffffff' }}>
            <span className="hidden sm:inline">High Priority Alerts</span>
            <span className="sm:hidden">Alerts</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: '#ffffff' }}>
            {suspiciousMovements.filter(coin => (coin.priorityScore || 0) > 80).length}
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
          <div className="text-xs sm:text-sm font-medium truncate" style={{ color: '#ffffff' }}>
            <span className="hidden sm:inline">Manipulation Detected</span>
            <span className="sm:hidden">Manipulation</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: '#ffffff' }}>
            {suspiciousMovements.filter(coin => (coin.manipulationConfidence || 0) > 70).length}
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
          <div className="text-xs sm:text-sm font-medium truncate" style={{ color: '#ffffff' }}>
            <span className="hidden sm:inline">Monitored Assets</span>
            <span className="sm:hidden">Assets</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: '#ffffff' }}>
            {openInterestData.length}
          </div>
        </div>
      </div>

      {/* 🚀 SMART MONEY TRACKER - Institutional Flow Detection */}
      <div className="min-h-[600px] sm:min-h-[800px] rounded-lg border-2 p-4 sm:p-6 backdrop-blur-[2.5px]" style={{  borderColor: '#2d5a31', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
          <h3 className="text-lg sm:text-2xl font-bold flex items-center gap-2 sm:gap-3" style={{ color: '#ffffff' }}>
            <span className="hidden sm:inline">MANIPULATION DETECTOR</span>
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
            {/* Database info banner */}
            {/* <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">
                    💾 Database Status: {suspiciousMovements.length}/10 coins stored
                  </span>
                  {dbLastUpdated && (
                    <span className="text-blue-600 dark:text-blue-400">
                      Last updated: {dbLastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">
                    Priority range: {Math.min(...suspiciousMovements.map(c => c.priorityScore || 0)).toFixed(0)} - {Math.max(...suspiciousMovements.map(c => c.priorityScore || 0)).toFixed(0)}
                  </span>
                </div>
              </div>
            </div> */}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-h-full overflow-y-auto py-4 sm:py-6 px-1 sm:px-2 overflow-x-hidden">
              {suspiciousMovements.map((coin, index) => (
                <TickerCard key={coin.symbol} coin={coin} index={index} />
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
              Optimized for speed - analyzing top 100 institutional flows
            </p>
          </div>
        ) : !isFirstLoad && !loading ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🔍</div>
            <h4 className="text-2xl font-bold mb-4" style={{ color: '#ffffff' }}>
              No Coins Found
            </h4>
            <p className="text-lg mb-4" style={{ color: '#4a7c59' }}>
              No coins are currently stored in the database
            </p>
            <div className="rounded-lg p-4 max-w-md mx-auto mb-4" style={{ backgroundColor: 'rgba(74, 124, 89, 0.2)', border: '1px solid rgba(74, 124, 89, 0.3)' }}>
              <p className="text-sm font-medium mb-2" style={{ color: '#ffffff' }}>
                💾 Database Status: Empty (0/10 coins)
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
              Detection thresholds: &gt;5% OI change, &gt;1.5σ anomalies, smart priority replacement
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
              Optimized for speed - analyzing top 100 institutional flows
            </p>
          </div>
        )}
      </div>

      {/* Live Signals - Split into Three Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* WHALE ACTIVITY */}
        <div className="rounded-xl p-4 sm:p-6 backdrop-blur-[3px] max-h-[600px] sm:max-h-[800px] min-h-[500px] sm:min-h-[700px]" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', backgroundColor: 'rgba(30, 63, 32, 0.1)' }}>
          <div className="mb-4 sm:mb-5">
            <h3 className="text-lg sm:text-xl font-semibold" style={{ color: '#ffffff' }}>
              <span className="hidden sm:inline">Whale Activity</span>
              <span className="sm:hidden">Whales</span>
            </h3>
          </div>
          <div className="max-h-[450px] sm:max-h-[600px] overflow-y-scroll space-y-3 sm:space-y-4 pr-1 sm:pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {signalsLoading ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <RefreshCwIcon className="h-12 w-12 text-purple-500 animate-spin" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading whale activity...</p>
              </div>
            ) : whaleSignals.length > 0 ? whaleSignals.map((signal, index) => {
              const sentiment = getSignalSentiment(signal);
              const colors = getSentimentColors(sentiment, 'purple');
              return (
                <div
                  key={index}
                  className="group relative p-3 sm:p-4 rounded-lg backdrop-blur-[3px] hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${signal.symbol}.P`, '_blank')}
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(30, 63, 32, 0.1)',
                    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center font-bold text-xs sm:text-sm text-purple-600 dark:text-purple-400 overflow-hidden">
                        <img 
                          src={`https://assets.coincap.io/assets/icons/${signal.symbol.replace('USDT', '').toLowerCase()}@2x.png`}
                          alt={signal.symbol.replace('USDT', '')}
                          className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
                          onError={(e) => {
                            // Fallback to letters if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="font-bold text-xs sm:text-sm text-purple-600 dark:text-purple-400">${signal.symbol.replace('USDT', '').slice(0, 2)}</span>`;
                            }
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm sm:text-lg text-white leading-none">
                          {signal.symbol.replace('USDT', '')}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                          {new Date(signal.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] sm:text-xs text-gray-400">
                        <span className="hidden sm:inline">Confidence</span>
                        <span className="sm:hidden">Conf</span>
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-white">{signal.confidence.toFixed(1)}%</span>
                    </div>
                    
                    {sentiment !== 'neutral' && (
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] sm:text-xs font-bold ${
                          sentiment === 'bullish' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {sentiment === 'bullish' ? 'BULL' : 'BEAR'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3 leading-relaxed line-clamp-3">
                    {signal.message}
                  </p>

                  {/* Action Button */}
                  <div className="flex justify-end">
                    <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                      <span className="hidden sm:inline">View Chart</span>
                      <span className="sm:hidden">Chart</span>
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm">No whale activity detected</p>
              </div>
            )}
          </div>
        </div>

        {/* FUNDING SQUEEZES */}
        <div className="rounded-xl p-4 sm:p-6 backdrop-blur-[3px] max-h-[600px] sm:max-h-[800px] min-h-[500px] sm:min-h-[700px]" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', backgroundColor: 'rgba(30, 63, 32, 0.1)' }}>
          <div className="mb-4 sm:mb-5">
            <h3 className="text-lg sm:text-xl font-semibold" style={{ color: '#ffffff' }}>
              <span className="hidden sm:inline">Funding Squeezes</span>
              <span className="sm:hidden">Funding</span>
            </h3>
          </div>
          <div className="max-h-[450px] sm:max-h-[600px] overflow-y-scroll space-y-3 sm:space-y-4 pr-1 sm:pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {signalsLoading ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <RefreshCwIcon className="h-12 w-12 text-orange-500 animate-spin" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading funding squeezes...</p>
              </div>
            ) : squeezeSignals.length > 0 ? squeezeSignals.map((signal, index) => {
              const sentiment = getSignalSentiment(signal);
              const colors = getSentimentColors(sentiment, 'orange');
              return (
                <div
                  key={index}
                  className="group relative p-3 sm:p-4 rounded-lg backdrop-blur-[3px] hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${signal.symbol}.P`, '_blank')}
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(30, 63, 32, 0.1)',
                    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center font-bold text-xs sm:text-sm text-orange-600 dark:text-orange-400 overflow-hidden">
                        <img 
                          src={`https://assets.coincap.io/assets/icons/${signal.symbol.replace('USDT', '').toLowerCase()}@2x.png`}
                          alt={signal.symbol.replace('USDT', '')}
                          className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
                          onError={(e) => {
                            // Fallback to letters if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="font-bold text-xs sm:text-sm text-orange-600 dark:text-orange-400">${signal.symbol.replace('USDT', '').slice(0, 2)}</span>`;
                            }
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm sm:text-lg text-white leading-none">
                          {signal.symbol.replace('USDT', '')}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                          {new Date(signal.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] sm:text-xs text-gray-400">
                        <span className="hidden sm:inline">Confidence</span>
                        <span className="sm:hidden">Conf</span>
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-white">{signal.confidence.toFixed(1)}%</span>
                    </div>
                    
                    {sentiment !== 'neutral' && (
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] sm:text-xs font-bold ${
                          sentiment === 'bullish' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {sentiment === 'bullish' ? ' BULL' : ' BEAR'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3 leading-relaxed line-clamp-3">
                    {signal.message}
                  </p>

                  {/* Action Button */}
                  <div className="flex justify-end">
                    <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                      <span className="hidden sm:inline">View Chart</span>
                      <span className="sm:hidden">Chart</span>
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm">No funding squeezes detected</p>
              </div>
            )}
          </div>
        </div>

        {/* STATISTICAL ANOMALIES */}
        <div className="rounded-xl p-4 sm:p-6 backdrop-blur-[3px] max-h-[600px] sm:max-h-[800px] min-h-[500px] sm:min-h-[700px]" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', backgroundColor: 'rgba(30, 63, 32, 0.1)' }}>
          <div className="mb-4 sm:mb-5">
            <h3 className="text-lg sm:text-xl font-semibold" style={{ color: '#ffffff' }}>
              <span className="hidden sm:inline">Statistical Anomalies</span>
              <span className="sm:hidden">Anomalies</span>
            </h3>
          </div>
          <div className="max-h-[450px] sm:max-h-[600px] overflow-y-scroll space-y-3 sm:space-y-4 pr-1 sm:pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {signalsLoading ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <RefreshCwIcon className="h-12 w-12 text-blue-500 animate-spin" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading statistical anomalies...</p>
              </div>
            ) : anomalySignals.length > 0 ? anomalySignals.map((signal, index) => {
              const sentiment = getSignalSentiment(signal);
              const colors = getSentimentColors(sentiment, 'blue');
              return (
                <div
                  key={index}
                  className="group relative p-3 sm:p-4 rounded-lg backdrop-blur-[3px] hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=BYBIT:${signal.symbol}.P`, '_blank')}
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(30, 63, 32, 0.1)',
                    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-xs sm:text-sm text-blue-600 dark:text-blue-400 overflow-hidden">
                        <img 
                          src={`https://assets.coincap.io/assets/icons/${signal.symbol.replace('USDT', '').toLowerCase()}@2x.png`}
                          alt={signal.symbol.replace('USDT', '')}
                          className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
                          onError={(e) => {
                            // Fallback to letters if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="font-bold text-xs sm:text-sm text-blue-600 dark:text-blue-400">${signal.symbol.replace('USDT', '').slice(0, 2)}</span>`;
                            }
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm sm:text-lg text-white leading-none">
                          {signal.symbol.replace('USDT', '')}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                          {new Date(signal.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] sm:text-xs text-gray-400">
                        <span className="hidden sm:inline">Confidence</span>
                        <span className="sm:hidden">Conf</span>
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-white">{signal.confidence.toFixed(1)}%</span>
                    </div>
                    
                    {sentiment !== 'neutral' && (
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] sm:text-xs font-bold ${
                          sentiment === 'bullish' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {sentiment === 'bullish' ? ' BULL' : ' BEAR'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3 leading-relaxed line-clamp-3">
                    {signal.message}
                  </p>

                  {/* Action Button */}
                  <div className="flex justify-end">
                    <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                      <span className="hidden sm:inline">View Chart</span>
                      <span className="sm:hidden">Chart</span>
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm">No anomalies detected</p>
              </div>
            )}
          </div>
        </div>
      </div>




    </div>
  );
};

export default InstitutionalActivity; 