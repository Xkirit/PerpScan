import { 
  FibonacciAnalysis, 
  FibonacciLevel, 
  VolumeProfile, 
  VolumeProfileLevel, 
  SwingPoint, 
  FibRetracementScanResult,
  KlineData 
} from '@/types';
import { BybitService } from './bybit-service';

export class FibonacciService {
  private bybitService: BybitService;
  private baseUrl = 'https://api.bybit.com';

  // Standard fibonacci retracement levels
  private readonly FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
  
  // Your target levels for entries (0.618 to 0.66)
  private readonly TARGET_LEVELS = [0.618, 0.65, 0.66];

  constructor() {
    this.bybitService = new BybitService();
  }

  /**
   * Scan for coins approaching fibonacci retracement levels with POC confluence
   */
  async scanFibonacciRetracements(
    minRetracement: number = 30, // minimum % retracement from swing
    maxRetracement: number = 80, // maximum % retracement 
    requirePocConfluence: boolean = true,
    limit: number = 50,
    minVolume: number = 100000 // minimum 24h volume in USD
  ): Promise<FibRetracementScanResult> {
    const startTime = Date.now();
    
    try {
      // Get top volume tickers for scanning
      const tickers = await this.bybitService.getPerpetualFuturesTickers();
      const topTickers = tickers
        .filter(ticker => 
          ticker.symbol.endsWith('USDT') && 
          parseFloat(ticker.volume24h) > minVolume // use configurable minimum volume filter
        )
        .sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h))
        .slice(0, limit);

      console.log(`🔍 Scanning ${topTickers.length} coins for fibonacci retracements...`);

      const fibAnalyses: FibonacciAnalysis[] = [];
      const batchSize = 10;

