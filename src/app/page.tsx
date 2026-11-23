'use client';

import { useState, useRef } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import AudioRecorder from '@/components/AudioRecorder';
import VerseResults from '@/components/VerseResults';
import { HistoryDrawer } from '@/components/HistoryDrawer';
import { matchVerse, matchVerses, MatchResult } from '@/lib/matcher';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [showResults, setShowResults] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchedVerse, setMatchedVerse] = useState<MatchResult | null>(null);
  const [matchedVerses, setMatchedVerses] = useState<MatchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const handleRecordingComplete = async (transcript: string, blob?: Blob) => {
    // If both transcript and audio blob are empty
    if (!transcript.trim() && !blob) {
      toast({
        title: "No Input Received",
        description: "Please record audio, upload a file, or type a scripture in the search bar.",
      });
      return;
    }

    setIsAnalyzing(true);
    setShowResults(false);

    try {
      const formData = new FormData();
      formData.append("transcript", transcript);

      if (blob) {
        let extension = 'webm';
        if (blob.type.includes('ogg')) extension = 'ogg';
        else if (blob.type.includes('mp4') || blob.type.includes('aac')) extension = 'mp4';
        else if (blob.type.includes('wav')) extension = 'wav';
        else if (blob.type.includes('mp3') || blob.type.includes('mpeg')) extension = 'mp3';

        formData.append("audio", blob, `recording.${extension}`);
      }

      const response = await fetch("/api/match", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        const candidates: MatchResult[] = Array.isArray(data.matches) && data.matches.length > 0
          ? data.matches
          : (data.match ? [data.match] : []);

        setMatchedVerses(candidates);
        setMatchedVerse(candidates[0] || null);

        if (data.transcript) {
          setSearchQuery(data.transcript);
        }
        setShowResults(true);
      } else if (data?.noTranscript) {
        toast({
          title: "Speech Not Transcribed",
          description: "No words were recognized in this recording. You can type the scripture in the search bar below, or add OPENAI_API_KEY to your Vercel settings for automatic server-side audio transcription.",
        });
        searchInputRef.current?.focus();
        setShowResults(false);
      } else {
        // Fall back to local database matching if we have a transcript
        if (transcript.trim()) {
          const matches = matchVerses(transcript, 5);
          setMatchedVerses(matches);
          setMatchedVerse(matches[0]);
          setShowResults(true);
        } else {
          toast({
            title: "Could not identify scripture",
            description: "No spoken words were recognized. Please type the verse in the search bar below.",
            variant: "destructive",
          });
          searchInputRef.current?.focus();
          setShowResults(false);
        }
      }
    } catch (err) {
      console.error("Failed to connect to API, falling back to local matching:", err);
      if (transcript.trim()) {
        const matches = matchVerses(transcript, 5);
        setMatchedVerses(matches);
        setMatchedVerse(matches[0]);
        setShowResults(true);
      } else {
        toast({
          title: "Connection Error",
          description: "Could not reach the scripture matching service. Please try typing your verse.",
          variant: "destructive",
        });
        setShowResults(false);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectHistoricalVerse = (verse: MatchResult) => {
    setMatchedVerse(verse);
    setMatchedVerses([verse]);
    setShowResults(true);
    setTimeout(() => {
      document.getElementById('results-view')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onBrowseVerses={() => {
          document.getElementById('main-app')?.scrollIntoView({ behavior: 'smooth' });
          searchInputRef.current?.focus();
        }}
        onHowItWorks={() => {
          document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Main App Section */}
      <section id="main-app" className="py-20 px-4 scroll-mt-14">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Try VerseFinder Now
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Record yourself speaking a Bible verse, or upload an audio file to see our recognition in action
            </p>
          </div>
          
          <div className="space-y-8">
            <AudioRecorder onRecordingComplete={handleRecordingComplete} />

            {/* Fallback Text Search Input */}
            <div className="flex flex-col items-center max-w-lg mx-auto w-full gap-3 pt-4 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground self-start">Alternative: Search by Typing</p>
              <div className="flex items-center w-full gap-2">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type a verse or keywords (e.g. shepherd, beginning, loved)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      handleRecordingComplete(searchQuery);
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  onClick={() => searchQuery.trim() && handleRecordingComplete(searchQuery)}
                  className="bg-gradient-primary hover:shadow-glow"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-start w-full text-xs text-muted-foreground mt-1">
                <span className="font-semibold">Quick tests:</span>
                {[
                  "the Lord is my shepherd",
                  "In the beginning God created",
                  "For God so loved the world",
                  "lean not on your own understanding"
                ].map((txt) => (
                  <button
                    key={txt}
                    onClick={() => {
                      setSearchQuery(txt);
                      handleRecordingComplete(txt);
                    }}
                    className="underline hover:text-primary transition-colors text-left"
                  >
                    "{txt}"
                  </button>
                ))}
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={() => {
                  if (!showResults) {
                    const fallback = matchVerses("For God so loved the world", 3);
                    setMatchedVerses(fallback);
                    setMatchedVerse(fallback[0]);
                  }
                  setShowResults(!showResults);
                  setIsAnalyzing(false);
                }}
                className="text-primary hover:text-primary/80 underline text-sm"
              >
                {showResults ? 'Try Another Verse' : 'See Demo Results'}
              </button>
            </div>
            
            {isAnalyzing && (
              <div className="text-center py-12 animate-pulse space-y-4">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground text-sm">Analyzing audio patterns & matching scripture database...</p>
              </div>
            )}
            
            <div id="results-view" className="scroll-mt-20">
              {showResults && !isAnalyzing && (
                <VerseResults
                  matchedVerse={matchedVerse}
                  matches={matchedVerses}
                  onSelectMatch={(v) => setMatchedVerse(v)}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-muted/30 scroll-mt-14">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to find any Bible verse
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Record or Upload',
                description: 'Speak a Bible verse or upload an audio file containing scriptural content'
              },
              {
                step: '2', 
                title: 'AI Recognition',
                description: 'Our advanced algorithm converts speech to text and matches it with our Bible database'
              },
              {
                step: '3',
                title: 'Get Results',
                description: 'Receive the verse reference, text, context, and related passages instantly'
              }
            ].map((item) => (
              <div key={item.step} className="text-center p-6 rounded-lg bg-card shadow-divine">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* History and Favorites Drawer */}
      <HistoryDrawer
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        onSelectVerse={handleSelectHistoricalVerse}
      />

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="text-2xl font-bold text-primary mb-2">VerseFinder</div>
          <p className="text-muted-foreground mb-6">
            Discover the Word through voice recognition
          </p>
          <p className="text-sm text-muted-foreground">
            © 2025 VerseFinder. Built with faith and technology.
          </p>
        </div>
      </footer>
    </div>
  );
}
