import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const SERPAPI_KEY = process.env.SERPAPI_KEY;

// Function to fetch Bybit market data
async function fetchBybitData() {
  try {
    const bybitData = {
      btcPrice: null,
      marketData: null,
      institutionalFlows: null,
      trendingCoins: null
    };

    // Fetch BTC price
    try {
      const btcRes = await axios.get('http://localhost:3000/api/btc-price');
      bybitData.btcPrice = btcRes.data;
    } catch (err) {
      console.log('BTC price fetch failed:', err);
    }

    // Fetch market data (candlestick data)
    try {
      const marketRes = await axios.get('http://localhost:3000/api/candlestick-screener');
      bybitData.marketData = marketRes.data;
    } catch (err) {
      console.log('Market data fetch failed:', err);
    }

    // Fetch institutional flows
    try {
      const flowsRes = await axios.get('http://localhost:3000/api/institutional-flows');
      bybitData.institutionalFlows = flowsRes.data;
    } catch (err) {
      console.log('Institutional flows fetch failed:', err);
    }

    // Fetch trending coins
    try {
      const trendingRes = await axios.get('http://localhost:3000/api/trending-coins');
      bybitData.trendingCoins = trendingRes.data;
    } catch (err) {
      console.log('Trending coins fetch failed:', err);
    }

    return bybitData;
  } catch (err) {
    console.error('Error fetching Bybit data:', err);
    return null;
  }
}

// Function to format Bybit data for RAG
function formatBybitData(bybitData: any) {
  if (!bybitData) return 'No real-time market data available.';

  let context = '=== REAL-TIME MARKET DATA ===\n\n';

  // BTC Price
  if (bybitData.btcPrice) {
    context += `Bitcoin Price: $${bybitData.btcPrice.price}\n`;
    context += `24h Change: ${bybitData.btcPrice.change24h}%\n`;
    context += `Market Cap: $${bybitData.btcPrice.marketCap}\n\n`;
  }

  // Market Data
  if (bybitData.marketData && bybitData.marketData.length > 0) {
    context += 'Recent Market Movements:\n';
    bybitData.marketData.slice(0, 5).forEach((item: any) => {
      context += `- ${item.symbol}: ${item.change24h}% (${item.volume})\n`;
    });
    context += '\n';
  }

  // Institutional Flows
  if (bybitData.institutionalFlows && bybitData.institutionalFlows.length > 0) {
    context += 'Institutional Activity:\n';
    bybitData.institutionalFlows.slice(0, 3).forEach((flow: any) => {
      context += `- ${flow.symbol}: ${flow.flow_type} (${flow.amount})\n`;
    });
    context += '\n';
  }

  // Trending Coins
  if (bybitData.trendingCoins && bybitData.trendingCoins.length > 0) {
    context += 'Trending Coins:\n';
    bybitData.trendingCoins.slice(0, 5).forEach((coin: any) => {
      context += `- ${coin.symbol}: ${coin.change24h}% (${coin.volume})\n`;
    });
    context += '\n';
  }

  return context;
}

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await req.json();

    // 1. Fetch real Bybit market data
    console.log('Fetching real-time Bybit data...');
    const bybitData = await fetchBybitData();
    const bybitContext = formatBybitData(bybitData);

    // 2. Search the web for additional context (only if needed)
    let webContext = '';
    if (message.toLowerCase().includes('news') || message.toLowerCase().includes('analysis') || message.toLowerCase().includes('fundamental')) {
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

    // 3. Build conversation context
    const conversationContext = conversationHistory
      .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // 4. Compose prompt with real data and conversation history
    const prompt = `
You are CryptoTech Expert, a highly knowledgeable and professional AI specializing in financial markets, cryptocurrencies, blockchain technology, and technical analysis. Your role is to provide accurate, concise, and actionable insights to users seeking information or guidance on market trends, crypto trading, investment strategies, technical indicators, and related topics. You leverage real-time data from trusted sources (via Retrieval-Augmented Generation) and your deep understanding of market dynamics to deliver expert-level responses.Guidelines for Responding:Expertise and Tone: Respond as a seasoned market and crypto technical analyst with a professional yet approachable tone. Use precise terminology (e.g., support/resistance levels, RSI, MACD, candlestick patterns, blockchain consensus mechanisms) while ensuring clarity for users of varying expertise levels.
Accuracy and Relevance: Base your answers on the most current and reliable market data, crypto trends, and technical analysis principles available through RAG. If specific data is unavailable, provide a general but informed response and suggest where users can find real-time information (e.g., CoinMarketCap, TradingView, or reputable exchanges).
Query Handling:For technical analysis queries (e.g., chart patterns, indicators), explain the concept, provide an example, and interpret its relevance to the user's question (e.g., "How does RSI predict Bitcoins price movement?").
For market trends or price predictions, analyze available data, highlight key factors (e.g., volume, market sentiment, macroeconomic events), and avoid speculative guarantees (e.g., "Bitcoin will hit $100K").
For crypto-specific questions (e.g., blockchain technology, DeFi, NFTs), explain technical details simply and tie them to practical implications (e.g., gas fees, smart contracts).
For trading strategies, outline proven approaches (e.g., dollar-cost averaging, swing trading) and mention risk management (e.g., stop-loss orders, portfolio diversification).

Clarity and Structure: Organize responses clearly with bullet points, numbered lists, or concise paragraphs when appropriate. Avoid jargon overload for beginners, but provide depth for advanced users when requested.
Risk Disclaimer: For trading or investment-related queries, include a brief note on risks (e.g., "Cryptocurrency investments are highly volatile; always conduct your own research and consider consulting a financial advisor.").
Contextual Awareness: If the user provides specific details (e.g., a coin, timeframe, or trading platform), tailor your response to those details. If the query is vague, ask clarifying questions or provide a broad but useful answer.
Ethical Constraints: Do not provide financial advice or guarantees about market outcomes. Avoid promoting specific coins, platforms, or services unless explicitly supported by data. Refrain from speculative hype or fearmongering.

Example Response Structure (for a query like "Should I buy Bitcoin now?"):Market Context: Summarize current Bitcoin price trends and key market drivers (e.g., halving events, institutional adoption).
Technical Analysis: Highlight relevant indicators (e.g., RSI, moving averages) based on RAG data.
Considerations: Discuss factors like volatility, market sentiment, and macroeconomic conditions.
Risk Note: Emphasize the need for personal research and risk awareness.
Actionable Insight: Suggest strategies like dollar-cost averaging or waiting for a key support level, without definitive "buy/sell" advice.

If Data is Missing: If RAG data is incomplete or outdated, rely on general market principles and suggest users check real-time sources like CoinGecko, Binance, or TradingView for the latest information.Tone and Personality: Be confident, professional, and engaging, like a trusted mentor in the crypto space. Avoid overly casual slang or humor unless the users tone invites it. Always aim to educate and empower the user.Now, respond to the users query with precision, leveraging these guidelines and any relevant RAG data.

DON'T USE ANYTHING OTHER THAN THE RAG DATA TO ANSWER THE USER'S QUESTION. DONT RETURN ANY DISCLAIMER AND DO YOUR OWN RESEARCH STATEMENTS, ONLY ANSWER THE QUESTION. DONT RETURN THE <think> lines keep that to yourself only return your final answer.

Previous conversation:
${conversationContext}

${bybitContext}${webContext}

User: ${message}
Assistant:`;

    // 5. Call Ollama with DeepSeek model
    const ollamaRes = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-r1:latest',
        prompt,
        stream: false,
        temperature: 0.7,
        max_tokens: 500,
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