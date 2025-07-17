'use client';

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';

// Custom SVG Icons
const BookOpenIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const HomeIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const TrendingUpIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const BarChart3Icon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const EyeIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const ChartCandlestickIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l3-3v10l5-5v11" />
  </svg>
);

const ListIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const MessageCircleIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

export default function DocsPage() {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState('overview');
  
  // Add custom styles for scrollbar-hide
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const sections = [
    { id: 'overview', label: 'Getting Started', icon: BookOpenIcon },
    { id: 'features', label: 'How to Use Each Tool', icon: TrendingUpIcon },
    { id: 'strategies', label: 'Trading Strategies', icon: BarChart3Icon },
    { id: 'tips', label: 'Pro Tips & Best Practices', icon: EyeIcon },
    { id: 'understanding', label: 'Understanding the Data', icon: ChartCandlestickIcon },
    { id: 'troubleshooting', label: 'Common Questions', icon: ListIcon },
  ];
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff' }}>
      {/* GitBook Style Header */}
      <header 
        className="sticky top-0 z-50 border-b" 
        style={{ 
          backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff', 
          borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
        }}
      >
        <div className="flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <img 
                src="/logo.svg" 
                alt="PerpFlow" 
                className="h-6 w-auto"
              />
             
            </Link>
            <span 
              className="text-sm px-2 py-1 rounded" 
              style={{ 
                backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                color: theme === 'dark' ? '#d1d5db' : '#6b7280'
              }}
            >
              Docs
            </span>
          </div>
           
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-80"
              style={{ 
                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
              }}
            >
              <HomeIcon className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* GitBook Style Layout */}
      <div className="flex">
        {/* GitBook-Style Left Sidebar */}
        <aside 
          className="hidden md:block w-80 flex-shrink-0 border-r" 
          style={{ 
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f8fafc',
            borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
          }}
        >
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="p-6">
              {/* Section Tabs */}
              <nav className="space-y-1 mb-8">
                {sections.map((section, index) => {
                  const isActive = activeSection === section.id;
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all text-left rounded-lg group"
                      style={{
                        backgroundColor: isActive 
                          ? (theme === 'dark' ? '#1e40af' : '#3b82f6')
                          : 'transparent',
                        color: isActive
                          ? '#ffffff'
                          : (theme === 'dark' ? '#d1d5db' : '#4b5563'),
                        borderLeft: isActive ? '4px solid #60a5fa' : '4px solid transparent'
                      }}
                    >
                      <Icon 
                        className="h-5 w-5 flex-shrink-0" 
                        style={{
                          color: isActive ? '#ffffff' : (theme === 'dark' ? '#9ca3af' : '#6b7280')
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{section.label}</span>
                          <span 
                            className="text-xs px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: isActive 
                                ? 'rgba(255, 255, 255, 0.2)'
                                : (theme === 'dark' ? '#374151' : '#e5e7eb'),
                              color: isActive ? '#ffffff' : (theme === 'dark' ? '#9ca3af' : '#6b7280')
                            }}
                          >
                            {index + 1}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
              
              {/* Quick Links */}
              <div className="border-t pt-6" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                <h4 
                  className="text-xs font-semibold mb-4 uppercase tracking-wide"
                  style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                >
                  Quick Access
                </h4>
                <div className="space-y-1">
                  <Link
                    href="/?tab=institutional"
                    className="flex items-center gap-3 px-3 py-2 text-sm transition-all rounded-lg hover:bg-blue-50 group"
                    style={{
                      color: theme === 'dark' ? '#d1d5db' : '#4b5563'
                    }}
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span>Whale Tracker</span>
                  </Link>
                  <Link
                    href="/?tab=screener"
                    className="flex items-center gap-3 px-3 py-2 text-sm transition-all rounded-lg hover:bg-blue-50 group"
                    style={{
                      color: theme === 'dark' ? '#d1d5db' : '#4b5563'
                    }}
                  >
                    <ChartCandlestickIcon className="h-4 w-4" />
                    <span>Pattern Screener</span>
                  </Link>
                  <Link
                    href="/?tab=watchlists"
                    className="flex items-center gap-3 px-3 py-2 text-sm transition-all rounded-lg hover:bg-blue-50 group"
                    style={{
                      color: theme === 'dark' ? '#d1d5db' : '#4b5563'
                    }}
                  >
                    <ListIcon className="h-4 w-4" />
                    <span>Watchlists</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0" style={{ backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff' }}>
          {/* Mobile Navigation */}
          <div className="md:hidden border-b p-4" style={{ 
            borderColor: theme === 'dark' ? '#404040' : '#e2e8f0',
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f8fafc'
          }}>
            <div className="overflow-x-auto">
              <div className="flex gap-2 pb-2" style={{ minWidth: 'max-content' }}>
                {sections.map((section, index) => {
                  const isActive = activeSection === section.id;
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all border whitespace-nowrap"
                      style={{
                        backgroundColor: isActive 
                          ? (theme === 'dark' ? '#1e40af' : '#3b82f6')
                          : (theme === 'dark' ? '#262626' : '#ffffff'),
                        color: isActive ? '#ffffff' : (theme === 'dark' ? '#d1d5db' : '#4b5563'),
                        borderColor: isActive 
                          ? (theme === 'dark' ? '#1e40af' : '#3b82f6')
                          : (theme === 'dark' ? '#404040' : '#e2e8f0')
                      }}
                    >
                      <Icon className="h-3 w-3" />
                      <span>{section.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Breadcrumb Navigation */}
          {/* <div className="max-w-4xl mx-auto px-6 lg:px-12 pt-6">
            <nav className="flex items-center gap-2 text-sm">
              <Link 
                href="/"
                className="transition-colors"
                style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              >
                Dashboard
              </Link>
              <span style={{ color: theme === 'dark' ? '#4b5563' : '#9ca3af' }}>→</span>
              <span style={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}>Documentation</span>
              <span style={{ color: theme === 'dark' ? '#4b5563' : '#9ca3af' }}>→</span>
              <span 
                className="font-medium"
                style={{ color: theme === 'dark' ? '#ffffff' : '#111827' }}
              >
                {sections.find(s => s.id === activeSection)?.label}
              </span>
            </nav>
          </div> */}
          
          {/* GitBook Style Content */}
          <article className="max-w-4xl mx-auto px-6 lg:px-12 py-8">
                {/* Getting Started Section */}
                {activeSection === 'overview' && (
                  <div className="space-y-8">
                    <div>
                      <h2 
                        className="text-3xl font-bold mb-4 flex items-center gap-3"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        <BookOpenIcon className="h-8 w-8" style={{ color: theme === 'dark' ? '#6366f1' : '#3b82f6' }} />
                        Welcome to Perpflow
                      </h2>
                      <p 
                        className="text-lg mb-6"
                        style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}
                      >
                        Your complete toolkit for cryptocurrency market analysis and smart trading decisions.
                      </p>
                    </div>

                    <div 
                      className="p-6 mb-8 rounded-lg border"
                      style={{
                        backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                        borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                      }}
                    >
                      <h3 
                        className="text-3xl font-semibold mb-6 leading-tight"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        🚀 What Can You Do Here?
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 
                            className="font-semibold mb-2"
                            style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                          >
                            📈 Find Hot Markets
                          </h4>
                          <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                            Discover which cryptocurrencies are trending, gaining momentum, or showing unusual activity
                          </p>
                        </div>
                        <div>
                          <h4 
                            className="font-semibold mb-2"
                            style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                          >
                            🐋 Track Big Money
                          </h4>
                          <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                            See when institutions and whales are making large trades - follow the smart money
                          </p>
                        </div>
                        <div>
                          <h4 
                            className="font-semibold mb-2"
                            style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                          >
                            📊 Spot Patterns
                          </h4>
                          <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                            Automatically find bullish and bearish candlestick patterns across hundreds of coins
                          </p>
                        </div>
                        <div>
                          <h4 
                            className="font-semibold mb-2"
                            style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                          >
                            📋 Build Watchlists
                          </h4>
                          <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                            Create custom watchlists by category and export them directly to TradingView
                          </p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="p-6 mb-8 rounded-lg border"
                      style={{
                        backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                        borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                      }}
                    >
                      <h3 
                        className="text-3xl font-semibold mb-6 leading-tight"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        🎯 Quick Start Guide
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <span 
                            className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1"
                          >
                            1
                          </span>
                          <div>
                            <h4 
                              className="font-semibold mb-1"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Start with Trend Analysis
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              Click on "Trend Analysis" to see which coins are moving the most. This gives you an instant overview of market sentiment.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span 
                            className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1"
                          >
                            2
                          </span>
                          <div>
                            <h4 
                              className="font-semibold mb-1"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Check Institutional Activity
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              Look for coins with high "whale rating" or "abnormality" scores - these indicate big money is moving.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span 
                            className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1"
                          >
                            3
                          </span>
                          <div>
                            <h4 
                              className="font-semibold mb-1"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Use Pattern Screener
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              Find coins forming bullish patterns right now. Click on any coin to see it on TradingView.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span 
                            className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1"
                          >
                            4
                          </span>
                          <div>
                            <h4 
                              className="font-semibold mb-1"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Create Your Watchlist
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              Build custom lists by category (DeFi, AI, Gaming, etc.) and download them for your trading platform.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="p-6 mb-8 rounded-lg border"
                      style={{
                        backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                        borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                      }}
                    >
                      <h3 
                        className="text-3xl font-semibold mb-6 leading-tight"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        💡 Why This Platform?
                      </h3>
                      <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 font-bold">✓</span>
                          <span><strong>Real-time data:</strong> Information updates every few seconds, so you never miss opportunities</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 font-bold">✓</span>
                          <span><strong>Smart alerts:</strong> Get notified when unusual activity happens in the market</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 font-bold">✓</span>
                          <span><strong>Pattern detection:</strong> Automatically scan 300+ coins for technical patterns</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 font-bold">✓</span>
                          <span><strong>Global access:</strong> Works worldwide with fast loading speeds</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* How to Use Each Tool Section */}
                {activeSection === 'features' && (
                  <div className="space-y-8">
                    <div>
                      <h2 
                        className="text-3xl font-bold mb-4 flex items-center gap-3"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        <TrendingUpIcon className="h-8 w-8" style={{ color: theme === 'dark' ? '#6366f1' : '#3b82f6' }} />
                        How to Use Each Tool
                      </h2>
                      <p 
                        className="text-lg mb-6"
                        style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}
                      >
                        Step-by-step guides for getting the most out of every feature.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Trend Analysis */}
                      <div 
                        className="p-6 mb-8 rounded-lg border"
                        style={{
                          backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                          borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                        }}
                      >
                        <h3 
                          className="text-2xl font-semibold mb-6 flex items-center gap-3"
                          style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                        >
                          <TrendingUpIcon className="h-5 w-5" />
                          📈 Trend Analysis - Finding Hot Markets
                        </h3>
                        <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="mb-4">
                          <strong>What it does:</strong> Shows you which coins are moving the most right now, both up and down.
                        </p>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>How to use it:</h4>
                            <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                              <li>• Look at the "Strongest" tab for coins with the biggest gains</li>
                              <li>• Check "Weakest" to see which coins are dropping (potential buying opportunities)</li>
                              <li>• Use the timeframe buttons (4H, 1D) to see different perspectives</li>
                              <li>• Click on any coin name to see it on TradingView</li>
                            </ul>
                          </div>
                          <div 
                            className="p-4 rounded-md border-l-4"
                            style={{
                              backgroundColor: theme === 'dark' ? '#14532d' : '#f0fdf4',
                              borderColor: theme === 'dark' ? '#166534' : '#86efac',
                              borderLeftColor: '#22c55e'
                            }}
                          >
                            <p className="text-sm font-medium" style={{ color: theme === 'dark' ? '#22c55e' : '#15803d' }}>
                              <strong>💡 Pro Tip:</strong> Look for coins that appear in both 4H and 1D strongest lists - these have sustained momentum.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Multi-Ticker Chart */}
                      <div 
                        className="p-6 mb-8 rounded-lg border"
                        style={{
                          backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                          borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                        }}
                      >
                        <h3 
                          className="text-2xl font-semibold mb-6 flex items-center gap-3"
                          style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                        >
                          <BarChart3Icon className="h-5 w-5" />
                          📊 Multi-Ticker Chart - Compare Multiple Coins
                        </h3>
                        <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="mb-4">
                          <strong>What it does:</strong> Shows price movements of multiple coins on one chart so you can compare performance.
                        </p>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>How to use it:</h4>
                            <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                              <li>• Add coins using the search box (type coin symbol like "BTC")</li>
                              <li>• Change timeframes to see different patterns (1H, 4H, 1D, etc.)</li>
                              <li>• Click legend items to hide/show specific coins</li>
                              <li>• Hover over the chart to see exact prices at any time</li>
                            </ul>
                          </div>
                          <div 
                            className="p-4 rounded-md border-l-4"
                            style={{
                              backgroundColor: theme === 'dark' ? '#14532d' : '#f0fdf4',
                              borderColor: theme === 'dark' ? '#166534' : '#86efac',
                              borderLeftColor: '#22c55e'
                            }}
                          >
                            <p className="text-sm font-medium" style={{ color: theme === 'dark' ? '#22c55e' : '#15803d' }}>
                              <strong>💡 Pro Tip:</strong> Compare similar coins (like different DeFi tokens) to see which one is leading or lagging.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Institutional Activity */}
                      <div 
                        className="p-6 mb-8 rounded-lg border"
                        style={{
                          backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                          borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                        }}
                      >
                        <h3 
                          className="text-2xl font-semibold mb-6 flex items-center gap-3"
                          style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                        >
                          <EyeIcon className="h-5 w-5" />
                          🐋 Whale Tracker - Follow the Smart Money
                        </h3>
                        <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="mb-4">
                          <strong>What it does:</strong> Spots when big institutions or whales make large trades that could move the market.
                        </p>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>What to look for:</h4>
                            <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                              <li>• <strong>Priority Score (80+):</strong> High scores mean unusual activity detected</li>
                              <li>• <strong>Whale Rating "XL" or "L":</strong> Large position sizes</li>
                              <li>• <strong>High Abnormality (2.0+):</strong> Very unusual trading patterns</li>
                              <li>• <strong>Red Alert icon:</strong> Immediate attention needed</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>How to use it:</h4>
                            <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                              <li>• Sort by "Priority Score" to see the most important alerts first</li>
                              <li>• Click "View on TradingView" to analyze the coin's chart</li>
                              <li>• Check multiple timeframes before making decisions</li>
                            </ul>
                          </div>
                          <div 
                            className="p-4 rounded-md border-l-4"
                            style={{
                              backgroundColor: theme === 'dark' ? '#14532d' : '#f0fdf4',
                              borderColor: theme === 'dark' ? '#166534' : '#86efac',
                              borderLeftColor: '#22c55e'
                            }}
                          >
                            <p className="text-sm font-medium" style={{ color: theme === 'dark' ? '#22c55e' : '#15803d' }}>
                              <strong>💡 Trading Tip:</strong> Don't blindly follow whale activity - use it as a signal to do your own research.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Open Interest */}
                      <div 
                        className="p-6 mb-8 rounded-lg border"
                        style={{
                          backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                          borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                        }}
                      >
                        <h3 
                          className="text-2xl font-semibold mb-6 flex items-center gap-3"
                          style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                        >
                          <BarChart3Icon className="h-5 w-5" />
                          💹 Open Interest - Market Leverage Insights
                        </h3>
                        <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="mb-4">
                          <strong>What it does:</strong> Shows how much leverage (borrowed money) is being used to trade each coin.
                        </p>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Key signals:</h4>
                            <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                              <li>• <strong>Rising Open Interest + Rising Price:</strong> Strong uptrend with new money</li>
                              <li>• <strong>Falling Open Interest + Falling Price:</strong> Weak trend, people closing positions</li>
                              <li>• <strong>High OI + Low Volume:</strong> Market might be overleveraged (risky)</li>
                              <li>• <strong>Sudden OI drop:</strong> Could signal a major move coming</li>
                            </ul>
                          </div>
                          <div 
                            className="p-4 rounded-md border-l-4"
                            style={{
                              backgroundColor: theme === 'dark' ? '#14532d' : '#f0fdf4',
                              borderColor: theme === 'dark' ? '#166534' : '#86efac',
                              borderLeftColor: '#22c55e'
                            }}
                          >
                            <p className="text-sm font-medium" style={{ color: theme === 'dark' ? '#22c55e' : '#15803d' }}>
                              <strong>⚠️ Warning:</strong> Very high open interest can lead to liquidation cascades - be careful with leverage.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Candlestick Screener */}
                      <div 
                        className="p-6 mb-8 rounded-lg border"
                        style={{
                          backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                          borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                        }}
                      >
                        <h3 
                          className="text-2xl font-semibold mb-6 flex items-center gap-3"
                          style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                        >
                          <ChartCandlestickIcon className="h-5 w-5" />
                          🕯️ Pattern Screener - Auto-Find Trading Setups
                        </h3>
                        <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="mb-4">
                          <strong>What it does:</strong> Automatically finds bullish and bearish candlestick patterns across 300+ coins.
                        </p>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Pattern meanings:</h4>
                            <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                              <li>• <strong>Bullish Engulfing:</strong> Buyer took control, potential upward move</li>
                              <li>• <strong>Bearish Engulfing:</strong> Sellers took control, potential downward move</li>
                              <li>• <strong>Higher volume:</strong> Stronger signal, more reliable pattern</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>How to use it:</h4>
                            <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                              <li>• Switch between timeframes (1H, 4H, 1D) using tabs</li>
                              <li>• Look for patterns with high volume for better reliability</li>
                              <li>• Click any coin to open its chart on TradingView</li>
                              <li>• Focus on coins you recognize or have researched</li>
                            </ul>
                          </div>
                          <div 
                            className="p-4 rounded-md border-l-4"
                            style={{
                              backgroundColor: theme === 'dark' ? '#14532d' : '#f0fdf4',
                              borderColor: theme === 'dark' ? '#166534' : '#86efac',
                              borderLeftColor: '#22c55e'
                            }}
                          >
                            <p className="text-sm font-medium" style={{ color: theme === 'dark' ? '#22c55e' : '#15803d' }}>
                              <strong>💡 Best Practice:</strong> Always confirm patterns on multiple timeframes before trading.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Watchlists Manager */}
                      <div 
                        className="p-6 mb-8 rounded-lg border"
                        style={{
                          backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                          borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                        }}
                      >
                        <h3 
                          className="text-2xl font-semibold mb-6 flex items-center gap-3"
                          style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                        >
                          <ListIcon className="h-5 w-5" />
                          📋 Watchlist Builder - Create Custom Lists
                        </h3>
                        <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="mb-4">
                          <strong>What it does:</strong> Creates organized lists of coins by category that you can import into TradingView.
                        </p>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Step-by-step guide:</h4>
                            <ol style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4 list-decimal">
                              <li>Choose your exchange (Bybit, Binance, etc.)</li>
                              <li>Pick category type: Market Trends (trending, gainers) or Crypto Sectors (DeFi, AI, Gaming)</li>
                              <li>Select specific category from the buttons or dropdown</li>
                              <li>Set how many coins you want (20-200)</li>
                              <li>Use filters if needed (minimum volume, price change, etc.)</li>
                              <li>Download as "Spot" for regular trading or "Perp" for futures</li>
                            </ol>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Importing to TradingView:</h4>
                            <ol style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4 list-decimal">
                              <li>Go to TradingView.com</li>
                              <li>Click "Watchlist" → "Import list"</li>
                              <li>Upload the downloaded .txt file</li>
                              <li>Your custom list appears in TradingView!</li>
                            </ol>
                          </div>
                          <div 
                            className="p-4 rounded-md border-l-4"
                            style={{
                              backgroundColor: theme === 'dark' ? '#14532d' : '#f0fdf4',
                              borderColor: theme === 'dark' ? '#166534' : '#86efac',
                              borderLeftColor: '#22c55e'
                            }}
                          >
                            <p className="text-sm font-medium" style={{ color: theme === 'dark' ? '#22c55e' : '#15803d' }}>
                              <strong>🚀 Time Saver:</strong> Create sector-specific watchlists to quickly monitor your favorite niches like DeFi or AI coins.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trading Strategies Section */}
                {activeSection === 'strategies' && (
                  <div className="space-y-8">
                    <div>
                      <h2 
                        className="text-3xl font-bold mb-4 flex items-center gap-3"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        <BarChart3Icon className="h-8 w-8" style={{ color: theme === 'dark' ? '#6366f1' : '#3b82f6' }} />
                        Trading Strategies Using Perpflow
                      </h2>
                      <p 
                        className="text-lg mb-6"
                        style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}
                      >
                        Proven approaches to combine our tools for better trading decisions.
                      </p>
                    </div>

                    <div 
                      className="p-6 mb-8 rounded-lg border"
                      style={{
                        backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                        borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                      }}
                    >
                      <h3 
                        className="text-3xl font-semibold mb-6 leading-tight"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        🔥 Strategy 1: Momentum + Whale Confirmation
                      </h3>
                      <div className="space-y-4">
                        <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                          <strong>Best for:</strong> Catching strong trending moves with institutional backing.
                        </p>
                        <div>
                          <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Step-by-step process:</h4>
                          <ol style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-2 ml-4 list-decimal">
                            <li><strong>Find momentum:</strong> Use Trend Analysis to find coins in "Strongest" category on both 4H and 1D timeframes</li>
                            <li><strong>Check whale activity:</strong> Look for the same coins in Institutional Tracker with Priority Score 70+</li>
                            <li><strong>Confirm with patterns:</strong> Check if the coin has bullish engulfing patterns in the Candlestick Screener</li>
                            <li><strong>Verify open interest:</strong> Ensure OI is rising with price (indicates fresh long positions)</li>
                            <li><strong>Entry:</strong> Enter on pullbacks to support levels</li>
                          </ol>
                        </div>
                        <div 
                          className="p-4 rounded-md border-l-4"
                          style={{
                            backgroundColor: theme === 'dark' ? '#14532d' : '#f0fdf4',
                            borderColor: theme === 'dark' ? '#166534' : '#86efac',
                            borderLeftColor: '#22c55e'
                          }}
                        >
                          <p className="text-sm" style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                            <strong>✨ Success Rate:</strong> Higher success rate due to multiple confirmations, but fewer signals.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="p-6 mb-8 rounded-lg border"
                      style={{
                        backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                        borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                      }}
                    >
                      <h3 
                        className="text-3xl font-semibold mb-6 leading-tight"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        🎯 Strategy 2: Reversal Hunting
                      </h3>
                      <div className="space-y-4">
                        <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                          <strong>Best for:</strong> Catching oversold bounces and trend reversals.
                        </p>
                        <div>
                          <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Step-by-step process:</h4>
                          <ol style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-2 ml-4 list-decimal">
                            <li><strong>Find oversold coins:</strong> Look in "Weakest" performers that have dropped 15%+ in 24h</li>
                            <li><strong>Check for whale accumulation:</strong> Look for high Priority Scores despite falling prices</li>
                            <li><strong>Wait for bullish pattern:</strong> Use Candlestick Screener to spot bullish engulfing on 4H or 1D</li>
                            <li><strong>Monitor OI:</strong> Falling OI with falling price = weak hands selling out</li>
                            <li><strong>Entry:</strong> Enter when pattern completes with volume confirmation</li>
                          </ol>
                        </div>
                        <div 
                          className="p-4 rounded-md border-l-4"
                          style={{
                            backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                            border: theme === 'dark' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.2)'
                          }}
                        >
                          <p className="text-sm" style={{ color: theme === 'dark' ? '#ef4444' : '#dc2626' }}>
                            <strong>⚠️ Risk Warning:</strong> Counter-trend trading is riskier - use smaller position sizes.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="p-6 mb-8 rounded-lg border"
                      style={{
                        backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                        borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                      }}
                    >
                      <h3 
                        className="text-3xl font-semibold mb-6 leading-tight"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        📋 Strategy 3: Sector Rotation
                      </h3>
                      <div className="space-y-4">
                        <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                          <strong>Best for:</strong> Identifying which crypto sectors are gaining or losing favor.
                        </p>
                        <div>
                          <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Step-by-step process:</h4>
                          <ol style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-2 ml-4 list-decimal">
                            <li><strong>Create sector watchlists:</strong> Use Watchlist Manager to build DeFi, AI, Gaming, Layer-1 lists</li>
                            <li><strong>Compare performance:</strong> Add these lists to Multi-Ticker Chart to see which sector leads</li>
                            <li><strong>Find sector leaders:</strong> Identify the strongest coin in the winning sector</li>
                            <li><strong>Check whale activity:</strong> Verify institutions are rotating into this sector</li>
                            <li><strong>Entry strategy:</strong> Buy sector leaders on dips, sell when sector rotation ends</li>
                          </ol>
                        </div>
                        <div 
                          className="p-4 rounded-md border-l-4"
                          style={{
                            backgroundColor: theme === 'dark' ? '#14532d' : '#f0fdf4',
                            borderColor: theme === 'dark' ? '#166534' : '#86efac',
                            borderLeftColor: '#22c55e'
                          }}
                        >
                          <p className="text-sm" style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                            <strong>💰 Long-term Edge:</strong> Sector rotation can provide weeks of trending moves.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="p-6 mb-8 rounded-lg border"
                      style={{
                        backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                        borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                      }}
                    >
                      <h3 
                        className="text-3xl font-semibold mb-6 leading-tight"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        ⚡ Strategy 4: Scalping with Real-time Alerts
                      </h3>
                      <div className="space-y-4">
                        <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                          <strong>Best for:</strong> Quick trades based on immediate market reactions.
                        </p>
                        <div>
                          <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Step-by-step process:</h4>
                          <ol style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-2 ml-4 list-decimal">
                            <li><strong>Monitor alerts:</strong> Keep Institutional Tracker open, watch for red alert icons</li>
                            <li><strong>Quick analysis:</strong> When alert appears, immediately check 1H candlestick patterns</li>
                            <li><strong>Volume confirmation:</strong> Ensure unusual volume supports the move</li>
                            <li><strong>Fast execution:</strong> Enter within 5-10 minutes of alert</li>
                            <li><strong>Quick exits:</strong> Take profits at 2-5% or stop loss at 1-2%</li>
                          </ol>
                        </div>
                        <div 
                          className="p-4 rounded-md border-l-4"
                          style={{
                            backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                            border: theme === 'dark' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.2)'
                          }}
                        >
                          <p className="text-sm" style={{ color: theme === 'dark' ? '#ef4444' : '#dc2626' }}>
                            <strong>🚀 High Frequency:</strong> This strategy requires constant monitoring and quick reflexes.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="p-6 mb-8 rounded-lg border"
                      style={{
                        backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                        borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                      }}
                    >
                      <h3 
                        className="text-3xl font-semibold mb-6 leading-tight"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        🛡️ Universal Risk Management Rules
                      </h3>
                      <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 font-bold">•</span>
                          <span><strong>Never risk more than 2-5% per trade:</strong> Even the best signals can fail</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 font-bold">•</span>
                          <span><strong>Always set stop losses:</strong> Decide your exit before entering</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 font-bold">•</span>
                          <span><strong>Don't chase after missing entries:</strong> Wait for the next setup</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 font-bold">•</span>
                          <span><strong>Keep a trading journal:</strong> Track what works and what doesn't</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 font-bold">•</span>
                          <span><strong>Start small:</strong> Test strategies with small amounts first</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Pro Tips Section */}
                {activeSection === 'tips' && (
                  <div className="space-y-8">
                    <div>
                      <h2 
                        className="text-3xl font-bold mb-4 flex items-center gap-3"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        <EyeIcon className="h-8 w-8" style={{ color: theme === 'dark' ? '#6366f1' : '#3b82f6' }} />
                        Pro Tips & Best Practices
                      </h2>
                      <p 
                        className="text-lg mb-6"
                        style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}
                      >
                        Advanced techniques from experienced traders to maximize your edge.
                      </p>
                    </div>

                    <div 
                      className="p-6 mb-8 rounded-lg border"
                      style={{
                        backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                        borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                      }}
                    >
                      <h3 
                        className="text-3xl font-semibold mb-6 leading-tight"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        🦅 Reading Institutional Signals Like a Pro
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Priority Score Interpretation:</h4>
                          <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                            <li>• <strong>90-100:</strong> Extremely unusual activity - investigate immediately</li>
                            <li>• <strong>80-89:</strong> Strong signal - good entry opportunity</li>
                            <li>• <strong>70-79:</strong> Moderate signal - wait for confirmation</li>
                            <li>• <strong>Below 70:</strong> Normal activity - not actionable</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Advanced Whale Watching:</h4>
                          <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                            <li>• Look for multiple "XL" ratings across different timeframes</li>
                            <li>• Abnormality scores above 3.0 often predict major moves within 24-48 hours</li>
                            <li>• When manipulation score is high (80+), expect volatile price action</li>
                            <li>• Combine with decreasing supply on exchanges for strongest signal</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="p-6 mb-8 rounded-lg border"
                      style={{
                        backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                        borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                      }}
                    >
                      <h3 
                        className="text-3xl font-semibold mb-6 leading-tight"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        📊 Advanced Pattern Recognition
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Volume Analysis Secrets:</h4>
                          <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                            <li>• Bullish engulfing with 3x average volume = 80% success rate</li>
                            <li>• Patterns on declining volume often fail within 24 hours</li>
                            <li>• Compare volume to the previous 20 candles, not just the average</li>
                            <li>• Weekend patterns are less reliable due to lower volume</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Multi-Timeframe Confirmation:</h4>
                          <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                            <li>• Always check one timeframe higher before entering</li>
                            <li>• 1H patterns work best when 4H trend is aligned</li>
                            <li>• 4H patterns against daily trend need 2x volume to succeed</li>
                            <li>• Daily patterns override all lower timeframe signals</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="p-6 mb-8 rounded-lg border"
                      style={{
                        backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                        borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                      }}
                    >
                      <h3 
                        className="text-3xl font-semibold mb-6 leading-tight"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        ⏰ Timing Your Entries and Exits
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Best Trading Times (UTC):</h4>
                          <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                            <li>• <strong>13:00-17:00:</strong> US market open - highest volume and volatility</li>
                            <li>• <strong>08:00-12:00:</strong> European session - good for trend continuation</li>
                            <li>• <strong>00:00-02:00:</strong> Asian session start - momentum often changes</li>
                            <li>• <strong>Avoid 18:00-23:00:</strong> Low volume "dead zone"</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Exit Strategies:</h4>
                          <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                            <li>• <strong>Scale out:</strong> Take 50% profit at 1:2 risk/reward, let rest run</li>
                            <li>• <strong>Trailing stops:</strong> Use 4H candle closes for swing trades</li>
                            <li>• <strong>Time-based exits:</strong> Close positions before major news events</li>
                            <li>• <strong>Volume divergence:</strong> Exit when volume doesn't support price moves</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="p-6 mb-8 rounded-lg border"
                      style={{
                        backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                        borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                      }}
                    >
                      <h3 
                        className="text-3xl font-semibold mb-6 leading-tight"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        🧠 Psychology and Mindset Hacks
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Avoiding Common Mistakes:</h4>
                          <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                            <li>• <strong>FOMO prevention:</strong> Wait for your setup, don't chase green candles</li>
                            <li>• <strong>Confirmation bias:</strong> Look for reasons your trade might fail</li>
                            <li>• <strong>Overtrading cure:</strong> Set maximum 3 trades per day</li>
                            <li>• <strong>Loss recovery:</strong> Don't increase size after losses</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Performance Optimization:</h4>
                          <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                            <li>• <strong>Track your best setups:</strong> Note which tool combinations work for you</li>
                            <li>• <strong>Review weekly:</strong> Analyze wins and losses every Sunday</li>
                            <li>• <strong>Focus on process:</strong> Good process leads to good results</li>
                            <li>• <strong>Stay updated:</strong> Market conditions change, adapt your approach</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="p-6 mb-8 rounded-lg border"
                      style={{
                        backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                        borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                      }}
                    >
                      <h3 
                        className="text-3xl font-semibold mb-6 leading-tight"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        🗺 Platform Optimization Tips
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Workflow Efficiency:</h4>
                          <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                            <li>• <strong>Bookmark key URLs:</strong> Save direct links to each tool with your preferred settings</li>
                            <li>• <strong>Multiple tabs:</strong> Keep Institutional Tracker open in one tab for alerts</li>
                            <li>• <strong>Keyboard shortcuts:</strong> Ctrl+T for new tab, Ctrl+R to refresh data</li>
                            <li>• <strong>Mobile usage:</strong> Use phone for quick checks, computer for detailed analysis</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Data Refresh Strategy:</h4>
                          <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                            <li>• <strong>Institutional data:</strong> Refreshes every 10 seconds automatically</li>
                            <li>• <strong>Patterns:</strong> Update every hour, manually refresh for latest</li>
                            <li>• <strong>Trend analysis:</strong> Refresh every 30 seconds during active trading</li>
                            <li>• <strong>Watchlists:</strong> Update when you see new opportunities</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Understanding the Data Section */}
                {activeSection === 'understanding' && (
                  <div className="space-y-8">
                    <div>
                      <h2 
                        className="text-3xl font-bold mb-4 flex items-center gap-3"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        <ChartCandlestickIcon className="h-8 w-8" style={{ color: theme === 'dark' ? '#6366f1' : '#3b82f6' }} />
                        Understanding the Data
                      </h2>
                      <p 
                        className="text-lg mb-6"
                        style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}
                      >
                        Learn what each number means and how to interpret the signals correctly.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Institutional Metrics */}
                      <div 
                        className="p-6 mb-8 rounded-lg border"
                        style={{
                          backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                          borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                        }}
                      >
                        <h3 
                          className="text-3xl font-semibold mb-6 leading-tight"
                          style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                        >
                          🦅 Institutional Activity Metrics Explained
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Priority Score (0-100):</h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="mb-2">
                              A composite score that combines volume, price movement, and statistical anomalies. Higher scores indicate more significant activity.
                            </p>
                            <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                              <li>• <strong>0-50:</strong> Normal market activity</li>
                              <li>• <strong>51-70:</strong> Elevated activity, worth monitoring</li>
                              <li>• <strong>71-85:</strong> Significant activity, potential opportunity</li>
                              <li>• <strong>86-100:</strong> Extreme activity, immediate attention required</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Whale Rating (S, M, L, XL):</h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="mb-2">
                              Categorizes the size of trading positions relative to typical market activity.
                            </p>
                            <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                              <li>• <strong>S (Small):</strong> 1-5x average position size</li>
                              <li>• <strong>M (Medium):</strong> 5-15x average position size</li>
                              <li>• <strong>L (Large):</strong> 15-50x average position size</li>
                              <li>• <strong>XL (Extra Large):</strong> 50x+ average position size</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Abnormality Score (0-5+):</h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="mb-2">
                              Measures how unusual the current activity is compared to historical patterns. Based on statistical standard deviations.
                            </p>
                            <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                              <li>• <strong>0-1.0:</strong> Normal market behavior</li>
                              <li>• <strong>1.0-2.0:</strong> Slightly unusual activity</li>
                              <li>• <strong>2.0-3.0:</strong> Significantly abnormal (2σ event)</li>
                              <li>• <strong>3.0+:</strong> Extremely rare event (3σ+)</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Manipulation Score (0-100):</h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              Indicates the likelihood of coordinated trading activity. High scores suggest potential market manipulation or coordinated institutional moves.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Market Data Interpretation */}
                      <div 
                        className="p-6 mb-8 rounded-lg border"
                        style={{
                          backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                          borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                        }}
                      >
                        <h3 
                          className="text-3xl font-semibold mb-6 leading-tight"
                          style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                        >
                          💹 Open Interest & Volume Interpretation
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>What is Open Interest?</h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              Open Interest (OI) is the total number of outstanding derivative contracts (futures/options) that haven't been settled. It represents the total amount of leverage in the market.
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Key Scenarios:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div 
                                className="p-4 rounded-md border-l-4"
                                style={{
                                  backgroundColor: theme === 'dark' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                                  border: theme === 'dark' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(34, 197, 94, 0.2)'
                                }}
                              >
                                <h5 className="font-semibold text-green-500 mb-2">📈 Bullish Signals</h5>
                                <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 text-sm">
                                  <li>• Rising price + Rising OI = Strong uptrend</li>
                                  <li>• Falling price + Falling OI = Short covering</li>
                                  <li>• High volume + Rising OI = New money entering</li>
                                </ul>
                              </div>
                              <div 
                                className="p-4 rounded-md border-l-4"
                                style={{
                                  backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                                  border: theme === 'dark' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.2)'
                                }}
                              >
                                <h5 className="font-semibold text-red-500 mb-2">📉 Bearish Signals</h5>
                                <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 text-sm">
                                  <li>• Falling price + Rising OI = New short positions</li>
                                  <li>• Rising price + Falling OI = Long liquidation</li>
                                  <li>• Very high OI = Potential liquidation cascade</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Candlestick Patterns */}
                      <div 
                        className="p-6 mb-8 rounded-lg border"
                        style={{
                          backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                          borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                        }}
                      >
                        <h3 
                          className="text-3xl font-semibold mb-6 leading-tight"
                          style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                        >
                          🕯️ Candlestick Pattern Success Rates
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Pattern Reliability by Timeframe:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h5 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>1H Patterns</h5>
                                <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 text-sm">
                                  <li>• Success rate: 55-65%</li>
                                  <li>• Best for: Quick scalps</li>
                                  <li>• Duration: 2-8 hours</li>
                                  <li>• Risk: Higher false signals</li>
                                </ul>
                              </div>
                              <div>
                                <h5 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>4H Patterns</h5>
                                <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 text-sm">
                                  <li>• Success rate: 65-75%</li>
                                  <li>• Best for: Swing trades</li>
                                  <li>• Duration: 1-3 days</li>
                                  <li>• Risk: Balanced approach</li>
                                </ul>
                              </div>
                              <div>
                                <h5 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>1D Patterns</h5>
                                <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 text-sm">
                                  <li>• Success rate: 75-85%</li>
                                  <li>• Best for: Position trades</li>
                                  <li>• Duration: 1-2 weeks</li>
                                  <li>• Risk: Most reliable</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#1A1F16' }}>Volume Requirements for Validation:</h4>
                            <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1 ml-4">
                              <li>• <strong>Minimum:</strong> 1.5x average volume (basic confirmation)</li>
                              <li>• <strong>Good:</strong> 2x average volume (solid signal)</li>
                              <li>• <strong>Excellent:</strong> 3x+ average volume (high confidence)</li>
                              <li>• <strong>Warning:</strong> Below average volume = likely false signal</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Update Frequencies */}
                      <div 
                        className="p-6 mb-8 rounded-lg border"
                        style={{
                          backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                          borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                        }}
                      >
                        <h3 
                          className="text-3xl font-semibold mb-6 leading-tight"
                          style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                        >
                          ⏱️ Data Freshness & Update Cycles
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 
                              className="font-semibold mb-2"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Real-time Data (Auto-updates)
                            </h4>
                            <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1">
                              <li>• <strong>Institutional tracker:</strong> Every 10 seconds</li>
                              <li>• <strong>Price data:</strong> Live streaming</li>
                              <li>• <strong>Trend analysis:</strong> Every 30 seconds</li>
                              <li>• <strong>Open interest:</strong> Every 1 minute</li>
                            </ul>
                          </div>
                          <div>
                            <h4 
                              className="font-semibold mb-2"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Cached Data (Manual refresh)
                            </h4>
                            <ul style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }} className="space-y-1">
                              <li>• <strong>Candlestick patterns:</strong> Every hour</li>
                              <li>• <strong>Historical data:</strong> Daily at midnight</li>
                              <li>• <strong>Watchlist data:</strong> On-demand generation</li>
                              <li>• <strong>Multi-ticker charts:</strong> User controlled</li>
                            </ul>
                          </div>
                        </div>
                        <div 
                          className="mt-4 p-4 rounded-lg"
                          style={{
                            backgroundColor: theme === 'dark' ? '#14532d' : '#f0fdf4',
                            borderColor: theme === 'dark' ? '#166534' : '#86efac',
                            borderLeftColor: '#22c55e'
                          }}
                        >
                          <p className="text-sm" style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                            <strong>💡 Pro Tip:</strong> When you see a signal, verify it's recent by checking the timestamp. Institutional alerts older than 5 minutes may have already been acted upon by others.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Common Questions Section */}
                {activeSection === 'troubleshooting' && (
                  <div className="space-y-8">
                    <div>
                      <h2 
                        className="text-3xl font-bold mb-4 flex items-center gap-3"
                        style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      >
                        <ListIcon className="h-8 w-8" style={{ color: theme === 'dark' ? '#6366f1' : '#3b82f6' }} />
                        Common Questions & Answers
                      </h2>
                      <p 
                        className="text-lg mb-6"
                        style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}
                      >
                        Find answers to the most frequently asked questions about using Perpflow.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Trading Questions */}
                      <div 
                        className="p-6 mb-8 rounded-lg border"
                        style={{
                          backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                          borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                        }}
                      >
                        <h3 
                          className="text-3xl font-semibold mb-6 leading-tight"
                          style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                        >
                          💹 Trading & Signals
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <h4 
                              className="font-semibold mb-2"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Q: How accurate are the whale signals?
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              A: Signals with Priority Score 80+ have approximately 70-75% accuracy for directional moves within 24-48 hours. However, they should always be combined with your own technical analysis and risk management.
                            </p>
                          </div>

                          <div>
                            <h4 
                              className="font-semibold mb-2"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Q: Should I trade every signal I see?
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              A: No! Quality over quantity. Focus on signals that meet multiple criteria: high priority score, good timeframe alignment, volume confirmation, and patterns you understand. It's better to take 2-3 high-quality trades than 10 mediocre ones.
                            </p>
                          </div>

                          <div>
                            <h4 
                              className="font-semibold mb-2"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Q: What's the best timeframe for beginners?
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              A: Start with 4H and 1D patterns. They're more reliable and give you time to think. 1H patterns move too fast for new traders, while daily patterns might tie up capital too long.
                            </p>
                          </div>

                          <div>
                            <h4 
                              className="font-semibold mb-2"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Q: How much should I risk per trade?
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              A: Never risk more than 2-5% of your account per trade. Even if you're 90% confident, the market can still surprise you. Consistent small gains beat one big loss.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Technical Questions */}
                      <div 
                        className="p-6 mb-8 rounded-lg border"
                        style={{
                          backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                          borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                        }}
                      >
                        <h3 
                          className="text-3xl font-semibold mb-6 leading-tight"
                          style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                        >
                          ⚙️ Technical & Platform
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <h4 
                              className="font-semibold mb-2"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Q: Why is the data sometimes slow to load?
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              A: The platform processes real-time data from Bybit's API which can occasionally have delays. If data seems stale, try refreshing the page. Most data updates automatically every 10-30 seconds.
                            </p>
                          </div>

                          <div>
                            <h4 
                              className="font-semibold mb-2"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Q: Can I use this on mobile?
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              A: Yes! The platform is fully responsive. However, for detailed analysis, a computer screen is recommended. Mobile is great for quick checks and alerts.
                            </p>
                          </div>

                          <div>
                            <h4 
                              className="font-semibold mb-2"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Q: Do I need a Bybit account to use this?
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              A: No! This is a read-only analysis platform. You don't need any exchange accounts. However, you'll need a trading account somewhere to act on the signals.
                            </p>
                          </div>

                          <div>
                            <h4 
                              className="font-semibold mb-2"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Q: How do I import watchlists to TradingView?
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              A: Download the .txt file from the Watchlist Manager, then in TradingView go to Watchlists → Import List → upload your file. Make sure to select the correct exchange format when downloading.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Strategy Questions */}
                      <div 
                        className="p-6 mb-8 rounded-lg border"
                        style={{
                          backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                          borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                        }}
                      >
                        <h3 
                          className="text-3xl font-semibold mb-6 leading-tight"
                          style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                        >
                          🎯 Strategy & Approach
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <h4 
                              className="font-semibold mb-2"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Q: What's the best tool for day trading?
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              A: For day trading, combine the Institutional Tracker (for immediate alerts) with 1H Candlestick Patterns. Keep the Multi-Ticker Chart open to monitor your positions and compare with broader market moves.
                            </p>
                          </div>

                          <div>
                            <h4 
                              className="font-semibold mb-2"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Q: How do I find the next big winner?
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              A: Look for coins that appear in multiple tools: trending in Trend Analysis, showing institutional activity, AND forming bullish patterns. Also monitor sector rotation using the Watchlist Manager.
                            </p>
                          </div>

                          <div>
                            <h4 
                              className="font-semibold mb-2"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Q: Should I follow whale trades exactly?
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              A: No! Whales have different goals, timeframes, and risk tolerances than retail traders. Use whale activity as a signal for direction and timing, but always do your own analysis and use proper position sizing.
                            </p>
                          </div>

                          <div>
                            <h4 
                              className="font-semibold mb-2"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Q: What's the biggest mistake new users make?
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              A: Over-trading and not having a plan. They see every signal as an opportunity instead of waiting for high-quality setups. Start by paper trading your strategy for at least 2 weeks before using real money.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Data Questions */}
                      <div 
                        className="p-6 mb-8 rounded-lg border"
                        style={{
                          backgroundColor: theme === 'dark' ? '#262626' : '#f8fafc',
                          borderColor: theme === 'dark' ? '#404040' : '#e2e8f0'
                        }}
                      >
                        <h3 
                          className="text-3xl font-semibold mb-6 leading-tight"
                          style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                        >
                          📈 Understanding the Numbers
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <h4 
                              className="font-semibold mb-2"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Q: What does "abnormality 2.5" actually mean?
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              A: It means the current trading activity is 2.5 standard deviations above normal - statistically, this should only happen about 1% of the time. It's a strong signal that something unusual is happening.
                            </p>
                          </div>

                          <div>
                            <h4 
                              className="font-semibold mb-2"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Q: Why do some coins have low priority scores but high abnormality?
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              A: Priority score combines multiple factors. A coin might have unusual volume (high abnormality) but if the price isn't moving much or it's a small market cap coin, the overall priority could be lower.
                            </p>
                          </div>

                          <div>
                            <h4 
                              className="font-semibold mb-2"
                              style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                            >
                              Q: How fresh is the data?
                            </h4>
                            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                              A: Institutional alerts update every 10 seconds, price data is real-time, and patterns update when new candles close. Always check the timestamp on signals - anything older than 5 minutes may have already been acted upon.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Getting Started */}
                      <div 
                        className="p-6 rounded-lg"
                        style={{
                          backgroundColor: theme === 'dark' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                          border: theme === 'dark' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(34, 197, 94, 0.2)'
                        }}
                      >
                        <h3 
                          className="text-3xl font-semibold mb-6 leading-tight"
                          style={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                        >
                          🚀 Still Have Questions?
                        </h3>
                        <div className="space-y-3">
                          <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                            <strong>Start Simple:</strong> Begin with the Trend Analysis tab to get familiar with the interface. Practice identifying patterns without trading real money.
                          </p>
                          <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                            <strong>Learn Gradually:</strong> Focus on one tool at a time. Master the Institutional Tracker before moving to more complex strategies.
                          </p>
                          <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                            <strong>Paper Trade First:</strong> Test your understanding with virtual trades for at least 2 weeks before risking real capital.
                          </p>
                          <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                            <strong>Keep Learning:</strong> Markets evolve constantly. What works today might need adjustment tomorrow. Stay flexible and keep improving.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            {/* GitBook Style Navigation */}
            <div className="flex justify-between items-center mt-16 pt-8 border-t" style={{ borderColor: theme === 'dark' ? '#404040' : '#e2e8f0' }}>
              <div>
                {sections.findIndex(s => s.id === activeSection) > 0 && (
                  <button
                    onClick={() => {
                      const currentIndex = sections.findIndex(s => s.id === activeSection);
                      setActiveSection(sections[currentIndex - 1].id);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-md"
                    style={{
                      color: theme === 'dark' ? '#d1d5db' : '#4b5563',
                      backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6'
                    }}
                  >
                    <span>←</span>
                    <span>Previous</span>
                  </button>
                )}
              </div>
              <div>
                {sections.findIndex(s => s.id === activeSection) < sections.length - 1 && (
                  <button
                    onClick={() => {
                      const currentIndex = sections.findIndex(s => s.id === activeSection);
                      setActiveSection(sections[currentIndex + 1].id);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-md"
                    style={{
                      color: theme === 'dark' ? '#d1d5db' : '#4b5563',
                      backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6'
                    }}
                  >
                    <span>Next</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}