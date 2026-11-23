'use client';

import { Book, Search, History, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

interface HeaderProps {
  onOpenHistory?: () => void;
  onBrowseVerses?: () => void;
  onHowItWorks?: () => void;
}

const Header = ({ onOpenHistory, onBrowseVerses, onHowItWorks }: HeaderProps) => {
  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border w-full">
      <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 max-w-7xl">
        {/* Brand Logo & Name */}
        <div 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none shrink-0"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="p-1.5 sm:p-2 bg-gradient-primary rounded-lg shadow-divine">
            <Book className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight">VerseFinder</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden md:block">Discover Bible verses through voice</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onHowItWorks || (() => handleScroll('how-it-works'))}
              className="text-xs sm:text-sm hidden lg:inline-flex h-8 sm:h-9 px-2 sm:px-3"
            >
              <HelpCircle className="h-4 w-4 mr-1 opacity-70" />
              How it Works
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenHistory}
              className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 flex items-center"
            >
              <History className="h-4 w-4 sm:mr-1.5 text-primary shrink-0" />
              <span className="hidden sm:inline">History</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onBrowseVerses || (() => handleScroll('main-app'))}
              className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 flex items-center"
            >
              <Search className="h-4 w-4 sm:mr-1.5 shrink-0" />
              <span className="hidden sm:inline">Browse</span>
              <span className="sm:hidden text-xs">Search</span>
            </Button>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
