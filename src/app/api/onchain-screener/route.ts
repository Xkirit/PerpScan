import { NextRequest, NextResponse } from 'next/server';

interface TokenTransfer {
  signature: string;
  block_timestamp: string;
  from_address: string;
  to_address: string;
  amount: string;
  mint_address: string;
  symbol: string;
  decimals: number;
}

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  totalLiquidity: number;
  volume24h: number;
  priceChange24h: number;
  holders: number;
  createdAt: string;
}

interface FreshWalletActivity {
  tokenSymbol: string;
  tokenAddress: string;
  tokenInfo: TokenInfo;
  walletAddress: string;
  buyAmount: string;
  buyValueUSD: number;
  walletAge: number;
  transactionCount: number;
  timestamp: string;
  txHash: string;
  suspiciousScore: number;
}

interface ScreenerResult {
  freshWalletActivities: FreshWalletActivity[];
  totalTokensScanned: number;
  totalTransfersAnalyzed: number;
  suspiciousActivities: number;
  timestamp: string;
  scanning?: boolean;
  tokens: TokenInfo[];
}

interface TokenTransferInfo {
  fromUserAccount: string;
  toUserAccount: string;
  tokenAmount: number;
  mint: string;
  decimals: number;
}

interface ParsedTransaction {
  signature: string;
  timestamp: string;
  feePayer: string;
  tokenTransfers: TokenTransferInfo[];
}

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_RPC_URL = `https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`;

function debug(...args: any[]) {
  console.log('[OnchainScreener]', ...args);
}

async function makeRequest(method: string, params: any = {}) {
  debug(`Making Helius API request: ${method}`, params);
  
  const response = await fetch(HELIUS_RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'helius-test',
      method,
      params,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    debug(`Helius API error response: ${error}`);
    throw new Error(`Helius API error: ${response.status} ${response.statusText} - ${error}`);
  }

  const data = await response.json();
  if (data.error) {
    debug(`Helius API returned error:`, data.error);
    throw new Error(`Helius API error: ${data.error.message}`);
  }

  debug(`Helius API response for ${method}:`, data.result);
  return data.result;
}

// Get trending Solana tokens by analyzing recent transfers
async function discoverTrendingSolanaTokens(): Promise<TokenInfo[]> {
  try {
    debug('Starting Solana token discovery...');
    
    // Get recent token mints using the getAssetBatch endpoint
    const mintAddresses = await makeRequest('getAssetBatch', {
      ids: [
        'So11111111111111111111111111111111111111112', // Wrapped SOL
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
        'AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB', // GST
      ]
    });

    debug(`Found ${mintAddresses?.length || 0} initial tokens`);
    
    const tokens: TokenInfo[] = [];
    const seenTokens = new Set<string>();

    // Process each token
    for (const mintAddress of (mintAddresses || [])) {
      if (!seenTokens.has(mintAddress)) {
        seenTokens.add(mintAddress);
        
        try {
          // Get token metadata
          const metadata = await makeRequest('getAsset', {
            id: mintAddress
          });

          if (metadata) {
            // Get recent transfers
            const transfers = await makeRequest('searchAssets', {
              ownerAddress: mintAddress,
              page: 1,
              limit: 100
            });

            const volume24h = transfers?.items?.length || 0;
            const uniqueHolders = new Set(transfers?.items?.map((t: any) => t.owner) || []).size;

            tokens.push({
              address: mintAddress,
              symbol: metadata.symbol || 'UNKNOWN',
              name: metadata.name || metadata.symbol || 'Unknown Token',
              totalLiquidity: uniqueHolders * volume24h, // Simple liquidity score
              volume24h: volume24h,
              priceChange24h: 0, // Would need price API for this
              holders: uniqueHolders,
              createdAt: new Date(metadata.createdAt || Date.now()).toISOString()
            });

            debug(`Processed token ${metadata.symbol || mintAddress}`);
          }
        } catch (error) {
          debug(`Error processing token ${mintAddress}:`, error);
        }
      }
    }

    // Sort tokens by liquidity score
    const sortedTokens = tokens
      .sort((a, b) => b.totalLiquidity - a.totalLiquidity)
      .slice(0, 15); // Top 15 tokens

    debug(`Found ${sortedTokens.length} trending Solana tokens`);
    return sortedTokens;

  } catch (error) {
    debug('Error discovering Solana tokens:', error);
    return [];
  }
}

async function getTokenTransfers(mintAddress: string): Promise<TokenTransfer[]> {
  try {
    const data = await makeRequest('searchAssets', {
      ownerAddress: mintAddress,
      page: 1,
      limit: 100
    });

    return (data?.items || []).map((item: any) => ({
      signature: item.id,
      block_timestamp: item.createdAt,
      from_address: item.owner,
      to_address: item.previousOwner || '',
      amount: '1', // NFT transfers are always 1
      mint_address: mintAddress,
      symbol: item.content?.metadata?.symbol || '',
      decimals: 0
    }));
  } catch (error) {
    debug(`Error fetching transfers for ${mintAddress}:`, error);
    return [];
  }
}

async function getWalletAge(walletAddress: string): Promise<number> {
  try {
    const data = await makeRequest('searchAssets', {
      ownerAddress: walletAddress,
      page: 1,
      limit: 1,
      sortBy: {
        createdAt: 'asc'
      }
    });

    if (data?.items && data.items.length > 0) {
      return calculateWalletAge(data.items[0].createdAt);
    }
    return 0;
  } catch (error) {
    debug(`Error fetching wallet age for ${walletAddress}:`, error);
    return 0;
  }
}

