'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Copy, Share2, Heart, BookOpen, Sparkles, AlertCircle, ListFilter, Check, Loader2, Volume2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MatchResult } from '@/lib/matcher';
import { toast } from 'sonner';
import { isFavorite, toggleFavorite, addToHistory, STORAGE_EVENT } from '@/lib/storage';

interface VerseResultsProps {
  matchedVerse?: MatchResult | null;
  matches?: MatchResult[];
  onSelectMatch?: (verse: MatchResult) => void;
}

const DEFAULT_VERSE: MatchResult = {
  reference: 'Psalm 23:1',
  text: 'The LORD is my shepherd; I shall not want.',
  context: 'A psalm of David expressing deep trust in divine guidance, provision, and peace.',
  confidence: 96,
  chapter: 'Psalm 23',
  theme: 'Trust & Protection'
};

const AVAILABLE_TRANSLATIONS = [
  { id: 'KJV', label: 'KJV (King James)' },
  { id: 'NIV', label: 'NIV (New International)' },
  { id: 'ESV', label: 'ESV (English Standard)' },
  { id: 'NASB', label: 'NASB (New American)' },
  { id: 'NLT', label: 'NLT (New Living)' },
  { id: 'WEB', label: 'WEB (World English)' },
  { id: 'YLT', label: 'YLT (Young’s Literal)' },
];

