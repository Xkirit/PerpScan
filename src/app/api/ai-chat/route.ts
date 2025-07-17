// AI Chat API temporarily disabled
/*
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const SERPAPI_KEY = process.env.SERPAPI_KEY;

// Define API endpoints for different data sources
const API_ENDPOINTS = {
  btcPrice: 'http://localhost:3000/api/btc-price',
  tickers: 'http://localhost:3000/api/tickers',
  institutionalFlows: 'http://localhost:3000/api/institutional-flows',
  trendingCoins: 'http://localhost:3000/api/trending-coins',
  fibonacciScanner: 'http://localhost:3000/api/fibonacci-scanner',
  accountRatio: 'http://localhost:3000/api/account-ratio',
  historicalOI: 'http://localhost:3000/api/historical-oi',
  onchainScreener: 'http://localhost:3000/api/onchain-screener'
};

// Extract cryptocurrency symbols from query
function extractSymbols(message: string): string[] {
  const query = message.toLowerCase();
  const symbols: string[] = [];
  
  // Common cryptocurrency mappings
  const symbolMap: { [key: string]: string } = {
    'bitcoin': 'BTCUSDT',
    'btc': 'BTCUSDT',
    'ethereum': 'ETHUSDT',
    'eth': 'ETHUSDT',
    'binance': 'BNBUSDT',
    'bnb': 'BNBUSDT',
    'cardano': 'ADAUSDT',
    'ada': 'ADAUSDT',
    'solana': 'SOLUSDT',
    'sol': 'SOLUSDT',
    'polkadot': 'DOTUSDT',
    'dot': 'DOTUSDT',
    'dogecoin': 'DOGEUSDT',
    'doge': 'DOGEUSDT',
    'avalanche': 'AVAXUSDT',
    'avax': 'AVAXUSDT',
    'polygon': 'MATICUSDT',
    'matic': 'MATICUSDT',
    'chainlink': 'LINKUSDT',
    'link': 'LINKUSDT',
    'uniswap': 'UNIUSDT',
    'uni': 'UNIUSDT',
    'litecoin': 'LTCUSDT',
    'ltc': 'LTCUSDT',
    'bitcoin cash': 'BCHUSDT',
    'bch': 'BCHUSDT',
    'ripple': 'XRPUSDT',
    'xrp': 'XRPUSDT',
    'cosmos': 'ATOMUSDT',
    'atom': 'ATOMUSDT'
  };

  // Check for exact matches
  for (const [name, symbol] of Object.entries(symbolMap)) {
    if (query.includes(name)) {
      symbols.push(symbol);
    }
  }

  // Check for USDT pairs (e.g., "BTCUSDT", "ETHUSDT")
  const usdtPattern = /([A-Z]{3,10})USDT/gi;
  const matches = query.match(usdtPattern);
  if (matches) {
    symbols.push(...matches.map(m => m.toUpperCase()));
  }

  return [...new Set(symbols)]; // Remove duplicates
}

// Query classification function
function classifyQuery(message: string): { apis: string[], symbols: string[] } {
  const query = message.toLowerCase();
  const classifications = [];
  const symbols = extractSymbols(message);

  // Price and market data queries (always include if symbols found)
  if (query.includes('price') || query.includes('btc') || query.includes('bitcoin') || 
      query.includes('market cap') || query.includes('value') || symbols.length > 0) {
    classifications.push('tickers');
  }

  // Specific BTC queries
  if (query.includes('btc') || query.includes('bitcoin')) {
    classifications.push('btcPrice');
  }

  // Technical analysis and candlestick patterns
  if (query.includes('candlestick') || query.includes('pattern') || query.includes('technical') || 
      query.includes('chart') || query.includes('volume') || query.includes('movement') ||
      query.includes('indicator') || query.includes('rsi') || query.includes('macd')) {
    classifications.push('candlestickScreener');
  }

  // Institutional activity
  if (query.includes('institutional') || query.includes('whale') || query.includes('large trader') || 
      query.includes('flow') || query.includes('big money') || query.includes('smart money')) {
    classifications.push('institutionalFlows');
  }

  // Trending and hot coins
  if (query.includes('trending') || query.includes('hot') || query.includes('popular') || 
      query.includes('gainers') || query.includes('movers') || query.includes('top') ||
      query.includes('best') || query.includes('performing')) {
    classifications.push('trendingCoins');
  }

  // Fibonacci and support/resistance
  if (query.includes('fibonacci') || query.includes('support') || query.includes('resistance') || 
      query.includes('retracement') || query.includes('level') || query.includes('fib')) {
    classifications.push('fibonacciScanner');
  }

  // Account ratios and sentiment
  if (query.includes('ratio') || query.includes('sentiment') || query.includes('account') || 
      query.includes('long') || query.includes('short') || query.includes('position')) {
    classifications.push('accountRatio');
  }

  // Historical data and open interest
  if (query.includes('historical') || query.includes('history') || query.includes('oi') || 
      query.includes('open interest') || query.includes('past') || query.includes('previous')) {
    classifications.push('historicalOI');
  }

  // On-chain data
  if (query.includes('onchain') || query.includes('on-chain') || query.includes('blockchain') || 
      query.includes('wallet') || query.includes('address') || query.includes('transaction')) {
    classifications.push('onchainScreener');
  }

  // If no specific classification, return general market data
  if (classifications.length === 0) {
    classifications.push('tickers', 'candlestickScreener');
  }

  return { apis: classifications, symbols };
}

// Fetch data from specific API endpoint
async function fetchFromAPI(endpoint: string, symbols?: string[]): Promise<any> {
  try {
    console.log(`Fetching data from: ${endpoint}`);
    
    let url = endpoint;
    if (symbols && symbols.length > 0) {
      const params = new URLSearchParams();
      if (endpoint.includes('btc-price')) {
        params.append('symbol', symbols[0]);
      } else if (endpoint.includes('tickers')) {
        params.append('symbol', symbols[0]);
        params.append('limit', '10');
      }
      url = `${endpoint}?${params.toString()}`;
    }
    
    const response = await axios.get(url, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    return null;
  }
}

// Format data for RAG context
function formatDataForRAG(data: any, source: string): string {
  if (!data) return '';

  let formatted = `\n=== ${source.toUpperCase()} DATA ===\n`;

  switch (source) {
    case 'btcPrice':
      if (data.price && data.price !== '0.00') {
        formatted += `Bitcoin Price: $${data.price}\n`;
        formatted += `24h Change: ${data.change24h}%\n`;
        formatted += `24h Volume: $${data.volume24h}\n`;
        formatted += `24h High: $${data.high24h}\n`;
        formatted += `24h Low: $${data.low24h}\n`;
        formatted += `Market Cap: $${data.marketCap}\n`;
      } else {
        formatted += 'Bitcoin price data unavailable\n';
      }
      break;

    case 'tickers':
      if (Array.isArray(data) && data.length > 0) {
        formatted += 'Current Market Prices:\n';
        data.slice(0, 8).forEach((ticker: any) => {
          const changeColor = parseFloat(ticker.change24h) >= 0 ? '🟢' : '🔴';
          formatted += `${changeColor} ${ticker.symbol}: $${ticker.price} (${ticker.change24h}%)\n`;
        });
      } else if (data.symbol && data.price) {
        // Single ticker response
        const changeColor = parseFloat(data.change24h) >= 0 ? '🟢' : '🔴';
        formatted += `${changeColor} ${data.symbol}: $${data.price} (${data.change24h}%)\n`;
        formatted += `Volume: $${data.volume24h}\n`;
        formatted += `High: $${data.high24h} | Low: $${data.low24h}\n`;
      } else {
        formatted += 'Market data unavailable\n';
      }
      break;

    

    case 'institutionalFlows':
      if (Array.isArray(data) && data.length > 0) {
        formatted += 'Institutional Activity:\n';
        data.slice(0, 3).forEach((flow: any) => {
          const flowIcon = flow.flow_type === 'inflow' ? '📈' : '📉';
          formatted += `${flowIcon} ${flow.symbol}: ${flow.flow_type} (${flow.amount})\n`;
        });
      }
      break;

    case 'trendingCoins':
      if (Array.isArray(data) && data.length > 0) {
        formatted += 'Trending Coins:\n';
        data.slice(0, 5).forEach((coin: any) => {
          const changeColor = parseFloat(coin.change24h) >= 0 ? '🟢' : '🔴';
          formatted += `${changeColor} ${coin.symbol}: ${coin.change24h}% (Volume: ${coin.volume})\n`;
        });
      }
      break;

    case 'fibonacciScanner':
      if (Array.isArray(data) && data.length > 0) {
        formatted += 'Fibonacci Levels:\n';
        data.slice(0, 3).forEach((fib: any) => {
          formatted += `📊 ${fib.symbol}: ${fib.level} at $${fib.price}\n`;
        });
      }
      break;

    case 'accountRatio':
      if (Array.isArray(data) && data.length > 0) {
        formatted += 'Account Ratios:\n';
        data.slice(0, 3).forEach((ratio: any) => {
          const sentiment = parseFloat(ratio.ratio) > 1 ? '🐂' : '🐻';
          formatted += `${sentiment} ${ratio.symbol}: Long/Short Ratio ${ratio.ratio}\n`;
        });
      }
      break;

    case 'historicalOI':
      if (Array.isArray(data) && data.length > 0) {
        formatted += 'Historical Open Interest:\n';
        data.slice(0, 3).forEach((oi: any) => {
          const changeIcon = parseFloat(oi.change) >= 0 ? '📈' : '📉';
          formatted += `${changeIcon} ${oi.symbol}: OI ${oi.openInterest} (${oi.change}%)\n`;
        });
      }
      break;

    case 'onchainScreener':
      if (Array.isArray(data) && data.length > 0) {
        formatted += 'On-Chain Activity:\n';
        data.slice(0, 3).forEach((onchain: any) => {
          formatted += `🔗 ${onchain.symbol}: ${onchain.metric} (${onchain.value})\n`;
        });
      }
      break;
  }

  return formatted;
}

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await req.json();

    // 1. Classify the user query
    const { apis, symbols } = classifyQuery(message);
    console.log('Query classification:', apis, symbols);

    // 2. Fetch data from relevant APIs
    const apiData: { [key: string]: any } = {};
    for (const api of apis) {
      if (API_ENDPOINTS[api as keyof typeof API_ENDPOINTS]) {
        const data = await fetchFromAPI(API_ENDPOINTS[api as keyof typeof API_ENDPOINTS], symbols);
        apiData[api] = data;
      }
    }

    // 3. Format all data for RAG context
    let ragContext = '';
    for (const [source, data] of Object.entries(apiData)) {
      ragContext += formatDataForRAG(data, source);
    }

    // 4. Add web search for additional context if needed
    let webContext = '';
    if (message.toLowerCase().includes('news') || message.toLowerCase().includes('analysis') || 
        message.toLowerCase().includes('fundamental') || message.toLowerCase().includes('why')) {
      try {
        const serpRes = await axios.get('https://serpapi.com/search', {
          params: {
            q: `${message} cryptocurrency market analysis`,
            api_key: SERPAPI_KEY,
            engine: 'google',
            num: 3,
          }
        });

        const snippets = serpRes.data.organic_results
          ?.map((r: any) => r.snippet)
          .filter(Boolean)
          .join('\n---\n') || '';
        
        webContext = `\n=== WEB ANALYSIS ===\n${snippets}\n`;
      } catch (err) {
        console.log('Web search failed:', err);
      }
    }

    // 5. Build conversation context
    const conversationContext = conversationHistory
      .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // 6. Compose comprehensive prompt
    const prompt = `
You are a crypto trading expert. Provide direct, concise answers based on the market data below.
Do not give the thinking texts keep that invisible only give the output.

Previous conversation:
${conversationContext}

${ragContext}${webContext}

User: ${message}
Assistant:`;

    // 7. Call Ollama with DeepSeek model
    const ollamaRes = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-r1:latest',
        prompt,
        stream: false,
        temperature: 0.3,
        max_tokens: 500,
        top_p: 0.9,
      }),
    });

    if (!ollamaRes.ok) {
      const text = await ollamaRes.text();
      console.error('Ollama error:', text);
      return NextResponse.json({ reply: 'Sorry, the AI model is not available.' }, { status: 500 });
    }

    const data = await ollamaRes.json();
    return NextResponse.json({ reply: data.response ?? 'Sorry, I could not answer that.' });
  } catch (err: any) {
    console.error('AI Chat API error:', err);
    return NextResponse.json({ reply: 'Sorry, there was an error processing your request.' }, { status: 500 });
  }
}
