"use client";

import { useTheme } from '@/contexts/ThemeContext';
import { SunIcon, MoonIcon } from 'lucide-react';
import { Button } from './ui/button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="flex items-center space-x-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <>
          <MoonIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Dark</span>
        </>
      ) : (
        <>
          <SunIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Light</span>
        </>
      )}
    </Button>
  );
} 