const VerseResults = ({ matchedVerse, matches = [], onSelectMatch }: VerseResultsProps) => {
  const [translation, setTranslation] = useState('KJV');
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);
  const [copied, setCopied] = useState(false);
  const [favorited, setFavorited] = useState(false);

  // Text-to-speech and audio alignment state
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const [speakingWordIndex, setSpeakingWordIndex] = useState<number | null>(null);

  const activeVerse = matchedVerse || matches[0] || DEFAULT_VERSE;

  // Sync favorites state and add to search history
  useEffect(() => {
    if (activeVerse?.reference) {
      setFavorited(isFavorite(activeVerse.reference));
      addToHistory(activeVerse);
      // Reset translation cache when active verse changes
      setTranslatedTexts({});
      setTranslation('KJV');
    }
  }, [activeVerse?.reference]);

  // Listen for storage changes from other components
  useEffect(() => {
    const handleStorageUpdate = () => {
      if (activeVerse?.reference) {
        setFavorited(isFavorite(activeVerse.reference));
      }
    };
    window.addEventListener(STORAGE_EVENT, handleStorageUpdate);
    return () => window.removeEventListener(STORAGE_EVENT, handleStorageUpdate);
  }, [activeVerse?.reference]);

  // Determine current display text based on selected translation
  const currentDisplayText = translation === 'KJV'
    ? activeVerse.text
    : (translatedTexts[translation] || activeVerse.text);

  // Split current text into words with character offsets for precise word-by-word highlighting
  const wordsWithOffsets = useMemo(() => {
    const regex = /\S+/g;
    const list: { word: string; start: number; end: number }[] = [];
    let match;
    while ((match = regex.exec(currentDisplayText)) !== null) {
      list.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
    return list;
  }, [currentDisplayText]);

  // Cancel speech on text change or unmount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      setSpeakingWordIndex(null);
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentDisplayText]);

  // Handle dynamic translation switching
  const handleTranslationChange = async (newTranslation: string) => {
    setTranslation(newTranslation);

    if (newTranslation === 'KJV' || !activeVerse.reference) {
      return;
    }

    if (translatedTexts[newTranslation]) {
      return;
    }

    setIsLoadingTranslation(true);
    try {
      const res = await fetch(`/api/verse?reference=${encodeURIComponent(activeVerse.reference)}&translation=${newTranslation}`);
      const data = await res.json();

      if (res.ok && data.success && data.text) {
        setTranslatedTexts((prev) => ({
          ...prev,
          [newTranslation]: data.text,
        }));
      } else {
        toast.info(`Could not retrieve ${newTranslation} for ${activeVerse.reference}. Showing default text.`);
      }
    } catch (err) {
      console.warn("Failed to fetch translation:", err);
      toast.error("Failed to fetch translation. Please check connection.");
    } finally {
      setIsLoadingTranslation(false);
    }
  };

  // Text-to-Speech Toggle with Word Boundary Tracking
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isPlayingSpeech) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      setSpeakingWordIndex(null);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(currentDisplayText);
    utterance.rate = 0.88; // Reverent, calm pacing
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Pick a natural, soothing voice
    const voices = window.speechSynthesis.getVoices();
    const bestVoice = voices.find(v => 
      (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Daniel") || v.name.includes("Karen") || v.name.includes("Arthur")) && v.lang.startsWith("en")
    ) || voices.find(v => v.lang.startsWith("en"));

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    // Audio-to-text alignment: track word boundaries as speech plays
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIdx = event.charIndex;
        const found = wordsWithOffsets.findIndex(
          t => charIdx >= t.start && charIdx <= t.end + 2
        );
        if (found !== -1) {
          setSpeakingWordIndex(found);
        }
      }
    };

    utterance.onend = () => {
      setIsPlayingSpeech(false);
      setSpeakingWordIndex(null);
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn("Speech synthesis notice:", e);
      }
      setIsPlayingSpeech(false);
      setSpeakingWordIndex(null);
    };

    setIsPlayingSpeech(true);
    setSpeakingWordIndex(0);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = async () => {
    const textToCopy = `"${currentDisplayText}" — ${activeVerse.reference} (${translation})`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success("Verse copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard. Please copy manually.");
    }
  };

  const handleShare = async () => {
    const shareText = `"${currentDisplayText}" — ${activeVerse.reference} (${translation})`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `VerseFinder: ${activeVerse.reference}`,
          text: shareText,
          url: window.location.href,
        });
        toast.success("Shared successfully!");
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleToggleFavorite = () => {
    const isNowFav = toggleFavorite(activeVerse);
    setFavorited(isNowFav);
    if (isNowFav) {
      toast.success("Saved to favorites!");
    } else {
      toast.info("Removed from favorites");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Multiple Candidate Switcher */}
      {matches.length > 1 && (
        <Card className="p-4 bg-muted/20 border-border/60 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <ListFilter className="h-3.5 w-3.5 text-primary" />
            <span>Top Candidate Matches ({matches.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {matches.map((cand, idx) => {
              const isSelected = cand.reference === activeVerse.reference;
              return (
                <button
                  key={`${cand.reference}-${idx}`}
                  onClick={() => onSelectMatch?.(cand)}
                  className={`flex flex-col text-left p-2.5 rounded-lg border text-sm transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card hover:bg-accent/60 border-border text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full font-semibold">
                    <span className="truncate">{cand.reference}</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded-full font-mono ${
                        isSelected
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {cand.confidence}%
                    </span>
                  </div>
                  <p
                    className={`text-xs line-clamp-1 mt-1 ${
                      isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'
                    }`}
                  >
                    {cand.text}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Low Confidence warning */}
      {activeVerse.confidence < 50 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-sm max-w-2xl mx-auto">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-semibold">Partial match confidence.</span> Review the candidate list above or try speaking more words from the passage.
          </div>
        </div>
      )}

      {/* Confidence Badge */}
      <div className="text-center">
        <Badge variant="secondary" className="text-base px-4 py-1.5 shadow-sm">
          <Sparkles className="h-4 w-4 mr-2 text-primary" />
          {activeVerse.confidence}% Match Confidence
        </Badge>
      </div>

      {/* Main Result Card */}
      <Card className="shadow-divine border-border/80">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">{activeVerse.reference}</h2>
          </div>

          {/* Dynamic Live Translation Selector */}
          <div className="flex items-center justify-center gap-2">
            <Select value={translation} onValueChange={handleTranslationChange}>
              <SelectTrigger className="w-48 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_TRANSLATIONS.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoadingTranslation && (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Verse Text with Audio-to-Word Alignment Highlighting */}
          <blockquote className="relative text-lg md:text-xl leading-relaxed text-center italic border-l-4 border-primary pl-6 py-5 bg-muted/30 rounded-r-lg text-foreground min-h-[5.5rem] flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
            {isLoadingTranslation ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground not-italic">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Loading {translation} text...</span>
              </div>
            ) : (
              <>
                <span className="text-primary font-serif text-2xl select-none leading-none -mr-0.5">“</span>
                {wordsWithOffsets.map((token, i) => {
                  const isCurrent = isPlayingSpeech && speakingWordIndex === i;
                  return (
                    <span
                      key={`${token.word}-${i}`}
                      className={`transition-all duration-150 inline-block px-1 py-0.5 rounded ${
                        isCurrent
                          ? 'bg-primary text-primary-foreground font-semibold scale-105 shadow-sm'
                          : ''
                      }`}
                    >
                      {token.word}
                    </span>
                  );
                })}
                <span className="text-primary font-serif text-2xl select-none leading-none -ml-0.5">”</span>
              </>
            )}
          </blockquote>

          {/* Context Information */}
          <div className="bg-gradient-hero p-4 rounded-lg border border-border/40">
            <h4 className="font-semibold text-primary mb-2 text-sm uppercase tracking-wider">Context & Theme</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-muted-foreground">Chapter:</span>
                <Badge variant="outline">{activeVerse.chapter}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-muted-foreground">Theme:</span>
                <Badge variant="outline">{activeVerse.theme || 'Scripture Reflection'}</Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-2 leading-normal">
                {activeVerse.context}
              </p>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap gap-2.5 justify-center pt-2">
            {/* Listen to Verse (Text-to-Speech) */}
            <Button
              variant={isPlayingSpeech ? "default" : "secondary"}
              size="sm"
              onClick={handleToggleSpeech}
              className={`transition-all ${
                isPlayingSpeech ? "bg-primary text-primary-foreground shadow-glow animate-pulse" : ""
              }`}
            >
              {isPlayingSpeech ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2 text-primary" />
                  Listen to Verse
                </>
              )}
            </Button>

            {/* Copy Verse */}
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy Verse'}
            </Button>

            {/* Share */}
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>

            {/* Save to Favorites */}
            <Button
              variant={favorited ? 'default' : 'outline'}
              size="sm"
              onClick={handleToggleFavorite}
              className={favorited ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
            >
              <Heart className={`h-4 w-4 mr-2 ${favorited ? 'fill-white text-white' : 'text-red-500'}`} />
              {favorited ? 'Favorited' : 'Save to Favorites'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerseResults;
