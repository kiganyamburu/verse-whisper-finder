import { Book, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-primary rounded-lg shadow-divine">
            <Book className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">VerseFinder</h1>
            <p className="text-sm text-muted-foreground">Discover Bible verses through voice</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="sm">
            How it Works
          </Button>
          <Button variant="ghost" size="sm">
            History
          </Button>
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Browse Verses
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;