      // Process in batches to avoid rate limiting
      for (let i = 0; i < topTickers.length; i += batchSize) {
        const batch = topTickers.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (ticker) => {
          try {
            return await this.analyzeFibonacciRetracement(
              ticker.symbol, 
              parseFloat(ticker.lastPrice),
              parseFloat(ticker.price24hPcnt) * 100,
              parseFloat(ticker.volume24h),
              requirePocConfluence
            );
          } catch (error) {
            console.warn(`Error analyzing ${ticker.symbol}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter(result => result !== null) as FibonacciAnalysis[];
        
        // Filter for coins approaching target levels
        const targetCoins = validResults.filter(analysis => 
          this.isApproachingTargetLevels(analysis, minRetracement, maxRetracement)
        );

        fibAnalyses.push(...targetCoins);

        // Rate limiting delay
        if (i + batchSize < topTickers.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Sort by quality and confluence
      fibAnalyses.sort((a, b) => {
        // Prioritize POC confluence
        if (a.confluence && !b.confluence) return -1;
        if (!a.confluence && b.confluence) return 1;
        
        // Then by quality
        const qualityOrder = { high: 3, medium: 2, low: 1 };
        const qualityDiff = qualityOrder[b.quality] - qualityOrder[a.quality];
        if (qualityDiff !== 0) return qualityDiff;
        
        // Finally by how close to target levels
        const aTarget = this.getClosestTargetLevel(a);
        const bTarget = this.getClosestTargetLevel(b);
        return Math.abs(aTarget.distance) - Math.abs(bTarget.distance);
      });

      const scanTime = Date.now() - startTime;

      return {
        fibAnalyses,
        totalScanned: topTickers.length,
        filteredCount: fibAnalyses.length,
        scanTime,
        criteria: {
          minRetracement,
          maxRetracement,
          requiredFibLevel: this.TARGET_LEVELS,
          pocConfluence: requirePocConfluence
        }
      };

    } catch (error) {
      console.error('Error in fibonacci scan:', error);
      throw error;
    }
  }

  /**
   * Analyze fibonacci retracement for a single symbol
   */
  private async analyzeFibonacciRetracement(
    symbol: string,
    currentPrice: number,
    priceChange24h: number,
    volume24h: number,
    requirePocConfluence: boolean
  ): Promise<FibonacciAnalysis | null> {
    try {
      // Get 4-hour kline data for swing analysis (last 7 days)
      const klineData = await this.bybitService.getKlineData(symbol, '240', 42); // 42 * 4h = 7 days
      
      if (klineData.length < 20) {
        return null; // Not enough data
      }

      // Find significant swing highs and lows
      const swingPoints = this.findSwingPoints(klineData);
      const recentSwings = this.findRecentSignificantSwing(swingPoints, currentPrice);

      if (!recentSwings) {
        return null; // No significant swing found
      }

      const { swingHigh, swingLow, trend } = recentSwings;

      // Calculate fibonacci levels
      const fibLevels = this.calculateFibonacciLevels(swingHigh, swingLow, trend);

      // Calculate current retracement percentage
      const retracePercent = this.calculateRetracementPercent(
        swingHigh.price, 
        swingLow.price, 
        currentPrice, 
        trend
      );

      // Get target levels in our range (0.618-0.66)
      const targetLevels = fibLevels.filter(level => 
        this.TARGET_LEVELS.includes(level.level)
      );

      // Calculate volume profile and POC
      let pocLevel: VolumeProfileLevel | undefined;
      let confluence = false;

      if (requirePocConfluence || true) { // Always try to get POC for better analysis
        try {
          const volumeProfile = await this.calculateVolumeProfile(symbol, klineData);
          pocLevel = volumeProfile.poc;
          
          // Check for confluence between POC and fibonacci levels
          confluence = this.checkPocFibConfluence(pocLevel, targetLevels);
        } catch (error) {
          console.warn(`Could not calculate volume profile for ${symbol}:`, error);
        }
      }

      // Determine quality based on swing strength and volume
      const quality = this.determineAnalysisQuality(
        swingHigh, 
        swingLow, 
        volume24h, 
        confluence, 
        Math.abs(priceChange24h)
      );

      return {
        symbol,
        trend,
        swingHigh,
        swingLow,
        currentPrice,
        fibLevels,
        targetLevels,
        pocLevel,
        confluence,
        quality,
        retracePercent,
        priceChange24h,
        volume24h,
        timestamp: Date.now()
      };

    } catch (error) {
      console.warn(`Error analyzing fibonacci for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Find swing highs and lows in kline data
   */
  private findSwingPoints(klineData: KlineData[]): SwingPoint[] {
    const swingPoints: SwingPoint[] = [];
    const lookback = 8; // Increased lookback for 4h timeframe (32 hours on each side)
    const minSwingPercent = 3; // Minimum 3% move to be considered a swing
    
    // Sort data chronologically
    const sortedData = [...klineData].sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));

    for (let i = lookback; i < sortedData.length - lookback; i++) {
      const current = sortedData[i];
      const high = parseFloat(current.high);
      const low = parseFloat(current.low);
      const volume = parseFloat(current.volume);
      const timestamp = parseInt(current.timestamp);

      // Check for swing high with stronger criteria
      let isSwingHigh = true;
      let isSwingLow = true;
      let highCount = 0;
      let lowCount = 0;

      // More robust swing detection - must be highest/lowest in lookback period
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j === i) continue;
        
        const compareHigh = parseFloat(sortedData[j].high);
        const compareLow = parseFloat(sortedData[j].low);

        if (compareHigh >= high) {
          isSwingHigh = false;
        } else {
          highCount++;
        }

        if (compareLow <= low) {
          isSwingLow = false;
        } else {
          lowCount++;
        }
      }

      // Additional validation: must be significantly higher/lower than surrounding candles
      if (isSwingHigh) {
        // Calculate average of surrounding highs
        let surroundingHighs = 0;
        let count = 0;
        for (let j = Math.max(0, i - lookback); j <= Math.min(sortedData.length - 1, i + lookback); j++) {
          if (j !== i) {
            surroundingHighs += parseFloat(sortedData[j].high);
            count++;
          }
        }
        const avgSurroundingHigh = surroundingHighs / count;
        const swingSize = ((high - avgSurroundingHigh) / avgSurroundingHigh) * 100;
        
        if (swingSize >= minSwingPercent && highCount >= lookback) {
          const strength = this.calculateSwingStrength(sortedData, i, 'high');
          swingPoints.push({
            type: 'high',
            price: high,
            timestamp,
            index: i,
            strength,
            volume
          });
        }
      }

      if (isSwingLow) {
        // Calculate average of surrounding lows
        let surroundingLows = 0;
        let count = 0;
        for (let j = Math.max(0, i - lookback); j <= Math.min(sortedData.length - 1, i + lookback); j++) {
          if (j !== i) {
            surroundingLows += parseFloat(sortedData[j].low);
            count++;
          }
        }
        const avgSurroundingLow = surroundingLows / count;
        const swingSize = ((avgSurroundingLow - low) / avgSurroundingLow) * 100;
        
        if (swingSize >= minSwingPercent && lowCount >= lookback) {
          const strength = this.calculateSwingStrength(sortedData, i, 'low');
          swingPoints.push({
            type: 'low',
            price: low,
            timestamp,
            index: i,
            strength,
            volume
          });
        }
      }
    }

    // Filter out swings that are too close together (minimum 12 hours apart for 4h timeframe)
    const filteredSwings = this.filterCloseSwings(swingPoints, 3); // 3 * 4h = 12 hours minimum
    
    return filteredSwings.sort((a: SwingPoint, b: SwingPoint) => b.timestamp - a.timestamp); // Most recent first
  }

