// Simple in-memory tracker for coins that have appeared in top 10 lists
class Top10Tracker {
  private top10History = new Set<string>();
  private readonly STORAGE_KEY = 'bybit_top10_history';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const symbols = JSON.parse(stored);
          this.top10History = new Set(symbols);
        }
      } catch (error) {
        console.warn('Failed to load top 10 history from localStorage:', error);
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.top10History)));
      } catch (error) {
        console.warn('Failed to save top 10 history to localStorage:', error);
      }
    }
  }

  markAsTop10(symbols: string[]) {
    let hasNewEntries = false;
    for (const symbol of symbols) {
      if (!this.top10History.has(symbol)) {
        this.top10History.add(symbol);
        hasNewEntries = true;
      }
    }
    if (hasNewEntries) {
      this.saveToStorage();
    }
  }

  isNewToTop10(symbol: string): boolean {
    return !this.top10History.has(symbol);
  }

  getTop10History(): string[] {
    return Array.from(this.top10History);
  }

  clearHistory() {
    this.top10History.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}

export const top10Tracker = new Top10Tracker();
