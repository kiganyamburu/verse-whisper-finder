'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { History, Heart, Trash2, ArrowRight, BookOpen } from 'lucide-react';
import { MatchResult } from '@/lib/matcher';
import {
  getFavorites,
  getHistory,
  removeFavorite,
  removeFromHistory,
  clearHistory,
  STORAGE_EVENT,
} from '@/lib/storage';

interface HistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectVerse: (verse: MatchResult) => void;
}

export function HistoryDrawer({ open, onOpenChange, onSelectVerse }: HistoryDrawerProps) {
  const [favorites, setFavorites] = useState<MatchResult[]>([]);
  const [history, setHistory] = useState<MatchResult[]>([]);

  const loadData = () => {
    setFavorites(getFavorites());
    setHistory(getHistory());
  };

  useEffect(() => {
    loadData();
    window.addEventListener(STORAGE_EVENT, loadData);
    return () => {
      window.removeEventListener(STORAGE_EVENT, loadData);
    };
  }, []);

  const handleSelect = (verse: MatchResult) => {
    onSelectVerse(verse);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-6">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Scripture Vault
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Access your recent voice queries and bookmarked scripture verses.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="history" className="flex-1 flex flex-col mt-2">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="history" className="flex items-center gap-2 text-xs">
              <History className="h-3.5 w-3.5" />
              Recent ({history.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2 text-xs">
              <Heart className="h-3.5 w-3.5" />
              Favorites ({favorites.length})
            </TabsTrigger>
          </TabsList>

          {/* History Tab */}
          <TabsContent value="history" className="flex-1 flex flex-col min-h-0">
            {history.length > 0 && (
              <div className="flex justify-end mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearHistory()}
                  className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Clear History
                </Button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {history.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                  <History className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm font-medium">No recent searches</p>
                  <p className="text-xs mt-1">Verses you identify or search for will appear here.</p>
                </div>
              ) : (
                history.map((verse, idx) => (
                  <div
                    key={`${verse.reference}-${idx}`}
                    className="p-3 rounded-lg border border-border/70 bg-card hover:bg-accent/40 transition-colors flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-primary">{verse.reference}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromHistory(verse.reference)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelect(verse)}
                          className="h-7 text-xs px-2.5"
                        >
                          View
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">
                      "{verse.text}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mt-2">
              {favorites.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                  <Heart className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm font-medium">No favorites saved</p>
                  <p className="text-xs mt-1">Click the heart button on any verse to save it here.</p>
                </div>
              ) : (
                favorites.map((verse, idx) => (
                  <div
                    key={`${verse.reference}-${idx}`}
                    className="p-3 rounded-lg border border-border/70 bg-card hover:bg-accent/40 transition-colors flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-primary">{verse.reference}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFavorite(verse.reference)}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          title="Remove from favorites"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelect(verse)}
                          className="h-7 text-xs px-2.5"
                        >
                          View
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">
                      "{verse.text}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

