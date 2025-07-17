import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  compiler: {
    removeConsole: {
      exclude: ['error', 'info', 'warn'],
    },
  },
  
  /* config options here */
  logging: false,
  // Completely disable ALL logging
  serverExternalPackages: [],

  // Custom webpack config to completely suppress output
  webpack: (config, { dev, isServer }) => {
    // Suppress all webpack logging
    config.stats = 'none';
    config.infrastructureLogging = {
      level: 'none',
    };
    return config;
  },



  // Reduce verbose output to minimum
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/bybit/:path*',
        destination: 'https://api.bybit.com/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/proxy/bybit/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
