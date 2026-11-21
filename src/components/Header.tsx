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
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="p-2 bg-gradient-primary rounded-lg shadow-divine">
            <Book className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">VerseFinder</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Discover Bible verses through voice</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1 sm:gap-2 mr-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onHowItWorks || (() => handleScroll('how-it-works'))}
              className="text-xs sm:text-sm hidden sm:inline-flex"
            >
              <HelpCircle className="h-4 w-4 mr-1 sm:mr-1.5 opacity-70" />
              How it Works
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenHistory}
              className="text-xs sm:text-sm"
            >
              <History className="h-4 w-4 mr-1 sm:mr-1.5 text-primary" />
              History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onBrowseVerses || (() => handleScroll('main-app'))}
              className="text-xs sm:text-sm"
            >
              <Search className="h-4 w-4 mr-1 sm:mr-1.5" />
              Browse Verses
            </Button>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