  /**
   * Filter out swing points that are too close together
   */
  private filterCloseSwings(swingPoints: SwingPoint[], minPeriods: number): SwingPoint[] {
    if (swingPoints.length === 0) return swingPoints;
    
    const filtered: SwingPoint[] = [];
    const periodMs = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
    const minDistance = minPeriods * periodMs;
    
    // Sort by timestamp
    const sorted = [...swingPoints].sort((a, b) => a.timestamp - b.timestamp);
    
    for (const swing of sorted) {
      // Check if this swing is far enough from existing swings of the same type
      const sameTypeSwings = filtered.filter(s => s.type === swing.type);
      const tooClose = sameTypeSwings.some(existingSwing => 
        Math.abs(swing.timestamp - existingSwing.timestamp) < minDistance
      );
      
      if (!tooClose) {
        filtered.push(swing);
      } else {
        // Keep the stronger swing if they're too close
        const closeSwing = sameTypeSwings.find(s => 
          Math.abs(swing.timestamp - s.timestamp) < minDistance
        );
        if (closeSwing && swing.strength > closeSwing.strength) {
          const index = filtered.indexOf(closeSwing);
          filtered[index] = swing;
        }
      }
    }
    
    return filtered;
  }

  /**
   * Calculate swing strength (1-10 scale)
   */
  private calculateSwingStrength(data: KlineData[], index: number, type: 'high' | 'low'): number {
    const current = data[index];
    const currentPrice = parseFloat(type === 'high' ? current.high : current.low);
    const lookback = 10;
    
    let maxDeviation = 0;
    const start = Math.max(0, index - lookback);
    const end = Math.min(data.length - 1, index + lookback);

    for (let i = start; i <= end; i++) {
      if (i === index) continue;
      
      const comparePrice = parseFloat(type === 'high' ? data[i].high : data[i].low);
      const deviation = Math.abs((currentPrice - comparePrice) / comparePrice) * 100;
      maxDeviation = Math.max(maxDeviation, deviation);
    }

    // Convert deviation to 1-10 scale
    return Math.min(10, Math.max(1, Math.round(maxDeviation / 2)));
  }

