import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Completely disable request logging in production
  serverExternalPackages: [],

  // Reduce verbose output
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
  // Custom webpack config to minimize console output
  webpack: (config, { dev, isServer }) => {
    // In production, replace console methods with no-ops
    if (!dev && process.env.NODE_ENV === 'production') {
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }
    return config;
  },
};

export default nextConfig;
