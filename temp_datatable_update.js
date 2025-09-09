const fs = require('fs');

let content = fs.readFileSync('src/components/DataTable.tsx', 'utf8');

// Add import for Sparkles icon
content = content.replace(
  "import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';",
  "import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, ChevronDownIcon, ChevronUpIcon, SparklesIcon } from 'lucide-react';"
);

// Update the symbol cell to include the new indicator
const oldSymbolCell = `                <td className="px-1 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div 
                      className="text-xs sm:text-sm font-medium cursor-pointer transition-colors truncate"
                      style={{ color: theme === 'dark' ? '#ffffff' : 'var(--foreground)' }}
                      onClick={() => {
                        const symbol = coin.symbol.replace('USDT', '');
                        const tradingViewUrl = \`https://www.tradingview.com/chart/?symbol=BYBIT:\${symbol}USDT.P\`;
                        window.open(tradingViewUrl, '_blank');
                      }}
                      title={\`Open \${coin.symbol} chart on TradingView\`}
                    >
                      {coin.symbol.replace('USDT', '')}
                    </div>
                  </div>
                </td>`;

const newSymbolCell = `                <td className="px-1 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <div 
                      className="text-xs sm:text-sm font-medium cursor-pointer transition-colors truncate"
                      style={{ color: theme === 'dark' ? '#ffffff' : 'var(--foreground)' }}
                      onClick={() => {
                        const symbol = coin.symbol.replace('USDT', '');
                        const tradingViewUrl = \`https://www.tradingview.com/chart/?symbol=BYBIT:\${symbol}USDT.P\`;
                        window.open(tradingViewUrl, '_blank');
                      }}
                      title={\`Open \${coin.symbol} chart on TradingView\`}
                    >
                      {coin.symbol.replace('USDT', '')}
                    </div>
                    {coin.newToTop10 && (
                      <div 
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: theme === 'dark' ? '#4a7c59' : '#76ba94',
                          color: theme === 'dark' ? '#ffffff' : '#ffffff'
                        }}
                        title="New to Top 10"
                      >
                        <SparklesIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">New</span>
                      </div>
                    )}
                  </div>
                </td>`;

content = content.replace(oldSymbolCell, newSymbolCell);

fs.writeFileSync('src/components/DataTable.tsx', content);
console.log('Updated DataTable with new indicator');