  /**
   * Find the most recent significant swing for fibonacci analysis
   */
  private findRecentSignificantSwing(
    swingPoints: SwingPoint[], 
    currentPrice: number
  ): { swingHigh: SwingPoint; swingLow: SwingPoint; trend: 'bullish' | 'bearish' } | null {
    
    // Filter for significant swings (strength >= 4 for higher quality)
    const significantSwings = swingPoints.filter(swing => swing.strength >= 4);
    
    if (significantSwings.length < 2) return null;

    // Find the most recent significant high and low
    const recentHighs = significantSwings.filter(s => s.type === 'high').slice(0, 3);
    const recentLows = significantSwings.filter(s => s.type === 'low').slice(0, 3);

    if (recentHighs.length === 0 || recentLows.length === 0) return null;

    // Sort by timestamp to find the most logical swing sequence
    const allSwings = [...recentHighs, ...recentLows].sort((a, b) => b.timestamp - a.timestamp);
    
    // Find the most recent significant move
    for (let i = 0; i < allSwings.length - 1; i++) {
      const recent = allSwings[i];
      
      // Find the corresponding opposite swing
      const oppositeType = recent.type === 'high' ? 'low' : 'high';
      const oppositeSwing = allSwings.find(s => 
        s.type === oppositeType && 
        Math.abs(s.timestamp - recent.timestamp) > 12 * 60 * 60 * 1000 // At least 12 hours apart
      );
      
      if (!oppositeSwing) continue;
      
      const high = recent.type === 'high' ? recent : oppositeSwing;
      const low = recent.type === 'low' ? recent : oppositeSwing;
      
      const swingRange = high.price - low.price;
      const minSwingSize = Math.max(high.price, low.price) * 0.08; // Minimum 8% swing for quality
      
      if (swingRange < minSwingSize) continue;

      // Determine if we're in a retracement scenario
      const isRecentHigh = recent.type === 'high';
      const priceInRange = currentPrice >= low.price && currentPrice <= high.price;
      
      if (!priceInRange) continue;
      
      // Calculate retracement percentage to ensure we're actually retracing
      let retracementPercent: number;
      let trend: 'bullish' | 'bearish';
      
      if (isRecentHigh && high.timestamp > low.timestamp) {
        // Recent high after low - bearish retracement scenario
        retracementPercent = ((high.price - currentPrice) / swingRange) * 100;
        trend = 'bearish';
      } else if (!isRecentHigh && low.timestamp > high.timestamp) {
        // Recent low after high - bullish retracement scenario  
        retracementPercent = ((currentPrice - low.price) / swingRange) * 100;
        trend = 'bullish';
      } else {
        continue; // Not a clear retracement scenario
      }
      
      // Must be actually retracing (between 10% and 90%)
      if (retracementPercent >= 10 && retracementPercent <= 90) {
        return {
          swingHigh: high,
          swingLow: low,
          trend
        };
      }
    }

    return null;
  }

  /**
   * Calculate fibonacci retracement levels
   */
  private calculateFibonacciLevels(
    swingHigh: SwingPoint,
    swingLow: SwingPoint,
    trend: 'bullish' | 'bearish'
  ): FibonacciLevel[] {
    const high = swingHigh.price;
    const low = swingLow.price;
    const range = high - low;

    return this.FIB_LEVELS.map(level => {
      let price: number;
      let type: 'support' | 'resistance';

      if (trend === 'bearish') {
        // Retracing from high to low
        price = high - (range * level);
        type = level > 0.5 ? 'support' : 'resistance';
      } else {
        // Retracing from low to high  
        price = low + (range * level);
        type = level > 0.5 ? 'resistance' : 'support';
      }

      return {
        level,
        price,
        distance: 0, // Will be calculated later with current price
        type
      };
    });
  }

