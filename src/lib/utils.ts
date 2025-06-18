import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPercentage(value: number): string {
  const formatted = value.toFixed(2);
  return value > 0 ? `+${formatted}%` : `${formatted}%`;
}

export function formatPrice(value: number): string {
  if (value >= 1) {
    return `$${value.toFixed(2)}`;
  } else if (value >= 0.01) {
    return `$${value.toFixed(4)}`;
  } else {
    return `$${value.toFixed(6)}`;
  }
}

export function formatVolume(value: number): string {
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

export function getPerformanceColor(value: number): string {
  if (value > 0) return 'text-green-600'
  if (value < 0) return 'text-red-600'
  return 'text-gray-600'
}

export function getPerformanceBgColor(value: number): string {
  if (value > 0) return 'bg-green-50 border-green-200'
  if (value < 0) return 'bg-red-50 border-red-200'
  return 'bg-gray-50 border-gray-200'
}

// Production-safe logging utilities
const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  log: (...args: any[]) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (!isProduction) {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (!isProduction) {
      console.info(...args);
    }
  }
};

// Suppress fetch errors in production
export const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, {
      ...options,
      // Add default headers to prevent some blocking
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PerpFlow/1.0)',
        'Accept': 'application/json',
        ...options?.headers,
      },
    });
    return response;
  } catch (error) {
    // Silently handle fetch errors in production
    if (!isProduction) {
      console.error('Fetch error:', error);
    }
    throw error;
  }
}; 