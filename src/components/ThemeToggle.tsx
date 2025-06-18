"use client";

import { useTheme } from '@/contexts/ThemeContext';
import { SunIcon, MoonIcon } from 'lucide-react';
import { Button } from './ui/button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    // console.log('ThemeToggle clicked! Current theme:', theme);
    toggleTheme();
    // console.log('toggleTheme called');
  };

  // console.log('ThemeToggle rendering with theme:', theme);

  return (
    <div className="flex items-center gap-2">
     
      <Button
      variant="outline"
      onClick={handleToggle}
      className="flex items-center gap-0 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 h-4 sm:h-9 text-xs sm:text-sm min-h-0 bg-background text-foreground border-accent"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <>
          <MoonIcon className="w-4 h-4 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Dark</span>
        </>
      ) : (
        <>
          <SunIcon className="w-4 h-4 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Light</span>
        </>
      )}
    </Button>
    </div>
  );
} 