  /**
   * Calculate how much price has retraced from the swing
   */
  private calculateRetracementPercent(
    swingHigh: number,
    swingLow: number,
    currentPrice: number,
    trend: 'bullish' | 'bearish'
  ): number {
    const range = swingHigh - swingLow;
    
    if (trend === 'bearish') {
      // Retracing down from high
      return ((swingHigh - currentPrice) / range) * 100;
    } else {
      // Retracing up from low
      return ((currentPrice - swingLow) / range) * 100;
    }
  }

  /**
   * Calculate volume profile from kline data (simplified version)
   */
  private async calculateVolumeProfile(symbol: string, klineData: KlineData[]): Promise<VolumeProfile> {
    // This is a simplified volume profile calculation
    // For true volume profile, we'd need tick-by-tick trade data
    
    const sortedData = [...klineData].sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
    const priceVolumeMap = new Map<number, number>();
    
    let totalVolume = 0;
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    // Accumulate volume at each price level (using OHLC average)
    sortedData.forEach(candle => {
      const high = parseFloat(candle.high);
      const low = parseFloat(candle.low);
      const volume = parseFloat(candle.volume);
      const avgPrice = (high + low + parseFloat(candle.open) + parseFloat(candle.close)) / 4;
      
      // Distribute volume across the price range of the candle
      const priceStep = 0.001; // Adjust based on symbol precision
      const steps = Math.max(1, Math.round((high - low) / priceStep));
      const volumePerStep = volume / steps;
      
      for (let i = 0; i <= steps; i++) {
        const price = low + (i * (high - low) / steps);
        const roundedPrice = Math.round(price / priceStep) * priceStep;
        
        priceVolumeMap.set(roundedPrice, (priceVolumeMap.get(roundedPrice) || 0) + volumePerStep);
        totalVolume += volumePerStep;
        minPrice = Math.min(minPrice, roundedPrice);
        maxPrice = Math.max(maxPrice, roundedPrice);
      }
    });

    // Convert to volume profile levels
    const levels: VolumeProfileLevel[] = Array.from(priceVolumeMap.entries())
      .map(([price, volume]) => ({
        price,
        volume,
        percentage: (volume / totalVolume) * 100,
        isPOC: false
      }))
      .sort((a, b) => b.volume - a.volume);

    // Find POC (Point of Control) - highest volume level
    const poc = levels[0];
    poc.isPOC = true;

    // Find Value Area (70% of volume around POC)
    const sortedByPrice = [...levels].sort((a, b) => a.price - b.price);
    let valueAreaVolume = poc.volume;
    let valueAreaHigh = poc;
    let valueAreaLow = poc;
    
    const targetVolumeArea = totalVolume * 0.7;
    const pocIndex = sortedByPrice.findIndex(level => level.price === poc.price);
    
    let expandUp = true;
    let expandDown = true;
    let upIndex = pocIndex + 1;
    let downIndex = pocIndex - 1;

    while (valueAreaVolume < targetVolumeArea && (expandUp || expandDown)) {
      const upVolume = expandUp && upIndex < sortedByPrice.length ? sortedByPrice[upIndex].volume : 0;
      const downVolume = expandDown && downIndex >= 0 ? sortedByPrice[downIndex].volume : 0;

      if (upVolume >= downVolume && expandUp) {
        valueAreaVolume += upVolume;
        valueAreaHigh = sortedByPrice[upIndex];
        upIndex++;
        if (upIndex >= sortedByPrice.length) expandUp = false;
      } else if (expandDown) {
        valueAreaVolume += downVolume;
        valueAreaLow = sortedByPrice[downIndex];
        downIndex--;
        if (downIndex < 0) expandDown = false;
      } else {
        break;
      }
    }

    valueAreaHigh.isVAH = true;
    valueAreaLow.isVAL = true;

    return {
      symbol,
      timeframe: '4h',
      startTime: parseInt(sortedData[0].timestamp),
      endTime: parseInt(sortedData[sortedData.length - 1].timestamp),
      levels,
      poc,
      valueAreaHigh,
      valueAreaLow,
      totalVolume
    };
  }

