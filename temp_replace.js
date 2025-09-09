const fs = require('fs');

let content = fs.readFileSync('src/lib/bybit-client-service.ts', 'utf8');

const oldMethod = `  getTopPerformers(analyses: CoinAnalysis[], limit: number = 10, interval: '4h' | '1d' = '4h'): AnalysisResult {
    const trending = [...analyses]
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit)
      .map((coin, index) => ({ ...coin, rank: index + 1 }));

    // Sort by the appropriate price change field based on interval
    const priceChangeField = interval === '4h' ? 'priceChange4h' : 'priceChange24h';
    
    const strongest = [...analyses]
      .sort((a, b) => b[priceChangeField] - a[priceChangeField])
      .slice(0, limit)
      .map((coin, index) => ({ ...coin, rank: index + 1 }));

    const weakest = [...analyses]
      .sort((a, b) => a[priceChangeField] - b[priceChangeField])
      .slice(0, limit)
      .map((coin, index) => ({ ...coin, rank: index + 1 }));

    return {
      trending,
      strongest,
      weakest,
      timestamp: new Date().toISOString(),
      totalCoins: analyses.length
    };
  }`;

const newMethod = `  getTopPerformers(analyses: CoinAnalysis[], limit: number = 10, interval: '4h' | '1d' = '4h'): AnalysisResult {
    const trending = [...analyses]
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit)
      .map((coin, index) => ({ ...coin, rank: index + 1 }));

    // Sort by the appropriate price change field based on interval
    const priceChangeField = interval === '4h' ? 'priceChange4h' : 'priceChange24h';
    
    const strongest = [...analyses]
      .sort((a, b) => b[priceChangeField] - a[priceChangeField])
      .slice(0, limit)
      .map((coin, index) => ({ ...coin, rank: index + 1 }));

    const weakest = [...analyses]
      .sort((a, b) => a[priceChangeField] - b[priceChangeField])
      .slice(0, limit)
      .map((coin, index) => ({ ...coin, rank: index + 1 }));

    // Mark coins as having been in top 10 and identify new entries
    const allTop10Symbols = [
      ...trending.map(c => c.symbol),
      ...strongest.map(c => c.symbol),
      ...weakest.map(c => c.symbol)
    ];
    top10Tracker.markAsTop10(allTop10Symbols);

    // Add newToTop10 flag to coins
    const markNewEntries = (coins: CoinAnalysis[]) => 
      coins.map(coin => ({ ...coin, newToTop10: top10Tracker.isNewToTop10(coin.symbol) }));

    return {
      trending: markNewEntries(trending),
      strongest: markNewEntries(strongest),
      weakest: markNewEntries(weakest),
      timestamp: new Date().toISOString(),
      totalCoins: analyses.length
    };
  }`;

content = content.replace(oldMethod, newMethod);
fs.writeFileSync('src/lib/bybit-client-service.ts', content);
console.log('Updated getTopPerformers with tracking');