async function getWalletTransactionCount(walletAddress: string): Promise<number> {
  try {
    const data = await makeRequest('searchAssets', {
      ownerAddress: walletAddress,
      page: 1,
      limit: 1
    });
    return data?.total || 0;
  } catch (error) {
    debug(`Error fetching transaction count for ${walletAddress}:`, error);
    return 0;
  }
}

function calculateWalletAge(firstTransaction: string): number {
  const firstTxDate = new Date(firstTransaction);
  const now = new Date();
  return Math.floor((now.getTime() - firstTxDate.getTime()) / (1000 * 60 * 60 * 24));
}

function calculateSuspiciousScore(
  walletAge: number, 
  transactionCount: number, 
  buyAmount: number,
  tokenInfo: TokenInfo
): number {
  let score = 0;
  
  // Age factor (newer = more suspicious)
  if (walletAge < 3) score += 40; // Very new wallets
  else if (walletAge < 7) score += 35;
  else if (walletAge < 30) score += 20;
  else if (walletAge < 90) score += 10;
  
  // Activity factor (less activity = more suspicious for large buys)
  if (transactionCount < 10) score += 30;
  else if (transactionCount < 50) score += 20;
  else if (transactionCount < 200) score += 10;
  
  // Buy size relative to volume (larger relative buys = more suspicious)
  const buyPercentOfVolume = (buyAmount / tokenInfo.volume24h) * 100;
  if (buyPercentOfVolume > 1) score += 20;
  else if (buyPercentOfVolume > 0.5) score += 15;
  else if (buyPercentOfVolume > 0.1) score += 10;
  
  // Token metrics
  if (tokenInfo.holders < 100) score += 15;
  else if (tokenInfo.holders < 500) score += 10;
  
  return Math.min(score, 100);
}

async function analyzeFreshWalletActivity(): Promise<ScreenerResult> {
  const freshWalletActivities: FreshWalletActivity[] = [];
  let totalTransfersAnalyzed = 0;
  const analyzedWallets = new Set<string>();

  debug('Starting Solana token analysis...');

  // Discover trending Solana tokens
  const trendingTokens = await discoverTrendingSolanaTokens();
  debug(`Found ${trendingTokens.length} trending tokens to analyze`);

  for (const token of trendingTokens) {
    debug(`Analyzing ${token.symbol}...`);
    
    try {
      const transfers = await getTokenTransfers(token.address);
      totalTransfersAnalyzed += transfers.length;

      // Focus on recent transfers
      const recentTransfers = transfers.filter(transfer => {
        const transferTime = new Date(transfer.block_timestamp);
        const hoursAgo = (Date.now() - transferTime.getTime()) / (1000 * 60 * 60);
        return hoursAgo <= 24;
      });

      for (const transfer of recentTransfers.slice(0, 20)) {
        if (analyzedWallets.has(transfer.to_address)) continue;
        analyzedWallets.add(transfer.to_address);

        const walletAge = await getWalletAge(transfer.to_address);
        const transactionCount = await getWalletTransactionCount(transfer.to_address);

        const isFreshWallet = walletAge < 90 || transactionCount < 200;

        if (isFreshWallet) {
          const buyAmountRaw = parseFloat(transfer.amount) / Math.pow(10, transfer.decimals);
          const estimatedUSDValue = buyAmountRaw * (token.volume24h / token.holders); // Rough estimate
          
          const suspiciousScore = calculateSuspiciousScore(
            walletAge,
            transactionCount,
            buyAmountRaw,
            token
          );

          freshWalletActivities.push({
            tokenSymbol: token.symbol,
            tokenAddress: token.address,
            tokenInfo: token,
            walletAddress: transfer.to_address,
            buyAmount: buyAmountRaw.toFixed(4),
            buyValueUSD: estimatedUSDValue,
            walletAge,
            transactionCount,
            timestamp: transfer.block_timestamp,
            txHash: transfer.signature,
            suspiciousScore
          });
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      debug(`Error analyzing ${token.symbol}:`, error);
    }
  }

  freshWalletActivities.sort((a, b) => b.suspiciousScore - a.suspiciousScore);

  const result: ScreenerResult = {
    freshWalletActivities: freshWalletActivities.slice(0, 50),
    totalTokensScanned: trendingTokens.length,
    totalTransfersAnalyzed,
    suspiciousActivities: freshWalletActivities.filter(activity => activity.suspiciousScore > 50).length,
    timestamp: new Date().toISOString(),
    tokens: trendingTokens
  };

  debug(`Analysis complete: Found ${freshWalletActivities.length} fresh wallet activities`);
  return result;
}

export async function GET(request: NextRequest) {
  try {
    debug('Starting onchain screener scan...');
    
    if (!HELIUS_API_KEY) {
      debug('ERROR: HELIUS_API_KEY is not set in environment variables');
      throw new Error('HELIUS_API_KEY is required');
    }
    
    debug('Using Helius RPC URL:', HELIUS_RPC_URL);
    
    const tokens = await discoverTrendingSolanaTokens();
    debug(`Discovered ${tokens.length} trending tokens`);
    
    const result = await analyzeFreshWalletActivity();
    debug('Scan completed successfully');
    
    return NextResponse.json({
      ...result,
      tokens,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    debug('Error in GET handler:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      freshWalletActivities: [],
      totalTokensScanned: 0,
      totalTransfersAnalyzed: 0,
      suspiciousActivities: 0,
      tokens: [],
      timestamp: new Date().toISOString()
    });
  }
} 