  /**
   * Check if POC aligns with fibonacci levels (confluence)
   */
  private checkPocFibConfluence(poc: VolumeProfileLevel, fibLevels: FibonacciLevel[]): boolean {
    const confluenceThreshold = 0.02; // 2% price difference threshold

    return fibLevels.some(fib => {
      const priceDiff = Math.abs(poc.price - fib.price) / fib.price;
      return priceDiff <= confluenceThreshold;
    });
  }

  /**
   * Determine analysis quality based on various factors
   */
  private determineAnalysisQuality(
    swingHigh: SwingPoint,
    swingLow: SwingPoint,
    volume24h: number,
    confluence: boolean,
    priceChange24h: number
  ): 'high' | 'medium' | 'low' {
    let score = 0;

    // Swing strength (max 30 points)
    score += (swingHigh.strength + swingLow.strength) * 1.5;

    // Volume (max 20 points)
    if (volume24h > 1000000) score += 20;
    else if (volume24h > 100000) score += 15;
    else if (volume24h > 10000) score += 10;
    else score += 5;

    // POC confluence (max 25 points)
    if (confluence) score += 25;

    // Price volatility (max 15 points)
    const volatility = Math.abs(priceChange24h);
    if (volatility > 5) score += 15;
    else if (volatility > 2) score += 10;
    else score += 5;

    // Swing age - fresher swings are better (max 10 points)
    const daysSinceSwing = (Date.now() - Math.max(swingHigh.timestamp, swingLow.timestamp)) / (1000 * 60 * 60 * 24);
    if (daysSinceSwing < 1) score += 10;
    else if (daysSinceSwing < 3) score += 7;
    else if (daysSinceSwing < 7) score += 5;
    else score += 2;

    // Determine quality
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  /**
   * Check if analysis meets target level criteria
   */
  private isApproachingTargetLevels(
    analysis: FibonacciAnalysis,
    minRetracement: number,
    maxRetracement: number
  ): boolean {
    // Must be within retracement range
    if (analysis.retracePercent < minRetracement || analysis.retracePercent > maxRetracement) {
      return false;
    }

    // Must have target levels close to current price
    const currentPrice = analysis.currentPrice;
    const hasNearbyTargetLevel = analysis.targetLevels.some(level => {
      const distance = Math.abs(level.price - currentPrice) / currentPrice;
      return distance <= 0.05; // Within 5% of target level
    });

    return hasNearbyTargetLevel;
  }

  /**
   * Get the closest target level to current price
   */
  private getClosestTargetLevel(analysis: FibonacciAnalysis): FibonacciLevel {
    const currentPrice = analysis.currentPrice;
    
    return analysis.targetLevels.reduce((closest, level) => {
      const distance = Math.abs(level.price - currentPrice) / currentPrice * 100;
      const closestDistance = Math.abs(closest.price - currentPrice) / currentPrice * 100;
      
      level.distance = distance;
      closest.distance = closestDistance;
      
      return distance < closestDistance ? level : closest;
    });
  }

  /**
   * Get detailed analysis for a specific symbol
   */
  async getDetailedFibonacciAnalysis(symbol: string): Promise<FibonacciAnalysis | null> {
    try {
      // Get current ticker data
      const tickers = await this.bybitService.getPerpetualFuturesTickers();
      const ticker = tickers.find(t => t.symbol === symbol);
      
      if (!ticker) {
        throw new Error(`Symbol ${symbol} not found`);
      }

      return await this.analyzeFibonacciRetracement(
        symbol,
        parseFloat(ticker.lastPrice),
        parseFloat(ticker.price24hPcnt) * 100,
        parseFloat(ticker.volume24h),
        true // Always check for POC confluence in detailed analysis
      );
    } catch (error) {
      console.error(`Error getting detailed analysis for ${symbol}:`, error);
      return null;
    }
  }
} 