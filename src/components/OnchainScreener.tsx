"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';

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
  freshWalletActivities: any[];
  totalTokensScanned: number;
  totalTransfersAnalyzed: number;
  suspiciousActivities: number;
  timestamp: string;
  scanning?: boolean;
  tokens?: TokenInfo[];
}

export default function OnchainScreener() {
  const [data, setData] = useState<ScreenerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/onchain-screener');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('API Error Details:', err);
      setError(`Error fetching data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const formatUSD = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getSuspiciousScoreColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const truncateAddress = (address: string): string => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-100 rounded-lg">
        <h3 className="font-bold">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-2">Solana Token Activity</h2>
            <p className="text-gray-600">
              Last updated: {new Date(data?.timestamp || '').toLocaleString()}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-700">Tokens Scanned</h3>
              <p className="text-2xl">{data?.totalTokensScanned || 0}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-700">Transfers Analyzed</h3>
              <p className="text-2xl">{formatNumber(data?.totalTransfersAnalyzed || 0)}</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-700">Fresh Wallets</h3>
              <p className="text-2xl">{data?.freshWalletActivities?.length || 0}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-700">Suspicious Activity</h3>
              <p className="text-2xl">{data?.suspiciousActivities || 0}</p>
            </div>
          </div>

          {data?.tokens && data.tokens.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Active Tokens</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.tokens.map((token) => (
                  <div key={token.address} className="bg-white p-4 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold">{token.symbol}</h4>
                        <p className="text-sm text-gray-600">{token.name}</p>
                      </div>
                      <Badge variant="secondary">
                        {formatNumber(token.holders)} holders
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <a
                        href={`https://solscan.io/token/${token.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {truncateAddress(token.address)}
                      </a>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">24h Volume:</span>
                        <br />
                        {formatNumber(token.volume24h)}
                      </div>
                      <div>
                        <span className="text-gray-600">Total Liquidity:</span>
                        <br />
                        {formatNumber(token.totalLiquidity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {data?.scanning && (
        <div className="p-4 bg-blue-100 text-blue-700 rounded-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
          <span>Scanning for new activity...</span>
        </div>
      )}
    </div>
  );
} 